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
import PracticeArea from '../../components/practice/PracticeArea';
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
  TrendingUp,
  ClipboardList,
  Users as UsersIcon,
  FileText,
  Target,
  PenTool,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      className="bg-white border border-[#D4E4D4] rounded-xl p-4 text-left hover:border-[#00A651] transition-all active:scale-[0.98] group"
    >
      <div className="w-9 h-9 rounded-lg bg-[#D4E4D4]/40 flex items-center justify-center mb-2">
        <IconComponent className="w-4.5 h-4.5 text-[#00A651]" />
      </div>
      <h4 className="text-gray-800 font-semibold text-xs">{area.title}</h4>
      <p className="text-gray-400 text-[10px] mt-0.5">{area.description}</p>
      <span className="inline-block mt-2 text-[10px] text-[#00A651] font-medium">
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
      className="bg-white border border-[#D4E4D4] rounded-xl p-4 text-left hover:border-[#00A651] transition-all active:scale-[0.98] group w-full"
    >
      <div className="flex items-center gap-2 mb-2">
        <IconComponent className="w-4 h-4 text-[#00A651]" />
        <h4 className="text-gray-800 font-semibold text-xs">{infographic.title}</h4>
      </div>
      <p className="text-gray-400 text-[10px]">{infographic.description}</p>
      <span className="inline-block mt-2 text-[10px] text-[#00A651] font-medium group-hover:text-gray-800">
        View guide &rarr;
      </span>
    </button>
  );
};

const HelpHome = () => {
  const { userProfile } = useAuth();
  const role = userProfile?.role;
  const { completedCount, totalCount } = useTutorial();
  const navigate = useNavigate();
  const [activeInfographic, setActiveInfographic] = useState(null);
  const [activePractice, setActivePractice] = useState(null);

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
    setActivePractice(practiceId);
  };

  return (
    <PageShell
      title="Help Center"
      subtitle="Guides, FAQs, and support"
      backTo={role === 'tryout_assessor' ? '/assessor' : '/welcome'}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* 1. Quick Start Carousel with ProgressRing */}
        <QuickStartCarousel userRole={role} />

        {/* 2. Popular Topics */}
        <div>
          <h2 className="text-gray-800 font-bold text-base mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-[#00A651]" />
            Popular Topics
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'How do tryouts work?', icon: ClipboardList, to: '/help/coordinators' },
              { label: 'Track my child\'s progress', icon: TrendingUp, to: '/help/parents' },
              { label: 'Take attendance', icon: UsersIcon, to: '/help/youth-coaches' },
              { label: 'Use the drill library', icon: BookOpen, to: '/help/coaches' },
              { label: 'Create a development plan', icon: Target, to: '/help/coaches' },
              { label: 'Write session summaries', icon: PenTool, to: '/help/youth-coaches' },
            ].map((topic) => (
              <button
                key={topic.label}
                onClick={() => navigate(topic.to)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D4E4D4] rounded-full text-xs text-gray-700 hover:border-[#00A651] hover:text-[#005028] transition-colors"
              >
                <topic.icon className="w-3.5 h-3.5 text-[#00A651]" />
                {topic.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Practice Areas grid */}
        {availablePractice.length > 0 && (
          <div>
            <h2 className="text-gray-800 font-bold text-base mb-3 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#00A651]" />
              Practice Areas
            </h2>
            <p className="text-gray-400 text-xs mb-3">
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
            <h2 className="text-gray-800 font-bold text-base mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00A651]" />
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
          <h2 className="text-gray-800 font-bold text-base mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#00A651]" />
            All Guides
          </h2>

          {/* Recommended highlight */}
          {recommendedPage && (
            <div className="mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#00A651] mb-1 block">
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
          <h2 className="text-gray-800 font-bold text-base mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#00A651]" />
            Frequently Asked Questions
          </h2>
          <FAQAccordion faqs={GLOBAL_FAQS} />
        </div>

        {/* 7. Contact Support */}
        <div>
          <h2 className="text-gray-800 font-bold text-base mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#00A651]" />
            Contact Support
          </h2>
          <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
            <p className="text-gray-700 text-sm">
              If you cannot find the answer you need, reach out to the club:
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-3 bg-[#F5F9F5] rounded-lg p-3 border border-[#D4E4D4]/50">
                <Mail className="w-4 h-4 text-[#00A651]" />
                <span className="text-gray-800 text-sm">admin@emeraldlakers.com</span>
              </div>
              <div className="flex items-center gap-3 bg-[#F5F9F5] rounded-lg p-3 border border-[#D4E4D4]/50">
                <Calendar className="w-4 h-4 text-[#00A651]" />
                <span className="text-gray-600 text-sm">Response within 24-48 hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Infographic Detail Modal */}
      {activeInfographic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setActiveInfographic(null)}>
          <div className="bg-white rounded-2xl border border-[#D4E4D4]/30 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#D4E4D4]/30">
              <h3 className="text-gray-800 font-bold">{activeInfographic.title}</h3>
              <button onClick={() => setActiveInfographic(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-gray-500 text-sm mb-4">{activeInfographic.description}</p>
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

      {/* Practice Area Full-Screen Modal */}
      {activePractice && (
        <div className="fixed inset-0 z-50 bg-[#F5F9F5] overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white border-b border-[#D4E4D4]/30 px-4 py-3 flex items-center justify-between">
            <h3 className="text-gray-800 font-bold text-sm">
              {PRACTICE_AREAS.find(a => a.id === activePractice)?.title || 'Practice'}
            </h3>
            <button
              onClick={() => setActivePractice(null)}
              className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          <PracticeArea practiceId={activePractice} />
        </div>
      )}
    </PageShell>
  );
};

export default HelpHome;
