import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-[#F0EDE4] text-[#1E1F22] font-sans p-4 sm:p-6 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        
        {/* Back button */}
        <div className="flex justify-start">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#E5E0D5] bg-white hover:bg-[#F0EDE4] text-xs font-bold text-[#1E1F22] rounded-full shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-neutral-500" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Header Section inside a card */}
        <header className="bg-white rounded-[24px] border border-[#E5E0D5] p-6 sm:p-8 shadow-sm flex flex-col gap-4">
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E5E0D5] bg-[#F0EDE4] text-xs font-bold text-[#1E1F22]">
              <Shield className="w-3.5 h-3.5 text-neutral-500" />
              <span>Security & Data</span>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1E1F22]">Privacy Policy</h1>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mt-1.5">
              Last updated: June 29, 2026
            </p>
          </div>
        </header>

        {/* Main Content inside a card */}
        <main className="bg-white rounded-[24px] border border-[#E5E0D5] p-6 sm:p-8 shadow-sm space-y-8">
          <p className="text-sm text-neutral-600 leading-relaxed font-medium">
            At CodeMap, your privacy and data security are our highest priorities. This policy outlines how your repositories and code files are processed when using our platform.
          </p>

          <div className="border-t border-[#F0EDE4] pt-6 space-y-6">
            
            <div className="space-y-2.5">
              <h2 className="text-[#1E1F22] font-bold text-sm tracking-tight uppercase">
                1. Repository Processing & Local Isolation
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                When you upload a ZIP archive or clone a repository via link, the backend server processes files in temporary, isolated directories. 
              </p>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                All source code analysis, dependency extraction, and semantic graph generation are performed in memory or temporary files. Once analysis completes, session data is cached inside transient caches for immediate visualization, and original source files are discarded.
              </p>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-[#1E1F22] font-bold text-sm tracking-tight uppercase">
                2. AI Services & Processing API
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                To generate structural visualization mappings, directory trees are sent to our integrated AI engine (powered by Google Gemini or Groq APIs). 
              </p>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                Only metadata structures (file names, directory paths, and configuration lists) are sent to these services. Your raw file logic, secrets, and private business keys are never shared with external APIs.
              </p>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-[#1E1F22] font-bold text-sm tracking-tight uppercase">
                3. Browser Storage & Session Persistence
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                Generated visual maps are cached locally in your browser's session storage (`sessionStorage`) to allow refresh persistence. Clearing session cache or closing your visualizer tab immediately wipes this local data.
              </p>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
