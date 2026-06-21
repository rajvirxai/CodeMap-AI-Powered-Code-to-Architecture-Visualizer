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
  Info
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
}

export default function DashboardPage() {
  const [treeData, setTreeData] = useState<FileNode | null>(null);
  const [architecture, setArchitecture] = useState<Architecture | null>(null);
  const [activeFile, setActiveFile] = useState<string>('index.js');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingReadme, setIsGeneratingReadme] = useState(false);

  const downloadReadmeFile = (content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "README.md";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleGenerateReadme = async () => {
    setIsGeneratingReadme(true);
    const folderId = sessionStorage.getItem('codemap_folderId') || 'mock-app';
    
    if (folderId.startsWith('mock-') || folderId === 'mock-app') {
      setTimeout(() => {
        setIsGeneratingReadme(false);
        const mockReadme = `# my-app\n\nGenerated automatically via CodeMap.\n\n## Heuristics\n- Sample documentation\n- Project type: mock`;
        downloadReadmeFile(mockReadme);
      }, 1500);
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/generate-readme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId })
      });

      if (!response.ok) {
        throw new Error('Failed to generate README');
      }

      const data = await response.json();
      if (data.readme) {
        downloadReadmeFile(data.readme);
      } else {
        throw new Error('Empty readme generated');
      }
    } catch (err: any) {
      console.error('Error generating README:', err);
      alert('Failed to generate README: ' + err.message);
    } finally {
      setIsGeneratingReadme(false);
    }
  };

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

  // Export handler to dynamically compile visual canvas layout as a PNG file download
  const handleExport = () => {
    setIsExporting(true);
    
    const width = 1200;
    const height = 800;
    let svgContent = '';
    
    // Construct SVG header
    svgContent += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    svgContent += `
      <style>
        .bg-grid { fill: #FCFBF9; }
        .grid-line { stroke: #E5E0D5; stroke-width: 1; opacity: 0.35; }
        .card-border { stroke: #E5E0D5; stroke-width: 1; fill: #FFFFFF; }
        .card-active { stroke: #1E1F22; stroke-width: 2; fill: #FFFFFF; }
        .text-label { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12px; fill: #1E1F22; font-weight: bold; }
        .text-sub { font-family: sans-serif; font-size: 10px; fill: #C2BBA8; font-weight: bold; }
        .badge-text { font-family: sans-serif; font-size: 8px; font-weight: bold; fill: #FFFFFF; }
        .connection-line { stroke: #C2BBA8; stroke-width: 2; stroke-dasharray: 5,5; fill: none; }
      </style>
    `;
    
    // Draw background grid lines
    svgContent += `<rect width="${width}" height="${height}" class="bg-grid" />`;
    for (let x = 0; x < width; x += 40) {
      svgContent += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" class="grid-line" />`;
    }
    for (let y = 0; y < height; y += 40) {
      svgContent += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" class="grid-line" />`;
    }
    
    if (fileDiagramData) {
      // --- DRAW DYNAMIC FILE DEPENDENCY DIAGRAM ---
      const leftNodes = Array.from(new Set([...fileDiagramData.imports, ...fileDiagramData.dependencies]));
      const rightNodes = fileDiagramData.exports || [];
      
      const cx = 600 - 110;
      const cy = 400 - 60;
      const cw = 220;
      const ch = 120;
      
      // Center Active Node Card
      svgContent += `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="28" ry="28" class="card-active" />`;
      svgContent += `<text x="${cx + cw/2}" y="${cy + 40}" text-anchor="middle" class="text-sub">ACTIVE FILE</text>`;
      svgContent += `<text x="${cx + cw/2}" y="${cy + 65}" text-anchor="middle" class="text-label">${activeFile}</text>`;
      svgContent += `<text x="${cx + cw/2}" y="${cy + 90}" text-anchor="middle" class="text-sub" style="font-size: 8px; fill: #FF7563;">CODE MODULE</text>`;
      
      // Left Imports Cards
      const lCount = leftNodes.length;
      const lStartY = 400 - (lCount * 60) / 2 + 10;
      leftNodes.forEach((nodeName, idx) => {
        const lx = 80;
        const ly = lStartY + idx * 60;
        const lw = 240;
        const lh = 44;
        
        svgContent += `<rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" rx="20" ry="20" class="card-border" />`;
        svgContent += `<circle cx="${lx + 20}" cy="${ly + lh/2}" r="4" fill="#60A5FA" />`;
        svgContent += `<text x="${lx + 35}" y="${ly + lh/2 + 4}" class="text-label" style="font-size: 11px;">${nodeName}</text>`;
        
        const startX = lx + lw;
        const startY = ly + lh / 2;
        const endX = cx;
        const endY = cy + ch / 2;
        const ctrlX = (startX + endX) / 2;
        svgContent += `<path d="M ${startX} ${startY} C ${ctrlX} ${startY}, ${ctrlX} ${endY}, ${endX} ${endY}" class="connection-line" />`;
      });
      
      // Right Exports Cards
      const rCount = rightNodes.length;
      const rStartY = 400 - (rCount * 60) / 2 + 10;
      rightNodes.forEach((nodeName, idx) => {
        const rx = 880;
        const ry = rStartY + idx * 60;
        const rw = 240;
        const rh = 44;
        
        svgContent += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="20" ry="20" class="card-border" />`;
        svgContent += `<circle cx="${rx + 20}" cy="${ry + rh/2}" r="4" fill="#34D399" />`;
        svgContent += `<text x="${rx + 35}" y="${ry + rh/2 + 4}" class="text-label" style="font-size: 11px;">${nodeName}</text>`;
        
        const startX = cx + cw;
        const startY = cy + ch / 2;
        const endX = rx;
        const endY = ry + rh / 2;
        const ctrlX = (startX + endX) / 2;
        svgContent += `<path d="M ${startX} ${startY} C ${ctrlX} ${startY}, ${ctrlX} ${endY}, ${endX} ${endY}" class="connection-line" />`;
      });
    } else {
      // --- DRAW HIERARCHICAL MODULES TREE ---
      const modulesList = (architecture && architecture.modules) ? architecture.modules : [];
      const mCount = modulesList.length;
      
      const rx = 600 - 80;
      const ry = 80;
      const rw = 160;
      const rh = 70;
      
      // Root Node Entry Card
      svgContent += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="20" ry="20" class="card-active" />`;
      svgContent += `<text x="${600}" y="${ry + 30}" text-anchor="middle" class="text-sub">ENTRY POINT</text>`;
      svgContent += `<text x="${600}" y="${ry + 50}" text-anchor="middle" class="text-label">${activeFile}</text>`;
      
      if (mCount > 0) {
        const entryBottomY = ry + rh;
        const connectorBarY = entryBottomY + 20;
        
        const moduleWidth = 170;
        const moduleHeight = 100;
        const gap = (1200 - mCount * moduleWidth) / (mCount + 1);
        
        const firstMX = gap + moduleWidth/2;
        const lastMX = gap + (mCount - 1) * (moduleWidth + gap) + moduleWidth/2;
        
        svgContent += `<line x1="600" y1="${entryBottomY}" x2="600" y2="${connectorBarY}" class="connection-line" />`;
        if (mCount > 1) {
          svgContent += `<line x1="${firstMX}" y1="${connectorBarY}" x2="${lastMX}" y2="${connectorBarY}" class="connection-line" />`;
        }
        
        modulesList.forEach((mod, idx) => {
          const mx = gap + idx * (moduleWidth + gap);
          const my = connectorBarY + 20;
          
          svgContent += `<line x1="${mx + moduleWidth/2}" y1="${connectorBarY}" x2="${mx + moduleWidth/2}" y2="${my}" class="connection-line" />`;
          
          let badgeColor = '#3B82F6';
          const typeL = mod.type.toLowerCase();
          if (typeL.includes('util') || typeL.includes('helper')) badgeColor = '#10B981';
          else if (typeL.includes('route') || typeL.includes('router')) badgeColor = '#8B5CF6';
          else if (typeL.includes('controller')) badgeColor = '#F59E0B';
          else if (typeL.includes('database') || typeL.includes('model') || typeL.includes('db')) badgeColor = '#F43F5E';
          
          // Module Card
          svgContent += `<rect x="${mx}" y="${my}" width="${moduleWidth}" height="${moduleHeight}" rx="20" ry="20" class="card-border" />`;
          svgContent += `<rect x="${mx + 15}" y="${my + 15}" width="70" height="18" rx="9" ry="9" fill="${badgeColor}" />`;
          svgContent += `<text x="${mx + 50}" y="${my + 27}" text-anchor="middle" class="badge-text">${mod.type.toUpperCase()}</text>`;
          svgContent += `<text x="${mx + 15}" y="${my + 54}" class="text-label" style="font-size: 11px;">${mod.name}</text>`;
          const descWord = mod.description ? (mod.description.substring(0, 24) + '...') : '';
          svgContent += `<text x="${mx + 15}" y="${my + 75}" class="text-sub" style="font-size: 8px;">${descWord}</text>`;
          
          // Children Cards
          if (mod.children && mod.children.length > 0) {
            const fileStartY = my + moduleHeight + 30;
            svgContent += `<line x1="${mx + moduleWidth/2}" y1="${my + moduleHeight}" x2="${mx + moduleWidth/2}" y2="${fileStartY - 30}" class="connection-line" />`;
            
            mod.children.forEach((childName, cIdx) => {
              const fx = mx + moduleWidth/2 - 70;
              const fy = fileStartY + cIdx * 50;
              const fw = 140;
              const fh = 36;
              
              svgContent += `<line x1="${mx + moduleWidth/2}" y1="${fy - 14}" x2="${mx + moduleWidth/2}" y2="${fy}" class="connection-line" />`;
              svgContent += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="12" ry="12" class="card-border" style="fill: #FCFBF9;" />`;
              svgContent += `<text x="${fx + fw/2}" y="${fy + 21}" text-anchor="middle" class="text-label" style="font-size: 10px;">${childName}</text>`;
            });
          }
        });
      }
    }
    
    svgContent += `</svg>`;
    
    // Compile SVG image using canvas to create standard PNG
    const img = new Image();
    img.width = width;
    img.height = height;
    
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        
        const element = document.createElement("a");
        element.href = pngUrl;
        element.download = `codemap-architecture-${activeFile}.png`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        URL.revokeObjectURL(url);
        setIsExporting(false);
      }
    };
    
    img.onerror = () => {
      setIsExporting(false);
      alert('PNG compilation failed. Exporting as SVG file instead.');
      const element = document.createElement("a");
      element.href = url;
      element.download = `codemap-architecture-${activeFile}.svg`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    };
    
    img.src = url;
  };

  // Managing states for tracking clicked nodes, loading indicators, and API status
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
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

  const handleNodeClick = async (clickedNodeData: any) => {
    setSelectedNode({ id: clickedNodeData.id, type: clickedNodeData.type });
    setIsPanelOpen(true);
    setIsAIAnalyzing(true);
    setApiError(null);

    const folderId = sessionStorage.getItem('codemap_folderId') || 'mock-app';
    const isMock = folderId.startsWith('mock-') || folderId === 'mock-app';

    let related: string[] = ["index.js", "package.json"];
    let inputs: string[] = ["import"];
    let outputs: string[] = ["export"];
    let localDeps: string[] = ["None"];
    
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
        localDeps = realNode.dependencies.slice(0, 4);
        related = [...related, ...realNode.dependencies];
      }
    }

    related = Array.from(new Set(related)).filter(f => f !== clickedNodeData.id).slice(0, 5);

    if (isMock) {
      setTimeout(() => {
        setIsAIAnalyzing(false);
        setSelectedNode({
          id: clickedNodeData.id,
          type: clickedNodeData.type,
          aiDetails: {
            purpose: `Coordinates system operations for ${clickedNodeData.id}. It structures local API requests/responses, integrates downstream resources, and maintains dynamic flow control across related repository files.`,
            inputs: inputs.length > 0 ? inputs : ["None"],
            outputs: outputs.length > 0 ? outputs : ["None"],
            dependencies: localDeps,
            role: `${clickedNodeData.type}`
          },
          relatedFiles: related
        });
      }, 500);
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId,
          filePath: clickedNodeData.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch explanation from AI.');
      }

      const data = await response.json();
      setIsAIAnalyzing(false);
      setSelectedNode({
        id: clickedNodeData.id,
        type: clickedNodeData.type,
        aiDetails: {
          purpose: data.purpose || 'No description available.',
          inputs: data.inputs && data.inputs.length > 0 ? data.inputs : ['None'],
          outputs: data.outputs && data.outputs.length > 0 ? data.outputs : ['None'],
          dependencies: data.dependencies && data.dependencies.length > 0 ? data.dependencies : ['None'],
          role: data.role || clickedNodeData.type
        },
        relatedFiles: data.dependencies && data.dependencies.length > 0 
          ? Array.from(new Set([...related, ...data.dependencies])).filter(f => f !== clickedNodeData.id).slice(0, 5)
          : related
      });

    } catch (err: any) {
      console.warn('API call failed, falling back to local description generation.', err);
      setIsAIAnalyzing(false);
      setSelectedNode({
        id: clickedNodeData.id,
        type: clickedNodeData.type,
        aiDetails: {
          purpose: `Coordinates system operations for ${clickedNodeData.id}. (API connection fallback: using localized heuristics)`,
          inputs: inputs.length > 0 ? inputs : ["None"],
          outputs: outputs.length > 0 ? outputs : ["None"],
          dependencies: localDeps,
          role: `${clickedNodeData.type}`
        },
        relatedFiles: related
      });
    }
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
    <div className="relative min-h-screen w-full bg-[#F0EDE4] text-[#1E1F22] flex font-sans overflow-hidden">
      
      <aside className="w-72 bg-white m-4 mr-0 rounded-[28px] border border-[#E5E0D5]/60 shadow-sm p-5 flex flex-col shrink-0 select-none">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <span className="text-xs font-bold tracking-wider text-neutral-400 uppercase">
            Explorer
          </span>
          <span className="text-[10px] font-bold bg-[#F0EDE4] text-[#1E1F22] px-2 py-0.5 rounded-full border border-[#E5E0D5]">
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
          <div className="mt-4 pt-4 border-t border-[#F0EDE4] shrink-0 overflow-y-auto max-h-[170px]">
            <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase block mb-2">
              Project Summary
            </span>
            <p className="text-[11px] font-sans text-neutral-600 leading-relaxed bg-[#F0EDE4]/30 p-3 rounded-[16px] border border-[#E5E0D5]/50 mb-3">
              {architecture.summary}
            </p>
            {architecture.techStack && architecture.techStack.length > 0 && (
              <div>
                <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase block mb-1.5">
                  Tech Stack
                </span>
                <div className="flex flex-wrap gap-1">
                  {architecture.techStack.map((tech, idx) => (
                    <span 
                      key={idx} 
                      className="text-[9px] font-mono font-bold bg-[#1E1F22] text-white px-2 py-0.5 rounded-md"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleGenerateReadme}
          disabled={isGeneratingReadme}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-[#1E1F22] hover:bg-[#2D2E32] text-white text-xs font-bold rounded-[16px] shadow-sm hover:shadow active:scale-98 transition-all disabled:opacity-50 shrink-0"
        >
          {isGeneratingReadme ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <File className="w-3.5 h-3.5 text-white" />
              <span>Generate README.md</span>
            </>
          )}
        </button>

        <div className="mt-4 pt-4 border-t border-[#F0EDE4] shrink-0 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
          <p className="text-[10px] font-mono text-neutral-400 leading-normal">
            Click on file nodes to display dependency architecture canvas.
          </p>
        </div>
      </aside>

      <main className="flex-1 p-6 flex flex-col justify-between overflow-hidden relative">
        
        <div className="flex justify-between items-center bg-white/80 backdrop-blur-md px-6 py-4 rounded-[24px] border border-white/80 shadow-sm mb-4 shrink-0 z-10">
          <div>
            <h1 className="text-base font-bold tracking-tight text-[#1E1F22]">CodeMap Workspace</h1>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">System Flow Visualizer Canvas</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-neutral-400">Active View:</span>
            <span className="font-mono text-xs font-bold bg-[#1E1F22] text-white border border-[#1E1F22] px-3.5 py-1.5 rounded-full shadow-inner">
              {activeFile}
            </span>
            
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#E5E0D5] hover:border-[#D2CBB8] text-xs font-bold tracking-wide rounded-full shadow-sm hover:shadow transition-all disabled:opacity-50 text-[#1E1F22]"
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
          </div>
        </div>

        <div className="flex-1 overflow-auto relative bg-[#FCFBF9] border border-[#E5E0D5] rounded-[32px] shadow-sm flex items-center justify-center p-8">
          
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
                  <div className="border border-[#E5E0D5] bg-white px-6 py-3.5 rounded-[20px] shadow-sm min-w-[150px] text-center">
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
                              className="border border-[#E5E0D5] bg-white px-5 py-4 rounded-[20px] text-center w-[160px] shadow-sm hover:shadow hover:border-[#D2CBB8] transition-all cursor-pointer active:scale-95 flex flex-col items-center"
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
                                      className="border border-[#E5E0D5] bg-white/80 hover:bg-white px-4 py-2.5 rounded-[16px] text-center w-[140px] shadow-sm hover:border-[#D2CBB8] transition-all cursor-pointer active:scale-95"
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

        <div className="absolute bottom-10 right-10 flex items-center gap-1.5 p-1.5 bg-white border border-[#E5E0D5] rounded-[20px] shadow-md z-20">
          <button 
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 border border-transparent hover:bg-[#F0EDE4] rounded-full text-neutral-500 hover:text-[#1E1F22] transition-all"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <button 
            onClick={handleZoomReset}
            title="Reset Zoom"
            className="px-2.5 py-1.5 hover:bg-[#F0EDE4] rounded-full text-[10px] font-mono text-neutral-500 hover:text-[#1E1F22] transition-all"
          >
            {Math.round(zoomScale * 100)}%
          </button>

          <button 
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 border border-transparent hover:bg-[#F0EDE4] rounded-full text-neutral-500 hover:text-[#1E1F22] transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-[#E5E0D5] mx-1" />

          <button 
            onClick={handleZoomReset}
            title="Fit to screen"
            className="p-2 border border-transparent hover:bg-[#F0EDE4] rounded-full text-neutral-500 hover:text-[#1E1F22] transition-all"
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

    updateConnections();
    const timer = setTimeout(updateConnections, 100);
    
    window.addEventListener('resize', updateConnections);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateConnections);
    };
  }, [leftNodes, rightNodes, fileName]);

  return (
    <div 
      ref={containerRef}
      className="flex items-center justify-between gap-12 w-full max-w-5xl relative min-h-[450px] px-8 py-10 bg-white/40 border border-[#D2CBB8] rounded-[32px] shadow-inner"
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
              className="bg-white hover:bg-[#FCFBF9] text-[#1E1F22] px-4 py-3 rounded-[20px] border border-[#E5E0D5] hover:border-[#D2CBB8] shadow-sm hover:shadow transition-all duration-200 cursor-pointer text-xs font-mono truncate hover:translate-x-1"
              title={item}
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                <span className="truncate">{item}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-xs text-neutral-400 italic pl-2 bg-[#F0EDE4]/20 py-4 rounded-[20px] border border-[#E5E0D5]/50 text-center">
            No imports detected
          </div>
        )}
      </div>

      <div 
        ref={centerRef}
        onClick={() => onNodeClick(fileName, "Active File")}
        className="relative overflow-hidden bg-white text-[#1E1F22] p-7 rounded-[28px] border-2 border-[#1E1F22] shadow-[0_12px_40px_rgba(30,31,34,0.08)] min-w-[220px] text-center hover:scale-105 transition-all duration-300 cursor-pointer z-10 shrink-0"
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
              className="bg-white hover:bg-[#FCFBF9] text-[#1E1F22] px-4 py-3 rounded-[20px] border border-[#E5E0D5] hover:border-[#D2CBB8] shadow-sm hover:shadow transition-all duration-200 cursor-pointer text-xs font-mono truncate hover:-translate-x-1"
              title={item}
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate">{item}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-xs text-neutral-400 italic pl-2 bg-[#F0EDE4]/20 py-4 rounded-[20px] border border-[#E5E0D5]/50 text-center">
            No exports detected
          </div>
        )}
      </div>
    </div>
  );
};