'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoadingStateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get('folderId') || 'mock-app';
  const isMock = folderId.startsWith('git-') || folderId === 'mock-app';

  const [progress, setProgress] = useState(65); // Simulating starting at 65% as in wireframe
  const [logs, setLogs] = useState<string[]>([]);
  const apiFetched = useRef(false);
  const dataRef = useRef<any>(null);

  // Default Mock File Tree Structure
  const mockData = {
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
  };

  useEffect(() => {
    if (apiFetched.current) return;
    apiFetched.current = true;

    setLogs(["Analyzing Repository Structure..."]);

    const fetchAnalysis = async () => {
      // Simulate reading logs step-by-step
      setTimeout(() => {
        setLogs(prev => [...prev, "• Reading file tree..."]);
      }, 1000);

      setTimeout(() => {
        setLogs(prev => [...prev, "• Parsing code dependencies..."]);
      }, 2500);

      setTimeout(() => {
        setLogs(prev => [...prev, "• Mapping architecture nodes..."]);
      }, 4000);

      if (isMock) {
        // Mock scenario (no backend API call)
        dataRef.current = mockData;
      } else {
        // Real Backend analysis
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
          if (response.ok) {
            dataRef.current = data;
          } else {
            console.warn('Backend analyze endpoint failed. Falling back to mock data.', data.error);
            dataRef.current = mockData;
          }
        } catch (err) {
          console.warn('Could not connect to backend server. Using mock data.', err);
          dataRef.current = mockData;
        }
      }
    };

    fetchAnalysis();
  }, [folderId, isMock]);

  // Handle progress animation and redirection
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Complete and redirect
          setLogs(prevLogs => [...prevLogs, "✓ Complete! Launching dashboard..."]);
          setTimeout(() => {
            // Save analysis result to sessionStorage so Dashboard can read it
            sessionStorage.setItem('codemap_tree', JSON.stringify(dataRef.current || mockData));
            router.push('/dashboard');
          }, 800);
          return 100;
        }
        
        // Slower increment as it nears 100%
        const increment = prev >= 95 ? 1 : prev >= 85 ? 2 : 4;
        return prev + increment;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [router]);

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
