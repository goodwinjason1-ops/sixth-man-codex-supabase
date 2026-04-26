import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Crosshair,
  ExternalLink,
  ShieldCheck,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';
import PageShell from '../../components/PageShell';
import { useData } from '../../contexts/DataContext';
import { buildFairPlaySummaryFlags } from '../../services/fairPlayService';
import {
  buildSelectionCommitteeBoard,
  toParentSafeCommitteeSummary
} from '../../services/selectionCommitteeService';
import { buildShotChartAnalytics } from '../../services/shotChartService';
import { db } from '../../services/firebase';

const useCollectionRows = (collectionName) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
      setRows(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setError('');
      setLoading(false);
    }, (err) => {
      console.error(`${collectionName} snapshot error:`, err);
      setRows([]);
      setError(err?.code || err?.message || 'unavailable');
      setLoading(false);
    });

    return unsubscribe;
  }, [collectionName]);

  return { rows, loading, error };
};

const pct = (value) => `${Number(value || 0).toFixed(value % 1 === 0 ? 0 : 1)}%`;

const AdvancedAnalyticsPage = () => {
  const navigate = useNavigate();
  const { players, teams } = useData();
  const shotEvents = useCollectionRows('shot_events');
  const playingTime = useCollectionRows('playing_time');
  const selectionDecisions = useCollectionRows('selection_decisions');

  const shotAnalytics = useMemo(() => buildShotChartAnalytics({
    shotEvents: shotEvents.rows,
    trendGranularity: 'week'
  }), [shotEvents.rows]);

  const fairPlaySummary = useMemo(() => (
    buildFairPlaySummaryFlags(playingTime.rows)
  ), [playingTime.rows]);

  const selectionBoard = useMemo(() => buildSelectionCommitteeBoard({
    players,
    existingDecisions: selectionDecisions.rows
  }), [players, selectionDecisions.rows]);

  const parentSafeSelection = useMemo(() => (
    toParentSafeCommitteeSummary(selectionBoard)
  ), [selectionBoard]);

  const approvedSelections = parentSafeSelection.players.filter((player) => (
    player.decisionStatus === 'approved'
  )).length;

  const topShotPlayers = shotAnalytics.players.slice(0, 5);
  const topShotZones = shotAnalytics.zones.slice(0, 5);
  const unresolvedTeams = fairPlaySummary.teams.filter((team) => (
    team.unresolvedShortMinuteCount > 0
  ));

  const dataErrors = [
    shotEvents.error && `Shot events: ${shotEvents.error}`,
    playingTime.error && `Playing time: ${playingTime.error}`,
    selectionDecisions.error && `Selection decisions: ${selectionDecisions.error}`
  ].filter(Boolean);

  return (
    <PageShell
      title="Advanced Analytics"
      subtitle="Shot charts, fair-play context, selection governance and trend foundations"
      backTo="/admin/analytics-hub"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Analytics & Reports', url: '/admin/analytics-hub' },
        { label: 'Advanced Analytics' }
      ]}
    >
      {dataErrors.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} />
            Some live analytics sources are unavailable
          </div>
          <p className="mt-1 text-xs">{dataErrors.join(' | ')}</p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard
          icon={Crosshair}
          label="Shot Attempts"
          value={shotEvents.loading ? '...' : shotAnalytics.overview.attempts}
          accent="text-blue-600"
        />
        <MetricCard
          icon={TrendingUp}
          label="Shot eFG"
          value={shotEvents.loading ? '...' : pct(shotAnalytics.overview.effectiveFieldGoalPct)}
          accent="text-emerald-600"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Fair-Play Context"
          value={playingTime.loading ? '...' : fairPlaySummary.totalContextCount}
          accent="text-purple-600"
          subtext={`${fairPlaySummary.unresolvedShortMinuteCount} unresolved`}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Approved Decisions"
          value={selectionDecisions.loading ? '...' : approvedSelections}
          accent="text-amber-600"
          subtext={`${selectionBoard.validation.invalidDecisionCount} invalid`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="xl:col-span-2 bg-white border border-[#D4E4D4] rounded-lg p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Target size={18} className="text-blue-600" />
                Shot Chart Foundation
              </h2>
              <p className="text-sm text-gray-500">Manual and AI shot events roll up into player, team, zone and trend summaries.</p>
            </div>
            <button
              onClick={() => navigate('/coach/videos')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#005028] text-white text-sm font-medium hover:bg-[#003018] transition-colors"
            >
              Video Hub <ExternalLink size={14} />
            </button>
          </div>

          {shotAnalytics.overview.attempts === 0 ? (
            <EmptyState
              icon={Crosshair}
              title="No shot events captured yet"
              message="Shot summaries will populate when manual shot logs or approved video AI events are written to the shot event stream."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnalyticsTable
                title="Top Players"
                rows={topShotPlayers}
                columns={[
                  { key: 'playerName', label: 'Player' },
                  { key: 'attempts', label: 'Att' },
                  { key: 'pointsPerShot', label: 'PPS' },
                  { key: 'effectiveFieldGoalPct', label: 'eFG%', format: pct }
                ]}
              />
              <AnalyticsTable
                title="Shot Zones"
                rows={topShotZones}
                columns={[
                  { key: 'zoneLabel', label: 'Zone' },
                  { key: 'attempts', label: 'Att' },
                  { key: 'makes', label: 'Make' },
                  { key: 'fieldGoalPct', label: 'FG%', format: pct }
                ]}
              />
            </div>
          )}
        </section>

        <section className="bg-white border border-[#D4E4D4] rounded-lg p-5">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
            <ShieldCheck size={18} className="text-purple-600" />
            Fair-Play Context
          </h2>
          <p className="text-sm text-gray-500 mb-4">Short-minute alerts are separated into explained and unresolved cases.</p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <MiniStat label="Alerts" value={fairPlaySummary.totalShortMinuteAlerts} />
            <MiniStat label="Explained" value={fairPlaySummary.suppressedAlertCount} />
            <MiniStat label="Open" value={fairPlaySummary.unresolvedShortMinuteCount} />
          </div>

          {unresolvedTeams.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No unresolved short-minute teams"
              message="Teams with unresolved fair-play exceptions will appear here for admin follow-up."
            />
          ) : (
            <div className="space-y-2">
              {unresolvedTeams.slice(0, 6).map((team) => (
                <div key={team.teamId} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{team.teamName}</p>
                    <p className="text-xs text-red-700">{team.unresolvedShortMinuteCount} unresolved alert{team.unresolvedShortMinuteCount === 1 ? '' : 's'}</p>
                  </div>
                  <AlertTriangle size={16} className="text-red-500" />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border border-[#D4E4D4] rounded-lg p-5">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
            <Users size={18} className="text-amber-600" />
            Selection Governance
          </h2>
          <p className="text-sm text-gray-500 mb-4">Committee decisions are checked for supported statuses, override rationale and parent-safe visibility.</p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <MiniStat label="Players" value={selectionBoard.meta.playerCount} />
            <MiniStat label="Approved" value={approvedSelections} />
            <MiniStat label="In Review" value={selectionBoard.statusCounts.in_review || 0} />
            <MiniStat label="Invalid" value={selectionBoard.validation.invalidDecisionCount} tone={selectionBoard.validation.invalidDecisionCount > 0 ? 'danger' : 'success'} />
          </div>

          {selectionBoard.validation.invalidDecisionCount > 0 ? (
            <div className="space-y-2">
              {selectionBoard.validation.invalidDecisions.slice(0, 5).map((item) => (
                <div key={item.playerId} className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
                  <p className="text-sm font-semibold text-gray-800">{item.playerName}</p>
                  <p className="text-xs text-red-700">{item.errors.join(' ')}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="Selection checks are clear"
              message="Invalid committee decisions will appear here before any parent-safe summary is published."
            />
          )}
        </section>

        <section className="xl:col-span-2 bg-white border border-[#D4E4D4] rounded-lg p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Activity size={18} className="text-emerald-600" />
                Performance Trends
              </h2>
              <p className="text-sm text-gray-500">Weekly shot trends are ready for movement and video-derived events as they come online.</p>
            </div>
            <button
              onClick={() => navigate('/admin/rotation-analytics')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D4E4D4] text-[#005028] text-sm font-medium hover:bg-[#F5F9F5] transition-colors"
            >
              Rotation Analytics <ExternalLink size={14} />
            </button>
          </div>

          {shotAnalytics.trends.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No weekly trend data yet"
              message="Trend lines will appear once shot events include dates."
            />
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {shotAnalytics.trends.slice(-6).map((trend) => (
                <div key={trend.period} className="rounded-lg border border-[#D4E4D4] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">{trend.period}</p>
                    <span className="text-xs text-gray-500">{trend.attempts} attempts</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-[#00A651]"
                      style={{ width: `${Math.min(100, trend.effectiveFieldGoalPct)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">eFG {pct(trend.effectiveFieldGoalPct)} | PPS {trend.pointsPerShot}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
};

const MetricCard = ({ icon: Icon, label, value, accent, subtext }) => (
  <div className="bg-white border border-[#D4E4D4] rounded-lg p-4">
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <Icon size={18} className={accent} />
    </div>
    <p className="mt-2 text-2xl font-bold text-gray-800">{value}</p>
    {subtext && <p className="mt-1 text-xs text-gray-500">{subtext}</p>}
  </div>
);

const MiniStat = ({ label, value, tone = 'neutral' }) => {
  const toneClass = tone === 'danger'
    ? 'text-red-600 bg-red-50 border-red-100'
    : tone === 'success'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
      : 'text-gray-700 bg-gray-50 border-gray-100';

  return (
    <div className={`rounded-lg border p-3 text-center ${toneClass}`}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] font-medium">{label}</p>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, message }) => (
  <div className="rounded-lg border border-dashed border-[#D4E4D4] bg-[#F5F9F5] p-5 text-center">
    <Icon size={24} className="mx-auto mb-2 text-[#00A651]" />
    <p className="text-sm font-semibold text-gray-800">{title}</p>
    <p className="mt-1 text-xs text-gray-500">{message}</p>
  </div>
);

const AnalyticsTable = ({ title, rows, columns }) => (
  <div className="overflow-hidden rounded-lg border border-[#D4E4D4]">
    <div className="bg-[#F5F9F5] px-3 py-2 text-sm font-semibold text-gray-800">{title}</div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-gray-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-3 py-2 font-semibold">{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.playerId || row.teamId || row.zoneId || row.period || rowIndex} className="border-t border-gray-100">
              {columns.map((column) => {
                const value = row[column.key];
                return (
                  <td key={column.key} className="px-3 py-2 text-gray-700">
                    {column.format ? column.format(value) : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AdvancedAnalyticsPage;
