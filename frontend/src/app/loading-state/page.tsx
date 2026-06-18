'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoadingStateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get('folderId') || 'mock-app';
  const isMock = folderId.startsWith('git-') || folderId === 'mock-app';

  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const connectionOpened = useRef(false);

  // Default Mock File Tree Structure and Architecture
  const mockData = {
    repoTree: {
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

  useEffect(() => {
    if (connectionOpened.current) return;
    connectionOpened.current = true;

    if (isMock) {
      // --- Simulated Fallback Mode for Mock Session ---
      setLogs(["Analyzing Mock Structure..."]);
      
      setTimeout(() => {
        setLogs(prev => [...prev, "• Reading file tree..."]);
      }, 800);

      setTimeout(() => {
        setLogs(prev => [...prev, "• Parsing code dependencies..."]);
      }, 1800);

      setTimeout(() => {
        setLogs(prev => [...prev, "• Mapping architecture nodes..."]);
      }, 2800);

      // Progress bar simulation loop
      let simulatedProgress = 0;
      const interval = setInterval(() => {
        simulatedProgress += 5;
        if (simulatedProgress >= 100) {
          clearInterval(interval);
          setProgress(100);
          setLogs(prev => [...prev, "✓ Complete! Launching dashboard..."]);
          setTimeout(() => {
            sessionStorage.setItem('codemap_tree', JSON.stringify(mockData));
            router.push(`/dashboard?folderId=${folderId}`);
          }, 800);
        } else {
          setProgress(simulatedProgress);
        }
      }, 150);

      return () => clearInterval(interval);

    } else {
      // --- Real-time SSE Connection Mode ---
      setLogs(["Establishing Event Connection..."]);
      setProgress(0);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const eventSource = new EventSource(`${backendUrl}/analyze-stream?folderId=${folderId}`);

      eventSource.onopen = () => {
        setLogs(prev => [...prev, "🔌 Connected to analyzer. Scanning repository..."]);
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          
          if (parsed.status === 'error') {
            setLogs(prev => [...prev, `❌ ${parsed.log}`]);
            eventSource.close();
            return;
          }

          setProgress(parsed.progress);
          if (parsed.log) {
            setLogs(prev => [...prev, parsed.log]);
          }

          if (parsed.status === 'complete' && parsed.data) {
            eventSource.close();
            setTimeout(() => {
              sessionStorage.setItem('codemap_tree', JSON.stringify(parsed.data));
              router.push(`/dashboard?folderId=${folderId}`);
            }, 800);
          }
        } catch (err) {
          console.error('Error parsing SSE event:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('EventSource connection failed:', err);
        setLogs(prev => [...prev, '⚠️ Event connection interrupted. Please ensure the backend is running.']);
        eventSource.close();
      };

      return () => {
        eventSource.close();
      };
    }
  }, [folderId, isMock, router]);

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
        <div className="w-full p-5 bg-black border border-zinc-850 rounded-xl font-mono text-xs text-zinc-400 space-y-2 text-left min-h-[160px] shadow-inner select-none">
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
