import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PageShell from '../../components/PageShell';
import {
  HelpCircle,
  BookOpen,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Users,
  Shield,
  Star,
  Key,
  UserPlus,
  BarChart3,
  Calendar,
  Mail
} from 'lucide-react';

const FAQItem = ({ question, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#1a8a68]/50 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="text-white text-sm font-medium pr-4">{question}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[#4ade80] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#4ade80] flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="pb-3 text-white/70 text-sm leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
};

const GuideCard = ({ title, description, icon: Icon, path, badgeColor }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className="w-full bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4 text-left hover:border-[#22c55e] transition-all active:scale-[0.98] group"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${badgeColor || 'bg-[#1a8a68]/50'}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          <p className="text-white/60 text-xs mt-0.5">{description}</p>
        </div>
      </div>
    </button>
  );
};

const HelpCenter = () => {
  const { userProfile } = useAuth();
  const role = userProfile?.role;

  return (
    <PageShell
      title="Help Center"
      subtitle="Guides, FAQs, and support"
      backTo={role === 'tryout_assessor' ? '/assessor' : '/welcome'}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Guides Section */}
        <div>
          <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#4ade80]" />
            Guides
          </h2>
          <div className="space-y-2">
            <GuideCard
              title="Tryout Assessor Guide"
              description="How to evaluate players during tryout sessions"
              icon={ClipboardCheck}
              path="/help/assessor-guide"
              badgeColor="bg-violet-500/30"
            />
            <GuideCard
              title="Little Lakers & Lakers Ready"
              description="Youth coach guide for running sessions"
              icon={Star}
              path="/help/little-lakers-guide"
              badgeColor="bg-amber-500/30"
            />
          </div>
        </div>

        {/* Getting Started */}
        <div>
          <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#4ade80]" />
            Getting Started
          </h2>
          <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4 space-y-3 text-sm text-white/80">
            <p>Welcome to the Emerald Lakers Basketball Club app. Here is a quick overview based on your role:</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs"><strong className="text-white">Admin / President / VP:</strong> Full access to all features including user management, tryout sessions, analytics, and club settings.</p>
              </div>
              <div className="flex items-start gap-2">
                <BarChart3 className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs"><strong className="text-white">Coordinators:</strong> Manage tryout sessions and assign assessors for your program (Girls or Boys). View tryout results and analytics.</p>
              </div>
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs"><strong className="text-white">Coaches:</strong> Access your team dashboard, run training sessions, do match-day assessments, and evaluate players during tryouts.</p>
              </div>
              <div className="flex items-start gap-2">
                <ClipboardCheck className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs"><strong className="text-white">Tryout Assessors:</strong> Evaluate players in your assigned sessions. See the Assessor Guide above for details.</p>
              </div>
              <div className="flex items-start gap-2">
                <Star className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs"><strong className="text-white">Players:</strong> View your profile, team info, skills passport, and training programs.</p>
              </div>
              <div className="flex items-start gap-2">
                <UserPlus className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs"><strong className="text-white">Parents:</strong> Track your child's progress, view schedules, and receive club notifications.</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#4ade80]" />
            Frequently Asked Questions
          </h2>
          <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl px-4">
            <FAQItem question="How do I reset my password?">
              <p>On the login screen, tap "Forgot Password" and enter your email address. You will receive a reset link. If you do not see the email, check your spam folder. Contact an admin if you still need help.</p>
            </FAQItem>

            <FAQItem question="How do parents access the app?">
              <p>Parents need an invitation from an admin or coach. Once invited, they sign up with their email and are linked to their child's profile. They can view progress, schedules, and notifications.</p>
            </FAQItem>

            <FAQItem question="How do tryout sessions work?">
              <p>Admins and coordinators create tryout sessions for each age group. Assessors are assigned to sessions and evaluate players on 5 metrics (Athleticism, Ball Skills, Game IQ, Coachability, Effort) using a 1-5 scale. Results are aggregated across all assessors to help coaches make team selections.</p>
            </FAQItem>

            <FAQItem question="How do I manage players on my team?">
              <p>Coaches can view their team roster from the Coach Dashboard. Admins can add or remove players from teams via the Roster Management page in the Admin Portal.</p>
            </FAQItem>

            <FAQItem question="What are the different roles in the system?">
              <p>
                The system has 12 roles: Administrator, President, Vice President, Girls Coordinator, Boys Coordinator, Youth Head Coach, Coach, Youth Coach, Tryout Assessor, Team Manager, Player, and Parent. Each role has specific permissions. Admins, the President, and VP have full access. Coordinators manage tryout evaluations. Coaches handle teams and assessments. Assessors only access their assigned tryout sessions.
              </p>
            </FAQItem>

            <FAQItem question="Can I use the app offline?">
              <p>Yes. The app works offline for most features. Data you enter while offline (scores, attendance, etc.) is stored on your device and syncs automatically when you reconnect to the internet.</p>
            </FAQItem>

            <FAQItem question="How do I view tryout results?">
              <p>Tryout results are available to Admins, President, VP, Coordinators, and Youth Head Coaches. Navigate to Tryout Results from the Admin Dashboard to see aggregated scores, player comparisons, and sorting by individual metrics.</p>
            </FAQItem>

            <FAQItem question="How are notifications sent?">
              <p>Notifications appear in the bell icon in the top navigation bar. They include session reminders, tryout assignments, milestone achievements, and club announcements. You can manage your notification preferences from your profile.</p>
            </FAQItem>
          </div>
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

export default HelpCenter;
