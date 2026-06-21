'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
        await delay(160);
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

        addLog('Repository analysis complete');
        setAnalysisData(data);
      } catch (err: unknown) {
        console.warn('Could not connect to backend server. Using mock data.', err);
        addLog('Backend unavailable. Using mock data.');
        setAnalysisData(mockData);
      }
    };

    fetchAnalysis();
  }, [folderId, isMock]);

  useEffect(() => {
    if (analysisData === null) return;

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
  }, [analysisData, router]);

  useEffect(() => {
    if (progress >= 90) return;

    const interval = window.setInterval(() => {
      setProgress((prev) => Math.min(prev + 7, 90));
    }, 100);

    return () => window.clearInterval(interval);
  }, [progress]);

  // Circular calculations
  const radius = 50;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950 text-white">
      <div className="w-full max-w-sm flex flex-col items-center gap-10">
        
        {/* Graphic A: Custom SVG Circular Progress Ring */}
        <div className="relative flex items-center justify-center">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              stroke="rgba(63, 63, 70, 0.3)"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Foreground circle (progress indicator) */}
            <circle
              stroke="white"
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
          <div className="absolute font-mono font-bold text-lg text-white">
            {progress}%
          </div>
        </div>

        {/* Graphic B: Horizontal Linear Fill Loading Bar */}
        <div className="w-full h-1.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status Terminal Logs */}
        <div className="w-full p-5 bg-black border border-zinc-850 rounded-xl font-mono text-xs text-zinc-400 space-y-2 text-left min-h-40 shadow-inner select-none">
          {logs.map((log, index) => {
            const isBullet = log.startsWith('•');
            const isSuccess = log.startsWith('✓');
            return (
              <div 
                key={index} 
                className={`transition-all duration-300 ${
                  isSuccess 
                    ? 'text-white font-bold' 
                    : isBullet 
                      ? 'text-zinc-500 pl-3' 
                      : 'text-zinc-300'
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950 text-white font-mono text-sm">
        Initializing analyzer...
      </div>
    }>
      <LoadingStateContent />
    </Suspense>
  );
}
