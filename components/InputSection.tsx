
import React, { useState, useRef } from 'react';
import { Upload, Search, Activity, Layers, AlertTriangle, X, Image as ImageIcon, Code, Cpu, Trophy, ExternalLink } from 'lucide-react';

interface InputSectionProps {
  onAnalyze: (text: string, image?: { data: string, mimeType: string }) => void;
  isProcessing: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isProcessing }) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string, data: string, mimeType: string } | null>(null);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
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

  const features = [
    {
      id: 0,
      icon: Layers,
      color: "text-cyan-400",
      borderColor: "group-hover:border-cyan-500/50",
      hoverText: "group-hover:text-cyan-400",
      title: "Maps Information Plates",
      modalTitle: "Structural Decomposition",
      modalSubtitle: "Powered by Gemini 3 Pro Reasoning",
      content: (
        <div className="space-y-4 text-slate-300">
            <p>
                LLMs are convincing because they are fluent. <strong>Faultline</strong> disrupts that fluency.
            </p>
            <p>
                We use Gemini 3's advanced reasoning capabilities to strip away rhetoric and isolate <strong>"Atomic Claims"</strong>. By requesting a strict JSON schema, we force the model to categorize every sentence as a <em>Fact</em> (Testable), <em>Opinion</em> (Subjective), or <em>Interpretation</em>.
            </p>
            <div className="bg-cyan-950/30 p-4 rounded-lg border border-cyan-500/20 text-sm mt-4">
                <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold">
                    <Code size={16} />
                    <span>Dev Lesson: Schema is Strategy</span>
                </div>
                Don't just ask for text. Use Gemini's <code>responseSchema</code> to enforce structural thinking. It turns a creative writer into a data parser.
            </div>
            <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-cyan-400 transition-colors mt-2">
                <ExternalLink size={12} />
                Try JSON Mode in Google AI Studio
            </a>
        </div>
      )
    },
    {
      id: 1,
      icon: Search,
      color: "text-emerald-400",
      borderColor: "group-hover:border-emerald-500/50",
      hoverText: "group-hover:text-emerald-400",
      title: "Stress-Tests Claims",
      modalTitle: "Adversarial Verification",
      modalSubtitle: "Powered by Google Search Grounding",
      content: (
        <div className="space-y-4 text-slate-300">
            <p>
                Hallucinations happen when models are confident but wrong. To catch them, we must introduce <strong>Friction</strong>.
            </p>
            <p>
                Faultline isolates "Load-Bearing Facts" (high importance claims) and uses the <strong>Gemini API's native <code>googleSearch</code> tool</strong> to run live verification queries. If the search results don't align with the claim, we flag it as a fracture.
            </p>
            <div className="bg-emerald-950/30 p-4 rounded-lg border border-emerald-500/20 text-sm mt-4">
                <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold">
                    <Cpu size={16} />
                    <span>Dev Lesson: Grounding</span>
                </div>
                For enterprise applications, reasoning without grounding is dangerous. Always connect your model to the world using Tools.
            </div>
        </div>
      )
    },
    {
      id: 2,
      icon: AlertTriangle,
      color: "text-red-400",
      borderColor: "group-hover:border-red-500/50",
      hoverText: "group-hover:text-red-400",
      title: "Locates Fault Lines",
      modalTitle: "Seismic Risk Assessment",
      modalSubtitle: "Join the Kaggle Competition",
      content: (
        <div className="space-y-4 text-slate-300">
            <p>
                Not all errors are equal. A wrong date is a crack; a wrong conclusion is a collapse.
            </p>
            <p>
                We calculate a <strong>Stability Score</strong> based strictly on verified facts, ignoring subjective fluff. This is the kind of "System 2" thinking that Gemini 3 excels at—analyzing its own output for logical consistency.
            </p>
            <div className="bg-red-950/30 p-4 rounded-lg border border-red-500/20 text-sm mt-4">
                <div className="flex items-center gap-2 mb-2 text-red-400 font-bold">
                    <Trophy size={16} />
                    <span>Steal this Idea</span>
                </div>
                We built this for the Gemini 3 Kaggle Competition. The tools are free to try. What will you build?
            </div>
            <a href="https://www.kaggle.com/competitions/gemini-3" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors mt-2">
                <ExternalLink size={12} />
                View the Competition on Kaggle
            </a>
        </div>
      )
    }
  ];

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
      
      {/* Interactive Feature Icons */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-500 text-sm font-medium w-full max-w-3xl">
        {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
                <button 
                    key={idx}
                    onClick={() => setActiveFeature(feature.id)}
                    className="flex flex-col items-center space-y-3 group focus:outline-none"
                >
                    <div className={`p-4 bg-slate-800/50 border border-slate-700 rounded-full text-slate-400 transition-all duration-300 transform group-hover:scale-110 group-hover:shadow-lg ${feature.borderColor} ${feature.hoverText}`}>
                        <Icon size={24} />
                    </div>
                    <div className="flex items-center gap-1 group-hover:text-slate-300 transition-colors">
                        <span>{feature.title}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                            <ExternalLink size={10} />
                        </div>
                    </div>
                </button>
            );
        })}
      </div>

      {/* Feature Details Modal */}
      {activeFeature !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setActiveFeature(null)}>
            <div 
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-0 relative animate-in zoom-in-95 duration-200 overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header with Color Accent */}
                <div className={`h-2 w-full bg-gradient-to-r ${
                    activeFeature === 0 ? 'from-cyan-500 to-blue-600' : 
                    activeFeature === 1 ? 'from-emerald-500 to-green-600' : 
                    'from-red-500 to-orange-600'
                }`} />
                
                <div className="p-8">
                    <button 
                        onClick={() => setActiveFeature(null)}
                        className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors bg-slate-800/50 p-1 rounded-full hover:bg-slate-800"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-start gap-4 mb-6">
                        <div className={`p-3 rounded-xl border bg-opacity-10 ${
                             activeFeature === 0 ? 'bg-cyan-500 border-cyan-500/30 text-cyan-400' : 
                             activeFeature === 1 ? 'bg-emerald-500 border-emerald-500/30 text-emerald-400' : 
                             'bg-red-500 border-red-500/30 text-red-400'
                        }`}>
                            {React.createElement(features[activeFeature].icon, { size: 32 })}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white tracking-tight">{features[activeFeature].modalTitle}</h3>
                            <p className={`text-sm font-medium uppercase tracking-wider mt-1 ${features[activeFeature].color}`}>
                                {features[activeFeature].modalSubtitle}
                            </p>
                        </div>
                    </div>

                    <div className="prose prose-invert prose-sm">
                        {features[activeFeature].content}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
                         <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Tech Spec // Gemini 3</span>
                         <button 
                            onClick={() => setActiveFeature(null)}
                            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                         >
                            Close Details
                         </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
