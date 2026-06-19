'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoadingStateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get('folderId') || 'mock-app';
  const isMock = folderId.startsWith('git-') || folderId === 'mock-app';

  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  // Default Mock File Tree Structure and Architecture
  const mockData = {
    repoTree: {
      name: "ecommerce-app",
      type: "folder",
      children: [
        {
          name: "components",
          type: "folder",
          children: [
            { name: "ProductCard.tsx", type: "file" },
            { name: "Cart.tsx", type: "file" },
            { name: "Navbar.tsx", type: "file" }
          ]
        },
        {
          name: "controllers",
          type: "folder",
          children: [
            { name: "authController.js", type: "file" },
            { name: "productController.js", type: "file" },
            { name: "orderController.js", type: "file" }
          ]
        },
        {
          name: "routes",
          type: "folder",
          children: [
            { name: "authRoutes.js", type: "file" },
            { name: "orderRoutes.js", type: "file" }
          ]
        },
        {
          name: "models",
          type: "folder",
          children: [
            { name: "User.js", type: "file" },
            { name: "Product.js", type: "file" },
            { name: "Order.js", type: "file" }
          ]
        },
        {
          name: "services",
          type: "folder",
          children: [
            { name: "paymentService.js", type: "file" },
            { name: "emailService.js", type: "file" }
          ]
        },
        {
          name: "utils",
          type: "folder",
          children: [
            { name: "db.js", type: "file" }
          ]
        },
        { name: "package.json", type: "file" }
      ]
    },
    architecture: {
      summary: "An enterprise-grade e-commerce application. The Next.js frontend handles product catalog rendering, inventory displays, cart logic, and authentication checks. It invokes REST endpoints handled by Express routing, which queries a MongoDB database using Mongoose schemas for orders/products, and integrates with the Stripe SDK for payments.",
      nodes: [
        { id: "ecommerce_app_components", label: "Next.js Web Client", type: "frontend" },
        { id: "ecommerce_app_routes", label: "Express REST Gateway", type: "api" },
        { id: "ecommerce_app_controllers", label: "Controllers Layer", type: "backend" },
        { id: "ecommerce_app_services", label: "Stripe Payment Service", type: "service" },
        { id: "ecommerce_app_models", label: "MongoDB Database Models", type: "database" },
        { id: "ecommerce_app_utils_db_js", label: "Database Connection", type: "database" }
      ],
      edges: [
        { source: "ecommerce_app_components", target: "ecommerce_app_routes", relationship: "REST Calls" },
        { source: "ecommerce_app_routes", target: "ecommerce_app_controllers", relationship: "Routes to" },
        { source: "ecommerce_app_controllers", target: "ecommerce_app_services", relationship: "Delegates to" },
        { source: "ecommerce_app_controllers", target: "ecommerce_app_models", relationship: "Queries" },
        { source: "ecommerce_app_models", target: "ecommerce_app_utils_db_js", relationship: "Uses Connection" }
      ]
    }
  };

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    if (isMock) {
      timeouts.push(setTimeout(() => {
        setLogs(["Analyzing Mock Structure..."]);
      }, 0));
      
      timeouts.push(setTimeout(() => {
        setLogs(prev => [...prev, "• Reading file tree..."]);
      }, 800));

      timeouts.push(setTimeout(() => {
        setLogs(prev => [...prev, "• Parsing code dependencies..."]);
      }, 1800));

      timeouts.push(setTimeout(() => {
        setLogs(prev => [...prev, "• Mapping architecture nodes..."]);
      }, 2800));

      // Progress bar simulation loop
      let simulatedProgress = 0;
      const interval = setInterval(() => {
        simulatedProgress += 5;
        if (simulatedProgress >= 100) {
          clearInterval(interval);
          setProgress(100);
          setLogs(prev => [...prev, "✓ Complete! Launching dashboard..."]);
          timeouts.push(setTimeout(() => {
            sessionStorage.setItem('codemap_tree', JSON.stringify(mockData));
            router.push(`/dashboard?folderId=${folderId}`);
          }, 800));
        } else {
          setProgress(simulatedProgress);
        }
      }, 150);

      return () => {
        clearInterval(interval);
        timeouts.forEach(t => clearTimeout(t));
      };

    } else {
      timeouts.push(setTimeout(() => {
        setLogs(["Establishing Event Connection..."]);
      }, 0));

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
            timeouts.push(setTimeout(() => {
              sessionStorage.setItem('codemap_tree', JSON.stringify(parsed.data));
              router.push(`/dashboard?folderId=${folderId}`);
            }, 800));
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
        timeouts.forEach(t => clearTimeout(t));
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
