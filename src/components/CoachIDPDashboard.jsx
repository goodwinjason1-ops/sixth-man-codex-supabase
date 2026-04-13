import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Target,
  Users,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

const CoachIDPDashboard = () => {
  const navigate = useNavigate();
  const { players, evaluations } = useData();
  const { currentUser } = useAuth();

  const [developmentPlans, setDevelopmentPlans] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'development_plans'), (snap) => {
      setDevelopmentPlans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error('Development plans subscription error:', err);
    });
    return () => unsub();
  }, []);

  // Assessment stats from evaluations collection
  const assessmentStats = useMemo(() => {
    if (!evaluations || !currentUser) return { playersAssessed: 0, totalAssessments: 0 };
    const allEvals = Object.values(evaluations);
    const coachEvals = allEvals.filter(e => e.coachId === currentUser.uid);

    // Unique players assessed by this coach
    const uniquePlayers = new Set(coachEvals.map(e => e.playerId));

    // Unique evaluation documents (each doc covers multiple skills)
    const uniqueDocs = new Set(coachEvals.map(e => e.id));

    return {
      playersAssessed: uniquePlayers.size,
      totalAssessments: uniqueDocs.size
    };
  }, [evaluations, currentUser]);

  const idpStats = useMemo(() => {
    const allPlans = developmentPlans;
    const activePlans = allPlans.filter(p => p.status === 'active');

    // Count players with active IDPs
    const playersWithIdp = new Set(activePlans.map(p => p.playerId));
    const totalPlayers = players?.length || 0;
    const playersNeedingPlans = totalPlayers - playersWithIdp.size;

    // Find plans with reviews due (mid-season review due if plan is > 6 weeks old with no mid-season review)
    const now = new Date();
    const reviewsDue = activePlans.filter(plan => {
      const planAge = (now - new Date(plan.createdAt)) / (1000 * 60 * 60 * 24);
      const hasMidReview = (plan.reviews || []).some(r => r.type === 'mid_season');
      return planAge > 42 && !hasMidReview; // 6 weeks
    });

    return {
      totalPlayers,
      activePlans: activePlans.length,
      playersNeedingPlans: Math.max(0, playersNeedingPlans),
      reviewsDue: reviewsDue.length
    };
  }, [players, developmentPlans]);

  return (
    <div
      onClick={() => navigate('/coach/players')}
      className="bg-white border border-[#D4E4D4] rounded-xl p-6 mb-6 cursor-pointer hover:border-[#00A651] transition-all group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#005028] to-[#00A651] rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Development Plans</h2>
            <p className="text-[#6B7C6B] text-sm">
              {assessmentStats.playersAssessed} player{assessmentStats.playersAssessed !== 1 ? 's' : ''} assessed
              {assessmentStats.totalAssessments > 0 && ` · ${assessmentStats.totalAssessments} assessment${assessmentStats.totalAssessments !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-[#00A651] group-hover:translate-x-1 transition-all" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#F5F9F5] rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-3.5 h-3.5 text-[#00A651]" />
          </div>
          <p className="text-lg font-bold text-gray-800">{assessmentStats.playersAssessed}</p>
          <p className="text-[10px] text-[#6B7C6B]">Players Assessed</p>
        </div>
        <div className="bg-[#F5F9F5] rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-[#00A651]" />
          </div>
          <p className="text-lg font-bold text-gray-800">{assessmentStats.totalAssessments}</p>
          <p className="text-[10px] text-[#6B7C6B]">Assessments</p>
        </div>
        <div className="bg-[#F5F9F5] rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#00A651]" />
          </div>
          <p className="text-lg font-bold text-gray-800">{idpStats.activePlans}</p>
          <p className="text-[10px] text-[#6B7C6B]">Active IDPs</p>
        </div>
      </div>

      {/* Alert Banner */}
      {idpStats.reviewsDue > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-amber-700 text-xs font-medium">
            {idpStats.reviewsDue} player{idpStats.reviewsDue !== 1 ? 's have' : ' has'} a mid-season review due this week
          </p>
        </div>
      )}

      {idpStats.playersNeedingPlans > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <p className="text-blue-700 text-xs font-medium">
            {idpStats.playersNeedingPlans} player{idpStats.playersNeedingPlans !== 1 ? 's' : ''} still need{idpStats.playersNeedingPlans === 1 ? 's' : ''} a development plan
          </p>
        </div>
      )}
    </div>
  );
};

export default CoachIDPDashboard;
