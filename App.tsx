import React, { useState, useCallback } from 'react';
import type { AnalysisState, VerificationResult, ModelProvider } from './types';
import { extractClaims, verifyClaim, generateCritiqueAndPrompt } from './services/geminiService';
import { InputSection } from './components/InputSection';
import { Dashboard } from './components/Dashboard';

// Safe environment variable access helper
const getApiKey = (provider: ModelProvider): string | undefined => {
  if (typeof process === 'undefined' || !process.env) return undefined;
  const env = process.env;
  switch (provider) {
    case 'google':
      return env.GEMINI_API_KEY || env.API_KEY;
    case 'openai':
      return env.OPENAI_API_KEY; // optional when using proxy
    case 'anthropic':
      return env.ANTHROPIC_API_KEY; // optional when using proxy
    case 'local':
    default:
      return env.API_KEY;
  }
};

const hasProxy = (): boolean => {
  if (typeof process === 'undefined' || !process.env) return false;
  return Boolean(process.env.PROXY_BASE_URL || '/api');
};

type ViewMode = 'INPUT' | 'AUTOPSY';
const BACKOFF_MS = 800;

type ModeKey = 'fast' | 'balanced' | 'full';

const MODE_PRESETS: Record<ModeKey, { maxVerifications: number; timeoutMs: number; retries: number; concurrency: number }> = {
  fast: { maxVerifications: 12, timeoutMs: 7000, retries: 1, concurrency: 6 },
  balanced: { maxVerifications: 24, timeoutMs: 9000, retries: 2, concurrency: 6 },
  full: { maxVerifications: 40, timeoutMs: 12000, retries: 2, concurrency: 6 }
};

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const runConcurrent = async <T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<PromiseSettledResult<R>[]> => {
  const results: PromiseSettledResult<R>[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const chunk = items.slice(i, i + limit);
    const settled = await Promise.allSettled(
      chunk.map((item, idx) => worker(item, i + idx))
    );
    results.push(...settled);
  }
  return results;
};

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('INPUT');
  const [mode, setMode] = useState<ModeKey>('balanced');
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    claims: [],
    verifications: {},
    isProcessing: false,
    isBackgroundVerifying: false,
    progressMessage: '',
    step: 'idle',
    overallRisk: 'low'
  });
  const [provider, setProvider] = useState<ModelProvider>('google');

  const handleReset = () => {
    setAnalysisState({
      claims: [],
      verifications: {},
    isProcessing: false,
    isBackgroundVerifying: false,
    progressMessage: '',
    step: 'idle',
    overallRisk: 'low'
  });
    setViewMode('INPUT');
  };

  const calculateRisk = (verifications: Record<string, VerificationResult>, totalClaims: number): AnalysisState['overallRisk'] => {
    const values = Object.values(verifications);
    const contradicted = values.filter(v => v.status === 'contradicted').length;
    const mixed = values.filter(v => v.status === 'mixed').length;
    const unverified = values.filter(v => v.status === 'unverified').length;
    const verifiedCount = values.filter(v => v.status !== 'loading').length;
    const notChecked = Math.max(0, totalClaims - values.length);
    const effectiveUnknown = unverified + notChecked;
    
    if (contradicted >= 2 || (contradicted >= 1 && mixed >= 1)) return 'critical';
    if (contradicted >= 1) return 'high';
    if (mixed >= 2) return 'high';
    if (mixed === 1) return 'medium';
    // If many claims remain unverified, consider it medium risk instead of low-confidence green.
    if (effectiveUnknown >= Math.max(2, Math.ceil(totalClaims * 0.3))) return 'medium';
    if (verifiedCount === 0 && totalClaims > 0) return 'medium';
    return 'low';
  };

  const verifyWithRetry = useCallback(async (claim, apiKey: string, provider: ModelProvider, timeoutMs: number, retries: number) => {
    let attempt = 0;
    let delay = BACKOFF_MS;
    while (attempt <= retries) {
      try {
        const result = await Promise.race<Promise<VerificationResult>>([
          verifyClaim(claim, apiKey, provider),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
        ]);
        return result;
      } catch (err: any) {
        attempt += 1;
        if (attempt > retries) throw err;
        await sleep(delay);
        delay *= 2;
      }
    }
    throw new Error('unreachable');
  }, []);

  const handleAnalyze = useCallback(async (text: string) => {
    const apiKey = getApiKey(provider);
    const preset = MODE_PRESETS[mode];
    
    if (!apiKey && provider === 'google' && !hasProxy()) {
        alert("API Key missing. Please ensure you are running in an environment with the correct key configured for the selected provider, or use the proxy.");
        return;
    }

    setViewMode('AUTOPSY');
    setAnalysisState(prev => ({ 
        ...prev, 
        isProcessing: true, 
        progressMessage: 'Extracting atomic claims...',
        step: 'extracting'
    }));

    try {
        // Step 1: Extraction
        const claims = await extractClaims(text, apiKey || '', provider);
        
        // Filter for high importance factual claims to verify
        const claimsToVerify = claims
            .filter(c => c.type === 'fact' && c.importance >= 3)
            .sort((a, b) => b.importance - a.importance)
            .slice(0, preset.maxVerifications);

        const highImpact = claimsToVerify.filter(c => c.importance === 5);

        setAnalysisState(prev => ({
            ...prev,
            claims,
            progressMessage: `Extracted ${claims.length} claims. Verifying ${claimsToVerify.length} critical facts...`,
            step: 'verifying'
        }));

        // Step 2: Verification
        const initialVerifications: Record<string, VerificationResult> = {};
        claimsToVerify.forEach(c => {
             initialVerifications[c.id] = { claimId: c.id, status: 'loading', explanation: '', sources: [] };
        });
        setAnalysisState(prev => ({ ...prev, verifications: initialVerifications }));

        const verificationAccumulator: Record<string, VerificationResult> = { ...initialVerifications };

        // Batch 1: high impact (5/5) with overlay
        if (highImpact.length > 0) {
          setAnalysisState(prev => ({ ...prev, progressMessage: `Verifying top impact claims (${highImpact.length})...` }));
          const results = await runConcurrent(
            highImpact,
            preset.concurrency,
            (claim) =>
              verifyWithRetry(claim, apiKey || '', provider, preset.timeoutMs, preset.retries).catch(err => {
                console.error(`Verification failed for ${claim.id}`, err);
                return {
                  claimId: claim.id,
                  status: 'unverified',
                  explanation: err?.message ? `Verification failed: ${err.message}` : 'Verification failed; check logs or proxy.',
                  sources: []
                } as VerificationResult;
              })
          );
          results.forEach((res, idx) => {
            const claimId = highImpact[idx].id;
            const value = res.status === 'fulfilled' ? res.value : {
              claimId,
              status: 'unverified',
              explanation: 'Verification failed; check logs or proxy.',
              sources: []
            };
            verificationAccumulator[claimId] = value;
          });
          setAnalysisState(prev => {
            const updated = { ...prev.verifications, ...verificationAccumulator };
            return {
              ...prev,
              verifications: updated,
              overallRisk: calculateRisk(updated, claims.length),
              isProcessing: false,
              progressMessage: `Verified ${highImpact.length} top-impact claims. Continuing with remaining...`
            };
          });
        } else {
          setAnalysisState(prev => ({ ...prev, isProcessing: false }));
        }

        // Batch 2: medium/remaining impact in background
        const remaining = claimsToVerify.filter(c => !highImpact.includes(c));
        if (remaining.length > 0) {
          setAnalysisState(prev => ({
            ...prev,
            isBackgroundVerifying: true,
            step: 'verifying_rest',
            progressMessage: `Verifying remaining ${remaining.length} claims...`
          }));

          const remainingResults = await runConcurrent(
            remaining,
            preset.concurrency,
            (claim) =>
              verifyWithRetry(claim, apiKey || '', provider, preset.timeoutMs, preset.retries).catch(err => {
                console.error(`Verification failed for ${claim.id}`, err);
                return {
                  claimId: claim.id,
                  status: 'unverified',
                  explanation: err?.message ? `Verification failed: ${err.message}` : 'Verification failed; check logs or proxy.',
                  sources: []
                } as VerificationResult;
              })
          );

          remainingResults.forEach((res, idx) => {
            const claimId = remaining[idx].id;
            const value = res.status === 'fulfilled' ? res.value : {
              claimId,
              status: 'unverified',
              explanation: 'Verification failed; check logs or proxy.',
              sources: []
            };
            verificationAccumulator[claimId] = value;
          });

          setAnalysisState(prev => {
            const updated = { ...prev.verifications, ...verificationAccumulator };
            return {
              ...prev,
              verifications: updated,
              overallRisk: calculateRisk(updated, claims.length),
              isBackgroundVerifying: false,
              progressMessage: `Verified ${Object.keys(verificationAccumulator).length}/${claimsToVerify.length} critical facts`
            };
          });
        }

        // Step 3: Critique after all batches
        const { critique, improvedPrompt } = await generateCritiqueAndPrompt(text, claims, verificationAccumulator, apiKey || '', provider);

        setAnalysisState(prev => ({
            ...prev,
            step: 'complete',
            critique,
            improvedPrompt
        }));

    } catch (error) {
        console.error(error);
        setAnalysisState(prev => ({
            ...prev,
            isProcessing: false,
            isBackgroundVerifying: false,
            progressMessage: 'Error occurred during analysis.',
            step: 'idle'
        }));
        alert("An error occurred during analysis. Check console for details.");
        setViewMode('INPUT');
    }
  }, [provider, verifyWithRetry, mode]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-cyan-500/30">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      
      <header className="absolute top-0 left-0 w-full p-6 flex justify-center items-center z-10 pointer-events-none">
        <div className="text-xl font-bold tracking-tighter pointer-events-auto">
          <span className="text-cyan-500">Fault</span><span className="text-red-500">line</span>
        </div>
      </header>

      <main className="relative z-0">
        {viewMode === 'INPUT' ? (
          <InputSection 
            onAnalyze={handleAnalyze} 
            isProcessing={analysisState.isProcessing} 
            provider={provider}
            onProviderChange={setProvider}
            mode={mode}
            onModeChange={setMode}
          />
        ) : (
          <Dashboard state={analysisState} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}

export default App;
