import React from 'react';
import { Hand, CircleDot, Target, Zap, Users, Trophy, Activity, Star, MessageCircle } from 'lucide-react';

const SKILL_MAP = {
  catching_throwing: { label: 'Catching & Throwing', icon: Hand, emoji: '\uD83E\uDD32' },
  dribbling: { label: 'Dribbling', icon: CircleDot, emoji: '\u26F9\uFE0F' },
  shooting_beginner: { label: 'Shooting (beginner)', icon: Target, emoji: '\uD83C\uDFAF' },
  movement_coordination: { label: 'Movement & Coordination', icon: Zap, emoji: '\uD83C\uDFC3' },
  teamwork: { label: 'Teamwork', icon: Users, emoji: '\uD83E\uDD1D' },
  game_play: { label: 'Game Play', icon: Trophy, emoji: '\uD83C\uDFC6' },
  balance_agility: { label: 'Balance & Agility', icon: Activity, emoji: '\uD83E\uDD38' },
};

const SessionSummaryCard = ({ summary, programConfig, showProgramName = false }) => {
  const sessionDate = summary.sessionDate?.toDate
    ? summary.sessionDate.toDate()
    : new Date(summary.sessionDate);

  const isLittleLakers = summary.programType === 'little_lakers';
  const accentBg = isLittleLakers ? 'bg-amber-50' : 'bg-emerald-50';
  const accentBorder = isLittleLakers ? 'border-amber-200' : 'border-emerald-200';
  const accentText = isLittleLakers ? 'text-amber-700' : 'text-emerald-700';
  const badgeBg = isLittleLakers ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';

  return (
    <div className={`bg-white border ${accentBorder} rounded-xl overflow-hidden`}>
      {/* Date Header */}
      <div className={`${accentBg} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{isLittleLakers ? '\uD83C\uDFC0' : '\uD83C\uDF1F'}</span>
          <div>
            <p className={`font-semibold text-sm ${accentText}`}>
              {sessionDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            {showProgramName && summary.programName && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${badgeBg} font-medium`}>
                {summary.programName}
              </span>
            )}
          </div>
        </div>
        {summary.coachName && (
          <span className="text-xs text-gray-500">Coach {summary.coachName}</span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Skills Practiced */}
        {summary.skillsPracticed?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Skills Practiced</p>
            <div className="flex flex-wrap gap-1.5">
              {summary.skillsPracticed.map(skillKey => {
                const skill = SKILL_MAP[skillKey];
                if (!skill) return null;
                const SkillIcon = skill.icon;
                return (
                  <span
                    key={skillKey}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${accentBg} ${accentText}`}
                  >
                    <SkillIcon className="w-3 h-3" />
                    {skill.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Fun Activity */}
        {summary.funActivity && (
          <div className="flex items-center gap-2">
            <span className="text-sm">{'\uD83C\uDFAE'}</span>
            <span className="text-sm text-gray-700">
              <span className="font-medium">Fun game:</span> {summary.funActivity}
            </span>
          </div>
        )}

        {/* Achievements */}
        {summary.achievements?.length > 0 && (
          <div>
            {summary.achievements
              .filter(a => a.milestoneLabels?.length > 0)
              .map((achievement, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 p-2 rounded-lg ${accentBg} mb-1.5`}
                >
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{achievement.childName}</p>
                    <p className="text-xs text-gray-600">
                      {achievement.milestoneLabels.join(' \u2022 ')}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Coach Note */}
        {summary.coachNote && (
          <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
            <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600 italic">{summary.coachNote}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionSummaryCard;
