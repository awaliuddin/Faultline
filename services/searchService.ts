import type { SourceEvidence } from '../types';

const getSearchConfig = () => {
  if (typeof process === 'undefined' || !process.env) return {};
  return {
    apiKey: process.env.CUSTOM_SEARCH_API_KEY,
    cseId: process.env.GOOGLE_CSE_ID,
    proxyBase: process.env.PROXY_BASE_URL || '/api'
  };
};

/**
 * Lightweight Google Custom Search helper for demo purposes.
 * Note: running this in the browser exposes the API key. For production,
 * proxy this call server-side to keep credentials private.
 */
export const runCustomSearch = async (query: string, maxResults = 4): Promise<SourceEvidence[]> => {
  const { apiKey, cseId, proxyBase } = getSearchConfig();
  if (!apiKey && !proxyBase) return [];

  try {
    if (proxyBase) {
      const res = await fetch(`${proxyBase}/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        return items.map((item: any) => ({
          title: item.title || 'Source',
          uri: item.link,
          snippet: item.snippet || item.htmlSnippet
        })).filter((s: SourceEvidence) => s.uri).slice(0, maxResults);
      }
    }

    if (!apiKey || !cseId) return [];

    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', cseId);
    url.searchParams.set('q', query);
    url.searchParams.set('num', String(Math.min(maxResults, 10)));

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.warn('Custom Search API error', res.status, await res.text());
      return [];
    }
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    return items.map((item: any) => ({
      title: item.title || 'Source',
      uri: item.link,
      snippet: item.snippet || item.htmlSnippet
    })).filter((s: SourceEvidence) => s.uri).slice(0, maxResults);
  } catch (err) {
    console.warn('Custom Search fetch failed', err);
    return [];
  }
};
