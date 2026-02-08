import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Star,
  Save,
  Users,
  Lightbulb,
  CheckCircle2,
  Smartphone,
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

const AssessorGuide = () => {
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
            <ClipboardCheck className="w-7 h-7 text-[#4ade80]" />
          </div>
          <h1 className="text-white text-xl font-bold">Tryout Assessor Guide</h1>
          <p className="text-[#4ade80] text-sm mt-1">Quick reference for evaluating players</p>
        </div>

        {/* Quick Overview Card */}
        <div className="bg-violet-500/10 border border-violet-500/50 rounded-xl p-4 mb-4">
          <h2 className="text-violet-300 font-semibold text-sm mb-2">Your Role</h2>
          <p className="text-white/80 text-sm">
            As an assessor you evaluate players across 5 skill areas on a 1-5 scale.
            Your scores help coaches place players into the right team for the season.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          <Section title="Accessing Your Sessions" icon={Smartphone} defaultOpen>
            <p>When you log in you will see your Assessor Dashboard with all sessions assigned to you.</p>
            <Step number="1" text="Log in with the email and password provided by the club." />
            <Step number="2" text="You will be taken directly to your Assessor Dashboard." />
            <Step number="3" text="Tap on a session card to open the evaluation screen." />
            <p className="text-[#4ade80] text-xs">
              Each session shows the age group, date, time, venue, and number of players.
            </p>
          </Section>

          <Section title="The 5 Evaluation Metrics" icon={Star} defaultOpen>
            <p>Rate each player from 1 (lowest) to 5 (highest) in these areas:</p>

            <div className="space-y-2.5 mt-2">
              <div className="bg-[#0a3d2e] rounded-lg p-3 border border-[#1a8a68]/50">
                <h4 className="text-[#4ade80] font-semibold text-xs mb-1">1. Athleticism</h4>
                <p className="text-xs">Speed, agility, coordination, and jumping ability.</p>
              </div>
              <div className="bg-[#0a3d2e] rounded-lg p-3 border border-[#1a8a68]/50">
                <h4 className="text-[#4ade80] font-semibold text-xs mb-1">2. Ball Skills</h4>
                <p className="text-xs">Dribbling, passing, catching, and shooting form.</p>
              </div>
              <div className="bg-[#0a3d2e] rounded-lg p-3 border border-[#1a8a68]/50">
                <h4 className="text-[#4ade80] font-semibold text-xs mb-1">3. Game IQ</h4>
                <p className="text-xs">Court awareness, decision making, and positioning.</p>
              </div>
              <div className="bg-[#0a3d2e] rounded-lg p-3 border border-[#1a8a68]/50">
                <h4 className="text-[#4ade80] font-semibold text-xs mb-1">4. Coachability</h4>
                <p className="text-xs">Listens to instructions, applies feedback, positive attitude.</p>
              </div>
              <div className="bg-[#0a3d2e] rounded-lg p-3 border border-[#1a8a68]/50">
                <h4 className="text-[#4ade80] font-semibold text-xs mb-1">5. Effort / Hustle</h4>
                <p className="text-xs">Work rate, intensity, and determination. Never gives up.</p>
              </div>
            </div>

            <div className="bg-[#1a8a68]/30 rounded-lg p-3 mt-2">
              <p className="text-xs text-white/90">
                <strong className="text-[#4ade80]">Score guide:</strong>{' '}
                1 = Well below average&ensp; 2 = Below average&ensp; 3 = Average&ensp; 4 = Above average&ensp; 5 = Outstanding
              </p>
            </div>
          </Section>

          <Section title="How to Evaluate a Player" icon={Users}>
            <Step number="1" text="Open your assigned session from the dashboard." />
            <Step number="2" text="Find the player in the list, or use search to filter by name or number." />
            <Step number="3" text="Tap on a player to open their evaluation card." />
            <Step number="4" text="Tap the 1-5 score buttons for each of the 5 metrics." />
            <Step number="5" text="Add an optional comment in the notes field for anything notable." />
            <Step number="6" text="Move to the next player. Your scores save automatically." />
          </Section>

          <Section title="Saving Your Work" icon={Save}>
            <p>
              Scores are saved automatically as you tap each rating. You do not need to press a separate save button.
            </p>
            <div className="bg-[#0a3d2e] rounded-lg p-3 border border-[#1a8a68]/50">
              <p className="text-xs">
                <strong className="text-[#4ade80]">Works offline too:</strong> If you lose internet connection during a session, your scores are stored on your device and will sync when you reconnect.
              </p>
            </div>
            <p>
              You can return to a session later and update any scores before the session is closed by an admin.
            </p>
          </Section>

          <Section title="Two-Stage Tryout Sessions" icon={ClipboardCheck}>
            <p>Some age groups run a two-stage tryout:</p>
            <div className="space-y-2 mt-1">
              <div className="flex items-start gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-500 flex-shrink-0">
                  Hour 1
                </span>
                <p className="text-xs">Development session for newer players and Team 3. Focus on fundamentals.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500 flex-shrink-0">
                  Hour 2
                </span>
                <p className="text-xs">Advanced session for Team 1 & 2 and promoted players. More game-based evaluation.</p>
              </div>
            </div>
            <p className="mt-1">
              Each hour is a separate session on your dashboard. Evaluate all players in each session independently.
            </p>
          </Section>

          <Section title="Tips for Good Evaluations" icon={Lightbulb}>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5" />
                <p className="text-xs"><strong className="text-white">Be consistent.</strong> Use the same standard for every player in the group. Compare players within the age group, not against older players.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5" />
                <p className="text-xs"><strong className="text-white">Use the full scale.</strong> Avoid giving everyone 3s. Spread your scores from 1-5 so coaches can see real differences.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5" />
                <p className="text-xs"><strong className="text-white">Add notes for standouts.</strong> If a player is particularly impressive or has areas of concern, note it. These comments help coaches make final decisions.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5" />
                <p className="text-xs"><strong className="text-white">Watch during drills AND games.</strong> Some players look different in structured drills versus live play. Consider both.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5" />
                <p className="text-xs"><strong className="text-white">Stay objective.</strong> Score what you see on the day, not what you know about the player from previous seasons.</p>
              </div>
            </div>
          </Section>
        </div>

        {/* Need Help */}
        <div className="mt-6 bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4 text-center">
          <p className="text-white/60 text-xs">
            Having trouble? Contact the club coordinator who assigned you or email{' '}
            <span className="text-[#4ade80]">admin@emeraldlakers.com</span>
          </p>
        </div>

        <div className="h-8" />
      </main>
    </div>
  );
};

export default AssessorGuide;
