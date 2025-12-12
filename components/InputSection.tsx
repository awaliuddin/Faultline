import React, { useState } from 'react';
import { Upload, Search, FileText, Settings2 } from 'lucide-react';
import type { ModelProvider } from '../types';

interface InputSectionProps {
  onAnalyze: (text: string) => void;
  isProcessing: boolean;
  provider: ModelProvider;
  onProviderChange: (provider: ModelProvider) => void;
  mode: 'fast' | 'balanced' | 'full';
  onModeChange: (mode: 'fast' | 'balanced' | 'full') => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isProcessing, provider, onProviderChange, mode, onModeChange }) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onAnalyze(inputText);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center mb-10">
        <div className="flex flex-col items-center gap-4 mb-4">
          <img
            src="/logo.png"
            alt="Faultline logo"
            className="h-24 md:h-32 w-auto rounded-xl shadow-lg shadow-cyan-900/50"
          />
        </div>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Paste any AI answer. Faultline runs a seismic check on every claim, compares it against the real world, and flags the weak points before they break in production.
        </p>
      </div>

      <div className="w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-2 shadow-2xl">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 p-6 min-h-[200px] outline-none resize-none text-lg font-light leading-relaxed rounded-xl focus:bg-slate-800/80 transition-all"
            placeholder="Paste an AI answer, article snippet, or essay here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing}
          />
          
          <div className="flex justify-between items-center px-6 pb-4 pt-2 border-t border-slate-700/50 mt-2">
            <div className="flex space-x-4">
               {/* File upload placeholder - visual only for this demo as per restrictions */}
              <button type="button" className="flex items-center space-x-2 text-slate-400 hover:text-cyan-400 transition-colors cursor-not-allowed opacity-50" title="Coming soon">
                <Upload size={18} />
                <span className="text-sm">Upload Screenshot</span>
              </button>
              <div className="flex items-center space-x-2 text-slate-400 text-sm">
                <Settings2 size={16} className="text-slate-500" />
                <select
                  value={provider}
                  onChange={(e) => onProviderChange(e.target.value as ModelProvider)}
                  disabled={isProcessing}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="google">Google (Gemini 3)</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="local">Local (offline)</option>
                </select>
                <select
                  value={mode}
                  onChange={(e) => onModeChange(e.target.value as 'fast' | 'balanced' | 'full')}
                  disabled={isProcessing}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="fast">Fast</option>
                  <option value="balanced">Balanced</option>
                  <option value="full">Full</option>
                </select>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all transform ${
                inputText.trim() && !isProcessing
                  ? 'bg-cyan-600 hover:bg-cyan-500 hover:scale-105 text-white shadow-lg shadow-cyan-900/50'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>Run seismic scan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-400 text-sm">
        <div className="flex flex-col items-center space-y-2">
            <div className="p-3 bg-slate-800 rounded-full text-cyan-400"><FileText size={20} /></div>
            <span>Extracts atomic claims</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
            <div className="p-3 bg-slate-800 rounded-full text-purple-400"><Search size={20} /></div>
            <span>Verifies with Search</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
            <div className="p-3 bg-slate-800 rounded-full text-red-400"><Upload size={20} /></div>
            <span>Exposes Weak Logic</span>
        </div>
      </div>
    </div>
  );
};
