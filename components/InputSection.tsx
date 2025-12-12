import React, { useState, useRef } from 'react';
import { Upload, Search, Activity, Layers, AlertTriangle, X, Image as ImageIcon } from 'lucide-react';

interface InputSectionProps {
  onAnalyze: (text: string, image?: { data: string, mimeType: string }) => void;
  isProcessing: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isProcessing }) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string, data: string, mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() || selectedFile) {
      onAnalyze(inputText, selectedFile ? { data: selectedFile.data, mimeType: selectedFile.mimeType } : undefined);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size too large. Please select an image under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64Data = base64String.split(',')[1];
        setSelectedFile({
          name: file.name,
          data: base64Data,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center mb-10">
        <h1 className="text-6xl font-extrabold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-purple-600">
          Faultline
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
          A seismic stress-test for AI answers. Map the information geology, test the integrity of every claim, and locate the fracture points before they collapse.
        </p>
      </div>

      <div className="w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-2 shadow-2xl shadow-orange-900/10">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            className="w-full bg-transparent text-slate-100 placeholder-slate-600 p-6 min-h-[200px] outline-none resize-none text-lg font-light leading-relaxed rounded-xl focus:bg-slate-800/80 transition-all selection:bg-orange-500/30"
            placeholder="Paste an AI answer, article snippet, or financial report here to test its stability..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing}
          />
          
          <div className="flex justify-between items-center px-6 pb-4 pt-2 border-t border-slate-700/50 mt-2">
            <div className="flex items-center space-x-4">
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleFileSelect} 
                 accept="image/*" 
                 className="hidden" 
               />
               
               {!selectedFile ? (
                 <button 
                   type="button" 
                   onClick={() => fileInputRef.current?.click()}
                   className="flex items-center space-x-2 text-slate-400 hover:text-orange-400 transition-colors" 
                   disabled={isProcessing}
                 >
                   <Upload size={18} />
                   <span className="text-sm">Upload Evidence</span>
                 </button>
               ) : (
                 <div className="flex items-center space-x-2 bg-slate-700/50 px-3 py-1 rounded-full border border-slate-600">
                   <ImageIcon size={14} className="text-orange-400" />
                   <span className="text-xs text-slate-300 max-w-[150px] truncate">{selectedFile.name}</span>
                   <button 
                     type="button" 
                     onClick={clearFile}
                     className="text-slate-400 hover:text-red-400 transition-colors"
                   >
                     <X size={14} />
                   </button>
                 </div>
               )}
            </div>
            
            <button
              type="submit"
              disabled={(!inputText.trim() && !selectedFile) || isProcessing}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-bold uppercase tracking-wide transition-all transform ${
                (inputText.trim() || selectedFile) && !isProcessing
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 hover:scale-105 text-white shadow-lg shadow-orange-900/50'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
              }`}
            >
              {isProcessing ? (
                <>
                  <Activity className="animate-pulse" size={18} />
                  <span>Surveying...</span>
                </>
              ) : (
                <>
                  <Activity size={18} />
                  <span>Run Seismic Survey</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-500 text-sm font-medium">
        <div className="flex flex-col items-center space-y-2 group">
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-full text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/50 transition-all duration-300"><Layers size={20} /></div>
            <span>Maps Information Plates</span>
        </div>
        <div className="flex flex-col items-center space-y-2 group">
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-full text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/50 transition-all duration-300"><Search size={20} /></div>
            <span>Stress-Tests Claims</span>
        </div>
        <div className="flex flex-col items-center space-y-2 group">
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-full text-slate-400 group-hover:text-red-400 group-hover:border-red-500/50 transition-all duration-300"><AlertTriangle size={20} /></div>
            <span>Locates Fault Lines</span>
        </div>
      </div>
    </div>
  );
};