import { GoogleGenAI } from "@google/genai";
import type { Claim, VerificationResult, ClaimStatus, SourceEvidence, ModelProvider } from '../types';
import { runCustomSearch } from './searchService';

// Helper to sanitize JSON strings
const cleanJson = (text: string): string => {
  if (!text) return '';
  const match = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return text.replace(/```json\n?|```/g, '').trim();
};

const getClient = (apiKey: string) => {
  if (typeof GoogleGenAI === 'undefined') {
    throw new Error("GoogleGenAI SDK failed to load.");
  }
  return new GoogleGenAI({ apiKey });
};

const openAIModel = (typeof process !== 'undefined' && process.env?.OPENAI_MODEL) || 'gpt-4o-mini';
const anthropicModel = (typeof process !== 'undefined' && process.env?.ANTHROPIC_MODEL) || 'claude-3-5-sonnet-latest';
const googleModel = (typeof process !== 'undefined' && process.env?.GOOGLE_MODEL) || 'gemini-3-pro-preview';
const proxyBase = (typeof process !== 'undefined' && process.env?.PROXY_BASE_URL) || '/api';

const normalizeStatus = (status?: string): ClaimStatus => {
  if (!status) return 'unverified';
  const value = status.toLowerCase();
  if (value.includes('contradict')) return 'contradicted';
  if (value.includes('support')) return 'supported';
  if (value.includes('mixed') || value.includes('partial')) return 'mixed';
  if (value.includes('unverified') || value.includes('unknown') || value.includes('no evidence')) return 'unverified';
  return 'mixed';
};

const extractTextFromResponse = (response: any): string => {
  const parts = response?.candidates?.[0]?.content?.parts || [];
  const textParts = parts
    .map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
    .filter(Boolean)
    .join('\n');
  return textParts.trim();
};

const mapGroundingSources = (response: any): SourceEvidence[] => {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!chunks) return [];
  const sources: SourceEvidence[] = [];
  chunks.forEach((chunk: any) => {
    if (chunk?.web?.uri) {
      sources.push({
        title: chunk.web.title || 'Source',
        uri: chunk.web.uri,
        snippet: chunk.web.snippet || chunk.web.description
      });
    }
  });
  // Deduplicate by uri
  return sources.filter((v, i, arr) => arr.findIndex(t => t.uri === v.uri) === i).slice(0, 3);
};

const parseClaims = (raw: any): Claim[] => {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : Array.isArray(raw.claims) ? raw.claims : [];
  return list.map((item: any, idx) => ({
    id: item.id || `c${idx + 1}`,
    text: item.text,
    type: item.type || 'fact',
    dependsOn: Array.isArray(item.depends_on) ? item.depends_on : Array.isArray(item.dependsOn) ? item.dependsOn : [],
    importance: Math.min(5, Math.max(1, Number(item.importance) || 1))
  })).filter(c => c.text);
};

// Exported for tests
export const testHelpers = { parseClaims };

const getOpenAIText = (completion: any): string => {
  const content = completion?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((part: any) => typeof part === 'string' ? part : (part?.text || '')).join('\n');
  }
  return '';
};

const getAnthropicText = (msg: any): string => {
  if (!msg) return '';
  const content = msg.content || msg;
  if (Array.isArray(content)) return content.map((c: any) => c?.text || '').join('\n');
  return content?.text || '';
};

const parseJsonSafe = (text: string): any => {
  try {
    return JSON.parse(cleanJson(text) || '{}');
  } catch {
    return {};
  }
};

const deriveFinalStatus = (inferred: ClaimStatus, explanation: string, fallbackText: string, sourcesLen: number): ClaimStatus => {
  const combined = `${explanation} ${fallbackText}`.toLowerCase();
  if (combined.includes('contradict')) return 'contradicted';
  if (inferred === 'unverified' && sourcesLen === 0) return 'mixed';
  return inferred;
};

