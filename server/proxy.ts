import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import type { Request, Response } from 'express';

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 8788;

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const CSE_KEY = process.env.CUSTOM_SEARCH_API_KEY;
const CSE_ID = process.env.GOOGLE_CSE_ID;

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Google Custom Search proxy
app.get('/api/search', async (req: Request, res: Response) => {
  if (!CSE_KEY || !CSE_ID) return res.status(500).json({ error: 'Search not configured' });
  const q = req.query.q as string;
  if (!q) return res.status(400).json({ error: 'Missing query' });
  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', CSE_KEY);
    url.searchParams.set('cx', CSE_ID);
    url.searchParams.set('q', q);
    url.searchParams.set('num', '4');
    const r = await fetch(url.toString());
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    console.error('CSE proxy failed', err);
    return res.status(500).json({ error: 'CSE proxy failed' });
  }
});

// Helper to pass through provider responses with better error visibility
const forward = async (r: Response, res: Response) => {
  const text = await r.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = { error: text };
  }
  return res.status(r.status).json(json);
};

// Minimal OpenAI chat proxy
app.post('/api/openai', async (req: Request, res: Response) => {
  if (!OPENAI_KEY) return res.status(500).json({ error: 'OpenAI not configured' });
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify(req.body)
    });
    return forward(r, res);
  } catch (err) {
    console.error('OpenAI proxy failed', err);
    return res.status(500).json({ error: 'OpenAI proxy failed' });
  }
});

// Minimal Anthropic chat proxy
app.post('/api/anthropic', async (req: Request, res: Response) => {
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'Anthropic not configured' });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });
    return forward(r, res);
  } catch (err) {
    console.error('Anthropic proxy failed', err);
    return res.status(500).json({ error: 'Anthropic proxy failed' });
  }
});

// Minimal Gemini proxy (text)
app.post('/api/gemini', async (req: Request, res: Response) => {
  if (!GEMINI_KEY) return res.status(500).json({ error: 'Gemini not configured' });
  try {
    const { model, contents, config, ...rest } = req.body || {};
    const payload: any = {
      model: model || 'gemini-3-pro-preview',
      contents,
      ...rest
    };
    if (config) {
      payload.generationConfig = config;
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${payload.model}:generateContent?key=${GEMINI_KEY}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return forward(r, res);
  } catch (err) {
    console.error('Gemini proxy failed', err);
    return res.status(500).json({ error: 'Gemini proxy failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
