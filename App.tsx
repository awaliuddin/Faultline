
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

type ViewMode = 'INPUT' | 'REPORT';

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

  const handleAnalyze = useCallback(async (text: string, image?: { data: string, mimeType: string }) => {
    const apiKey = getApiKey();
    
    if (!apiKey) {
        alert("API Key missing. Please ensure you are running in an environment with API_KEY configured.");
        return;
    }

    setViewMode('REPORT');
    setAnalysisState(prev => ({ 
        ...prev, 
        isProcessing: true, 
        progressMessage: 'Mapping geological structure...',
        step: 'extracting'
    }));

    try {
        // Step 1: Extraction
        const claims = await extractClaims(text, apiKey, image);
        
        if (claims.length === 0) {
            throw new Error("No structural elements detected.");
        }

        // Identify which claims are testable (Facts with importance >= 3)
        // We do verify ALL important facts now, not just top 5, but let's cap at 8 for performance/rate-limits
        const claimsToVerify = claims
            .filter(c => c.type === 'fact' && c.importance >= 3)
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 8);
        
        const claimIdsToVerify = new Set(claimsToVerify.map(c => c.id));

        setAnalysisState(prev => ({
            ...prev,
            claims,
            progressMessage: `Mapped ${claims.length} structural elements. Stress-testing ${claimsToVerify.length} critical load-bearing facts...`,
            step: 'verifying'
        }));

        // Initialize verifications state
        // IMPORTANT: We must set a state for ALL claims, otherwise 'ClaimRow' might get stuck loading
        const initialVerifications: Record<string, VerificationResult> = {};
        
        claims.forEach(c => {
             if (claimIdsToVerify.has(c.id)) {
                 initialVerifications[c.id] = { claimId: c.id, status: 'loading', explanation: 'Queued for stress-testing...', sources: [] };
             } else {
                 // Mark as skipped (Opinion or Low Importance)
                 let reason = 'Low load-bearing impact.';
                 if (c.type === 'opinion') reason = 'Subjective opinion (not testable).';
                 if (c.type === 'interpretation') reason = 'Interpretation (context dependent).';
                 
                 initialVerifications[c.id] = { 
                     claimId: c.id, 
                     status: 'skipped', 
                     explanation: reason, 
                     sources: [] 
                 };
             }
        });
        
        setAnalysisState(prev => ({ ...prev, verifications: initialVerifications }));

        // Step 2: Verification Loop
        for (const claim of claimsToVerify) {
            // Update progress for specific claim
            setAnalysisState(prev => ({
                ...prev,
                verifications: {
                    ...prev.verifications,
                    [claim.id]: { ...prev.verifications[claim.id], explanation: 'Running seismic stress test...' }
                }
            }));

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
        const { critique, improvedPrompt } = await generateCritiqueAndPrompt(text || "Image-based analysis", claimsToVerify, apiKey);

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
            progressMessage: 'Seismic survey interrupted due to technical error.',
            step: 'idle'
        }));
        alert("An error occurred during analysis. Check console for details.");
        setViewMode('INPUT');
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-orange-500/30">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10 pointer-events-none">
        <div className="text-xl font-bold tracking-tighter text-slate-500 pointer-events-auto">
          Fault<span className="text-orange-500">line</span>
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
