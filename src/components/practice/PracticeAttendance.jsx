import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  UserX,
  Users,
  CheckCircle,
  XCircle,
  BarChart3,
  Clock
} from 'lucide-react';

const FAKE_PLAYERS = [
  { id: 'a1', name: 'Liam Patterson', number: 4 },
  { id: 'a2', name: 'Sienna Kumar', number: 11 },
  { id: 'a3', name: 'Kai Williams', number: 7 },
  { id: 'a4', name: 'Mila Chen', number: 15 },
  { id: 'a5', name: 'Noah Fletcher', number: 22 },
  { id: 'a6', name: 'Aria Douglas', number: 3 },
  { id: 'a7', name: 'Ethan Park', number: 10 },
  { id: 'a8', name: 'Zoe Anderson', number: 8 },
];

const PracticeAttendance = () => {
  // Initialize all players as not-marked (null = unmarked, true = present, false = absent)
  const [attendance, setAttendance] = useState(() => {
    const initial = {};
    FAKE_PLAYERS.forEach((p) => {
      initial[p.id] = null;
    });
    return initial;
  });

  const toggleAttendance = (playerId) => {
    setAttendance((prev) => {
      const current = prev[playerId];
      // null -> true (present) -> false (absent) -> true (present)
      if (current === null) return { ...prev, [playerId]: true };
      return { ...prev, [playerId]: !current };
    });
  };

  const markAllPresent = () => {
    setAttendance((prev) => {
      const updated = { ...prev };
      FAKE_PLAYERS.forEach((p) => {
        updated[p.id] = true;
      });
      return updated;
    });
  };

  const stats = useMemo(() => {
    const total = FAKE_PLAYERS.length;
    const present = Object.values(attendance).filter((v) => v === true).length;
    const absent = Object.values(attendance).filter((v) => v === false).length;
    const unmarked = Object.values(attendance).filter((v) => v === null).length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, unmarked, percentage };
  }, [attendance]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="bg-white border-2 border-[#D4E4D4] rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-[#F5F9F5] border-2 border-[#D4E4D4] rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-[#00A651]" />
          </div>
          <div>
            <h2 className="text-gray-800 font-bold text-lg">Training Attendance</h2>
            <div className="flex items-center gap-1.5 text-[#00A651] text-sm">
              <Clock className="w-3.5 h-3.5" />
              <span>Tuesday 5:30 PM - U12 Emerald</span>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#F5F9F5] rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <UserCheck className="w-4 h-4 text-[#00A651]" />
            </div>
            <p className="text-[#00A651] text-xl font-bold">{stats.present}</p>
            <p className="text-gray-400 text-xs">Present</p>
          </div>
          <div className="bg-[#F5F9F5] rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <UserX className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-red-400 text-xl font-bold">{stats.absent}</p>
            <p className="text-gray-400 text-xs">Absent</p>
          </div>
          <div className="bg-[#F5F9F5] rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <BarChart3 className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-gray-800 text-xl font-bold">{stats.percentage}%</p>
            <p className="text-gray-400 text-xs">Rate</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={markAllPresent}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#D4E4D4] rounded-lg text-[#00A651] text-sm font-medium hover:border-[#00A651] transition-colors min-h-[44px]"
        >
          <CheckCircle className="w-4 h-4" />
          Mark All Present
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 text-gray-400 text-sm">
          <span>{stats.present}/{stats.total} present</span>
        </div>
      </div>

      {/* Attendance Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-[#F5F9F5] rounded-full overflow-hidden flex">
          {stats.present > 0 && (
            <div
              className="h-full bg-[#005028] transition-all duration-300"
              style={{ width: `${(stats.present / stats.total) * 100}%` }}
            />
          )}
          {stats.absent > 0 && (
            <div
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${(stats.absent / stats.total) * 100}%` }}
            />
          )}
        </div>
      </div>

      {/* Player List */}
      <div className="space-y-2">
        {FAKE_PLAYERS.map((player) => {
          const status = attendance[player.id];
          const isPresent = status === true;
          const isAbsent = status === false;

          return (
            <button
              key={player.id}
              onClick={() => toggleAttendance(player.id)}
              className={`w-full text-left rounded-xl p-4 transition-all duration-200 active:scale-[0.98] flex items-center gap-3 min-h-[60px] ${
                isPresent
                  ? 'bg-[#005028]/15 border-2 border-[#00A651]'
                  : isAbsent
                    ? 'bg-red-500/10 border-2 border-red-500/50'
                    : 'bg-white border-2 border-[#D4E4D4] hover:border-[#00A651]/50'
              }`}
            >
              {/* Status Icon */}
              <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                isPresent
                  ? 'bg-[#005028]/20'
                  : isAbsent
                    ? 'bg-red-500/20'
                    : 'bg-[#F5F9F5] border border-[#D4E4D4]'
              }`}>
                {isPresent ? (
                  <CheckCircle className="w-6 h-6 text-[#00A651]" />
                ) : isAbsent ? (
                  <XCircle className="w-6 h-6 text-red-400" />
                ) : (
                  <span className="text-gray-800 font-bold">#{player.number}</span>
                )}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold ${
                  isPresent ? 'text-gray-800' : isAbsent ? 'text-gray-500' : 'text-gray-800'
                }`}>
                  {player.name}
                </h3>
                <p className={`text-xs ${
                  isPresent
                    ? 'text-[#00A651]'
                    : isAbsent
                      ? 'text-red-400'
                      : 'text-gray-400'
                }`}>
                  {isPresent ? 'Present' : isAbsent ? 'Absent' : 'Tap to mark attendance'}
                </p>
              </div>

              {/* Number Badge */}
              {(isPresent || isAbsent) && (
                <span className={`text-sm font-bold ${
                  isPresent ? 'text-[#00A651]' : 'text-red-400/60'
                }`}>
                  #{player.number}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Completion Message */}
      {stats.unmarked === 0 && (
        <div className="mt-6 bg-[#005028]/10 border border-[#00A651]/40 rounded-xl p-4 text-center">
          <CheckCircle className="w-8 h-8 text-[#00A651] mx-auto mb-2" />
          <p className="text-[#00A651] font-semibold">
            Attendance Complete!
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {stats.present}/{stats.total} present ({stats.percentage}%)
          </p>
        </div>
      )}
    </div>
  );
};

export default PracticeAttendance;
