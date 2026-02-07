import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  CircleDot,
  Target,
  Crosshair,
  Footprints,
  Shield,
  Move,
  Users,
  Brain,
  Award
} from 'lucide-react';
import SkillCard from '../components/SkillCard';
import SkillDetailModal from '../components/SkillDetailModal';
import Breadcrumb from '../components/Breadcrumb';

// Enhanced sample/placeholder data - will connect to Firestore later
const sampleSkillsData = [
  {
    id: 'ball-handling',
    name: 'Ball Handling',
    icon: CircleDot,
    level: 2,
    lastAssessment: 'Jan 15, 2026',
    coachNotes: 'Good progress on crossovers. Work on weak hand dribbling.',
    description: 'The ability to control the basketball while stationary and moving. Includes dribbling with both hands, protecting the ball, and changing speeds and directions while maintaining control.',
    levelDefinitions: {
      1: 'Can dribble stationary with dominant hand. Learning basic control and keeping eyes up.',
      2: 'Can dribble while moving with both hands. Working on crossovers and speed changes.',
      3: 'Confident handling in game situations. Can use moves to beat defenders consistently.',
      4: 'Elite ball handler who can teach others. Creates opportunities and rarely turns the ball over.'
    },
    assessmentHistory: [
      { date: 'Jan 15, 2026', level: 2, coach: 'Coach Mike', notes: 'Good progress on crossovers. Work on weak hand dribbling. Keep practicing the between-the-legs move.' },
      { date: 'Dec 10, 2025', level: 2, coach: 'Coach Sarah', notes: 'Showing improvement with left hand. Need to work on keeping head up while dribbling.' },
      { date: 'Nov 5, 2025', level: 1, coach: 'Coach Mike', notes: 'Strong start with basics. Focus on stationary dribbling drills before moving.' },
      { date: 'Oct 1, 2025', level: 1, coach: 'Coach Mike', notes: 'Initial assessment - has good potential. Building foundation skills.' }
    ]
  },
  {
    id: 'passing-receiving',
    name: 'Passing & Receiving',
    icon: Target,
    level: 3,
    lastAssessment: 'Jan 20, 2026',
    coachNotes: 'Excellent court vision. Chest passes are strong.',
    description: 'The ability to accurately pass the ball to teammates and receive passes under pressure. Includes chest passes, bounce passes, overhead passes, and catching in traffic.',
    levelDefinitions: {
      1: 'Can make basic chest and bounce passes. Learning to receive with two hands.',
      2: 'Passes with good accuracy in practice. Working on passing while moving.',
      3: 'Makes smart passes in games. Good court vision and can find open teammates.',
      4: 'Elite passer who creates scoring opportunities. Can execute advanced passes under pressure.'
    },
    assessmentHistory: [
      { date: 'Jan 20, 2026', level: 3, coach: 'Coach Sarah', notes: 'Excellent court vision. Chest passes are strong. Ready to work on no-look passes.' },
      { date: 'Dec 15, 2025', level: 3, coach: 'Coach Mike', notes: 'Great improvement! Making smart decisions with the ball.' },
      { date: 'Nov 12, 2025', level: 2, coach: 'Coach Sarah', notes: 'Good progress on bounce passes. Keep working on passing on the move.' },
      { date: 'Oct 8, 2025', level: 2, coach: 'Coach Mike', notes: 'Solid fundamentals in place. Focus on reading the defense.' }
    ]
  },
  {
    id: 'shooting',
    name: 'Shooting',
    icon: Crosshair,
    level: 2,
    lastAssessment: 'Jan 18, 2026',
    coachNotes: 'Form is improving. Focus on follow-through consistency.',
    description: 'The ability to score from various positions on the court. Includes layups, mid-range shots, free throws, and three-pointers with proper form and consistency.',
    levelDefinitions: {
      1: 'Learning proper shooting form. Can make layups and close-range shots.',
      2: 'Developing consistent form. Working on mid-range shots and free throws.',
      3: 'Reliable shooter in games. Good form and can score from multiple spots.',
      4: 'Elite scorer who can shoot from anywhere. Consistent under pressure and can teach form.'
    },
    assessmentHistory: [
      { date: 'Jan 18, 2026', level: 2, coach: 'Coach Mike', notes: 'Form is improving. Focus on follow-through consistency. 65% on layups.' },
      { date: 'Dec 20, 2025', level: 2, coach: 'Coach Sarah', notes: 'Good elbow alignment. Work on balance before the shot.' },
      { date: 'Nov 15, 2025', level: 1, coach: 'Coach Mike', notes: 'Form is developing well. Keep working on the BEEF method.' },
      { date: 'Oct 10, 2025', level: 1, coach: 'Coach Mike', notes: 'Initial assessment - learning fundamentals. Good attitude.' }
    ]
  },
  {
    id: 'footwork',
    name: 'Footwork',
    icon: Footprints,
    level: 2,
    lastAssessment: 'Jan 12, 2026',
    coachNotes: 'Pivot work needs attention. Good defensive stance.',
    description: 'The foundation of all basketball movements. Includes pivoting, jump stops, defensive slides, cutting, and maintaining proper balance and body position.',
    levelDefinitions: {
      1: 'Learning basic stances and stops. Working on balance and pivot foot awareness.',
      2: 'Can execute pivots and jump stops. Developing defensive slide technique.',
      3: 'Quick and balanced footwork in games. Good at creating space with feet.',
      4: 'Elite footwork that creates advantages. Can teach proper technique to others.'
    },
    assessmentHistory: [
      { date: 'Jan 12, 2026', level: 2, coach: 'Coach Sarah', notes: 'Pivot work needs attention. Good defensive stance. Keep low!' },
      { date: 'Dec 8, 2025', level: 2, coach: 'Coach Mike', notes: 'Jump stops are solid. Focus on not traveling during pivots.' },
      { date: 'Nov 3, 2025', level: 1, coach: 'Coach Sarah', notes: 'Good progress on stance. Work on staying balanced.' },
      { date: 'Oct 5, 2025', level: 1, coach: 'Coach Mike', notes: 'Starting with basics. Has good athletic foundation.' }
    ]
  },
  {
    id: 'defense',
    name: 'Defense',
    icon: Shield,
    level: 3,
    lastAssessment: 'Jan 22, 2026',
    coachNotes: 'Great effort and positioning. Keep working on lateral speed.',
    description: 'The ability to prevent opponents from scoring. Includes on-ball defense, help defense, rebounding, and understanding defensive rotations and principles.',
    levelDefinitions: {
      1: 'Learning defensive stance and positioning. Working on staying between player and basket.',
      2: 'Can guard players one-on-one. Developing help defense awareness.',
      3: 'Strong defender who communicates. Good at anticipating and contesting shots.',
      4: 'Elite defender who leads the team. Can guard multiple positions and teach defense.'
    },
    assessmentHistory: [
      { date: 'Jan 22, 2026', level: 3, coach: 'Coach Mike', notes: 'Great effort and positioning. Keep working on lateral speed. Excellent communication!' },
      { date: 'Dec 18, 2025', level: 3, coach: 'Coach Sarah', notes: 'Promoted to level 3! Outstanding effort and improvement.' },
      { date: 'Nov 20, 2025', level: 2, coach: 'Coach Mike', notes: 'Help defense improving. Stay vocal on the court.' },
      { date: 'Oct 15, 2025', level: 2, coach: 'Coach Sarah', notes: 'Good stance and effort. Work on not reaching.' }
    ]
  },
  {
    id: 'off-ball-movement',
    name: 'Off-Ball Movement',
    icon: Move,
    level: 1,
    lastAssessment: 'Jan 10, 2026',
    coachNotes: 'Learning to cut and find open spaces. Keep practicing!',
    description: 'Movement without the ball to create scoring opportunities. Includes cutting, screening, spacing, and reading the defense to get open.',
    levelDefinitions: {
      1: 'Learning to move without the ball. Understanding basic spacing concepts.',
      2: 'Can make purposeful cuts. Working on timing and reading defenders.',
      3: 'Creates opportunities with movement. Good at using screens and finding gaps.',
      4: 'Elite off-ball player who is always dangerous. Can teach movement concepts.'
    },
    assessmentHistory: [
      { date: 'Jan 10, 2026', level: 1, coach: 'Coach Sarah', notes: 'Learning to cut and find open spaces. Keep practicing! Focus on V-cuts.' },
      { date: 'Dec 5, 2025', level: 1, coach: 'Coach Mike', notes: 'Understanding spacing better. Needs to move with more purpose.' },
      { date: 'Nov 1, 2025', level: 1, coach: 'Coach Sarah', notes: 'Initial work on off-ball movement. Tends to stand still - keep moving!' }
    ]
  },
  {
    id: 'team-play',
    name: 'Team Play / Game Concepts',
    icon: Users,
    level: 2,
    lastAssessment: 'Jan 25, 2026',
    coachNotes: 'Understanding spacing better. Good communication on court.',
    description: 'Understanding of team basketball concepts. Includes pick and roll, fast breaks, zone defense, offensive sets, and playing within the team system.',
    levelDefinitions: {
      1: 'Learning basic team concepts. Understanding positions and simple plays.',
      2: 'Can execute basic plays. Working on reading situations and making adjustments.',
      3: 'Understands team basketball well. Makes smart decisions that help the team.',
      4: 'Floor general who leads the team. Can teach concepts and run the offense/defense.'
    },
    assessmentHistory: [
      { date: 'Jan 25, 2026', level: 2, coach: 'Coach Mike', notes: 'Understanding spacing better. Good communication on court. Learning pick and roll.' },
      { date: 'Dec 22, 2025', level: 2, coach: 'Coach Sarah', notes: 'Good understanding of fast break. Work on half-court sets.' },
      { date: 'Nov 18, 2025', level: 1, coach: 'Coach Mike', notes: 'Learning positions well. Needs to understand why we run plays.' },
      { date: 'Oct 12, 2025', level: 1, coach: 'Coach Sarah', notes: 'Starting team concept training. Has good basketball instincts.' }
    ]
  },
  {
    id: 'basketball-iq',
    name: 'Basketball IQ',
    icon: Brain,
    level: 2,
    lastAssessment: 'Jan 20, 2026',
    coachNotes: 'Reading plays well. Decision making improving.',
    description: 'The mental aspect of basketball. Includes reading the game, making quick decisions, understanding situations, and anticipating what will happen next.',
    levelDefinitions: {
      1: 'Learning to read the game. Working on basic decision making.',
      2: 'Shows good awareness. Making better decisions but still learning.',
      3: 'High basketball IQ. Anticipates plays and makes smart choices consistently.',
      4: 'Elite basketball mind. Sees the game at a higher level and can coach others.'
    },
    assessmentHistory: [
      { date: 'Jan 20, 2026', level: 2, coach: 'Coach Sarah', notes: 'Reading plays well. Decision making improving. Ask more questions!' },
      { date: 'Dec 12, 2025', level: 2, coach: 'Coach Mike', notes: 'Good court awareness. Work on recognizing defensive schemes.' },
      { date: 'Nov 8, 2025', level: 1, coach: 'Coach Sarah', notes: 'Improving game understanding. Watches film which is great!' },
      { date: 'Oct 3, 2025', level: 1, coach: 'Coach Mike', notes: 'Initial assessment - shows good instincts. Needs game experience.' }
    ]
  }
];

