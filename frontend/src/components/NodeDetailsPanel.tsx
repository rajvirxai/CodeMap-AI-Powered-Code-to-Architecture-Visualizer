import React from 'react';

interface AIData {
  purpose: string;
  inputs: string[];
  outputs: string[];
  dependencies?: string[];
  role: string;
}

interface NodeData {
  id: string;
  type: string;
  aiDetails?: AIData;
  relatedFiles?: string[];
}

interface NodeDetailsPanelProps {
  node: NodeData | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  node,
  isOpen,
  onClose,
  isLoading,
  error,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-20 right-6 w-96 h-[calc(100vh-6rem)] bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-[#E5E0D5] z-40 text-[#1E1F22] flex flex-col transition-all duration-300 p-6 space-y-6">
      
      {/* Panel Header */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 block mb-1">
            {node?.type || 'File Module'}
          </span>
          <h3 className="text-xl font-bold text-[#1E1F22] tracking-tight truncate max-w-[240px]">
            {node ? node.id : 'Analysis'}
          </h3>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center bg-[#F0EDE4] hover:bg-[#E5E0D5] rounded-full text-[#1E1F22] font-bold text-xs transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Content Scrolling Area */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
        
        {/* Loading State Skeleton */}
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-28 bg-[#F0EDE4] rounded-[24px]"></div>
            <div className="h-20 bg-[#F0EDE4] rounded-[24px]"></div>
          </div>
        )}

        {/* Error Notification Block */}
        {error && !isLoading && (
          <div className="bg-[#FF7563]/10 border border-[#FF7563]/30 rounded-[20px] p-4 text-sm text-[#FF7563]">
            <p className="font-bold">Fetch Error</p>
            <p className="text-xs opacity-90">{error}</p>
          </div>
        )}

        {/* Active Data Layout Display */}
        {!isLoading && !error && node && (
          <>
            {/* Visual Top Badge with Aura Aesthetic */}
            <div className="relative overflow-hidden bg-[#D2CBB8] text-[#1E1F22] p-5 rounded-[24px] h-32 flex flex-col justify-end">
              <div className="absolute top-[-20px] right-[-20px] w-28 h-28 bg-[#FFD13B] rounded-full filter blur-xl opacity-70"></div>
              <div className="absolute top-[20px] right-[40px] w-20 h-20 bg-[#FF7563] rounded-full filter blur-xl opacity-60"></div>
              
              <div className="relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 block">AI Layer Assessment</span>
                <p className="text-base font-bold leading-tight truncate max-w-[200px]">
                  {node.aiDetails?.role || "Architecture Node"}
                </p>
              </div>
            </div>

            {/* AI Functional Description Block */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Functional Description</h4>
              <p className="text-sm text-neutral-700 bg-[#F0EDE4]/50 p-4 rounded-[20px] border border-[#E5E0D5]/50 leading-relaxed">
                {node.aiDetails?.purpose || "No analysis details generated for this system entity yet."}
              </p>
            </div>

            {/* Charcoal Block for Inputs, Outputs & Dependencies */}
            <div className="bg-[#1E1F22] rounded-[24px] p-4 text-white space-y-4 shadow-inner">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFD13B] block mb-1">Inputs Parsed</span>
                <div className="flex flex-wrap gap-1">
                  {node.aiDetails?.inputs?.map((inp, idx) => (
                    <span key={idx} className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-neutral-200">
                      {inp}
                    </span>
                  )) || <span className="text-xs opacity-50 italic">None</span>}
                </div>
              </div>

              <div className="border-t border-white/10 pt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7563] block mb-1">Outputs Generated</span>
                <div className="flex flex-wrap gap-1">
                  {node.aiDetails?.outputs?.map((out, idx) => (
                    <span key={idx} className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-neutral-200">
                      {out}
                    </span>
                  )) || <span className="text-xs opacity-50 italic">None</span>}
                </div>
              </div>

              <div className="border-t border-white/10 pt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8] block mb-1">Dependencies</span>
                <div className="flex flex-wrap gap-1">
                  {node.aiDetails?.dependencies?.map((dep, idx) => (
                    <span key={idx} className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-neutral-200">
                      {dep}
                    </span>
                  )) || <span className="text-xs opacity-50 italic">None</span>}
                </div>
              </div>
            </div>

            {/* Pill-shaped links for Related Assets */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Related Assets</h4>
              <div className="flex flex-wrap gap-1.5">
                {node.relatedFiles && node.relatedFiles.length > 0 ? (
                  node.relatedFiles.map((file, idx) => (
                    <span key={idx} className="text-xs bg-[#F0EDE4] hover:bg-[#E5E0D5] text-[#1E1F22] px-3 py-1.5 rounded-full font-medium transition-colors border border-transparent hover:border-neutral-300 cursor-pointer">
                      {file}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-neutral-400 italic pl-1">Isolated system file.</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};