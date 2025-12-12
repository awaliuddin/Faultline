import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
        'process.env.ANTHROPIC_API_KEY': JSON.stringify(env.ANTHROPIC_API_KEY),
        'process.env.OPENAI_MODEL': JSON.stringify(env.OPENAI_MODEL),
        'process.env.ANTHROPIC_MODEL': JSON.stringify(env.ANTHROPIC_MODEL),
        'process.env.CUSTOM_SEARCH_API_KEY': JSON.stringify(env.CUSTOM_SEARCH_API_KEY),
        'process.env.GOOGLE_CSE_ID': JSON.stringify(env.GOOGLE_CSE_ID),
        'process.env.PROXY_BASE_URL': JSON.stringify(env.PROXY_BASE_URL || '/api')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
