import React, { useState } from 'react';

export interface AIData {
  purpose: string;
  inputs: string[];
  outputs: string[];
  role: string;
}

export interface NodeData {
  id: string;
  type: string;
  aiDetails?: AIData;
  relatedFiles?: string[];
}

interface ArchitectureModule {
  name: string;
  type: string;
  description: string;
  children: string[];
}

interface Architecture {
  entryPoint: string;
  modules: ArchitectureModule[];
  summary?: string;
}

interface NodeDetailsPanelProps {
  node: NodeData | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
  architecture?: Architecture | null;
  projectName?: string;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  node,
  isOpen,
  onClose,
  isLoading,
  error,
  architecture,
  projectName = 'Project',
}) => {
  const [cachedNode, setCachedNode] = useState<NodeData | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'node'>('summary');
  const [prevNode, setPrevNode] = useState<NodeData | null>(null);
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(false);

  if (node !== prevNode || isOpen !== prevIsOpen) {
    setPrevNode(node);
    setPrevIsOpen(isOpen);
    if (isOpen) {
      if (node) {
        setCachedNode(node);
        setViewMode('node');
      } else {
        setViewMode('summary');
      }
    }
  }

  return (
    <>
      {/* Backdrop overlay for Mobile Details Panel */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#1E1F22]/20 backdrop-blur-xs z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <div 
        className={`bg-white rounded-[24px] border border-[#E5E0D5] flex flex-col shrink-0 transition-all duration-300 ease-in-out z-40 text-[#1E1F22] overflow-hidden
          /* Desktop layout: sidebar member */
          lg:flex lg:relative lg:inset-auto lg:h-full
          ${isOpen ? 'lg:w-96 lg:opacity-100 lg:p-6 lg:border' : 'lg:w-0 lg:p-0 lg:border-0 lg:opacity-0 lg:pointer-events-none'}
          /* Mobile layout: floating drawer */
          fixed inset-y-4 right-4 h-[calc(100vh-6rem)] w-96 shadow-lg p-6
          ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-96 opacity-0 pointer-events-none lg:translate-x-0 lg:opacity-100'}
        `}
      >
        {/* Render content wrapper only when open or transitioning */}
        <div className={`flex flex-col h-full space-y-6 overflow-hidden transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          {/* Header */}
          <div className="flex justify-between items-start shrink-0">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                {viewMode === 'node' ? (cachedNode?.type || 'File Module') : 'Project Overview'}
              </span>
              <h3 className="text-lg font-bold text-[#1E1F22] tracking-tight truncate max-w-[240px]" title={viewMode === 'node' ? cachedNode?.id : projectName}>
                {viewMode === 'node' ? cachedNode?.id : projectName}
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-[#F0EDE4] hover:bg-[#E5E0D5] rounded-full text-[#1E1F22] font-bold text-xs transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Content Scrolling Area */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
            {isLoading && (
              <div className="space-y-4 animate-pulse">
                <div className="h-28 bg-[#F0EDE4] rounded-[16px]"></div>
                <div className="h-20 bg-[#F0EDE4] rounded-[16px]"></div>
              </div>
            )}

            {error && !isLoading && (
              <div className="bg-[#FF7563]/10 border border-[#FF7563]/30 rounded-[16px] p-4 text-xs text-[#FF7563]">
                <p className="font-bold">Fetch Error</p>
                <p className="opacity-90">{error}</p>
              </div>
            )}

            {!isLoading && !error && (
              viewMode === 'node' && cachedNode ? (
                /* --- NODE DETAILS VIEW --- */
                <>
                  {/* Visual Top Badge with Aura Aesthetic */}
                  <div className="relative overflow-hidden bg-[#D2CBB8] text-[#1E1F22] p-5 rounded-[16px] h-32 flex flex-col justify-end shadow-sm">
                    <div className="absolute top-[-20px] right-[-20px] w-28 h-28 bg-[#FFD13B] rounded-full filter blur-xl opacity-70"></div>
                    <div className="absolute top-[20px] right-[40px] w-20 h-20 bg-[#FF7563] rounded-full filter blur-xl opacity-60"></div>
                    
                    <div className="relative z-10">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 block mb-0.5">AI Layer Assessment</span>
                      <p className="text-sm font-bold leading-tight truncate max-w-[200px]">
                        {cachedNode.aiDetails?.role || "Architecture Node"}
                      </p>
                    </div>
                  </div>

                  {/* AI Functional Description Block */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-1">Functional Description</h4>
                    <p className="text-xs text-neutral-600 bg-[#F0EDE4]/40 p-4 rounded-[16px] border border-[#E5E0D5] leading-relaxed">
                      {cachedNode.aiDetails?.purpose || "No analysis details generated for this system entity yet."}
                    </p>
                  </div>

                  {/* Charcoal Block for Inputs & Outputs */}
                  <div className="bg-[#1E1F22] rounded-[16px] p-4 text-white space-y-4 shadow-inner">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFD13B] block mb-1">Inputs Parsed</span>
                      <div className="flex flex-wrap gap-1">
                        {cachedNode.aiDetails?.inputs?.map((inp, idx) => (
                          <span key={idx} className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-neutral-200 font-mono">
                            {inp}
                          </span>
                        )) || <span className="text-xs opacity-50 italic">None</span>}
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7563] block mb-1">Outputs Generated</span>
                      <div className="flex flex-wrap gap-1">
                        {cachedNode.aiDetails?.outputs?.map((out, idx) => (
                          <span key={idx} className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-neutral-200 font-mono">
                            {out}
                          </span>
                        )) || <span className="text-xs opacity-50 italic">None</span>}
                      </div>
                    </div>
                  </div>

                  {/* Related Assets */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-1">Related Assets</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {cachedNode.relatedFiles && cachedNode.relatedFiles.length > 0 ? (
                        cachedNode.relatedFiles.map((file, idx) => (
                          <span key={idx} className="text-xs bg-[#F0EDE4] hover:bg-[#E5E0D5] text-[#1E1F22] px-3 py-1.5 rounded-[12px] font-medium transition-colors border border-transparent hover:border-neutral-300 cursor-pointer">
                            {file}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-neutral-400 italic pl-1">Isolated system file.</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* --- PROJECT SUMMARY VIEW --- */
                <>
                  {/* Visual Top Badge with Aura Aesthetic */}
                  <div className="relative overflow-hidden bg-[#D2CBB8] text-[#1E1F22] p-5 rounded-[16px] h-32 flex flex-col justify-end shadow-sm">
                    <div className="absolute top-[-20px] right-[-20px] w-28 h-28 bg-[#FFD13B] rounded-full filter blur-xl opacity-70"></div>
                    <div className="absolute top-[20px] right-[40px] w-20 h-20 bg-[#FF7563] rounded-full filter blur-xl opacity-60"></div>
                    
                    <div className="relative z-10">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 block mb-0.5">System Architecture</span>
                      <p className="text-sm font-bold leading-tight truncate max-w-[200px]">
                        Project Overview
                      </p>
                    </div>
                  </div>

                  {/* Key Statistics Grid */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="bg-[#F0EDE4]/40 p-3 rounded-[16px] border border-[#E5E0D5] flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Entry Point</span>
                      <span className="text-xs font-mono font-bold text-[#1E1F22] truncate" title={architecture?.entryPoint || 'None'}>
                        {architecture?.entryPoint || 'index.js'}
                      </span>
                    </div>
                    <div className="bg-[#F0EDE4]/40 p-3 rounded-[16px] border border-[#E5E0D5] flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Scanned Modules</span>
                      <span className="text-xs font-mono font-bold text-[#1E1F22]">
                        {architecture?.modules?.length || 0} Modules
                      </span>
                    </div>
                  </div>

                  {/* Summary Text block */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-1">Project Summary</h4>
                    <p className="text-xs text-neutral-600 bg-[#F0EDE4]/40 p-4 rounded-[16px] border border-[#E5E0D5] leading-relaxed">
                      {architecture?.summary || "No high-level project summary description has been generated for this repository yet."}
                    </p>
                  </div>

                  {/* Scanned Modules Checklist */}
                  {architecture?.modules && architecture.modules.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-1">System Component Map</h4>
                      <div className="space-y-2.5">
                        {architecture.modules.map((mod, idx) => {
                          const typeLower = mod.type.toLowerCase();
                          let badgeColor = 'bg-blue-50/70 border-blue-100 text-blue-600';
                          if (typeLower.includes('util') || typeLower.includes('helper')) badgeColor = 'bg-emerald-50/70 border-emerald-100 text-emerald-600';
                          else if (typeLower.includes('route') || typeLower.includes('router')) badgeColor = 'bg-purple-50/70 border-purple-100 text-purple-600';
                          else if (typeLower.includes('controller')) badgeColor = 'bg-amber-50/70 border-amber-100 text-amber-600';
                          else if (typeLower.includes('database') || typeLower.includes('model') || typeLower.includes('db')) badgeColor = 'bg-rose-50/70 border-rose-100 text-rose-600';

                          return (
                            <div key={idx} className="bg-white hover:bg-[#FCFBF9] border border-[#E5E0D5] p-3.5 rounded-[16px] shadow-sm transition-all flex flex-col gap-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-[#1E1F22]">{mod.name}</span>
                                <span className={`text-[8px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-full ${badgeColor}`}>
                                  {mod.type}
                                </span>
                              </div>
                              {mod.description && (
                                <p className="text-[10.5px] text-neutral-500 leading-snug">
                                  {mod.description}
                                </p>
                              )}
                              {mod.children && mod.children.length > 0 && (
                                <div className="text-[9px] font-mono text-neutral-400 mt-1 border-t border-[#F0EDE4] pt-1.5 truncate">
                                  Files: {mod.children.join(', ')}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
};