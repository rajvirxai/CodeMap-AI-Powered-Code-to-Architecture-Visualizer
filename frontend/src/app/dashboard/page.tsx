'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Info,
  Shield,
  Zap,
  Settings,
  Server,
  Database,
  Cpu,
  Globe,
  Layout
} from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface Node {
  id: string;
  label: string;
  type: string;
}

interface Edge {
  source: string;
  target: string;
  relationship: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const folderId = searchParams.get('folderId');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [treeData, setTreeData] = useState<FileNode | null>(null);
  const [architectureData, setArchitectureData] = useState<{ summary?: string; nodes: Node[]; edges: Edge[] } | null>(null);
  const [activeFile, setActiveFile] = useState<string>('App.js');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);
  
  // Interactive visualization state
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Retrieve cached repository tree and architecture from loading stage or database
  useEffect(() => {
    const loadFromCache = () => {
      const cached = sessionStorage.getItem('codemap_tree');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          
          // Handle integrated { repoTree, architecture } format or legacy format
          if (parsed.repoTree) {
            setTreeData(parsed.repoTree);
            if (parsed.architecture) {
              setArchitectureData(parsed.architecture);
            }
          } else {
            setTreeData(parsed);
            // Fallback to programmatic mock architecture generation
            setArchitectureData(generateMockArchitecture(parsed));
          }
        } catch (e) {
          console.error('Error parsing cached repository tree', e);
        }
      } else {
        // Default mock structure
        const defaultTree: FileNode = {
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
        };
        setTreeData(defaultTree);
        setArchitectureData(generateMockArchitecture(defaultTree));
      }
    };

    if (folderId && !folderId.startsWith('git-') && folderId !== 'mock-app') {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

      fetch(`${backendUrl}/architecture/${folderId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Data not found in DB');
          return res.json();
        })
        .then((data) => {
          setTreeData(data.repoTree);
          setArchitectureData(data.architecture);
        })
        .catch((err) => {
          console.warn('⚠️ Fetching from DB failed, falling back to cache:', err.message);
          loadFromCache();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      loadFromCache();
    }
  }, [folderId]);

  // Programmatic generation of mock architecture nodes and edges from a file tree
  const generateMockArchitecture = (tree: FileNode): { nodes: Node[]; edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const addedNodes = new Set<string>();

    const addNode = (id: string, label: string, type: string) => {
      if (!addedNodes.has(id)) {
        nodes.push({ id, label, type });
        addedNodes.add(id);
      }
    };

    const traverse = (node: FileNode, parentPath = '') => {
      if (!node || typeof node !== 'object') return;
      const name = node.name;
      if (!name) return;
      const isFolder = node.type === 'folder';
      const path = parentPath ? `${parentPath}/${name}` : name;
      const id = path.replace(/[^a-zA-Z0-9]/g, '_');
      
      const lowerName = name.toLowerCase();
      let type = 'other';
      if (['components', 'pages', 'app', 'ui', 'views'].some(w => lowerName.includes(w))) {
        type = 'frontend';
      } else if (['routes', 'controllers', 'api', 'endpoints'].some(w => lowerName.includes(w))) {
        type = 'api';
      } else if (['services', 'helpers'].some(w => lowerName.includes(w))) {
        type = 'service';
      } else if (['models', 'schema', 'migrations', 'prisma', 'db'].some(w => lowerName.includes(w))) {
        type = 'database';
      } else if (['config', 'env', 'settings'].some(w => lowerName.includes(w))) {
        type = 'config';
      }

      // Add file/folder node to architecture
      if (node.type === 'file' || (isFolder && ['components', 'services', 'models', 'routes', 'controllers'].some(w => lowerName.includes(w)))) {
        addNode(id, name, type);
      }

      if (parentPath && addedNodes.has(id)) {
        const parentId = parentPath.replace(/[^a-zA-Z0-9]/g, '_');
        if (addedNodes.has(parentId)) {
          edges.push({
            source: parentId,
            target: id,
            relationship: 'contains'
          });
        }
      }

      if (isFolder && node.children) {
        node.children.forEach(child => traverse(child, path));
      }
    };

    traverse(tree);
    return { nodes, edges };
  };

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
        setSelectedNode(null); // Clear manual visualizer selection to prioritize explorer
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

  // Node type mapper for UI styling, labels, and icons
  const getNodeTypeConfig = (type: string) => {
    const t = type.toLowerCase();
    switch (t) {
      case 'frontend':
        return {
          colorClass: 'border-blue-500/60 bg-blue-950/20 text-blue-200 shadow-blue-500/10 hover:border-blue-400',
          label: 'Client UI',
          icon: Layout,
          iconColor: 'text-blue-400'
        };
      case 'auth':
        return {
          colorClass: 'border-cyan-500/60 bg-cyan-950/20 text-cyan-200 shadow-cyan-500/10 hover:border-cyan-400',
          label: 'Authentication',
          icon: Shield,
          iconColor: 'text-cyan-400'
        };
      case 'api':
        return {
          colorClass: 'border-amber-500/60 bg-amber-950/20 text-amber-200 shadow-amber-500/10 hover:border-amber-400',
          label: 'Gateway API',
          icon: Globe,
          iconColor: 'text-amber-400'
        };
      case 'config':
        return {
          colorClass: 'border-stone-500/60 bg-stone-900/20 text-stone-200 shadow-stone-500/10 hover:border-stone-400',
          label: 'Configuration',
          icon: Settings,
          iconColor: 'text-stone-400'
        };
      case 'backend':
        return {
          colorClass: 'border-violet-500/60 bg-violet-950/20 text-violet-200 shadow-violet-500/10 hover:border-violet-400',
          label: 'Core Backend',
          icon: Server,
          iconColor: 'text-violet-400'
        };
      case 'service':
        return {
          colorClass: 'border-emerald-500/60 bg-emerald-950/20 text-emerald-200 shadow-emerald-500/10 hover:border-emerald-400',
          label: 'Service Layer',
          icon: Cpu,
          iconColor: 'text-emerald-400'
        };
      case 'utility':
        return {
          colorClass: 'border-teal-500/60 bg-teal-950/20 text-teal-200 shadow-teal-500/10 hover:border-teal-400',
          label: 'Utility',
          icon: Settings,
          iconColor: 'text-teal-400'
        };
      case 'database':
        return {
          colorClass: 'border-rose-500/60 bg-rose-950/20 text-rose-200 shadow-rose-500/10 hover:border-rose-400',
          label: 'Database Table',
          icon: Database,
          iconColor: 'text-rose-400'
        };
      case 'storage':
        return {
          colorClass: 'border-pink-500/60 bg-pink-950/20 text-pink-200 shadow-pink-500/10 hover:border-pink-400',
          label: 'Storage',
          icon: FolderOpen,
          iconColor: 'text-pink-400'
        };
      default:
        return {
          colorClass: 'border-zinc-700 bg-zinc-900/20 text-zinc-300 shadow-zinc-500/5 hover:border-zinc-500',
          label: 'Component',
          icon: File,
          iconColor: 'text-zinc-500'
        };
    }
  };

  // Grouping logic for layered canvas columns
  const getColumnIndex = (type: string) => {
    const t = type.toLowerCase();
    if (['frontend', 'auth'].includes(t)) return 0;
    if (['api', 'config'].includes(t)) return 1;
    if (['backend', 'service', 'utility'].includes(t)) return 2;
    return 3; // database, storage, other
  };

  // Calculate coordinates for layered columns layout
  const { layoutNodes, maxCanvasHeight, maxCanvasWidth } = useMemo(() => {
    if (!architectureData || !architectureData.nodes || architectureData.nodes.length === 0) {
      return { layoutNodes: [], maxCanvasHeight: 500, maxCanvasWidth: 1040 };
    }

    const nodes = architectureData.nodes;
    const columns: Node[][] = [[], [], [], []];

    nodes.forEach(node => {
      const colIdx = getColumnIndex(node.type);
      columns[colIdx].push(node);
    });

    const nodeHeight = 56;
    const gap = 32;
    const colWidth = 190;
    const colGap = 120; // spacing between columns

    const colHeights = columns.map(col => {
      return col.length > 0 ? col.length * (nodeHeight + gap) - gap : 0;
    });

    const maxCanvasHeight = Math.max(...colHeights, 420);

    const layoutNodes = columns.flatMap((col, colIdx) => {
      const colHeight = colHeights[colIdx];
      const yOffset = (maxCanvasHeight - colHeight) / 2;
      const x = colIdx * (colWidth + colGap);

      return col.map((node, nodeIdx) => {
        const y = yOffset + nodeIdx * (nodeHeight + gap);
        return {
          ...node,
          x,
          y,
          width: colWidth,
          height: nodeHeight,
          centerX: x + colWidth / 2,
          centerY: y + nodeHeight / 2
        };
      });
    });

    const maxCanvasWidth = 4 * colWidth + 3 * colGap;

    return { layoutNodes, maxCanvasHeight, maxCanvasWidth };
  }, [architectureData]);

  // Map absolute positions to calculate dynamic connection lines (edges)
  const calculatedEdges = useMemo(() => {
    if (!architectureData || !architectureData.edges || layoutNodes.length === 0) return [];

    const nodeMap = new Map(layoutNodes.map(n => [n.id, n]));

    return architectureData.edges.map(edge => {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      if (!sourceNode || !targetNode) return null;

      // Adjust coordinate connection endpoints to start from the border of boxes
      const isLeftToRight = sourceNode.x < targetNode.x;
      const x1 = isLeftToRight ? sourceNode.x + sourceNode.width : sourceNode.x;
      const y1 = sourceNode.centerY;
      const x2 = isLeftToRight ? targetNode.x : targetNode.x + targetNode.width;
      const y2 = targetNode.centerY;

      return {
        ...edge,
        x1,
        y1,
        x2,
        y2
      };
    }).filter(Boolean) as Array<Edge & { x1: number; y1: number; x2: number; y2: number }>;
  }, [architectureData, layoutNodes]);

  // Determine current active node ID (explorer click or manual canvas click)
  const activeNodeId = useMemo(() => {
    if (selectedNode) return selectedNode;
    
    if (architectureData && architectureData.nodes) {
      const matched = architectureData.nodes.find(n => 
        n.label.toLowerCase() === activeFile.toLowerCase() ||
        n.id.toLowerCase() === activeFile.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')
      );
      if (matched) return matched.id;
    }
    return null;
  }, [selectedNode, activeFile, architectureData]);

  // Set of node IDs highlighted based on active selection/hovering
  const highlightedNodeIds = useMemo(() => {
    const set = new Set<string>();
    
    // Default to show all nodes fully if no node is active or hovered
    if (!activeNodeId && !hoveredNode) return set;

    const sourceNodeId = hoveredNode || activeNodeId;
    if (sourceNodeId) {
      set.add(sourceNodeId);
      if (architectureData && architectureData.edges) {
        architectureData.edges.forEach(edge => {
          if (edge.source === sourceNodeId) {
            set.add(edge.target);
          }
          if (edge.target === sourceNodeId) {
            set.add(edge.source);
          }
        });
      }
    }

    return set;
  }, [activeNodeId, hoveredNode, architectureData]);

  const isNodeHighlighted = (nodeId: string) => {
    if (!activeNodeId && !hoveredNode) return true;
    return highlightedNodeIds.has(nodeId);
  };

  const isEdgeHighlighted = (sourceId: string, targetId: string) => {
    if (hoveredNode) {
      return sourceId === hoveredNode || targetId === hoveredNode;
    }
    if (activeNodeId) {
      return sourceId === activeNodeId || targetId === activeNodeId;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#060913] flex flex-col items-center justify-center font-mono text-sm text-slate-400">
        <RefreshCw className="h-6 w-6 animate-spin text-white mb-4" />
        Loading analysis from database...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#060913] text-slate-100">
      <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[288px_minmax(0,1fr)]">
        {/* Left sidebar: fixed explorer navigation */}
        <aside className="sticky top-0 flex h-[calc(100vh-4rem)] w-full flex-col border-r border-white/10 bg-slate-950/95 select-none backdrop-blur-xl lg:w-72">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Explorer</p>
                <p className="mt-1 text-sm font-medium text-slate-200">Repository structure</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-slate-400">
                local
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
              {treeData ? (
                <DirectoryNode node={treeData} depth={0} />
              ) : (
                <div className="px-4 py-10 text-center text-xs font-mono text-slate-500">
                  Loading structure...
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 px-5 py-4">
            {architectureData?.summary ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 max-h-[220px] overflow-y-auto">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-1">Project Summary</p>
                <p className="text-[11px] leading-relaxed text-slate-400 font-sans">
                  {architectureData.summary}
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <p className="text-[11px] leading-5 text-slate-400">
                  Select a file or node to inspect the architecture map from the tree on the right.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Center canvas: spaced architecture tree layout */}
        <main className="relative min-w-0 overflow-hidden bg-[radial-gradient(ellipse_at_top,_rgba(15,23,42,0.95)_0%,_rgba(3,7,18,1)_65%)]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:2.75rem_2.75rem] opacity-35 pointer-events-none" />

          {/* Top-left status module */}
          <div className="absolute left-6 top-6 z-20 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Selected Node</p>
            <p className="mt-1 max-w-[18rem] truncate text-sm font-medium text-slate-100">
              {activeNodeId ? (layoutNodes.find(n => n.id === activeNodeId)?.label || activeNodeId) : activeFile}
            </p>
          </div>

          {/* Top-right export utility */}
          <div className="absolute right-6 top-6 z-20">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:border-white/20 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Exporting
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Map
                </>
              )}
            </button>
          </div>

          <div className="flex h-full min-h-[calc(100vh-4rem)] items-center justify-center overflow-auto px-6 py-24">
            <section className="relative mx-auto flex items-center justify-center rounded-[2rem] border border-white/10 bg-slate-950/55 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
              <div
                className="relative select-none transition-transform duration-300 ease-out"
                style={{
                  transform: `scale(${zoomScale})`,
                  width: `${maxCanvasWidth}px`,
                  height: `${maxCanvasHeight}px`
                }}
              >
                {layoutNodes.length > 0 && (
                  <svg
                    className="absolute inset-0 z-0 h-full w-full overflow-visible pointer-events-none"
                    style={{ width: `${maxCanvasWidth}px`, height: `${maxCanvasHeight}px` }}
                  >
                    <defs>
                      <marker
                        id="arrow"
                        viewBox="0 0 10 10"
                        refX="7"
                        refY="5"
                        markerWidth="5"
                        markerHeight="5"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
                      </marker>
                      <marker
                        id="arrow-highlight"
                        viewBox="0 0 10 10"
                        refX="7"
                        refY="5"
                        markerWidth="5"
                        markerHeight="5"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ffffff" />
                      </marker>
                    </defs>

                    {calculatedEdges.map((edge, idx) => {
                      const isHighlighted = isEdgeHighlighted(edge.source, edge.target);
                      const dx = Math.abs(edge.x2 - edge.x1);
                      const controlOffset = Math.min(dx * 0.4, 150);
                      const pathString = `M ${edge.x1} ${edge.y1} C ${edge.x1 + controlOffset} ${edge.y1}, ${edge.x2 - controlOffset} ${edge.y2}, ${edge.x2} ${edge.y2}`;

                      return (
                        <g key={idx} className="transition-all duration-300">
                          <path
                            d={pathString}
                            fill="transparent"
                            stroke={isHighlighted ? '#ffffff' : '#334155'}
                            strokeWidth={isHighlighted ? '2.5' : '1.2'}
                            markerEnd={isHighlighted ? 'url(#arrow-highlight)' : 'url(#arrow)'}
                            className="transition-all duration-300"
                          />
                          {isHighlighted && (
                            <text
                              x={(edge.x1 + edge.x2) / 2}
                              y={(edge.y1 + edge.y2) / 2 - 6}
                              fill="#cbd5e1"
                              fontSize="9"
                              fontFamily="monospace"
                              textAnchor="middle"
                              className="select-none"
                            >
                              {edge.relationship}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                )}

                {layoutNodes.length > 0 && (
                  <div className="absolute -top-8 left-0 right-0 flex w-full justify-between px-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500 pointer-events-none select-none">
                    <span className="w-[190px] text-center">Client & Auth</span>
                    <span className="w-[190px] text-center">API & Config</span>
                    <span className="w-[190px] text-center">Services & Utils</span>
                    <span className="w-[190px] text-center">Database & Storage</span>
                  </div>
                )}

                {layoutNodes.map((node) => {
                  const { colorClass, label, icon: Icon, iconColor } = getNodeTypeConfig(node.type);
                  const isHighlighted = isNodeHighlighted(node.id);
                  const isActive = activeNodeId === node.id;

                  return (
                    <div
                      key={node.id}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={() => setSelectedNode(node.id)}
                      className={`absolute z-10 flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg transition-all duration-300 ${colorClass} ${
                        isActive
                          ? 'scale-[1.03] border-white ring-2 ring-white/80'
                          : isHighlighted
                            ? 'opacity-100'
                            : 'opacity-25 hover:opacity-50'
                      }`}
                      style={{
                        left: `${node.x}px`,
                        top: `${node.y}px`,
                        width: `${node.width}px`,
                        height: `${node.height}px`
                      }}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
                      <div className="min-w-0 flex-1">
                        <span className="mb-0.5 block text-[8px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                          {label}
                        </span>
                        <span className="block truncate font-mono text-[11px] font-semibold leading-tight text-white">
                          {node.label}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {layoutNodes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-8 text-center">
                    <div>
                      <Info className="mx-auto mb-3 h-8 w-8 text-slate-600" />
                      <p className="text-sm font-mono text-slate-400">No architecture nodes resolved.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Bottom-right zoom utility */}
          <div className="absolute bottom-6 right-6 z-20 rounded-2xl border border-white/10 bg-slate-950/85 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                className="rounded-xl border border-transparent px-3 py-3 text-slate-400 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              <button
                onClick={handleZoomReset}
                title="Reset Zoom"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                {Math.round(zoomScale * 100)}%
              </button>

              <button
                onClick={handleZoomIn}
                title="Zoom In"
                className="rounded-xl border border-transparent px-3 py-3 text-slate-400 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              <div className="mx-1 h-6 w-px bg-white/10" />

              <button
                onClick={handleZoomReset}
                title="Fit to screen"
                className="rounded-xl border border-transparent px-3 py-3 text-slate-400 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#060913] flex items-center justify-center font-mono text-sm text-slate-400">
        Loading Workspace...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
