import { describe, expect, it } from 'vitest';
import { testHelpers } from './geminiService';

describe('parseClaims', () => {
  const { parseClaims } = testHelpers;

  it('parses array payloads', () => {
    const claims = parseClaims([
      { id: 'c1', text: 'Claim one', type: 'fact', importance: 4, depends_on: [] },
      { id: 'c2', text: 'Claim two', type: 'opinion', importance: 2 }
    ]);
    expect(claims).toHaveLength(2);
    expect(claims[0].id).toBe('c1');
    expect(claims[1].dependsOn).toEqual([]);
  });

  it('parses object payload with claims property', () => {
    const claims = parseClaims({
      claims: [{ text: 'Missing id', type: 'fact', importance: 3 }]
    });
    expect(claims).toHaveLength(1);
    expect(claims[0].id).toBe('c1');
  });
});
