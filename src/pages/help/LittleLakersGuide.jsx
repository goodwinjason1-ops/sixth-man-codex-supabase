import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  Calendar,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  Award,
  Printer
} from 'lucide-react';

const Section = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[#0d5943]/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1a8a68]/50 rounded-lg flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#4ade80]" />
          </div>
          <h3 className="text-white font-semibold text-sm">{title}</h3>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[#4ade80]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#4ade80]" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 text-white/80 text-sm leading-relaxed space-y-3">
          {children}
        </div>
      )}
    </div>
  );
};

const Step = ({ number, text }) => (
  <div className="flex items-start gap-3">
    <span className="flex-shrink-0 w-6 h-6 bg-[#1a8a68] rounded-full flex items-center justify-center text-white text-xs font-bold">
      {number}
    </span>
    <p>{text}</p>
  </div>
);

const LittleLakersGuide = () => {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0a3d2e]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0a3d2e] border-b border-[#1a8a68] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#4ade80] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-1.5 border border-[#1a8a68] rounded-lg text-white/70 text-xs hover:bg-[#1a8a68] transition-colors print:hidden"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#0d5943] border-2 border-[#1a8a68] rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-7 h-7 text-[#4ade80]" />
          </div>
          <h1 className="text-white text-xl font-bold">Little Lakers & Lakers Ready</h1>
          <p className="text-[#4ade80] text-sm mt-1">Youth coach guide</p>
        </div>

        {/* Program Overview */}
        <div className="bg-violet-500/10 border border-violet-500/50 rounded-xl p-4 mb-4">
          <h2 className="text-violet-300 font-semibold text-sm mb-2">Program Overview</h2>
          <div className="space-y-2 text-white/80 text-sm">
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500 flex-shrink-0">
                Little Lakers
              </span>
              <p className="text-xs">Ages 4-5. Introduction to basketball through fun, movement-based activities. Focus on coordination, teamwork, and enjoyment.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-lime-500/20 text-lime-300 border border-lime-500 flex-shrink-0">
                Lakers Ready
              </span>
              <p className="text-xs">Ages 6-7. Building on foundations with basic basketball skills, simple game concepts, and guided play.</p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          <Section title="Getting Started" icon={Star} defaultOpen>
            <p>As a youth coach you have access to your assigned program sessions from the dashboard.</p>
            <Step number="1" text="Log in with your coach credentials." />
            <Step number="2" text="Navigate to Youth Programs from your dashboard or the menu." />
            <Step number="3" text="Select the program you are coaching (Little Lakers or Lakers Ready)." />
            <Step number="4" text="You will see the term schedule with all session dates and plans." />
          </Section>

          <Section title="Session Plans" icon={ClipboardList} defaultOpen>
            <p>Each session comes with a structured plan. Here is the typical session format:</p>
            <div className="space-y-2 mt-2">
              <div className="bg-[#0a3d2e] rounded-lg p-3 border border-[#1a8a68]/50">
                <h4 className="text-[#4ade80] font-semibold text-xs mb-1">Warm-Up (10 min)</h4>
                <p className="text-xs">Fun movement games to get kids active and engaged. Tag games, animal walks, relay races.</p>
              </div>
              <div className="bg-[#0a3d2e] rounded-lg p-3 border border-[#1a8a68]/50">
                <h4 className="text-[#4ade80] font-semibold text-xs mb-1">Skill Focus (15 min)</h4>
                <p className="text-xs">Age-appropriate basketball skill activity. Keep instructions short and demonstrations clear.</p>
              </div>
              <div className="bg-[#0a3d2e] rounded-lg p-3 border border-[#1a8a68]/50">
                <h4 className="text-[#4ade80] font-semibold text-xs mb-1">Game Time (15 min)</h4>
                <p className="text-xs">Modified games that reinforce the session skill. Small-sided, lots of touches for every child.</p>
              </div>
              <div className="bg-[#0a3d2e] rounded-lg p-3 border border-[#1a8a68]/50">
                <h4 className="text-[#4ade80] font-semibold text-xs mb-1">Cool Down (5 min)</h4>
                <p className="text-xs">Stretching, high-fives, and a positive summary of what they learned today.</p>
              </div>
            </div>
          </Section>

          <Section title="Taking Attendance" icon={Users}>
            <Step number="1" text="Open the session for the current date." />
            <Step number="2" text="Tap each child's name to mark them as present." />
            <Step number="3" text="Attendance saves automatically. Absent children remain unchecked." />
            <p className="text-[#4ade80] text-xs mt-1">
              Consistent attendance records help the club track participation and identify children who may need follow-up.
            </p>
          </Section>

          <Section title="Milestone Tracking" icon={Award}>
            <p>Track developmental milestones for each child throughout the term.</p>
            <div className="space-y-2 mt-2">
              <div className="bg-[#0a3d2e] rounded-lg p-3 border border-[#1a8a68]/50">
                <h4 className="text-[#4ade80] font-semibold text-xs">Little Lakers Milestones</h4>
                <ul className="text-xs mt-1 space-y-1 list-disc list-inside text-white/70">
                  <li>Can catch a bounced ball</li>
                  <li>Can dribble standing still</li>
                  <li>Understands taking turns</li>
                  <li>Follows simple instructions</li>
                  <li>Shows sportsmanship</li>
                </ul>
              </div>
              <div className="bg-[#0a3d2e] rounded-lg p-3 border border-[#1a8a68]/50">
                <h4 className="text-[#4ade80] font-semibold text-xs">Lakers Ready Milestones</h4>
                <ul className="text-xs mt-1 space-y-1 list-disc list-inside text-white/70">
                  <li>Can dribble while moving</li>
                  <li>Chest pass to a partner</li>
                  <li>Basic defensive stance</li>
                  <li>Understands simple plays</li>
                  <li>Shows teamwork and encouragement</li>
                </ul>
              </div>
            </div>
            <p className="text-xs mt-1">Tick off milestones as you observe them. Progress carries over between sessions.</p>
          </Section>

          <Section title="Managing Your Schedule" icon={Calendar}>
            <p>Your program schedule shows all sessions for the current term.</p>
            <div className="space-y-2 mt-1">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5" />
                <p className="text-xs"><strong className="text-white">Upcoming sessions</strong> are highlighted with date, time, and venue details.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5" />
                <p className="text-xs"><strong className="text-white">Past sessions</strong> show attendance numbers and completion status.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5" />
                <p className="text-xs"><strong className="text-white">Session notes</strong> let you record observations for the coordinator.</p>
              </div>
            </div>
          </Section>

          <Section title="Parent Communication" icon={MessageSquare}>
            <p>Parents receive automatic notifications from the system. As a coach, here is how you can help:</p>
            <div className="space-y-2.5 mt-1">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5" />
                <p className="text-xs"><strong className="text-white">Session reminders</strong> are sent automatically 24 hours before each session.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5" />
                <p className="text-xs"><strong className="text-white">Milestone achievements</strong> notify parents when their child reaches a new milestone.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5" />
                <p className="text-xs"><strong className="text-white">End-of-term reports</strong> are generated from milestone data and shared with parents.</p>
              </div>
            </div>
            <p className="text-xs mt-1">
              If parents have questions at the session, encourage them to check the app for schedules and progress, or contact the coordinator.
            </p>
          </Section>
        </div>

        {/* Need Help */}
        <div className="mt-6 bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4 text-center">
          <p className="text-white/60 text-xs">
            Need help? Contact your program coordinator or email{' '}
            <span className="text-[#4ade80]">admin@emeraldlakers.com</span>
          </p>
        </div>

        <div className="h-8" />
      </main>
    </div>
  );
};

export default LittleLakersGuide;