const levelLabels = {
  1: 'Emerging',
  2: 'Developing',
  3: 'Competent',
  4: 'Confident Leader'
};

const SkillsPassportPage = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [selectedSkill, setSelectedSkill] = useState(null);

  // Calculate overall progress
  const totalLevels = sampleSkillsData.reduce((sum, skill) => sum + skill.level, 0);
  const maxLevels = sampleSkillsData.length * 4;
  const overallProgress = Math.round((totalLevels / maxLevels) * 100);

  // Get average level
  const averageLevel = Math.round(totalLevels / sampleSkillsData.length);

  const handleSkillClick = (skill) => {
    setSelectedSkill(skill);
  };

  const handleCloseModal = () => {
    setSelectedSkill(null);
  };

  return (
    <div className="min-h-screen bg-[#0a3d2e]">
      {/* Header */}
      <div className="bg-[#0d5943] border-b border-[#1a8a68]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Breadcrumb Navigation */}
          <Breadcrumb
            path={[
              { label: 'Home', url: '/welcome' },
              { label: 'My Skills Passport' }
            ]}
            className="mb-4"
          />

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#0a3d2e] border-2 border-[#1a8a68] rounded-full flex items-center justify-center">
              <Award className="w-8 h-8 text-[#4ade80]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Skills Passport</h1>
              <p className="text-[#4ade80] mt-1">
                {userProfile?.displayName || 'Player'} • {userProfile?.ageGroup || 'U12'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Progress Section */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white font-semibold">Overall Progress</h2>
              <p className="text-[#4ade80] text-sm">Average Level: {levelLabels[averageLevel]}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-white">{overallProgress}%</span>
              <p className="text-[#1a8a68] text-xs">Complete</p>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="h-4 bg-[#0a3d2e] rounded-full border border-[#1a8a68] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#1a8a68] via-[#22c55e] to-[#4ade80] rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          {/* Level Legend */}
          <div className="flex justify-between mt-4 gap-2">
            {[1, 2, 3, 4].map((level) => (
              <div key={level} className="flex-1 text-center">
                <div className={`h-2 rounded-full mb-1 ${
                  level === 1 ? 'bg-[#1a8a68]' :
                  level === 2 ? 'bg-[#22c55e]' :
                  level === 3 ? 'bg-[#4ade80]' :
                  'bg-[#86efac]'
                }`} />
                <p className="text-[10px] text-[#1a8a68]">{levelLabels[level]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Skills Grid */}
        <div className="mb-4">
          <h2 className="text-white font-semibold mb-1">Skill Categories</h2>
          <p className="text-[#1a8a68] text-sm">Tap a skill to view details</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8">
          {sampleSkillsData.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onClick={() => handleSkillClick(skill)}
            />
          ))}
        </div>

        {/* Info Footer */}
        <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4 mb-8">
          <h3 className="text-white font-medium text-sm mb-2">About Skill Levels</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#1a8a68]" />
              <span className="text-[#1a8a68] font-medium w-28">Emerging (1)</span>
              <span className="text-white opacity-80">Just starting to learn the skill</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
              <span className="text-[#22c55e] font-medium w-28">Developing (2)</span>
              <span className="text-white opacity-80">Building consistency</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#4ade80]" />
              <span className="text-[#4ade80] font-medium w-28">Competent (3)</span>
              <span className="text-white opacity-80">Reliable in game situations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#86efac]" />
              <span className="text-[#86efac] font-medium w-28">Confident Leader (4)</span>
              <span className="text-white opacity-80">Can teach others</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-[#1a8a68]">
        <p className="text-[#1a8a68] text-xs">Emerald Lakers Skills Passport</p>
      </footer>

      {/* Skill Detail Modal */}
      {selectedSkill && (
        <SkillDetailModal
          skill={selectedSkill}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default SkillsPassportPage;
