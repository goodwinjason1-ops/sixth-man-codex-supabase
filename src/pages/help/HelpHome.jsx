import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useTutorial from '../../hooks/useTutorial';
import PageShell from '../../components/PageShell';
import HelpSearchBar from '../../components/help/HelpSearchBar';
import HelpRoleCard from '../../components/help/HelpRoleCard';
import FAQAccordion from '../../components/help/FAQAccordion';
import QuickStartCarousel from '../../components/help/QuickStartCarousel';
import ProgressRing from '../../components/help/ProgressRing';
import FlowChart from '../../components/tutorial/FlowChart';
import ProcessFlow from '../../components/tutorial/ProcessFlow';
import { HELP_PAGES, GLOBAL_FAQS } from '../../data/helpContent';
import { INFOGRAPHICS } from '../../data/infographicContent';
import * as Icons from 'lucide-react';
import {
  HelpCircle,
  BookOpen,
  Star,
  Mail,
  Calendar,
  BarChart3,
  Dumbbell,
  Layers,
  X,
} from 'lucide-react';

const PAGE_ORDER = ['admin', 'leadership', 'coordinators', 'coaches', 'youth-coaches', 'assessors', 'parents', 'players'];

// Practice area definitions
const PRACTICE_AREAS = [
  { id: 'assessor', title: 'Assessor Scoring', icon: 'ClipboardCheck', description: 'Practice rating players', roles: ['tryout_assessor', 'admin', 'president', 'vice_president', 'coach_coordinator', 'girls_coordinator', 'boys_coordinator'] },
  { id: 'attendance', title: 'Attendance', icon: 'Users', description: 'Mark players present/absent', roles: ['youth_coach', 'youth_head_coach', 'coach', 'admin'] },
  { id: 'match-assessment', title: 'Match Assessment', icon: 'Trophy', description: 'Rate game performance', roles: ['coach', 'admin', 'president', 'vice_president', 'coach_coordinator'] },
  { id: 'admin-tryout', title: 'Create Tryout', icon: 'Settings', description: 'Set up a tryout session', roles: ['admin', 'president', 'vice_president', 'coach_coordinator', 'girls_coordinator', 'boys_coordinator'] },
];

