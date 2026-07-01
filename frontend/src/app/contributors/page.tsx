import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';

interface Contributor {
  name: string;
  role: string;
  category: 'Frontend' | 'Backend' | 'AI' | 'Leadership';
  bio: string;
  github?: string;
  linkedin?: string;
  badge?: string; // Optional specialty badge e.g. Mentor
}

const contributors: Contributor[] = [
  {
    name: "Rudra Singh",
    role: "Project Mentor",
    category: "Leadership",
    badge: "Mentor",
    bio: "Guiding the technical blueprint, database normalization rules, and integration phases of CodeMap.",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
  },
  {
    name: "Rajvir Singh",
    role: "Backend Developer",
    category: "Backend",
    bio: "Project initiator. Formulated systems architecture, database schemas, and Express server controllers.",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
  },
  {
    name: "Sombodhi Pandit",
    role: "Backend Developer",
    category: "Backend",
    bio: "Designed file scanning algorithms, ZIP upload extractions, and core API response routing.",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
  },
  {
    name: "Pragya Singh",
    role: "Frontend Developer",
    category: "Frontend",
    bio: "Architected layout structure, branding systems, visualizer workspaces, and responsive audit corrections.",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
  },
  {
    name: "Sanchita Samadder",
    role: "Frontend Developer",
    category: "Frontend",
    bio: "Developed connection mapping visual lines, file sidebars, loading progress indicators, and UI components.",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
  },
  {
    name: "Oitrika Bhattacharjee",
    role: "AI Developer",
    category: "AI",
    bio: "Configured dual-engine AI routers, dynamic error fallbacks, and prompt payload structures.",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
  },
  {
    name: "Vaibhav Shaw",
    role: "AI Developer",
    category: "AI",
    bio: "Built JSON-to-graph validation pipelines, syntax token parsing, and microservice boundary detection schemas.",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
  }
];

export default function ContributorsPage() {
  // Helper to extract initials
  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  // Group contributors by category
  const categories = {
    "Leadership & Mentorship": contributors.filter(c => c.category === 'Leadership'),
    "Frontend Team": contributors.filter(c => c.category === 'Frontend'),
    "Backend Team": contributors.filter(c => c.category === 'Backend'),
    "AI Team": contributors.filter(c => c.category === 'AI')
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-[#F0EDE4] text-[#1E1F22] font-sans p-4 sm:p-6 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        
        {/* Navigation Return Button */}
        <div className="flex justify-start">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#E5E0D5] bg-white hover:bg-[#F0EDE4] text-xs font-bold text-[#1E1F22] rounded-full shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-neutral-500" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Hero Headings inside a card */}
        <header className="bg-white rounded-[24px] border border-[#E5E0D5] p-6 sm:p-8 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E5E0D5] bg-[#F0EDE4] text-xs font-bold text-[#1E1F22]">
            <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
            <span>The Creators</span>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1E1F22]">Meet the Team</h1>
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold mt-1">
              The developers, mentors, and architects behind CodeMap
            </p>
          </div>
        </header>

        {/* Teams Sections */}
        <div className="space-y-10 mt-4">
          {Object.entries(categories).map(([groupTitle, members]) => {
            if (members.length === 0) return null;

            return (
              <section key={groupTitle} className="space-y-4">
                {/* Category Header */}
                <div className="border-b border-[#E5E0D5] pb-2 pl-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    {groupTitle}
                  </h2>
                </div>

                {/* Team Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {members.map((member, idx) => {
                    // Category-specific badge styling
                    let badgeColorClass = 'text-neutral-600 bg-neutral-50/70 border-neutral-100';
                    if (member.category === 'Frontend') badgeColorClass = 'text-blue-600 bg-blue-50/70 border-blue-100';
                    else if (member.category === 'Backend') badgeColorClass = 'text-purple-600 bg-purple-50/70 border-purple-100';
                    else if (member.category === 'AI') badgeColorClass = 'text-rose-600 bg-rose-50/70 border-rose-100';
                    else if (member.category === 'Leadership') badgeColorClass = 'text-amber-600 bg-amber-50/70 border-amber-100';

                    return (
                      <div 
                        key={idx} 
                        className="bg-white rounded-[24px] border border-[#E5E0D5] p-6 shadow-sm hover:shadow hover:border-[#D2CBB8] transition-all flex flex-col justify-between group"
                      >
                        {/* Profile Header */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            {/* Initials Avatar */}
                            <div className="w-12 h-12 rounded-full bg-[#F0EDE4] border border-[#E5E0D5] flex items-center justify-center font-bold text-sm text-[#1E1F22] shadow-inner select-none shrink-0 group-hover:scale-105 transition-transform duration-200">
                              {getInitials(member.name)}
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-[#1E1F22] leading-tight">{member.name}</h3>
                              <p className="text-[10px] font-medium text-neutral-400 mt-0.5">{member.role}</p>
                            </div>
                          </div>

                          {/* Specialty Badge */}
                          <div className="flex flex-wrap gap-2">
                            <span className={`text-[9px] font-bold border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${badgeColorClass}`}>
                              {member.category}
                            </span>
                            {member.badge && (
                              <span className="text-[9px] font-bold bg-[#1E1F22] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                {member.badge}
                              </span>
                            )}
                          </div>

                          {/* Bio */}
                          <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                            {member.bio}
                          </p>
                        </div>

                        {/* Social Links */}
                        <div className="flex items-center gap-4 pt-6 border-t border-[#F0EDE4] mt-6">
                          {member.github && (
                            <a 
                              href={member.github} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-neutral-400 hover:text-[#1E1F22] transition-colors"
                              title="GitHub Profile"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                              </svg>
                            </a>
                          )}
                          {member.linkedin && (
                            <a 
                              href={member.linkedin} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-neutral-400 hover:text-[#1E1F22] transition-colors"
                              title="LinkedIn Profile"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

      </div>
    </div>
  );
}
