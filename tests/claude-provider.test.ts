import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LLMProvider, ImageInput, CritiqueResult, ProviderFactory } from '../providers/base_provider';
import type { Claim } from '../types';

// Mock global fetch for Anthropic API calls
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { createClaudeProvider } from '../providers/claude_provider';

function mockAnthropicResponse(text: string, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => ({
      content: [{ type: 'text', text }],
    }),
  };
}

describe('ClaudeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('interface compliance', () => {
    it('should implement LLMProvider interface', () => {
      const provider = createClaudeProvider('test-key');
      expect(provider.name).toBeDefined();
      expect(provider.modelId).toBeDefined();
      expect(typeof provider.extractClaims).toBe('function');
      expect(typeof provider.verifyClaim).toBe('function');
      expect(typeof provider.generateCritiqueAndPrompt).toBe('function');
    });

    it('should expose correct provider name', () => {
      const provider = createClaudeProvider('test-key');
      expect(provider.name).toBe('Anthropic Claude');
    });

    it('should expose correct model ID', () => {
      const provider = createClaudeProvider('test-key');
      expect(provider.modelId).toBe('claude-sonnet-4-20250514');
    });

    it('factory should satisfy ProviderFactory type', () => {
      const factory: ProviderFactory = createClaudeProvider;
      const provider = factory('test-key');
      expect(provider.name).toBe('Anthropic Claude');
    });

    it('should create independent instances', () => {
      const p1 = createClaudeProvider('key-1');
      const p2 = createClaudeProvider('key-2');
      expect(p1).not.toBe(p2);
    });
  });

  describe('extractClaims', () => {
    it('should return parsed claims from API response', async () => {
      const mockClaims = [
        { id: 'c1', text: 'Water boils at 100C', type: 'fact', importance: 4 },
        { id: 'c2', text: 'Coffee tastes good', type: 'opinion', importance: 2 },
      ];
      mockFetch.mockResolvedValueOnce(mockAnthropicResponse(JSON.stringify(mockClaims)));

      const provider = createClaudeProvider('test-key');
      const result = await provider.extractClaims('Some text about water and coffee');
      expect(result).toEqual(mockClaims);
      expect(result).toHaveLength(2);
    });

    it('should return empty array for empty input', async () => {
      const provider = createClaudeProvider('test-key');
      const result = await provider.extractClaims('');
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle markdown-wrapped JSON response', async () => {
      const claims = [{ id: 'c1', text: 'Claim', type: 'fact', importance: 5 }];
      const wrapped = '```json\n' + JSON.stringify(claims) + '\n```';
      mockFetch.mockResolvedValueOnce(mockAnthropicResponse(wrapped));

      const provider = createClaudeProvider('test-key');
      const result = await provider.extractClaims('Input text');
      expect(result).toEqual(claims);
    });

    it('should pass image input in API call', async () => {
      const claims = [{ id: 'c1', text: 'Image claim', type: 'fact', importance: 3 }];
      mockFetch.mockResolvedValueOnce(mockAnthropicResponse(JSON.stringify(claims)));

      const provider = createClaudeProvider('test-key');
      const image: ImageInput = { data: 'base64data', mimeType: 'image/png' };
      const result = await provider.extractClaims('', image);
      expect(result).toEqual(claims);

      // Verify the fetch call included image content
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.messages[0].content[0].type).toBe('image');
      expect(body.messages[0].content[0].source.data).toBe('base64data');
    });

    it('should return empty array on API error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const provider = createClaudeProvider('test-key');
      const result = await provider.extractClaims('Some text');
      expect(result).toEqual([]);
    });

    it('should return empty array for non-array response', async () => {
      mockFetch.mockResolvedValueOnce(
        mockAnthropicResponse(JSON.stringify({ not: 'an array' })),
      );

      const provider = createClaudeProvider('test-key');
      const result = await provider.extractClaims('Some text');
      expect(result).toEqual([]);
    });

    it('should send correct headers with API key', async () => {
      mockFetch.mockResolvedValueOnce(mockAnthropicResponse('[]'));

      const provider = createClaudeProvider('sk-ant-test-key');
      await provider.extractClaims('Test');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.anthropic.com/v1/messages');
      expect(options.headers['x-api-key']).toBe('sk-ant-test-key');
      expect(options.headers['anthropic-version']).toBe('2023-06-01');
    });
  });

  describe('verifyClaim', () => {
    it('should return verification result', async () => {
      mockFetch.mockResolvedValueOnce(
        mockAnthropicResponse(
          JSON.stringify({ status: 'supported', explanation: 'Confirmed by sources.' }),
        ),
      );

      const provider = createClaudeProvider('test-key');
      const claim: Claim = { id: 'c1', text: 'Water is wet', type: 'fact', importance: 5 };
      const result = await provider.verifyClaim(claim);

      expect(result.claimId).toBe('c1');
      expect(result.status).toBe('supported');
      expect(result.explanation).toBe('Confirmed by sources.');
      expect(result.sources).toEqual([]);
    });

    it('should handle contradicted status', async () => {
      mockFetch.mockResolvedValueOnce(
        mockAnthropicResponse(
          JSON.stringify({ status: 'contradicted', explanation: 'Not accurate.' }),
        ),
      );

      const provider = createClaudeProvider('test-key');
      const claim: Claim = { id: 'c2', text: 'Bad claim', type: 'fact', importance: 4 };
      const result = await provider.verifyClaim(claim);
      expect(result.status).toBe('contradicted');
    });

    it('should fallback to unverified on API error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Rate limit'));

      const provider = createClaudeProvider('test-key');
      const claim: Claim = { id: 'c3', text: 'Claim', type: 'fact', importance: 3 };
      const result = await provider.verifyClaim(claim);

      expect(result.claimId).toBe('c3');
      expect(result.status).toBe('unverified');
      expect(result.explanation).toContain('technical error');
    });

    it('should fallback to unverified on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const provider = createClaudeProvider('test-key');
      const claim: Claim = { id: 'c4', text: 'Claim', type: 'fact', importance: 3 };
      const result = await provider.verifyClaim(claim);
      expect(result.status).toBe('unverified');
    });
  });

  describe('generateCritiqueAndPrompt', () => {
    it('should return critique and improved prompt', async () => {
      const mockResult = {
        critique: 'Foundation shows fractures.',
        improvedPrompt: 'Please cite sources.',
      };
      mockFetch.mockResolvedValueOnce(mockAnthropicResponse(JSON.stringify(mockResult)));

      const provider = createClaudeProvider('test-key');
      const claims: Claim[] = [{ id: 'c1', text: 'Bad claim', type: 'fact', importance: 5 }];
      const result = await provider.generateCritiqueAndPrompt('original text', claims);

      expect(result.critique).toBe('Foundation shows fractures.');
      expect(result.improvedPrompt).toBe('Please cite sources.');
    });

    it('should return fallback on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API down'));

      const provider = createClaudeProvider('test-key');
      const result = await provider.generateCritiqueAndPrompt('text', []);

      expect(result.critique).toBe('Analysis incomplete.');
      expect(result.improvedPrompt).toContain('Verify facts');
    });
  });
});
