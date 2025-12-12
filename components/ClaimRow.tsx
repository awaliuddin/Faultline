import React from 'react';
import type { Claim, VerificationResult } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, ExternalLink, Loader2 } from 'lucide-react';

interface ClaimRowProps {
  claim: Claim;
  verification?: VerificationResult;
}

export const ClaimRow: React.FC<ClaimRowProps> = ({ claim, verification }) => {
  const skipReason = () => {
    if (verification) return '';
    if (claim.type !== 'fact') return 'Not verified: non-factual claim type.';
    if (claim.importance < 3) return 'Not verified: below importance threshold (>=3).';
    return 'Not verified: deprioritized due to verification cap; consider manual review.';
  };

  const statusHelp = () => {
    if (!verification) return 'Skipped (non-factual or low importance).';
    switch (verification.status) {
      case 'supported': return 'Evidence supports this claim.';
      case 'contradicted': return 'Evidence contradicts this claim.';
      case 'mixed': return 'Evidence is mixed or unclear.';
      case 'unverified': return verification.explanation || 'No evidence found or verification failed.';
      case 'loading': return 'Verification in progress...';
      default: return 'No status available.';
    }
  };

  const getStatusIcon = () => {
    if (!verification) return <HelpCircle className="text-slate-500" size={20} />;
    
    switch (verification.status) {
      case 'supported': return <CheckCircle2 className="text-emerald-500" size={20} />;
      case 'contradicted': return <XCircle className="text-red-500" size={20} />;
      case 'mixed': return <AlertTriangle className="text-amber-500" size={20} />;
      case 'unverified': return <HelpCircle className="text-slate-500" size={20} />;
      case 'loading': return <Loader2 className="animate-spin text-cyan-500" size={20} />;
      default: return <HelpCircle className="text-slate-500" size={20} />;
    }
  };

  const getStatusColor = () => {
    if (!verification) return 'border-l-slate-700 bg-slate-800/30';
    switch (verification.status) {
      case 'supported': return 'border-l-emerald-500 bg-emerald-950/10';
      case 'contradicted': return 'border-l-red-500 bg-red-950/10';
      case 'mixed': return 'border-l-amber-500 bg-amber-950/10';
      default: return 'border-l-slate-500 bg-slate-800/30';
    }
  };

  return (
    <div className={`p-4 rounded-r-lg border-l-4 mb-3 transition-all ${getStatusColor()}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
              {claim.type} • Impact: {claim.importance}/5
            </span>
          </div>
          <p className="text-slate-200 font-medium text-lg leading-snug">{claim.text}</p>
          
          {verification && verification.status !== 'loading' && (
            <div className="mt-3 text-sm text-slate-400 bg-slate-900/50 p-3 rounded border border-white/5">
              <p className="mb-2"><span className="font-semibold text-slate-300">Analysis:</span> {verification.explanation}</p>
              
              {verification.sources.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  {verification.sources.map((source, idx) => (
                    <div key={idx} className="bg-slate-950/40 p-2 rounded border border-slate-800/60">
                      <a 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
                      >
                        <ExternalLink size={10} />
                        {source.title.length > 40 ? source.title.substring(0, 40) + '...' : source.title}
                      </a>
                      {source.snippet && (
                        <div className="text-xs text-slate-500 mt-1">
                          {source.snippet}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!verification && (
            <div className="mt-3 text-xs text-slate-500 bg-slate-900/40 p-3 rounded border border-white/5">
              {skipReason()}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 min-w-[40px]" title={statusHelp()}>
          {getStatusIcon()}
          {verification && verification.status !== 'loading' && (
            <span className={`text-[10px] uppercase font-bold tracking-wider ${
              verification.status === 'supported' ? 'text-emerald-500' :
              verification.status === 'contradicted' ? 'text-red-500' :
              verification.status === 'mixed' ? 'text-amber-500' : 'text-slate-500'
            }`}>
              {verification.status}
            </span>
          )}
          {!verification && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              not checked
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
