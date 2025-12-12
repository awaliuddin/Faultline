import React, { useEffect, useRef, useState } from 'react';
import type { AnalysisState, VerificationResult } from '../types';
import { ClaimRow } from './ClaimRow';
import { ArrowLeft, ShieldAlert, Sparkles, Activity } from 'lucide-react';

interface DashboardProps {
  state: AnalysisState;
  onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, onReset }) => {
  const { claims, verifications, overallRisk, critique, improvedPrompt } = state;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [copied, setCopied] = useState(false);

  // Explicit casting for safety
  const verificationValues = Object.values(verifications) as VerificationResult[];
  
  const stats = {
    supported: verificationValues.filter((v) => v.status === 'supported').length,
    contradicted: verificationValues.filter((v) => v.status === 'contradicted').length,
    mixed: verificationValues.filter((v) => v.status === 'mixed').length,
    notChecked: claims.filter((c) => !verifications[c.id]).length,
    unverified: verificationValues.filter((v) => v.status === 'unverified').length,
    total: claims.length
  };
  const totalUnverified = stats.unverified + stats.notChecked;
  const completedPercent = stats.total > 0
    ? Math.round(((stats.supported + stats.contradicted + stats.mixed + totalUnverified) / stats.total) * 100)
    : 0;

  const pendingVerifications = verificationValues.filter((v) => v.status === 'loading').length;

  useEffect(() => {
    if (state.isProcessing && videoRef.current) {
      videoRef.current.playbackRate = 0.25;
      videoRef.current.play().catch(() => {});
    }
  }, [state.isProcessing]);

  const handleCopyPrompt = async () => {
    if (!improvedPrompt) return;
    try {
      await navigator.clipboard.writeText(improvedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.warn('Clipboard copy failed', err);
    }
  };

  // Simple SVG Pie Chart Logic
  const createPieSlice = (startAngle: number, endAngle: number, color: string) => {
    const x1 = 50 + 50 * Math.cos(Math.PI * startAngle / 180);
    const y1 = 50 + 50 * Math.sin(Math.PI * startAngle / 180);
    const x2 = 50 + 50 * Math.cos(Math.PI * endAngle / 180);
    const y2 = 50 + 50 * Math.sin(Math.PI * endAngle / 180);
    
    // Flag for large arc (if > 180 degrees)
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return (
      <path
        d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
        fill={color}
      />
    );
  };

  const renderPieChart = () => {
    if (stats.total === 0) return <circle cx="50" cy="50" r="50" fill="#334155" />;
    
    const data = [
      { value: stats.supported, color: '#10b981' }, // emerald-500
      { value: stats.contradicted, color: '#ef4444' }, // red-500
      { value: stats.mixed, color: '#f59e0b' }, // amber-500
      { value: stats.unverified + stats.notChecked, color: '#38bdf8' } // sky-400
    ];

    let currentAngle = -90; // Start at top
    const total = stats.total;
    
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-0">
        {data.map((slice, i) => {
          if (slice.value === 0) return null;
          const sliceAngle = (slice.value / total) * 360;
          const endAngle = currentAngle + sliceAngle;
          const path = createPieSlice(currentAngle, endAngle, slice.color);
          currentAngle = endAngle;
          return <g key={i}>{path}</g>;
        })}
        {/* Inner circle for donut effect */}
        <circle cx="50" cy="50" r="35" fill="#1e293b" />
      </svg>
    );
  };

  const getRiskColor = () => {
    switch (overallRisk) {
      case 'low': return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
      case 'medium': return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
      case 'high': return 'text-orange-500 border-orange-500/50 bg-orange-500/10';
      case 'critical': return 'text-red-500 border-red-500/50 bg-red-500/10';
      default: return 'text-slate-400 border-slate-500';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 pb-20">
      <button 
        onClick={onReset}
        className="flex items-center space-x-2 text-slate-400 hover:text-white mb-6 transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span>Analyze another text</span>
      </button>

      {/* Header Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Scorecard */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Autopsy Report</h2>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>{claims.length} Total Claims</span>
                <span>•</span>
                <span>{Object.keys(verifications).length} Verified</span>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg border ${getRiskColor()} flex items-center gap-2`}>
              <Activity size={18} />
              <span className="font-bold uppercase tracking-wider text-sm">{overallRisk} Risk Level</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center mt-6 gap-8">
            <div className="h-32 w-32 relative flex-shrink-0">
               {renderPieChart()}
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <span className="text-xl font-bold text-white">
                        {completedPercent}%
                    </span>
               </div>
             </div>
             
             <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="text-emerald-400 font-bold text-xl">{stats.supported}</div>
                    <div className="text-xs uppercase text-slate-500 font-bold tracking-wider">Supported</div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="text-red-400 font-bold text-xl">{stats.contradicted}</div>
                    <div className="text-xs uppercase text-slate-500 font-bold tracking-wider">Contradicted</div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="text-amber-400 font-bold text-xl">{stats.mixed}</div>
                    <div className="text-xs uppercase text-slate-500 font-bold tracking-wider">Mixed/Unclear</div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="text-sky-400 font-bold text-xl">{stats.unverified + stats.notChecked}</div>
                    <div className="text-xs uppercase text-slate-500 font-bold tracking-wider">Unverified/Not Checked</div>
                </div>
             </div>
          </div>
        </div>

        {/* AI Critique */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl flex flex-col justify-center relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldAlert size={100} />
             </div>
             <h3 className="text-slate-400 font-semibold mb-3 flex items-center gap-2">
                <ShieldAlert size={18} />
                Executive Summary
             </h3>
             <p className="text-lg text-slate-200 leading-relaxed">
                {critique || `Reviewing ${stats.total} claims: ${stats.supported} supported, ${stats.contradicted} contradicted, ${stats.mixed} mixed, ${stats.unverified} unverified.`}
             </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Claim Table */}
        <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Claim Verification Report</h3>
            {pendingVerifications > 0 && (
              <div className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/40 rounded-lg px-3 py-2 animate-pulse">
                Background verification in progress: {pendingVerifications} claim{pendingVerifications !== 1 ? 's' : ''} remaining...
              </div>
            )}
            <div className="space-y-2">
                {claims.map(claim => (
                    <ClaimRow 
                        key={claim.id} 
                        claim={claim} 
                        verification={verifications[claim.id]} 
                    />
                ))}
            </div>
        </div>

        {/* Sidebar: Prompt Improvement */}
        <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 sticky top-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles size={18} className="text-purple-400" />
                    Ask Better Next Time
                </h3>
                <div className="text-sm text-slate-400 mb-4">
                    Based on the logical gaps found in this answer, here is a stronger prompt for your next attempt:
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-sm text-purple-200 whitespace-pre-wrap">
                    {improvedPrompt || "Generating improved prompt..."}
                </div>
                <button 
                    onClick={handleCopyPrompt}
                    disabled={!improvedPrompt}
                    className={`mt-4 w-full py-2 rounded text-sm font-medium transition-colors ${
                      improvedPrompt ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                    }`}
                >
                    {copied ? 'Copied!' : 'Copy Prompt'}
                </button>
            </div>
        </div>
      </div>

      {state.isProcessing && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-md w-full">
            <video
              ref={videoRef}
              src="/Faultline_Animation.mp4"
              autoPlay
              loop
              muted
              className="w-full rounded-xl border border-slate-800 shadow-lg"
            />
            <div className="text-sm text-slate-300 text-center">
              {state.progressMessage || 'Running autopsy...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
