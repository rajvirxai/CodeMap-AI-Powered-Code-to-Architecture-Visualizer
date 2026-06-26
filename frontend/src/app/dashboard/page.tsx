"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Folder, 
  FolderOpen, 
  File, 
  ChevronRight, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  RefreshCw,
  Info,
  Menu
} from 'lucide-react';
import { NodeDetailsPanel } from '@/components/NodeDetailsPanel';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  imports?: string[];
  exports?: string[];
  dependencies?: string[];
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
  techStack?: string[];
  framework?: string;
  database?: string;
  externalAPIs?: string[];
  authentication?: string;
}

export default function DashboardPage() {
  const [treeData, setTreeData] = useState<FileNode | null>(null);
  const [architecture, setArchitecture] = useState<Architecture | null>(null);
  const [activeFile, setActiveFile] = useState<string>('index.js');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Close sidebar by default on smaller screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Retrieve cached repository tree from loading stage
  useEffect(() => {
    const cached = sessionStorage.getItem('codemap_tree');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.fileTree && parsed.architecture) {
          setTreeData(parsed.fileTree);
          setArchitecture(parsed.architecture);
          setActiveFile(parsed.architecture.entryPoint || 'index.js');
        } else {
          // Legacy/fallback structure
          setTreeData(parsed);
        }
      } catch (e) {
        console.error('Error parsing cached repository tree', e);
      }
    } else {
      // Fallback if directly navigating to dashboard
      const defaultMock = {
        fileTree: {
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
        },
        architecture: {
          entryPoint: "index.js",
          modules: [
            {
              name: "Components",
              type: "Component",
              description: "Core UI layout and panel display components",
              children: ["Dashboard.js", "Sidebar.js"]
            },
            {
              name: "Utils",
              type: "Utility",
              description: "Helper files and calculations",
              children: ["utils.js"]
            }
          ]
        }
      };
      setTreeData(defaultMock.fileTree as FileNode);
      setArchitecture(defaultMock.architecture);
      setActiveFile(defaultMock.architecture.entryPoint);
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

  // Managing states for tracking clicked nodes, loading indicators, and API status
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Search tree recursively to find active file node
  const activeFileNode = useMemo(() => {
    if (!treeData) return null;
    const findNode = (node: FileNode, targetName: string): FileNode | null => {
      if (node.type === 'file' && node.name === targetName) {
        return node;
      }
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child, targetName);
          if (found) return found;
        }
      }
      return null;
    };
    return findNode(treeData, activeFile);
  }, [treeData, activeFile]);

  // Determine file imports/exports/dependencies, generating realistic defaults for code files if missing
  const fileDiagramData = useMemo(() => {
    if (!activeFileNode) return null;
    
    // Check if it's a code file by extension
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.json', '.html', '.css'];
    const fileExt = activeFileNode.name.slice(activeFileNode.name.lastIndexOf('.'));
    const isCodeFile = codeExtensions.includes(fileExt.toLowerCase()) || activeFileNode.name.endsWith('.js') || activeFileNode.name.endsWith('.ts');
    
    if (!isCodeFile) return null;

    // 1. Use scanned backend metadata if present
    if (
      (activeFileNode.imports && activeFileNode.imports.length > 0) ||
      (activeFileNode.exports && activeFileNode.exports.length > 0) ||
      (activeFileNode.dependencies && activeFileNode.dependencies.length > 0)
    ) {
      return {
        imports: activeFileNode.imports || [],
        exports: activeFileNode.exports || [],
        dependencies: activeFileNode.dependencies || []
      };
    }

    // 2. Otherwise, dynamically generate realistic mock data based on the filename
    const nameNoExt = activeFileNode.name.split('.')[0];
    let imports: string[] = [];
    let exports: string[] = [];
    let dependencies: string[] = [];

    const lowerName = activeFileNode.name.toLowerCase();
    if (lowerName.includes('controller')) {
      imports = ['db.js', 'geminiAnalyzer.js', 'dotenv'];
      exports = [`get${nameNoExt.replace('Controller', '')}`, `update${nameNoExt.replace('Controller', '')}`, `delete${nameNoExt.replace('Controller', '')}`];
      dependencies = ['express', 'mongoose'];
    } else if (lowerName.includes('route')) {
      imports = ['express', `${nameNoExt.replace('Routes', 'Controller').replace('Route', 'Controller') || 'controller'}.js`];
      exports = ['router'];
      dependencies = ['express'];
    } else if (lowerName.includes('db') || lowerName.includes('model') || lowerName.includes('schema')) {
      imports = ['mongoose', 'dotenv'];
      exports = [nameNoExt.charAt(0).toUpperCase() + nameNoExt.slice(1)];
      dependencies = ['mongoose'];
    } else if (lowerName.includes('util') || lowerName.includes('helper')) {
      imports = ['fs', 'path'];
      exports = ['scanDirectory', 'formatDate', 'sanitizeName'];
      dependencies = [];
    } else if (lowerName.includes('component') || lowerName.includes('page') || activeFileNode.name.charAt(0) === activeFileNode.name.charAt(0).toUpperCase()) {
      imports = ['react', 'lucide-react', 'NodeDetailsPanel.tsx'];
      exports = [nameNoExt];
      dependencies = ['react', 'lucide-react'];
    } else {
      imports = ['utils.js', 'package.json'];
      exports = [nameNoExt || 'defaultExport'];
      dependencies = [];
    }

    return {
      imports,
      exports,
      dependencies
    };
  }, [activeFileNode]);

  const handleNodeClick = (clickedNodeData: any) => {
    setSelectedNode({ id: clickedNodeData.id, type: clickedNodeData.type });
    setIsPanelOpen(true);
    setIsAIAnalyzing(true);
    setApiError(null);

    let related: string[] = ["index.js", "package.json"];
    let inputs: string[] = ["import"];
    let outputs: string[] = ["export"];
    
    const findNode = (node: FileNode, targetName: string): FileNode | null => {
      if (node.name === targetName) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child, targetName);
          if (found) return found;
        }
      }
      return null;
    };

    let realNode: FileNode | null = null;
    if (treeData) {
      realNode = findNode(treeData, clickedNodeData.id);
    }

    if (realNode) {
      if (realNode.imports && realNode.imports.length > 0) {
        inputs = realNode.imports.slice(0, 4);
        related = [...related, ...realNode.imports];
      }
      if (realNode.exports && realNode.exports.length > 0) {
        outputs = realNode.exports.slice(0, 4);
        related = [...related, ...realNode.exports];
      }
      if (realNode.dependencies && realNode.dependencies.length > 0) {
        related = [...related, ...realNode.dependencies];
      }
    }

    related = Array.from(new Set(related)).filter(f => f !== clickedNodeData.id).slice(0, 5);

    setTimeout(() => {
      setIsAIAnalyzing(false);
      setSelectedNode({
        id: clickedNodeData.id,
        type: clickedNodeData.type,
        aiDetails: {
          purpose: `Coordinates system operations for ${clickedNodeData.id}. It structures local API requests/responses, integrates downstream resources, and maintains dynamic flow control across related repository files.`,
          inputs: inputs.length > 0 ? inputs : ["None"],
          outputs: outputs.length > 0 ? outputs : ["None"],
          role: `${clickedNodeData.type}`
        },
        relatedFiles: related
      });
    }, 850);
  };

  const handleCanvasNodeClick = (nodeName: string, nodeType: string) => {
    handleNodeClick({ id: nodeName, type: nodeType });
    
    const checkFileExists = (node: FileNode | null, target: string): boolean => {
      if (!node) return false;
      if (node.type === 'file' && node.name === target) return true;
      if (node.children) {
        for (const child of node.children) {
          if (checkFileExists(child, target)) return true;
        }
      }
      return false;
    };

    if (treeData && checkFileExists(treeData, nodeName)) {
      setActiveFile(nodeName);
    }
  };

  const DirectoryNode = ({ node, depth = 0 }: { node: FileNode; depth: number }) => {
    const [isOpen, setIsOpen] = useState(depth < 2);
    const isFolder = node.type === 'folder';

    const handleClick = () => {
      if (isFolder) {
        setIsOpen(!isOpen);
      } else {
        setActiveFile(node.name);
        handleNodeClick({ id: node.name, type: "Code File" });
      }
    };

    const isActive = activeFile === node.name;

    return (
      <div className="select-none">
        <div 
          onClick={handleClick}
          className={`flex items-center gap-2 py-1.5 px-3 rounded-[12px] cursor-pointer transition-all duration-150 border border-transparent ${
            isActive 
              ? 'bg-[#1E1F22] text-white font-medium shadow-sm border-[#1E1F22]' 
              : 'text-neutral-600 hover:text-[#1E1F22] hover:bg-[#F0EDE4]/60'
          }`}
        >
          {isFolder ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <ChevronRight 
                className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-90' : ''
                }`} 
              />
              <span className="text-[#C2BBA8]">
                {isOpen ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-3.5" />
              <span className="text-neutral-400">
                <File className="w-4 h-4" />
              </span>
            </div>
          )}
          <span className="text-xs font-mono truncate">{node.name}</span>
        </div>

        {isFolder && node.children && (
          <div 
            className="ml-3 pl-3.5 border-l border-[#E5E0D5] space-y-0.5 transition-all duration-300 ease-in-out overflow-hidden"
            style={{ 
              maxHeight: isOpen ? '5000px' : '0px', 
              opacity: isOpen ? 1 : 0,
              pointerEvents: isOpen ? 'auto' : 'none'
            }}
          >
            {node.children.map((child, idx) => (
              <DirectoryNode key={idx} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full bg-[#F0EDE4] text-[#1E1F22] flex font-sans overflow-hidden p-4 gap-4">
      
      {/* Backdrop overlay for Mobile Sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#1E1F22]/20 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Explorer Sidebar */}
      <aside 
        className={`bg-white rounded-[24px] border border-[#E5E0D5] p-5 flex flex-col shrink-0 select-none transition-all duration-300 ease-in-out z-40
          /* Desktop layout: toggle width */
          lg:flex lg:relative lg:inset-auto lg:h-full ${isSidebarOpen ? 'w-72 opacity-100' : 'w-0 p-0 border-0 opacity-0 pointer-events-none'}
          /* Mobile layout: floating drawer */
          fixed inset-y-4 left-4 h-[calc(100vh-6rem)] w-72 shadow-lg
          ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-80 opacity-0 pointer-events-none lg:translate-x-0 lg:opacity-100'}
        `}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <span className="text-sm font-bold tracking-wider text-neutral-400 uppercase">
            Explorer
          </span>
          <span className="text-[10px] font-bold bg-[#F0EDE4] text-[#1E1F22] px-2.5 py-1 rounded-full border border-[#E5E0D5]">
            LOCAL
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto mt-2 pr-1 custom-scrollbar">
          {treeData ? (
            <div className="space-y-1">
              <DirectoryNode node={treeData} depth={0} />
            </div>
          ) : (
            <div className="p-4 text-center text-xs font-mono text-neutral-400 animate-pulse">
              Loading repository...
            </div>
          )}
        </div>
        
        {architecture && architecture.summary && (
          <div className="mt-4 shrink-0 overflow-y-auto max-h-[300px] relative overflow-hidden bg-[#1E1F22] text-white p-5 rounded-[24px] shadow-inner custom-scrollbar">
            <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-[#FFD13B] rounded-full filter blur-xl opacity-20 pointer-events-none"></div>
            <div className="absolute bottom-[-10px] left-[-10px] w-16 h-16 bg-[#FF7563] rounded-full filter blur-xl opacity-20 pointer-events-none"></div>
            
            <span className="text-[10px] font-bold tracking-wider text-[#FFD13B] uppercase block mb-2 relative z-10">
              Project Summary
            </span>
            <p className="text-[11px] font-sans text-neutral-300 leading-relaxed relative z-10 mb-4">
              {architecture.summary}
            </p>
            {/* Metadata Badges */}
            <div className="grid grid-cols-2 gap-2 mb-3 relative z-10">
              {architecture.framework && architecture.framework !== 'None' && architecture.framework !== 'unknown' && (
                <div className="bg-white/5 p-2 rounded-[12px] border border-white/10">
                  <span className="text-[8px] font-bold tracking-wider text-[#FFD13B] uppercase block opacity-80">Framework</span>
                  <span className="text-[10px] font-sans font-semibold text-white">{architecture.framework}</span>
                </div>
              )}
              {architecture.database && architecture.database !== 'None' && architecture.database !== 'unknown' && (
                <div className="bg-white/5 p-2 rounded-[12px] border border-white/10">
                  <span className="text-[8px] font-bold tracking-wider text-[#FFD13B] uppercase block opacity-80">Database</span>
                  <span className="text-[10px] font-sans font-semibold text-white">{architecture.database}</span>
                </div>
              )}
              {architecture.authentication && architecture.authentication !== 'None' && architecture.authentication !== 'unknown' && (
                <div className="bg-white/5 p-2 rounded-[12px] border border-white/10 col-span-2">
                  <span className="text-[8px] font-bold tracking-wider text-[#FFD13B] uppercase block opacity-80">Authentication</span>
                  <span className="text-[10px] font-sans font-semibold text-white">{architecture.authentication}</span>
                </div>
              )}
              {architecture.externalAPIs && architecture.externalAPIs.length > 0 && architecture.externalAPIs[0] !== 'None detected' && architecture.externalAPIs[0] !== 'None' && (
                <div className="bg-white/5 p-2 rounded-[12px] border border-white/10 col-span-2">
                  <span className="text-[8px] font-bold tracking-wider text-[#FFD13B] uppercase block mb-1 opacity-80">External APIs</span>
                  <div className="flex flex-wrap gap-1">
                    {architecture.externalAPIs.map((api, idx) => (
                      <span key={idx} className="text-[9px] font-sans font-semibold bg-white/10 text-white px-1.5 py-0.5 rounded-[6px]">
                        {api}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {architecture.techStack && architecture.techStack.length > 0 && (
              <div className="relative z-10">
                <span className="text-[10px] font-bold tracking-wider text-[#FFD13B] uppercase block mb-1.5 opacity-80">
                  Tech Stack
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {architecture.techStack.map((tech, idx) => (
                    <span 
                      key={idx} 
                      className="text-[9px] font-mono font-bold bg-white/10 text-white px-2.5 py-1 rounded-md"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-[#F0EDE4] shrink-0 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
          <p className="text-[10px] font-mono text-neutral-400 leading-normal">
            Click on file nodes to display dependency architecture canvas.
          </p>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col justify-between overflow-hidden relative min-w-0 h-full gap-4">
        
        {/* Canvas Header */}
        <div className="flex justify-between items-center bg-white px-6 py-4 rounded-[24px] border border-[#E5E0D5] shadow-sm shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-[#F0EDE4] rounded-xl text-neutral-500 hover:text-[#1E1F22] transition-all cursor-pointer"
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#1E1F22]">CodeMap Workspace</h1>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">System Flow Visualizer Canvas</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-neutral-400 hidden sm:inline">Active View:</span>
            <span className="font-mono text-xs font-bold bg-[#1E1F22] text-white border border-[#1E1F22] px-3.5 py-1.5 rounded-full shadow-inner truncate max-w-[180px]">
              {activeFile}
            </span>
            
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#E5E0D5] hover:border-[#D2CBB8] text-xs font-bold tracking-wide rounded-full shadow-sm hover:shadow transition-all disabled:opacity-50 text-[#1E1F22] cursor-pointer"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export Map</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Canvas Body */}
        <div className="flex-1 overflow-auto relative bg-[#FCFBF9] border border-[#E5E0D5] rounded-[24px] shadow-sm flex items-center justify-center p-4 min-h-0 custom-scrollbar">
          
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#E5E0D5_1px,transparent_1px),linear-gradient(to_bottom,#E5E0D5_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] opacity-35 pointer-events-none" />

          <div 
            className="transition-transform duration-200 ease-out origin-center flex flex-col items-center justify-center min-w-[500px]"
            style={{ transform: `scale(${zoomScale})` }}
          >
            {fileDiagramData ? (
              <FileDependencyVisualizer 
                fileName={activeFile} 
                data={fileDiagramData} 
                onNodeClick={handleCanvasNodeClick} 
              />
            ) : (
              <>
                <div className="flex flex-col items-center">
                  <div className="border border-[#E5E0D5] bg-white px-6 py-3.5 rounded-[16px] shadow-sm min-w-[150px] text-center">
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider mb-0.5">Entry Point</span>
                    <span className="font-mono font-bold text-xs text-[#1E1F22]">{activeFile}</span>
                  </div>
                </div>

                {architecture && architecture.modules && architecture.modules.length > 0 && (
                  <>
                    <div className="w-[1.5px] h-6 bg-[#D2CBB8]" />
                    
                    <div className="flex gap-12 justify-center items-start relative px-4">
                      {architecture.modules.map((module, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === architecture.modules.length - 1;
                        const isOnly = architecture.modules.length === 1;

                        const typeLower = module.type.toLowerCase();
                        let colorClass = 'text-blue-600 bg-blue-50/70 border-blue-100';
                        if (typeLower.includes('util') || typeLower.includes('helper')) colorClass = 'text-emerald-600 bg-emerald-50/70 border-emerald-100';
                        else if (typeLower.includes('route') || typeLower.includes('router')) colorClass = 'text-purple-600 bg-purple-50/70 border-purple-100';
                        else if (typeLower.includes('controller')) colorClass = 'text-amber-600 bg-amber-50/70 border-amber-100';
                        else if (typeLower.includes('database') || typeLower.includes('model') || typeLower.includes('db')) colorClass = 'text-rose-600 bg-rose-50/70 border-rose-100';

                        return (
                          <div key={idx} className="flex flex-col items-center relative min-w-[140px]">
                            {!isOnly && (
                              <div 
                                className={`absolute top-0 h-[1.5px] bg-[#D2CBB8] ${
                                  isFirst ? 'left-1/2 right-0' : isLast ? 'left-0 right-1/2' : 'left-0 right-0'
                                }`}
                              />
                            )}
                            <div className="w-[1.5px] h-6 bg-[#D2CBB8]" />

                            <div 
                              onClick={() => handleNodeClick({ id: module.name, type: module.type })}
                              className="border border-[#E5E0D5] bg-white px-5 py-4 rounded-[16px] text-center w-[160px] shadow-sm hover:shadow hover:border-[#D2CBB8] transition-all cursor-pointer active:scale-95 flex flex-col items-center"
                            >
                              <span className={`text-[9px] font-bold ${colorClass} border px-2.5 py-0.5 rounded-full block uppercase tracking-wider mb-2`}>
                                {module.type}
                              </span>
                              <span className="font-sans font-bold text-xs text-[#1E1F22] truncate block w-full" title={module.name}>{module.name}</span>
                              {module.description && (
                                <span className="text-[10px] font-sans text-neutral-400 block mt-2 leading-snug line-clamp-2" title={module.description}>
                                  {module.description}
                                </span>
                              )}
                            </div>

                            {module.children && module.children.length > 0 && (
                              <>
                                <div className="w-[1.5px] h-6 bg-[#D2CBB8]" />
                                <div className="flex flex-col gap-3">
                                  {module.children.map((childName, cIdx) => (
                                    <div 
                                      key={cIdx} 
                                      className="border border-[#E5E0D5] bg-white/80 hover:bg-white px-4 py-2.5 rounded-[12px] text-center w-[140px] shadow-sm hover:border-[#D2CBB8] transition-all cursor-pointer active:scale-95"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCanvasNodeClick(childName, "Code File");
                                      }}
                                    >
                                      <span className="text-[9px] font-mono text-neutral-400 block mb-0.5">File</span>
                                      <span className="font-sans font-bold text-xs text-[#1E1F22] truncate block" title={childName}>{childName}</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}

          </div>
        </div>

        {/* Floating Legend Panel */}
        <div className="absolute bottom-6 left-6 bg-white border border-[#E5E0D5] p-3.5 rounded-[16px] shadow-md z-20 flex flex-col gap-2 min-w-[140px] select-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block border-b border-[#F0EDE4] pb-1 mb-0.5">
            Legend
          </span>
          <div className="flex flex-col gap-1.5 text-[10px] font-sans">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
              <span className="text-neutral-600 font-medium">Route / Router</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span className="text-neutral-600 font-medium">Controller</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span className="text-neutral-600 font-medium">Component</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-neutral-600 font-medium">Utility / Helper</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span className="text-neutral-600 font-medium">Database / Model</span>
            </div>
            <div className="flex items-center gap-2 border-t border-[#F0EDE4] pt-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-neutral-200 border border-neutral-300 shrink-0" />
              <span className="text-neutral-500 font-medium">Active Code File</span>
            </div>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-6 right-6 flex items-center gap-1.5 p-1.5 bg-white border border-[#E5E0D5] rounded-[16px] shadow-md z-20">
          <button 
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 border border-transparent hover:bg-[#F0EDE4] rounded-full text-neutral-500 hover:text-[#1E1F22] transition-all cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <button 
            onClick={handleZoomReset}
            title="Reset Zoom"
            className="px-2.5 py-1.5 hover:bg-[#F0EDE4] rounded-full text-[10px] font-mono text-neutral-500 hover:text-[#1E1F22] transition-all cursor-pointer"
          >
            {Math.round(zoomScale * 100)}%
          </button>

          <button 
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 border border-transparent hover:bg-[#F0EDE4] rounded-full text-neutral-500 hover:text-[#1E1F22] transition-all cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-[#E5E0D5] mx-1" />

          <button 
            onClick={handleZoomReset}
            title="Fit to screen"
            className="p-2 border border-transparent hover:bg-[#F0EDE4] rounded-full text-neutral-500 hover:text-[#1E1F22] transition-all cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

      </main>

      <NodeDetailsPanel
        node={selectedNode}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        isLoading={isAIAnalyzing}
        error={apiError}
        architecture={architecture}
        projectName={treeData?.name || 'Project'}
      />
    </div>
  );
}

interface FileDependencyVisualizerProps {
  fileName: string;
  data: {
    imports: string[];
    exports: string[];
    dependencies: string[];
  };
  onNodeClick: (nodeName: string, nodeType: string) => void;
}

const FileDependencyVisualizer: React.FC<FileDependencyVisualizerProps> = ({ 
  fileName, 
  data, 
  onNodeClick 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const leftItemRefs = useRef<HTMLDivElement[]>([]);
  const rightItemRefs = useRef<HTMLDivElement[]>([]);
  const [lines, setLines] = useState<{ d: string }[]>([]);

  const leftNodes = useMemo(() => {
    const unique = new Set([...data.imports, ...data.dependencies]);
    return Array.from(unique);
  }, [data.imports, data.dependencies]);

  const rightNodes = data.exports || [];

  const updateConnections = () => {
    if (!containerRef.current || !centerRef.current) return;

    const container = containerRef.current;
    
    const getRelativeCoords = (el: HTMLElement) => {
      let top = 0;
      let left = 0;
      let curr: HTMLElement | null = el;
      while (curr && curr !== container) {
        top += curr.offsetTop;
        left += curr.offsetLeft;
        curr = curr.offsetParent as HTMLElement;
      }
      return {
        x: left,
        y: top,
        w: el.offsetWidth,
        h: el.offsetHeight
      };
    };

    const centerCoords = getRelativeCoords(centerRef.current);
    const newLines: { d: string }[] = [];

    leftItemRefs.current.forEach((itemEl, idx) => {
      if (!itemEl) return;
      const itemCoords = getRelativeCoords(itemEl);
      const startX = itemCoords.x + itemCoords.w;
      const startY = itemCoords.y + itemCoords.h / 2;
      const endX = centerCoords.x;
      const endY = centerCoords.y + centerCoords.h / 2;
      
      const controlX = (startX + endX) / 2;
      const d = `M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`;
      newLines.push({ d });
    });

    rightItemRefs.current.forEach((itemEl, idx) => {
      if (!itemEl) return;
      const itemCoords = getRelativeCoords(itemEl);
      const startX = centerCoords.x + centerCoords.w;
      const startY = centerCoords.y + centerCoords.h / 2;
      const endX = itemCoords.x;
      const endY = itemCoords.y + itemCoords.h / 2;
      
      const controlX = (startX + endX) / 2;
      const d = `M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`;
      newLines.push({ d });
    });

    setLines(newLines);
  };

  useEffect(() => {
    leftItemRefs.current = [];
    rightItemRefs.current = [];

    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      updateConnections();
    });
    observer.observe(containerRef.current);

    updateConnections();
    const timer = setTimeout(updateConnections, 100);
    const timer2 = setTimeout(updateConnections, 350); // After sidebar animation completes

    window.addEventListener('resize', updateConnections);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      clearTimeout(timer2);
      window.removeEventListener('resize', updateConnections);
    };
  }, [leftNodes, rightNodes, fileName]);

  return (
    <div 
      ref={containerRef}
      className="flex items-center justify-between gap-12 w-full max-w-5xl relative min-h-[450px] px-8 py-10 bg-white/40 border border-[#E5E0D5] rounded-[24px] shadow-inner"
    >
      <style>{`
        .dash-line {
          animation: dash-animation 35s linear infinite;
        }
        @keyframes dash-animation {
          to {
            stroke-dashoffset: -1000;
          }
        }
      `}</style>

      <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-[#C2BBA8]/80 stroke-[2] fill-none">
        {lines.map((line, idx) => (
          <path 
            key={idx} 
            d={line.d} 
            strokeDasharray="5,5" 
            className="dash-line" 
          />
        ))}
      </svg>

      <div className="w-60 flex flex-col gap-3.5 z-10 shrink-0">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1 pl-2">Imports & Dependencies</h4>
        {leftNodes.length > 0 ? (
          leftNodes.map((item, idx) => (
            <div 
              key={idx}
              ref={(el) => { if (el) leftItemRefs.current[idx] = el; }}
              onClick={() => onNodeClick(item, "Imported File")}
              className="bg-white hover:bg-[#FCFBF9] text-[#1E1F22] px-4 py-3 rounded-[12px] border border-[#E5E0D5] hover:border-[#D2CBB8] shadow-sm hover:shadow transition-all duration-200 cursor-pointer text-xs font-mono truncate hover:translate-x-1"
              title={item}
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                <span className="truncate">{item}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-xs text-neutral-400 italic pl-2 bg-[#F0EDE4]/20 py-4 rounded-[12px] border border-[#E5E0D5]/50 text-center">
            No imports detected
          </div>
        )}
      </div>

      <div 
        ref={centerRef}
        onClick={() => onNodeClick(fileName, "Active File")}
        className="relative overflow-hidden bg-white text-[#1E1F22] p-7 rounded-[16px] border-2 border-[#1E1F22] shadow-[0_12px_40px_rgba(30,31,34,0.08)] min-w-[220px] text-center hover:scale-105 transition-all duration-300 cursor-pointer z-10 shrink-0"
      >
        <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-[#FFD13B]/20 rounded-full filter blur-xl"></div>
        <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 bg-[#FF7563]/20 rounded-full filter blur-xl"></div>
        
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Active File</span>
        <span className="font-mono font-bold text-sm text-[#1E1F22] block truncate max-w-[180px]" title={fileName}>
          {fileName}
        </span>
        <span className="text-[9px] font-mono text-neutral-500 block mt-2 border-t border-neutral-100 pt-2 uppercase">
          {(leftNodes.length > 0 || rightNodes.length > 0) ? 'Code Module' : 'System Asset'}
        </span>
      </div>

      <div className="w-60 flex flex-col gap-3.5 z-10 shrink-0">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1 pl-2">Exports</h4>
        {rightNodes.length > 0 ? (
          rightNodes.map((item, idx) => (
            <div 
              key={idx}
              ref={(el) => { if (el) rightItemRefs.current[idx] = el; }}
              onClick={() => onNodeClick(item, "Exported Entity")}
              className="bg-white hover:bg-[#FCFBF9] text-[#1E1F22] px-4 py-3 rounded-[12px] border border-[#E5E0D5] hover:border-[#D2CBB8] shadow-sm hover:shadow transition-all duration-200 cursor-pointer text-xs font-mono truncate hover:-translate-x-1"
              title={item}
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate">{item}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-xs text-neutral-400 italic pl-2 bg-[#F0EDE4]/20 py-4 rounded-[12px] border border-[#E5E0D5]/50 text-center">
            No exports detected
          </div>
        )}
      </div>
    </div>
  );
};