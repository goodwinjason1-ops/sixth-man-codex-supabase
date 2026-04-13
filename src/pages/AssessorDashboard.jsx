import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAssessorSessions } from '../services/tryoutService';
import { getScoutAssignedGames } from '../services/scoutService';
import {
  LogOut,
  ClipboardCheck,
  Calendar,
  Clock,
  Users,
  ChevronRight,
  Loader2,
  MapPin,
  HelpCircle,
  Eye
} from 'lucide-react';
import TutorialPromptCard from '../components/tutorial/TutorialPromptCard';
import FirstTimeHint from '../components/tutorial/FirstTimeHint';

const AssessorDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, signOut } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [scoutGames, setScoutGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
      setLoading(true);
      const email = userProfile?.email || currentUser?.email;
      const [sessResult, scoutResult] = await Promise.all([
        getAssessorSessions(currentUser.uid, email),
        getScoutAssignedGames(currentUser.uid, email)
      ]);
      if (sessResult.success) setSessions(sessResult.data);
      if (scoutResult.success) setScoutGames(scoutResult.data);
      setLoading(false);
    };
    loadData();
  }, [currentUser, userProfile?.email]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'TBD';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return time24;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400 border-green-500',
      completed: 'bg-blue-500/20 text-blue-400 border-blue-500',
      closed: 'bg-red-500/20 text-red-400 border-red-500'
    };
    const labels = {
      active: 'Active',
      completed: 'Completed',
      closed: 'Closed'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-500/20 text-gray-300 border-gray-500'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F9F5]">
      {/* Header */}
      <header className="pt-8 pb-6 px-4 relative">
        {userProfile?.role === 'tryout_assessor' ? (
          <button
            onClick={handleLogout}
            className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-transparent border border-[#D4E4D4] rounded-lg text-gray-800 text-sm hover:bg-gray-100 hover:border-[#00A651] transition-all duration-200 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/dashboard')}
            className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-transparent border border-[#D4E4D4] rounded-lg text-gray-800 text-sm hover:bg-gray-100 hover:border-[#00A651] transition-all duration-200 active:scale-95"
          >
            ← Back
          </button>
        )}

        <div className="flex flex-col items-center justify-center">
          <div className="text-center mb-2">
            <p className="text-gray-800 text-lg font-semibold tracking-widest">EMERALD</p>
            <h1 className="text-4xl font-bold text-gray-800 tracking-wider leading-tight">LAKERS</h1>
          </div>

          <div className="w-16 h-16 bg-white border-2 border-[#D4E4D4] rounded-full flex items-center justify-center my-3">
            <ClipboardCheck className="w-8 h-8 text-[#00A651]" />
          </div>

          <p className="text-[#00A651] text-sm tracking-wide">Tryout Assessor Portal</p>

          <button
            onClick={() => navigate('/help/assessor-guide')}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D4E4D4] rounded-full text-[#00A651] text-xs hover:bg-gray-100 hover:text-gray-800 transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Quick Guide
          </button>

          {userProfile?.displayName && (
            <div className="mt-3 text-center">
              <p className="text-gray-800 text-lg opacity-90">
                Welcome, {userProfile.displayName}
              </p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-[#005028]/10 text-[#005028] border border-[#005028]/40">
                Tryout Assessor
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Sessions List */}
      <main className="px-4 pb-8">
        <div className="max-w-lg mx-auto">
          {/* Tutorial prompt for first-time assessors */}
          <TutorialPromptCard tutorialId="assessor" />

          <h2 className="text-gray-800 font-bold text-lg mb-4">Your Assigned Sessions</h2>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-10 h-10 text-[#00A651] animate-spin mx-auto mb-3" />
              <p className="text-gray-500">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-[#D4E4D4] rounded-xl p-8 text-center">
              <ClipboardCheck className="w-12 h-12 text-[#6B7C6B] mx-auto mb-3" />
              <h3 className="text-gray-800 font-medium mb-1">No Sessions Assigned</h3>
              <p className="text-[#00A651] text-sm">
                You don't have any active tryout sessions assigned yet. Check back later.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session, sessionIdx) => {
                const sessionCard = (
                <button
                  key={session.id}
                  onClick={() => navigate(`/tryout/${session.id}`)}
                  className="w-full bg-white border-2 border-[#D4E4D4] rounded-xl p-4 text-left hover:border-[#00A651] transition-all duration-200 active:scale-[0.98] group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-gray-800 font-bold">{session.name}</h3>
                        {getStatusBadge(session.status)}
                        {session.sessionType === 'hour-1' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#005028]/10 text-[#005028] border border-[#005028]/40">
                            Hour 1
                          </span>
                        )}
                        {session.sessionType === 'hour-2' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#00A651]/10 text-[#005028] border border-[#00A651]/40">
                            Hour 2
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm text-[#00A651]">
                        {session.ageGroup && (
                          <span className="px-2 py-0.5 bg-[#D4E4D4]/50 text-gray-800 text-xs rounded">
                            {session.ageGroup}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(session.date)}
                        </span>
                        {session.startTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(session.startTime)}
                            {session.endTime && ` - ${formatTime(session.endTime)}`}
                          </span>
                        )}
                        {session.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {session.venue}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {session.players?.length || 0} players
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-[#6B7C6B] group-hover:text-[#00A651] flex-shrink-0 mt-1 transition-colors" />
                  </div>
                </button>
                );
                return sessionIdx === 0 ? (
                  <FirstTimeHint key={session.id} hintKey="assessor_first_session">{sessionCard}</FirstTimeHint>
                ) : (
                  <React.Fragment key={session.id}>{sessionCard}</React.Fragment>
                );
              })}
            </div>
          )}

          {/* Game Scouting Section */}
          {scoutGames.length > 0 && (
            <div className="mt-6">
              <h2 className="text-gray-800 font-bold text-lg mb-4">Game Scouting Assignments</h2>
              <button
                onClick={() => navigate('/scout-dashboard')}
                className="w-full bg-white border-2 border-[#D4E4D4] rounded-xl p-4 text-left hover:border-[#00A651] transition-all duration-200 active:scale-[0.98] group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Eye className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-800 font-bold">Game Scouting</h3>
                    <p className="text-[#00A651] text-sm">{scoutGames.length} game{scoutGames.length !== 1 ? 's' : ''} assigned</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#6B7C6B] group-hover:text-[#00A651] flex-shrink-0 transition-colors" />
                </div>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center">
        <p className="text-[#00A651]/40 text-xs">Sixth Man Basketball</p>
      </footer>
    </div>
  );
};

export default AssessorDashboard;