export const extractClaims = async (text: string, apiKey: string, provider: ModelProvider = 'google'): Promise<Claim[]> => {
  if (!text) return [];
  if (!apiKey && provider !== 'local' && !proxyBase) return [];

  const basePrompt = `
    Analyze the following text and decompose it into atomic claims.
    Focus on extracting assertions that can be fact-checked.

    Text: "${text}"

    Return a JSON array where each object has:
    - id: a unique string ID (e.g., "c1")
    - text: the specific claim as a standalone sentence
    - type: one of "fact", "opinion", "interpretation"
    - depends_on: array of other claim ids this claim relies on (empty if none)
    - importance: integer 1-5 (5 being critical to the argument's validity)
  `;

  try {
    if (provider === 'openai') {
      const res = await fetch(`${proxyBase}/openai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: openAIModel,
          response_format: { type: "json_object" },
          messages: [
            { role: 'system', content: 'You extract atomic claims and respond strictly with JSON: {"claims":[...]}.' },
            { role: 'user', content: basePrompt }
          ]
        })
      });
      const raw = await res.text();
      if (!res.ok) throw new Error(`OpenAI proxy error: ${raw}`);
      const data = parseJsonSafe(raw);
      const textResp = getOpenAIText(data) || raw;
      const parsed = parseJsonSafe(textResp);
      return parseClaims(parsed);
    }

    if (provider === 'anthropic') {
      const resp = await fetch(`${proxyBase}/anthropic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: anthropicModel,
          max_tokens: 800,
          temperature: 0,
          system: 'Extract atomic claims and respond strictly with JSON object: {"claims":[...]} including id, text, type, depends_on, importance.',
          messages: [{ role: 'user', content: basePrompt }]
        })
      });
      const raw = await resp.text();
      if (!resp.ok) throw new Error(`Anthropic proxy error: ${raw}`);
      const parsedBody = parseJsonSafe(raw);
      const textResp = getAnthropicText(parsedBody) || raw;
      const parsed = parseJsonSafe(textResp);
      return parseClaims(parsed);
    }

    if (provider === 'local') {
      // Simple heuristic: split sentences as fallback.
      const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 6);
      return sentences.map((s, idx) => ({
        id: `c${idx + 1}`,
        text: s.trim(),
        type: 'fact',
        dependsOn: [],
        importance: 3
      }));
    }

    // Default: Google Gemini
    const model = googleModel;
    const requestBody = {
      model,
      contents: [{ role: "user", parts: [{ text: basePrompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              id: { type: 'STRING' },
              text: { type: 'STRING' },
              type: { type: 'STRING' }, 
              depends_on: { type: 'ARRAY', items: { type: 'STRING' } },
              importance: { type: 'INTEGER' },
            },
            required: ["id", "text", "type", "importance", "depends_on"]
          }
        }
      }
    };

    if (proxyBase) {
      const resp = await fetch(`${proxyBase}/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const data = await resp.json();
      const cleanedText = cleanJson(data?.candidates?.[0]?.content?.parts?.[0]?.text || data?.text || '[]');
      return parseClaims(JSON.parse(cleanedText));
    }

    const ai = getClient(apiKey);
    const response = await ai.models.generateContent(requestBody as any);
    const cleanedText = cleanJson(response.text || '[]');
    const result = JSON.parse(cleanedText);
    return parseClaims(result);
  } catch (error) {
    console.error("Error extracting claims:", error);
    return [];
  }
};

export const verifyClaim = async (claim: Claim, apiKey: string, provider: ModelProvider = 'google'): Promise<VerificationResult> => {
  if (!apiKey && provider === 'google' && !proxyBase) throw new Error("API Key required");

  const model = googleModel;

  const prompt = `
    You are a rigorous fact-checker. 
    Verify this claim using available knowledge and, if enabled, search tools.
    
    Claim: "${claim.text}"
    
    Determine if the claim is "supported", "contradicted", or "mixed" (partially true/false) based on the evidence.
    If the claim is physically impossible or clearly nonsensical, classify as "contradicted" even if no direct citation exists.
    If no credible evidence is found and the claim cannot be supported, use "unverified".
    
    Return a JSON object with:
    - status: "supported", "contradicted", "mixed", or "unverified"
    - explanation: A concise (1-2 sentences) explanation of why.
  `;

  try {
    // For non-Google providers, pull evidence via Custom Search to ground the decision
    const cseEvidence = provider !== 'google' ? await runCustomSearch(claim.text, 4) : [];

    if (provider === 'openai') {
      const resp = await fetch(`${proxyBase}/openai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: openAIModel,
          response_format: { type: "json_object" },
          messages: [
            { role: 'system', content: 'You are a fact-checker. Respond with JSON.' },
            { role: 'user', content: `${prompt}\n\nEvidence snippets:\n${cseEvidence.map((s, i) => `${i + 1}. ${s.title}: ${s.snippet || ''} (${s.uri})`).join('\n') || 'No evidence found.'}\nIf no credible evidence is provided, return status: "unverified".` }
          ]
        })
      });
      const raw = await resp.text();
      if (!resp.ok) throw new Error(`OpenAI proxy error: ${raw}`);
      const data = parseJsonSafe(raw);
      const textResp = getOpenAIText(data) || raw;
      const resultJson: any = parseJsonSafe(textResp);
      if (cseEvidence.length === 0 && !resultJson.explanation) {
        resultJson.explanation = 'No search evidence; search unavailable or quota reached.';
      }

      return {
        claimId: claim.id,
        status: deriveFinalStatus(
          cseEvidence.length === 0 ? 'unverified' : normalizeStatus(resultJson.status || textResp),
          resultJson.explanation || '',
          textResp,
          cseEvidence.length
        ),
        explanation: resultJson.explanation || textResp || 'No structured explanation provided.',
        sources: cseEvidence
      };
    }

    if (provider === 'anthropic') {
      const resp = await fetch(`${proxyBase}/anthropic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: anthropicModel,
          max_tokens: 400,
          temperature: 0,
          system: 'You are a fact-checker. Respond with JSON.',
          messages: [{ role: 'user', content: `${prompt}\n\nEvidence snippets:\n${cseEvidence.map((s, i) => `${i + 1}. ${s.title}: ${s.snippet || ''} (${s.uri})`).join('\n') || 'No evidence found.'}\nIf no credible evidence is provided, return status: "unverified".` }]
        })
      });
      const raw = await resp.text();
      if (!resp.ok) throw new Error(`Anthropic proxy error: ${raw}`);
      const parsedBody = parseJsonSafe(raw);
      const textResp = getAnthropicText(parsedBody) || raw;
      const resultJson: any = parseJsonSafe(textResp);
      if (cseEvidence.length === 0 && !resultJson.explanation) {
        resultJson.explanation = 'No search evidence; search unavailable or quota reached.';
      }
      return {
        claimId: claim.id,
        status: deriveFinalStatus(
          cseEvidence.length === 0 ? 'unverified' : normalizeStatus(resultJson.status || textResp),
          resultJson.explanation || '',
          textResp,
          cseEvidence.length
        ),
        explanation: resultJson.explanation || textResp || 'No structured explanation provided.',
        sources: cseEvidence
      };
    }

    if (provider === 'local') {
      const evidence = cseEvidence;
      return {
        claimId: claim.id,
        status: evidence.length > 0 ? 'mixed' : 'unverified',
        explanation: evidence.length > 0 ? 'Evidence fetched; manual review required.' : 'Local mode cannot verify; manual review recommended.',
        sources: evidence
      };
    }

    const requestBody = {
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType cannot be used with googleSearch
      }
    };

    if (proxyBase) {
      const resp = await fetch(`${proxyBase}/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const data = await resp.json();

      // Try to parse structured JSON first
      let resultJson: any = {};
      const cleanedText = cleanJson(data?.text || '');
      const fallbackText = cleanedText || extractTextFromResponse(data);

      if (cleanedText) {
        try {
          resultJson = JSON.parse(cleanedText);
        } catch {
          console.warn("Failed to parse JSON from verification response", cleanedText);
        }
      }

      const inferredStatus = normalizeStatus(resultJson.status || fallbackText);
      const explanation = resultJson.explanation 
        || fallbackText 
        || 'No structured explanation provided.';

      const sources = mapGroundingSources(data);

      const finalStatus = deriveFinalStatus(inferredStatus, explanation, fallbackText, sources.length);

      return {
        claimId: claim.id,
        status: finalStatus,
        explanation,
        sources
      };
    }

    const ai = getClient(apiKey);
    const response = await ai.models.generateContent(requestBody as any);

    // Try to parse structured JSON first
    let resultJson: any = {};
    const cleanedText = cleanJson(response.text || '');
    const fallbackText = cleanedText || extractTextFromResponse(response);

    if (cleanedText) {
      try {
        resultJson = JSON.parse(cleanedText);
      } catch {
        console.warn("Failed to parse JSON from verification response", cleanedText);
      }
    }

    const inferredStatus = normalizeStatus(resultJson.status || fallbackText);
    const explanation = resultJson.explanation 
      || fallbackText 
      || 'No structured explanation provided.';

    const sources = mapGroundingSources(response);

    const finalStatus = deriveFinalStatus(inferredStatus, explanation, fallbackText, sources.length);

    return {
      claimId: claim.id,
      status: finalStatus,
      explanation,
      sources
    };

  } catch (error) {
    console.error(`Error verifying claim ${claim.id}:`, error);
    return {
      claimId: claim.id,
      status: 'unverified',
      explanation: 'Failed to verify due to technical error.',
      sources: []
    };
  }
};

