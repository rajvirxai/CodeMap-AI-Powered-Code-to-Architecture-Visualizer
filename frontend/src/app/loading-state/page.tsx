'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, RefreshCw, ArrowLeft, Database } from 'lucide-react';

// Default Mock File Tree Structure and Architecture
const mockData = {
  fileTree: {
    name: "my-app",
    type: "folder",
    children: [
      {
        name: "index.js",
        type: "file",
      },
      {
        name: "utils.js",
        type: "file",
      },
      {
        name: "components",
        type: "folder",
        children: [
          {
            name: "Dashboard.js",
            type: "file",
          },
          {
            name: "Sidebar.js",
            type: "file",
          }
        ]
      },
      {
        name: "package.json",
        type: "file"
      }
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

function LoadingStateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get('folderId') || 'mock-app';
  const isMock = folderId.startsWith('mock-') || folderId === 'mock-app';

  const [progress, setProgress] = useState(10);
  const [logs, setLogs] = useState<string[]>(['Initializing analyzer...']);
  const [analysisData, setAnalysisData] = useState<unknown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const apiFetched = useRef(false);

  const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  useEffect(() => {
    if (apiFetched.current) return;
    apiFetched.current = true;

    const addLog = (message: string) => {
      setLogs((prev) => [...prev, message]);
    };

    const fetchAnalysis = async () => {
      addLog('Analyzing repository structure...');

      if (isMock) {
        await delay(500);
        addLog('Using mock repository data');
        setAnalysisData(mockData);
        return;
      }

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const response = await fetch(`${backendUrl}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ folderId }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to analyze repository');
        }

        addLog('✓ Repository analysis complete');
        setAnalysisData(data);
      } catch (err: unknown) {
        console.warn('Repository analysis connection failed.', err);
        const errMsg = err instanceof Error ? err.message : 'Unknown backend analysis error';
        addLog(`✗ Analysis failed: ${errMsg}`);
        setError(errMsg);
      }
    };

    fetchAnalysis();
  }, [folderId, isMock, retryTrigger]);

  useEffect(() => {
    if (analysisData === null || error !== null) return;

    const progressTimeout = window.setTimeout(() => {
      setProgress(92);
    }, 0);

    const redirectTimeout = window.setTimeout(() => {
      setProgress(100);
      setLogs((prevLogs) => [...prevLogs, '✓ Complete! Launching dashboard...']);
      sessionStorage.setItem('codemap_tree', JSON.stringify(analysisData));
      sessionStorage.setItem('codemap_folderId', folderId);
      router.push('/dashboard');
    }, 260);

    return () => {
      window.clearTimeout(progressTimeout);
      window.clearTimeout(redirectTimeout);
    };
  }, [analysisData, router, folderId, error]);

  useEffect(() => {
    if (progress >= 90 || error !== null) return;

    const interval = window.setInterval(() => {
      setProgress((prev) => Math.min(prev + 7, 90));
    }, 100);

    return () => window.clearInterval(interval);
  }, [progress, error]);

  const handleRetry = () => {
    setError(null);
    setProgress(10);
    setLogs(['Re-initializing analyzer...']);
    apiFetched.current = false;
    setRetryTrigger((prev) => prev + 1);
  };

  const handleUseMock = () => {
    setError(null);
    setProgress(80);
    setLogs((prev) => [...prev, 'Bypassing error, loading mock database...']);
    setAnalysisData(mockData);
  };

  // Circular calculations
  const radius = 50;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#F0EDE4] text-[#1E1F22] select-none min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-md p-6 sm:p-8 border border-[#E5E0D5] bg-white rounded-[24px] shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-3.5 pb-4 border-b border-[#E5E0D5]">
            <div className="w-10 h-10 rounded-xl bg-[#FF7563]/10 border border-[#FF7563]/20 flex items-center justify-center text-[#FF7563] shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1E1F22]">Repository Scan Failed</h3>
              <p className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider mt-0.5">Analysis Aborted</p>
            </div>
          </div>

          <div className="text-xs font-mono bg-[#FCFBF9] border border-[#E5E0D5] p-4 rounded-xl text-[#FF7563] leading-relaxed overflow-x-auto whitespace-pre-wrap">
            {error}
          </div>

          <p className="text-xs text-neutral-500 leading-normal font-sans">
            CodeMap encountered a connection failure or processing exception while scanning files. Verify the backend server is running and accessible on port 5000.
          </p>

          <div className="flex flex-col gap-2 pt-2 border-t border-[#E5E0D5]">
            <button
              onClick={handleRetry}
              className="w-full py-3 bg-[#1E1F22] hover:bg-[#2C2E33] text-white font-bold font-mono tracking-wide text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Analysis</span>
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/upload')}
                className="flex-1 py-2.5 border border-[#E5E0D5] bg-white hover:bg-[#F0EDE4] text-xs font-bold font-mono text-[#1E1F22] rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
              <button
                onClick={handleUseMock}
                className="flex-1 py-2.5 border border-[#E5E0D5] bg-white hover:bg-[#F0EDE4] text-xs font-bold font-mono text-neutral-500 rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Demo Mode</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#F0EDE4] text-[#1E1F22] min-h-[calc(100vh-4rem)] select-none">
      <div className="w-full max-w-sm flex flex-col items-center gap-8 bg-white border border-[#E5E0D5] rounded-[24px] p-8 shadow-sm">
        
        {/* Graphic A: Custom SVG Circular Progress Ring */}
        <div className="relative flex items-center justify-center">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              stroke="#F0EDE4"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Foreground circle (progress indicator) */}
            <circle
              stroke="#1E1F22"
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="transition-all duration-200 ease-out"
            />
          </svg>
          {/* Centered Percentage */}
          <div className="absolute font-mono font-bold text-lg text-[#1E1F22]">
            {progress}%
          </div>
        </div>

        {/* Graphic B: Horizontal Linear Fill Loading Bar */}
        <div className="w-full h-1.5 bg-[#F0EDE4] border border-[#E5E0D5] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#1E1F22] transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status Terminal Logs */}
        <div className="w-full p-4 bg-[#FCFBF9] border border-[#E5E0D5] rounded-xl font-mono text-[11px] text-neutral-500 space-y-2 text-left min-h-40 shadow-inner select-none">
          {logs.map((log, index) => {
            const isBullet = log.startsWith('•') || log.startsWith('✗');
            const isSuccess = log.startsWith('✓');
            return (
              <div 
                key={index} 
                className={`transition-all duration-300 ${
                  isSuccess 
                    ? 'text-[#1E1F22] font-bold' 
                    : isBullet 
                      ? (log.startsWith('✗') ? 'text-[#FF7563]' : 'text-neutral-400 pl-3')
                      : 'text-neutral-500'
                }`}
              >
                {log}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Suspense boundary wrapper to prevent build-time deoptimization
export default function LoadingPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#F0EDE4] text-[#1E1F22] font-mono text-sm min-h-[calc(100vh-4rem)]">
        Initializing analyzer...
      </div>
    }>
      <LoadingStateContent />
    </Suspense>
  );
}
