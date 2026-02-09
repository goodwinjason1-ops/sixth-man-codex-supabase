import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useTutorial from '../../hooks/useTutorial';
import PageShell from '../../components/PageShell';
import HelpSearchBar from '../../components/help/HelpSearchBar';
import HelpRoleCard from '../../components/help/HelpRoleCard';
import FAQAccordion from '../../components/help/FAQAccordion';
import { HELP_PAGES, GLOBAL_FAQS } from '../../data/helpContent';
import { TUTORIALS, TUTORIAL_ORDER } from '../../data/tutorialContent';
import * as Icons from 'lucide-react';
import {
  HelpCircle,
  BookOpen,
  Star,
  Mail,
  Calendar,
  GraduationCap,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
} from 'lucide-react';

const PAGE_ORDER = ['admin', 'leadership', 'coordinators', 'coaches', 'youth-coaches', 'assessors', 'parents', 'players'];

const TutorialCard = ({ tutorial, completed, onStart }) => {
  const IconComponent = Icons[tutorial.icon] || Icons.BookOpen;

  return (
    <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          completed ? 'bg-[#22c55e]/20' : 'bg-[#1a8a68]/40'
        }`}>
          {completed ? (
            <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
          ) : (
            <IconComponent className="w-5 h-5 text-[#4ade80]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold text-sm">{tutorial.title}</h3>
            {completed && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30">
                Completed
              </span>
            )}
          </div>
          <p className="text-white/50 text-xs mt-0.5">{tutorial.subtitle}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-white/30 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {tutorial.estimatedMinutes} min
            </span>
            <span className="text-white/30 text-xs">
              {tutorial.steps.length} steps
            </span>
          </div>
          <button
            onClick={() => onStart(tutorial.id)}
            className={`mt-3 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[36px] ${
              completed
                ? 'bg-[#1a8a68]/30 text-white/70 hover:bg-[#1a8a68]/50'
                : 'bg-[#22c55e] text-white hover:bg-[#16a34a]'
            }`}
          >
            {completed ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                Replay
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Start Tutorial
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const HelpHome = () => {
  const { userProfile } = useAuth();
  const role = userProfile?.role;
  const { startTutorial, hasCompletedTutorial, completedCount, totalCount } = useTutorial();

  // Find the recommended guide for the current user
  const recommended = PAGE_ORDER.find(
    (slug) => HELP_PAGES[slug]?.applicableRoles?.includes(role)
  );
  const recommendedPage = recommended ? HELP_PAGES[recommended] : null;

  return (
    <PageShell
      title="Help Center"
      subtitle="Guides, FAQs, and support"
      backTo={role === 'tryout_assessor' ? '/assessor' : '/welcome'}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Search */}
        <HelpSearchBar />

        {/* Interactive Tutorials */}
        <div>
          <h2 className="text-white font-bold text-base mb-1 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#4ade80]" />
            Interactive Tutorials
          </h2>
          <p className="text-white/40 text-xs mb-3">
            Step-by-step walkthroughs to get you started ({completedCount}/{totalCount} completed)
          </p>

          {/* Overall progress bar */}
          {totalCount > 0 && (
            <div className="mb-3">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#22c55e] rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            {TUTORIAL_ORDER.map((id) => {
              const tutorial = TUTORIALS[id];
              if (!tutorial) return null;
              return (
                <TutorialCard
                  key={id}
                  tutorial={tutorial}
                  completed={hasCompletedTutorial(id)}
                  onStart={startTutorial}
                />
              );
            })}
          </div>
        </div>

        {/* Recommended for You */}
        {recommendedPage && (
          <div>
            <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-[#4ade80]" />
              Recommended for You
            </h2>
            <HelpRoleCard {...recommendedPage} />
          </div>
        )}

        {/* All Guides */}
        <div>
          <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#4ade80]" />
            All Guides
          </h2>
          <div className="space-y-2">
            {PAGE_ORDER.map((slug) => {
              const page = HELP_PAGES[slug];
              if (!page) return null;
              return <HelpRoleCard key={slug} {...page} />;
            })}
          </div>
        </div>

        {/* Global FAQs */}
        <div>
          <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#4ade80]" />
            Frequently Asked Questions
          </h2>
          <FAQAccordion faqs={GLOBAL_FAQS} />
        </div>

        {/* Contact Support */}
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
    </PageShell>
  );
};

export default HelpHome;