const PracticeAreaCard = ({ area, onStart }) => {
  const IconComponent = Icons[area.icon] || Icons.HelpCircle;
  return (
    <button
      onClick={() => onStart(area.id)}
      className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4 text-left hover:border-[#22c55e] transition-all active:scale-[0.98] group"
    >
      <div className="w-9 h-9 rounded-lg bg-[#1a8a68]/40 flex items-center justify-center mb-2">
        <IconComponent className="w-4.5 h-4.5 text-[#4ade80]" />
      </div>
      <h4 className="text-white font-semibold text-xs">{area.title}</h4>
      <p className="text-white/50 text-[10px] mt-0.5">{area.description}</p>
      <span className="inline-block mt-2 text-[10px] text-[#4ade80] font-medium">
        Try it &rarr;
      </span>
    </button>
  );
};

const InfographicCard = ({ infographic, onClick }) => {
  const IconComponent = Icons[infographic.icon] || Icons.BarChart3;
  return (
    <button
      onClick={() => onClick(infographic)}
      className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4 text-left hover:border-[#22c55e] transition-all active:scale-[0.98] group w-full"
    >
      <div className="flex items-center gap-2 mb-2">
        <IconComponent className="w-4 h-4 text-[#4ade80]" />
        <h4 className="text-white font-semibold text-xs">{infographic.title}</h4>
      </div>
      <p className="text-white/50 text-[10px]">{infographic.description}</p>
      <span className="inline-block mt-2 text-[10px] text-[#4ade80] font-medium group-hover:text-white">
        View guide &rarr;
      </span>
    </button>
  );
};

const HelpHome = () => {
  const { userProfile } = useAuth();
  const role = userProfile?.role;
  const { completedCount, totalCount } = useTutorial();
  const [activeInfographic, setActiveInfographic] = useState(null);

  // Find the recommended guide for the current user
  const recommended = PAGE_ORDER.find(
    (slug) => HELP_PAGES[slug]?.applicableRoles?.includes(role)
  );
  const recommendedPage = recommended ? HELP_PAGES[recommended] : null;

  // Filter practice areas by role
  const availablePractice = role
    ? PRACTICE_AREAS.filter((a) => a.roles.includes(role))
    : PRACTICE_AREAS;

  // Get infographics as array
  const infographicList = Object.values(INFOGRAPHICS || {});

  const handleStartPractice = (practiceId) => {
    // Open practice in a modal/overlay — for now scroll to embedded practice area
    // This is a placeholder; actual navigation handled by content blocks
    const el = document.getElementById(`practice-${practiceId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <PageShell
      title="Help Center"
      subtitle="Guides, FAQs, and support"
      backTo={role === 'tryout_assessor' ? '/assessor' : '/welcome'}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* 1. Quick Start Carousel with ProgressRing */}
        <QuickStartCarousel userRole={role} />

        {/* 2. Practice Areas grid */}
        {availablePractice.length > 0 && (
          <div>
            <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#4ade80]" />
              Practice Areas
            </h2>
            <p className="text-white/40 text-xs mb-3">
              Try features without affecting real data
            </p>
            <div className="grid grid-cols-2 gap-3">
              {availablePractice.map((area) => (
                <PracticeAreaCard
                  key={area.id}
                  area={area}
                  onStart={handleStartPractice}
                />
              ))}
            </div>
          </div>
        )}

        {/* 3. Infographics section */}
        {infographicList.length > 0 && (
          <div>
            <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#4ade80]" />
              Visual Guides
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {infographicList.map((info) => (
                <InfographicCard key={info.id} infographic={info} onClick={setActiveInfographic} />
              ))}
            </div>
          </div>
        )}

        {/* 4. Search bar */}
        <HelpSearchBar />

        {/* 5. All Guides — 2-col icon grid */}
        <div>
          <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#4ade80]" />
            All Guides
          </h2>

          {/* Recommended highlight */}
          {recommendedPage && (
            <div className="mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#4ade80] mb-1 block">
                Recommended for your role
              </span>
              <HelpRoleCard {...recommendedPage} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {PAGE_ORDER.map((slug) => {
              const page = HELP_PAGES[slug];
              if (!page) return null;
              if (slug === recommended) return null; // Already shown above
              return <HelpRoleCard key={slug} {...page} />;
            })}
          </div>
        </div>

        {/* 6. Global FAQs */}
        <div>
          <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#4ade80]" />
            Frequently Asked Questions
          </h2>
          <FAQAccordion faqs={GLOBAL_FAQS} />
        </div>

        {/* 7. Contact Support */}
        <div>
          <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#4ade80]" />
            Contact Support
          </h2>
          <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
            <p className="text-white/80 text-sm">
              If you cannot find the answer you need, reach out to the club:
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-3 bg-[#0a3d2e] rounded-lg p-3 border border-[#1a8a68]/50">
                <Mail className="w-4 h-4 text-[#4ade80]" />
                <span className="text-white text-sm">admin@emeraldlakers.com</span>
              </div>
              <div className="flex items-center gap-3 bg-[#0a3d2e] rounded-lg p-3 border border-[#1a8a68]/50">
                <Calendar className="w-4 h-4 text-[#4ade80]" />
                <span className="text-white/70 text-sm">Response within 24-48 hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Infographic Detail Modal */}
      {activeInfographic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setActiveInfographic(null)}>
          <div className="bg-[#0d5943] rounded-2xl border border-[#1a8a68]/30 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a8a68]/30">
              <h3 className="text-white font-bold">{activeInfographic.title}</h3>
              <button onClick={() => setActiveInfographic(null)} className="p-1 hover:bg-white/10 rounded-lg">
                <X size={18} className="text-white/60" />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-white/60 text-sm mb-4">{activeInfographic.description}</p>
              {activeInfographic.type === 'flowchart' && activeInfographic.nodes && (
                <FlowChart nodes={activeInfographic.nodes} edges={activeInfographic.edges} />
              )}
              {activeInfographic.type === 'process-flow' && activeInfographic.steps && (
                <ProcessFlow steps={activeInfographic.steps} />
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default HelpHome;
