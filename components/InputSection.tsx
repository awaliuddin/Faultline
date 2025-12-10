import React, { useState } from 'react';
import { Upload, Search, FileText } from 'lucide-react';

interface InputSectionProps {
  onAnalyze: (text: string) => void;
  isProcessing: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isProcessing }) => {
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
        <h1 className="text-5xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
          Faultline
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          The inference autopsy for AI answers. Paste any AI-generated text to dissect its claims, check them against reality, and find the hallucinations.
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
                  <span>Run Autopsy</span>
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