export const generateCritiqueAndPrompt = async (
  originalText: string,
  claims: Claim[],
  verifications: Record<string, VerificationResult>,
  apiKey: string,
  provider: ModelProvider = 'google'
): Promise<{ critique: string; improvedPrompt: string }> => {
  if (!apiKey && provider !== 'local') return { critique: "Auth Error", improvedPrompt: "Missing API Key" };
  
  const model = googleModel;

  const problematic = Object.values(verifications)
    .filter(v => v.status !== 'supported')
    .map(v => {
      const claim = claims.find(c => c.id === v.claimId);
      return `- (${v.status}) ${claim?.text || 'Unknown claim'} :: ${v.explanation}`;
    })
    .slice(0, 8)
    .join('\n');
  
  const prompt = `
    You are generating JSON ONLY. No prose outside JSON.
    I have analyzed a text and found the following problematic claims (contradicted, mixed accuracy, or unverified):
    ${problematic || '- None explicitly flagged; provide general critique for verification gaps.'}

    Original Text context (truncated): "${originalText.substring(0, 500)}..."

    1. Provide a concise critique of the text's reliability (max 50 words).
    2. Provide a stronger re-prompt the user could have used to demand evidence and citations.

    Respond ONLY with JSON: {"critique": string, "improvedPrompt": string}
  `;

  const localFallback = {
    critique: problematic ? "Multiple claims lack supporting evidence; treat this answer as unreliable." : "Evidence was insufficient; verify critical claims before trusting this answer.",
    improvedPrompt: "Answer concisely with cited evidence. For each factual claim include a source URL and mark uncertain claims as 'unverified'. If no evidence, say so explicitly."
  };

  try {
    if (provider === 'openai') {
      const resp = await fetch(`${proxyBase}/openai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: openAIModel,
          response_format: { type: "json_object" },
          messages: [
            { role: 'system', content: 'Provide JSON with critique and improvedPrompt fields. No other text.' },
            { role: 'user', content: prompt }
          ]
        })
      });
      const raw = await resp.text();
      if (!resp.ok) throw new Error(`OpenAI proxy error: ${raw}`);
      const parsedBody = parseJsonSafe(raw);
      const textResp = getOpenAIText(parsedBody) || raw;
      const parsed = parseJsonSafe(textResp);
      return parsed.critique && parsed.improvedPrompt ? parsed : localFallback;
    }

    if (provider === 'anthropic') {
      const resp = await fetch(`${proxyBase}/anthropic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: anthropicModel,
          max_tokens: 400,
          temperature: 0.2,
          system: 'Provide JSON with critique and improvedPrompt fields. No other text.',
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const raw = await resp.text();
      if (!resp.ok) throw new Error(`Anthropic proxy error: ${raw}`);
      const parsedBody = parseJsonSafe(raw);
      const textResp = getAnthropicText(parsedBody) || raw;
      const parsed = parseJsonSafe(textResp);
      return parsed.critique && parsed.improvedPrompt ? parsed : localFallback;
    }

    if (provider === 'local') {
      return {
        critique: "Local mode cannot verify facts; treat results as unverified.",
        improvedPrompt: "Use an online fact-checking LLM with grounding to validate each claim."
      };
    }

    if (provider === 'google' && proxyBase) {
      const resp = await fetch(`${proxyBase}/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { responseMimeType: "application/json" }
        })
      });
      const data = await resp.json();
      const cleanedText = cleanJson(data?.candidates?.[0]?.content?.parts?.[0]?.text || data?.text || '{}');
      const parsed = JSON.parse(cleanedText);
      return parsed.critique && parsed.improvedPrompt ? parsed : localFallback;
    }

    const ai = getClient(apiKey);
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    const cleanedText = cleanJson(response.text || '{}');
    const parsed = JSON.parse(cleanedText);
    return parsed.critique && parsed.improvedPrompt ? parsed : localFallback;
  } catch (error) {
    console.error('Critique generation failed', error);
    return localFallback;
  }
};
