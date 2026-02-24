import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFilteredData } from '../hooks/useFilteredData';
import {
  CircleDot,
  Target,
  Crosshair,
  Footprints,
  Shield,
  Move,
  Users,
  Brain,
  Award,
  ClipboardList
} from 'lucide-react';
import SkillCard from '../components/SkillCard';
import SkillDetailModal from '../components/SkillDetailModal';
import Breadcrumb from '../components/Breadcrumb';

// Skill category definitions (icons, descriptions, level definitions)
const skillCategories = [
  {
    id: 'ball-handling',
    name: 'Ball Handling',
    icon: CircleDot,
    description: 'The ability to control the basketball while stationary and moving. Includes dribbling with both hands, protecting the ball, and changing speeds and directions while maintaining control.',
    levelDefinitions: {
      1: 'Can dribble stationary with dominant hand. Learning basic control and keeping eyes up.',
      2: 'Can dribble while moving with both hands. Working on crossovers and speed changes.',
      3: 'Confident handling in game situations. Can use moves to beat defenders consistently.',
      4: 'Elite ball handler who can teach others. Creates opportunities and rarely turns the ball over.'
    }
  },
  {
    id: 'passing-receiving',
    name: 'Passing & Receiving',
    icon: Target,
    description: 'The ability to accurately pass the ball to teammates and receive passes under pressure. Includes chest passes, bounce passes, overhead passes, and catching in traffic.',
    levelDefinitions: {
      1: 'Can make basic chest and bounce passes. Learning to receive with two hands.',
      2: 'Passes with good accuracy in practice. Working on passing while moving.',
      3: 'Makes smart passes in games. Good court vision and can find open teammates.',
      4: 'Elite passer who creates scoring opportunities. Can execute advanced passes under pressure.'
    }
  },
  {
    id: 'shooting',
    name: 'Shooting',
    icon: Crosshair,
    description: 'The ability to score from various positions on the court. Includes layups, mid-range shots, free throws, and three-pointers with proper form and consistency.',
    levelDefinitions: {
      1: 'Learning proper shooting form. Can make layups and close-range shots.',
      2: 'Developing consistent form. Working on mid-range shots and free throws.',
      3: 'Reliable shooter in games. Good form and can score from multiple spots.',
      4: 'Elite scorer who can shoot from anywhere. Consistent under pressure and can teach form.'
    }
  },
  {
    id: 'footwork',
    name: 'Footwork',
    icon: Footprints,
    description: 'The foundation of all basketball movements. Includes pivoting, jump stops, defensive slides, cutting, and maintaining proper balance and body position.',
    levelDefinitions: {
      1: 'Learning basic stances and stops. Working on balance and pivot foot awareness.',
      2: 'Can execute pivots and jump stops. Developing defensive slide technique.',
      3: 'Quick and balanced footwork in games. Good at creating space with feet.',
      4: 'Elite footwork that creates advantages. Can teach proper technique to others.'
    }
  },
  {
    id: 'defense',
    name: 'Defense',
    icon: Shield,
    description: 'The ability to prevent opponents from scoring. Includes on-ball defense, help defense, rebounding, and understanding defensive rotations and principles.',
    levelDefinitions: {
      1: 'Learning defensive stance and positioning. Working on staying between player and basket.',
      2: 'Can guard players one-on-one. Developing help defense awareness.',
      3: 'Strong defender who communicates. Good at anticipating and contesting shots.',
      4: 'Elite defender who leads the team. Can guard multiple positions and teach defense.'
    }
  },
  {
    id: 'off-ball-movement',
    name: 'Off-Ball Movement',
    icon: Move,
    description: 'Movement without the ball to create scoring opportunities. Includes cutting, screening, spacing, and reading the defense to get open.',
    levelDefinitions: {
      1: 'Learning to move without the ball. Understanding basic spacing concepts.',
      2: 'Can make purposeful cuts. Working on timing and reading defenders.',
      3: 'Creates opportunities with movement. Good at using screens and finding gaps.',
      4: 'Elite off-ball player who is always dangerous. Can teach movement concepts.'
    }
  },
  {
    id: 'team-play',
    name: 'Team Play / Game Concepts',
    icon: Users,
    description: 'Understanding of team basketball concepts. Includes pick and roll, fast breaks, zone defense, offensive sets, and playing within the team system.',
    levelDefinitions: {
      1: 'Learning basic team concepts. Understanding positions and simple plays.',
      2: 'Can execute basic plays. Working on reading situations and making adjustments.',
      3: 'Understands team basketball well. Makes smart decisions that help the team.',
      4: 'Floor general who leads the team. Can teach concepts and run the offense/defense.'
    }
  },
  {
    id: 'basketball-iq',
    name: 'Basketball IQ',
    icon: Brain,
    description: 'The mental aspect of basketball. Includes reading the game, making quick decisions, understanding situations, and anticipating what will happen next.',
    levelDefinitions: {
      1: 'Learning to read the game. Working on basic decision making.',
      2: 'Shows good awareness. Making better decisions but still learning.',
      3: 'High basketball IQ. Anticipates plays and makes smart choices consistently.',
      4: 'Elite basketball mind. Sees the game at a higher level and can coach others.'
    }
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
  const { playerId: paramPlayerId } = useParams();
  const { userProfile, currentUser, players, evaluations } = useFilteredData();
  const [selectedSkill, setSelectedSkill] = useState(null);

  // Get the player record - support URL param, player's own profile, or parent's linked child
  const playerData = useMemo(() => {
    if (paramPlayerId) {
      return players.find(p => p.id === paramPlayerId) || {};
    }
    if (userProfile?.playerId) {
      return players.find(p => p.id === userProfile.playerId) || {};
    }
    if (userProfile?.role === 'parent' && players.length > 0) {
      return players[0];
    }
    return {};
  }, [players, userProfile, paramPlayerId]);

  // Build skills data from real Firestore evaluations
  const skillsData = useMemo(() => {
    if (!playerData.id) return [];

    // Get all evaluations for this player, grouped by skill
    const playerEvals = Object.values(evaluations).filter(e => e.playerId === playerData.id);

    if (playerEvals.length === 0) return [];

    // Group evaluations by skill ID
    const evalsBySkill = {};
    playerEvals.forEach(ev => {
      const skillId = ev.skillId;
      if (!skillId) return;
      if (!evalsBySkill[skillId]) evalsBySkill[skillId] = [];
      evalsBySkill[skillId].push(ev);
    });

    // Build enriched skill objects from the category definitions
    return skillCategories.map(category => {
      const skillEvals = (evalsBySkill[category.id] || [])
        .sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateB - dateA;
        });

      const latestEval = skillEvals[0];
      const currentLevel = latestEval?.level || 0;

      // Format assessment history for the detail modal
      const assessmentHistory = skillEvals.map(ev => {
        const evalDate = ev.date?.toDate ? ev.date.toDate() : new Date(ev.date);
        return {
          date: evalDate.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' }),
          level: ev.level || 0,
          coach: ev.coachName || 'Coach',
          notes: ev.skillNotes || ev.generalNotes || ''
        };
      });

      // Format the last assessment date
      let lastAssessment = null;
      if (latestEval?.date) {
        const d = latestEval.date?.toDate ? latestEval.date.toDate() : new Date(latestEval.date);
        lastAssessment = d.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
      }

      return {
        ...category,
        level: currentLevel,
        lastAssessment,
        coachNotes: latestEval?.skillNotes || latestEval?.generalNotes || '',
        assessmentHistory
      };
    }).filter(skill => skill.level > 0 || skill.assessmentHistory.length > 0);
  }, [playerData.id, evaluations]);

  // Calculate overall progress (only when we have data)
  const hasData = skillsData.length > 0;
  const totalLevels = hasData ? skillsData.reduce((sum, skill) => sum + skill.level, 0) : 0;
  const maxLevels = hasData ? skillsData.length * 4 : 1;
  const overallProgress = hasData ? Math.round((totalLevels / maxLevels) * 100) : 0;

  // Get average level
  const averageLevel = hasData ? Math.round(totalLevels / skillsData.length) : 0;

  const handleSkillClick = (skill) => {
    setSelectedSkill(skill);
  };

  const handleCloseModal = () => {
    setSelectedSkill(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F9F5]">
      {/* Header */}
      <div className="bg-white border-b border-[#D4E4D4]">
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
            <div className="w-16 h-16 bg-[#F5F9F5] border-2 border-[#D4E4D4] rounded-full flex items-center justify-center">
              <Award className="w-8 h-8 text-[#00A651]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Skills Passport</h1>
              <p className="text-[#00A651] mt-1">
                {playerData.name || playerData.displayName || 'Player'}{playerData.ageGroup ? ` • ${playerData.ageGroup}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Progress Section */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {hasData ? (
          <>
            <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-gray-800 font-semibold">Overall Progress</h2>
                  <p className="text-[#00A651] text-sm">Average Level: {levelLabels[averageLevel] || 'Not assessed'}</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-gray-800">{overallProgress}%</span>
                  <p className="text-[#6B7C6B] text-xs">Complete</p>
                </div>
              </div>

              {/* Overall Progress Bar */}
              <div className="h-4 bg-[#F5F9F5] rounded-full border border-[#D4E4D4] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#005028] via-[#00A651] to-[#00A651] rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>

              {/* Level Legend */}
              <div className="flex justify-between mt-4 gap-2">
                {[1, 2, 3, 4].map((level) => (
                  <div key={level} className="flex-1 text-center">
                    <div className={`h-2 rounded-full mb-1 ${
                      level === 1 ? 'bg-[#D4E4D4]' :
                      level === 2 ? 'bg-[#005028]' :
                      level === 3 ? 'bg-[#00A651]' :
                      'bg-[#86efac]'
                    }`} />
                    <p className="text-[10px] text-[#6B7C6B]">{levelLabels[level]}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Grid */}
            <div className="mb-4">
              <h2 className="text-gray-800 font-semibold mb-1">Skill Categories</h2>
              <p className="text-[#6B7C6B] text-sm">Tap a skill to view details</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8">
              {skillsData.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onClick={() => handleSkillClick(skill)}
                />
              ))}
            </div>
          </>
        ) : (
          /* Empty state when no skills data is available */
          <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-8 mb-6 text-center">
            <div className="w-16 h-16 bg-[#F5F9F5] border-2 border-[#D4E4D4] rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-[#6B7C6B]" />
            </div>
            <h2 className="text-gray-800 font-semibold text-lg mb-2">No skills data available yet</h2>
            <p className="text-[#6B7C6B] text-sm max-w-md mx-auto">
              Your Skills Passport will be populated once your coaches complete skill assessments.
              Check back after your next training session or evaluation.
            </p>
          </div>
        )}

        {/* Info Footer */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-4 mb-8">
          <h3 className="text-gray-800 font-medium text-sm mb-2">About Skill Levels</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#D4E4D4]" />
              <span className="text-[#6B7C6B] font-medium w-28">Emerging (1)</span>
              <span className="text-gray-800 opacity-80">Just starting to learn the skill</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#005028]" />
              <span className="text-[#00A651] font-medium w-28">Developing (2)</span>
              <span className="text-gray-800 opacity-80">Building consistency</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#00A651]" />
              <span className="text-[#00A651] font-medium w-28">Competent (3)</span>
              <span className="text-gray-800 opacity-80">Reliable in game situations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#86efac]" />
              <span className="text-[#86efac] font-medium w-28">Confident Leader (4)</span>
              <span className="text-gray-800 opacity-80">Can teach others</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-[#D4E4D4]">
        <p className="text-[#6B7C6B] text-xs">Emerald Lakers Skills Passport</p>
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
