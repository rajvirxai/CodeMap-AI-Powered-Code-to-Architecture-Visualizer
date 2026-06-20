"use client";

import React, { useState } from 'react';
import { NodeDetailsPanel } from '@/components/NodeDetailsPanel';

export default function DashboardPage() {
  // Managing states for tracking clicked nodes, loading indicators, and API status
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Triggered when clicking a file node on your central architecture graph canvas
  const handleNodeClick = (clickedNodeData: any) => {
    setSelectedNode(clickedNodeData);
    setIsPanelOpen(true);
    setIsAIAnalyzing(true);
    setApiError(null);

    // Mock API pipeline fetch (Simulating backend integration execution)
    setTimeout(() => {
      const mockEnhancedAIData = {
        ...clickedNodeData,
        aiDetails: {
          purpose: "Handles core user session initializations, parses secure incoming login credentials, and coordinates JWT handshake protocols smoothly.",
          inputs: ["req.body.email", "req.body.password"],
          outputs: ["sessionToken JSON", "secureCookie header"],
          role: "Authentication Controller / Route Controller"
        },
        relatedFiles: ["db.ts", "authRoutes.js", "tokenValidator.tsx"]
      };
      
      setSelectedNode(mockEnhancedAIData);
      setIsAIAnalyzing(false);
    }, 1200); // 1.2 second loading visual test state
  };

  return (
    /* Main wrapper updated to use the premium soft cream background layout (#F0EDE4) */
    <div className="relative min-h-screen bg-[#F0EDE4] text-[#1E1F22] flex font-sans overflow-hidden">
      
      {/* PRAGYA'S ISOLATED SIDEBAR WORKSPACE 
        She can code her collapsible folders inside this container file safely 
        without breaking your elements.
      */}
      <div className="w-72 bg-white m-4 mr-0 rounded-[28px] border border-[#E5E0D5]/60 shadow-sm p-4 flex flex-col">
        <h3 className="font-bold text-sm text-neutral-400 uppercase tracking-wider mb-4">Repository Explorer</h3>
        <div className="flex-1 border border-dashed border-neutral-200 rounded-[20px] flex items-center justify-center p-4 text-center bg-[#F0EDE4]/20">
          <p className="text-xs italic text-neutral-400">[Pragya's folder tree lists here independently]</p>
        </div>
      </div>

      {/* CENTRAL VISUALIZER BOARD (The Graph Workspace) */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        
        {/* Soft Minimalist Top Navbar */}
        <div className="flex justify-between items-center bg-white/60 backdrop-blur-md px-6 py-4 rounded-[24px] border border-white/80 shadow-sm">
          <div>
            <h1 className="text-lg font-bold tracking-tight">CodeMap Workspace</h1>
            <p className="text-xs text-neutral-500">System Flow Visualizer Canvas</p>
          </div>
          <div className="text-xs bg-[#1E1F22] text-white px-4 py-2 rounded-full font-semibold">
            Active Sprint: Day 5
          </div>
        </div>

        {/* Node Tree Canvas Simulation Space */}
        <div className="flex-1 my-4 bg-white/40 border border-dashed border-[#D2CBB8] rounded-[32px] flex items-center justify-center flex-col p-6 text-center">
          <p className="text-sm text-neutral-500 max-w-sm mb-4">
            This workspace holds your visual chart networks. Click the target below to run an interactive state execution.
          </p>

          {/* Canvas Node Click Simulator Trigger Button */}
          <button
            onClick={() => handleNodeClick({ id: "authController.js", type: "JavaScript File" })}
            className="bg-[#1E1F22] hover:bg-neutral-800 text-white px-6 py-3 rounded-full text-xs font-bold tracking-wide shadow-md transition-all active:scale-95"
          >
            🎯 Simulate Clicking Node: "authController.js"
          </button>
        </div>
      </div>

      {/* SANCHITA'S ISOLATED SIDE PANEL OVERLAY */}
      <NodeDetailsPanel
        node={selectedNode}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        isLoading={isAIAnalyzing}
        error={apiError}
      />
    </div>
  );
}