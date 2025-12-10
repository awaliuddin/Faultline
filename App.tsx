import React, { useState, useCallback } from 'react';
import type { AnalysisState, VerificationResult } from './types';
import { extractClaims, verifyClaim, generateCritiqueAndPrompt } from './services/geminiService';
import { InputSection } from './components/InputSection';
import { Dashboard } from './components/Dashboard';

// Safe environment variable access helper
const getApiKey = (): string | undefined => {
  // Check if process exists and has the expected structure
  if (typeof process !== 'undefined' && process.env) {
    return process.env.API_KEY;
  }
  return undefined;
};

type ViewMode = 'INPUT' | 'AUTOPSY';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('INPUT');
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    claims: [],
    verifications: {},
    isProcessing: false,
    progressMessage: '',
    step: 'idle',
    overallRisk: 'low'
  });

  const handleReset = () => {
    setAnalysisState({
      claims: [],
      verifications: {},
      isProcessing: false,
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
    
    if (contradicted > 2) return 'critical';
    if (contradicted > 0 || mixed > 2) return 'high';
    if (mixed > 0) return 'medium';
    return 'low';
  };

  const handleAnalyze = useCallback(async (text: string) => {
    const apiKey = getApiKey();
    
    if (!apiKey) {
        alert("API Key missing. Please ensure you are running in an environment with API_KEY configured.");
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
        const claims = await extractClaims(text, apiKey);
        
        // Filter for high importance factual claims to verify
        const claimsToVerify = claims
            .filter(c => c.type === 'fact' && c.importance >= 3)
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 5);

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

        for (const claim of claimsToVerify) {
            const result = await verifyClaim(claim, apiKey);
            
            setAnalysisState(prev => {
                const updatedVerifications = { ...prev.verifications, [claim.id]: result };
                return {
                    ...prev,
                    verifications: updatedVerifications,
                    overallRisk: calculateRisk(updatedVerifications, claims.length)
                };
            });
        }

        // Step 3: Critique
        const { critique, improvedPrompt } = await generateCritiqueAndPrompt(text, claimsToVerify, apiKey);

        setAnalysisState(prev => ({
            ...prev,
            isProcessing: false,
            step: 'complete',
            critique,
            improvedPrompt
        }));

    } catch (error) {
        console.error(error);
        setAnalysisState(prev => ({
            ...prev,
            isProcessing: false,
            progressMessage: 'Error occurred during analysis.',
            step: 'idle'
        }));
        alert("An error occurred during analysis. Check console for details.");
        setViewMode('INPUT');
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-cyan-500/30">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10 pointer-events-none">
        <div className="text-xl font-bold tracking-tighter text-slate-500 pointer-events-auto">
          Fault<span className="text-cyan-500">line</span>
        </div>
      </header>

      <main className="relative z-0">
        {viewMode === 'INPUT' ? (
          <InputSection onAnalyze={handleAnalyze} isProcessing={analysisState.isProcessing} />
        ) : (
          <Dashboard state={analysisState} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}

export default App;