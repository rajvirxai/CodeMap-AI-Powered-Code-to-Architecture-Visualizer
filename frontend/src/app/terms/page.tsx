import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
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
              <FileText className="w-3.5 h-3.5 text-neutral-500" />
              <span>Legal Agreement</span>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1E1F22]">Terms & Conditions</h1>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mt-1.5">
              Last updated: June 29, 2026
            </p>
          </div>
        </header>

        {/* Main Content inside a card */}
        <main className="bg-white rounded-[24px] border border-[#E5E0D5] p-6 sm:p-8 shadow-sm space-y-8">
          <p className="text-sm text-neutral-600 leading-relaxed font-medium">
            Welcome to CodeMap. By using our website, services, and visualizer tools, you agree to comply with and be bound by the following terms and conditions.
          </p>

          <div className="border-t border-[#F0EDE4] pt-6 space-y-6">
            
            <div className="space-y-2.5">
              <h2 className="text-[#1E1F22] font-bold text-sm tracking-tight uppercase">
                1. Acceptance of Terms
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                By accessing CodeMap, uploading codebase archives, or initiating repository cloning pipelines, you acknowledge that you have read, understood, and agree to these Terms & Conditions. If you do not agree, please refrain from using our visualizer tools.
              </p>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-[#1E1F22] font-bold text-sm tracking-tight uppercase">
                2. Code & Repository Visualizations
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                CodeMap acts as a structural analysis visualizer. You are solely responsible for the code you upload or link. You must ensure you possess the legal rights and authorization to upload, clone, analyze, and visualize the repository source files.
              </p>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-[#1E1F22] font-bold text-sm tracking-tight uppercase">
                3. AI Services Usage & Limitations
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                Our analysis relies on metadata summaries processed by LLM architectures (e.g. Gemini, Groq). While we strive for architectural mapping accuracy, CodeMap does not guarantee that the generated visualization is free from errors, omissions, or misclassifications.
              </p>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-[#1E1F22] font-bold text-sm tracking-tight uppercase">
                4. Disclaimer of Warranties
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                The service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied. CodeMap does not warrant that the service will be uninterrupted, secure, or free from server-side connection issues.
              </p>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
