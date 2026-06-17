'use client';

import { useState, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen, 
  File, 
  ChevronRight, 
  ChevronDown, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  RefreshCw,
  Info
} from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

export default function DashboardPage() {
  const [treeData, setTreeData] = useState<FileNode | null>(null);
  const [activeFile, setActiveFile] = useState<string>('App.js');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);

  // Retrieve cached repository tree from loading stage
  useEffect(() => {
    const cached = sessionStorage.getItem('codemap_tree');
    if (cached) {
      try {
        setTreeData(JSON.parse(cached));
      } catch (e) {
        console.error('Error parsing cached repository tree', e);
      }
    } else {
      // Fallback fallback if directly navigating to dashboard
      setTreeData({
        name: "my-app",
        type: "folder",
        children: [
          { name: "index.js", type: "file" },
          { name: "utils.js", type: "file" },
          {
            name: "components",
            type: "folder",
            children: [
              { name: "Dashboard.js", type: "file" },
              { name: "Sidebar.js", type: "file" }
            ]
          },
          { name: "package.json", type: "file" }
        ]
      });
    }
  }, []);

  // Zoom handlers
  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.1, 1.8));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoomScale(1);

  // Export handler
  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert('CodeMap architecture exported successfully as PNG!');
    }, 1200);
  };

  // Directory Node renderer component
  const DirectoryNode = ({ node, depth = 0 }: { node: FileNode; depth: number }) => {
    const [isOpen, setIsOpen] = useState(true);
    const isFolder = node.type === 'folder';

    const handleClick = () => {
      if (isFolder) {
        setIsOpen(!isOpen);
      } else {
        setActiveFile(node.name);
      }
    };

    return (
      <div className="select-none">
        <div 
          onClick={handleClick}
          className={`flex items-center gap-2 py-1.5 px-2.5 rounded-md cursor-pointer transition-colors ${
            activeFile === node.name 
              ? 'bg-zinc-800 text-white font-medium' 
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
          style={{ paddingLeft: `${depth * 16 + 10}px` }}
        >
          {isFolder ? (
            <>
              <span className="text-zinc-600">
                {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </span>
              <span className="text-blue-400">
                {isOpen ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
              </span>
            </>
          ) : (
            <>
              <span className="w-3.5" /> {/* Spacer instead of chevron */}
              <span className="text-zinc-500">
                <File className="w-4 h-4" />
              </span>
            </>
          )}
          <span className="text-xs font-mono">{node.name}</span>
        </div>

        {isFolder && isOpen && node.children && (
          <div className="mt-0.5">
            {node.children.map((child, idx) => (
              <DirectoryNode key={idx} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-zinc-950 text-white">
      {/* 1. Left Sidebar: Interactive repository directory explorer */}
      <aside className="w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col shrink-0 select-none">
        <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
          <span className="text-xs font-mono font-bold tracking-wider text-zinc-500 uppercase">
            Explorer
          </span>
          <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
            LOCAL
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {treeData ? (
            <DirectoryNode node={treeData} depth={0} />
          ) : (
            <div className="p-4 text-center text-xs font-mono text-zinc-600">
              Loading structure...
            </div>
          )}
        </div>
        
        {/* Footer info box */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/60 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
          <p className="text-[10px] font-mono text-zinc-600 leading-normal">
            Click on file nodes to display dependency architecture canvas.
          </p>
        </div>
      </aside>

      {/* 2. Central Workspace Canvas */}
      <main className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative overflow-hidden">
        
        {/* Top Controls Bar */}
        <header className="h-14 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-6 z-10">
          {/* Current view marker */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-xs font-bold text-zinc-400">View:</span>
            <span className="font-mono text-xs font-bold bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded text-white shadow-inner">
              {activeFile}
            </span>
          </div>

          {/* Export Map layout button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-1.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-xs font-mono font-bold tracking-wide rounded hover:border-zinc-700 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export Map</span>
              </>
            )}
          </button>
        </header>

        {/* Central Visualizer Area (Zoomable Canvas) */}
        <div className="flex-1 overflow-auto relative bg-[radial-gradient(ellipse_at_center,#18181b_0%,#09090b_100%)] flex items-center justify-center p-8">
          
          {/* Subtle Grid Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

          {/* Scalable Container */}
          <div 
            className="transition-transform duration-200 ease-out origin-center flex flex-col items-center justify-center min-w-[500px]"
            style={{ transform: `scale(${zoomScale})` }}
          >
            
            {/* Top Root Block: [App.js] */}
            <div className="flex flex-col items-center">
              <div className="border-2 border-white bg-zinc-900 px-6 py-3.5 rounded shadow-[4px_4px_0px_rgba(255,255,255,0.15)] max-w-[150px] text-center">
                <span className="text-xs font-mono text-zinc-500 block uppercase tracking-wider mb-0.5">Entry</span>
                <span className="font-mono font-bold text-sm text-white">{activeFile}</span>
              </div>
            </div>

            {/* SVG Linking Lines */}
            <div className="w-full max-w-sm h-12 relative flex justify-center">
              <svg className="w-full h-full absolute top-0 left-0" viewBox="0 0 400 50">
                {/* Branch line to left (Components) */}
                <line x1="200" y1="0" x2="100" y2="50" stroke="#52525b" strokeWidth="1.5" strokeDasharray="3 3" />
                {/* Branch line to right (Utils) */}
                <line x1="200" y1="0" x2="300" y2="50" stroke="#52525b" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>
            </div>

            {/* Branch Level 1 Nodes */}
            <div className="flex gap-16 justify-center w-full">
              
              {/* Left Branch: [Components] */}
              <div className="flex flex-col items-center">
                <div className="border border-zinc-800 bg-zinc-900/80 px-5 py-3 rounded text-center w-[130px]">
                  <span className="text-[10px] font-mono text-blue-400 block uppercase tracking-wider mb-0.5">Directory</span>
                  <span className="font-mono font-bold text-xs text-white">Components</span>
                </div>

                {/* Vertical Linking Line */}
                <div className="h-10 w-[1.5px] bg-dashed border-l border-zinc-700 border-dashed" />

                {/* Sub Node: [Dashboard.js] */}
                <div className="border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 rounded text-center w-[120px] shadow-lg">
                  <span className="text-[9px] font-mono text-zinc-500 block mb-0.5">Component</span>
                  <span className="font-mono text-xs text-zinc-300">Dashboard.js</span>
                </div>
              </div>

              {/* Right Branch: [Utils] */}
              <div className="flex flex-col items-center">
                <div className="border border-zinc-800 bg-zinc-900/80 px-5 py-3 rounded text-center w-[130px]">
                  <span className="text-[10px] font-mono text-emerald-400 block uppercase tracking-wider mb-0.5">Utility</span>
                  <span className="font-mono font-bold text-xs text-white">Utils</span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Sticky floating navigation controls panel in bottom-right */}
        <div className="absolute bottom-6 right-6 flex items-center gap-1.5 p-1.5 bg-zinc-950 border border-zinc-900 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-20">
          <button 
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 border border-transparent hover:border-zinc-800 hover:bg-zinc-900 rounded-md text-zinc-400 hover:text-white transition-all"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <button 
            onClick={handleZoomReset}
            title="Reset Zoom"
            className="px-2.5 py-1.5 border border-zinc-900 bg-zinc-900 hover:bg-zinc-800 rounded-md text-[10px] font-mono text-zinc-400 hover:text-white transition-all"
          >
            {Math.round(zoomScale * 100)}%
          </button>

          <button 
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 border border-transparent hover:border-zinc-800 hover:bg-zinc-900 rounded-md text-zinc-400 hover:text-white transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-zinc-900 mx-1" />

          <button 
            onClick={handleZoomReset}
            title="Fit to screen"
            className="p-2 border border-transparent hover:border-zinc-800 hover:bg-zinc-900 rounded-md text-zinc-400 hover:text-white transition-all"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

      </main>
    </div>
  );
}
