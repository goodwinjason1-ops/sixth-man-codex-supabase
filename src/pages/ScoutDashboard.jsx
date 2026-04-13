import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getScoutAssignedGames } from '../services/scoutService';
import {
  ArrowLeft,
  Eye,
  Calendar,
  Clock,
  Users,
  ChevronRight,
  Loader2,
  MapPin,
  Trophy
} from 'lucide-react';

const ScoutDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGames = async () => {
      if (!currentUser) return;
      setLoading(true);
      const result = await getScoutAssignedGames(currentUser.uid, userProfile?.email || currentUser?.email);
      if (result.success) {
        setGames(result.data);
      }
      setLoading(false);
    };
    loadGames();
  }, [currentUser, userProfile?.email]);

  const formatDate = (date) => {
    if (!date) return 'TBD';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return time24;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  };

  return (
    <div className="min-h-screen bg-[#F5F9F5]">
      {/* Header */}
      <header className="pt-8 pb-6 px-4 relative">
        <button
          onClick={() => navigate('/dashboard')}
          className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-transparent border border-[#D4E4D4] rounded-lg text-gray-800 text-sm hover:bg-gray-100 hover:border-[#00A651] transition-all duration-200 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-white border-2 border-[#D4E4D4] rounded-full flex items-center justify-center my-3">
            <Eye className="w-8 h-8 text-[#00A651]" />
          </div>

          <p className="text-[#00A651] text-sm tracking-wide">Game Scouting Portal</p>

          {userProfile?.displayName && (
            <div className="mt-3 text-center">
              <p className="text-gray-800 text-lg opacity-90">
                Welcome, {userProfile.displayName}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Games List */}
      <main className="px-4 pb-8">
        <div className="max-w-lg mx-auto">
          <h2 className="text-gray-800 font-bold text-lg mb-4">Your Assigned Games</h2>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-10 h-10 text-[#00A651] animate-spin mx-auto mb-3" />
              <p className="text-gray-500">Loading games...</p>
            </div>
          ) : games.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-[#D4E4D4] rounded-xl p-8 text-center">
              <Eye className="w-12 h-12 text-[#6B7C6B] mx-auto mb-3" />
              <h3 className="text-gray-800 font-medium mb-1">No Games Assigned</h3>
              <p className="text-[#6B7C6B] text-sm">
                You don't have any games assigned for scouting yet. Check back later.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => navigate(`/scout/${game.id}`)}
                  className="w-full bg-white border-2 border-[#D4E4D4] rounded-xl p-4 text-left hover:border-[#00A651] transition-all duration-200 active:scale-[0.98] group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-gray-800 font-bold">
                          {game.teamName || 'Team'} vs {game.opponent || 'TBD'}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm text-[#00A651]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(game.date)}
                        </span>
                        {game.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(game.time)}
                          </span>
                        )}
                        {game.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {game.venue}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-10 h-10 bg-[#00A651]/10 rounded-lg flex items-center justify-center group-hover:bg-[#00A651]/20 transition-colors">
                        <Trophy className="w-5 h-5 text-[#00A651]" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#6B7C6B] group-hover:text-[#00A651] transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ScoutDashboard;
