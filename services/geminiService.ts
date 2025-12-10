import { GoogleGenAI } from "@google/genai";
import type { Claim, VerificationResult, ClaimStatus } from '../types';

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

export const extractClaims = async (text: string, apiKey: string): Promise<Claim[]> => {
  if (!text || !apiKey) return [];

  const model = 'gemini-3-pro-preview';
  
  const prompt = `
    Analyze the following text and decompose it into atomic claims. 
    Focus on extracting assertions that can be fact-checked.
    
    Text: "${text}"
    
    Return a JSON array where each object has:
    - id: a unique string ID (e.g., "c1")
    - text: the specific claim as a standalone sentence
    - type: one of "fact", "opinion", "interpretation"
    - importance: integer 1-5 (5 being critical to the argument's validity)
  `;

  try {
    const ai = getClient(apiKey);
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
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
              importance: { type: 'INTEGER' },
            },
            required: ["id", "text", "type", "importance"]
          }
        }
      }
    });

    const cleanedText = cleanJson(response.text || '[]');
    const result = JSON.parse(cleanedText);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error extracting claims:", error);
    return [];
  }
};

export const verifyClaim = async (claim: Claim, apiKey: string): Promise<VerificationResult> => {
  if (!apiKey) throw new Error("API Key required");

  const model = 'gemini-3-pro-preview';

  const prompt = `
    You are a rigorous fact-checker. 
    Verify this claim using the provided Google Search tool.
    
    Claim: "${claim.text}"
    
    Determine if the claim is "supported", "contradicted", or "mixed" (partially true/false) based on the search results.
    If no evidence is found, mark as "unverified".
    
    Return a JSON object with:
    - status: "supported", "contradicted", "mixed", or "unverified"
    - explanation: A concise (1-2 sentences) explanation of why.
  `;

  try {
    const ai = getClient(apiKey);
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType cannot be used with googleSearch
      }
    });

    let resultJson: any = {};
    try {
      const cleanedText = cleanJson(response.text || '{}');
      if (cleanedText && cleanedText !== '{}') {
          resultJson = JSON.parse(cleanedText);
      }
    } catch (e) {
      console.warn("Failed to parse JSON from verification response", response.text);
      if (response.text) {
          resultJson = { status: 'mixed', explanation: response.text.substring(0, 150) + '...' };
      }
    }

    const sources: Array<{ title: string; uri: string }> = [];
    
    // Extract sources from grounding chunks
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || 'Source',
            uri: chunk.web.uri
          });
        }
      });
    }

    const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);

    return {
      claimId: claim.id,
      status: (resultJson.status || 'unverified') as ClaimStatus,
      explanation: resultJson.explanation || 'No structured explanation provided.',
      sources: uniqueSources.slice(0, 3)
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

export const generateCritiqueAndPrompt = async (originalText: string, failedClaims: Claim[], apiKey: string): Promise<{ critique: string; improvedPrompt: string }> => {
  if (!apiKey) return { critique: "Auth Error", improvedPrompt: "Missing API Key" };
  
  const model = 'gemini-3-pro-preview';
  
  const prompt = `
    I have analyzed a text and found the following problematic claims (contradicted or mixed accuracy):
    ${failedClaims.map(c => `- ${c.text}`).join('\n')}

    Original Text context: "${originalText.substring(0, 500)}..."

    1. Write a short, biting critique of the text's reliability (max 50 words).
    2. Suggest a better prompt the user could have used to generate a more accurate answer originally.

    Return JSON: { "critique": string, "improvedPrompt": string }
  `;

  try {
    const ai = getClient(apiKey);
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const cleanedText = cleanJson(response.text || '{}');
    return JSON.parse(cleanedText);
  } catch (error) {
    return { critique: "Analysis incomplete.", improvedPrompt: "Verify facts before trusting AI outputs." };
  }
};