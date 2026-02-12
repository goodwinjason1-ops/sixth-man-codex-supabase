import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import PageShell from '../../components/PageShell';
import {
  FileText,
  Download,
  Calendar,
  Users,
  Target,
  Award,
  Clock,
  CheckCircle,
  Loader2,
  File,
  FileSpreadsheet,
  Printer,
  AlertCircle,
  X
} from 'lucide-react';

const ReportsExportPage = () => {
  const navigate = useNavigate();
  const { players, evaluations, teams } = useData();
  const [selectedReport, setSelectedReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [generatedReports, setGeneratedReports] = useState([]);
  const [error, setError] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(null);

  // Get unique teams
  const teamList = useMemo(() => {
    if (teams?.length) return teams.map(t => t.name || t);
    return [...new Set(players?.map(p => p.team))].filter(Boolean).sort();
  }, [players, teams]);

  // Report templates
  const reportTemplates = [
    {
      id: 'player_progress',
      name: 'Player Progress Report',
      description: 'Individual player development over time',
      icon: Users,
      filters: ['dateRange', 'team'],
      format: ['pdf', 'csv']
    },
    {
      id: 'team_summary',
      name: 'Team Summary Report',
      description: 'Team performance and statistics overview',
      icon: Target,
      filters: ['dateRange', 'team'],
      format: ['pdf', 'csv']
    },
    {
      id: 'assessment_log',
      name: 'Assessment Activity Log',
      description: 'Complete log of all assessments performed',
      icon: FileText,
      filters: ['dateRange', 'team'],
      format: ['csv']
    },
    {
      id: 'skill_breakdown',
      name: 'Skill Breakdown Report',
      description: 'Detailed analysis by skill category',
      icon: Award,
      filters: ['dateRange', 'team'],
      format: ['pdf', 'csv']
    },
    {
      id: 'coach_activity',
      name: 'Coach Activity Report',
      description: 'Coach assessment activity and effectiveness',
      icon: Users,
      filters: ['dateRange'],
      format: ['pdf', 'csv']
    },
    {
      id: 'roster_export',
      name: 'Roster Export',
      description: 'Complete player roster with contact info',
      icon: FileSpreadsheet,
      filters: ['team'],
      format: ['csv']
    }
  ];

  // Generate report
  const generateReport = async (reportId, format) => {
    setGenerating(true);
    setError(null);

    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 1500));

      const report = reportTemplates.find(r => r.id === reportId);
      const newReport = {
        id: Date.now(),
        name: report.name,
        format: format.toUpperCase(),
        generatedAt: new Date().toISOString(),
        dateRange: `${dateRange.start} - ${dateRange.end}`,
        team: selectedTeam === 'all' ? 'All Teams' : selectedTeam,
        status: 'ready'
      };

      // Handle PDF format - show message that it's coming soon
      if (format === 'pdf') {
        // Generate a printable HTML version that can be converted to PDF
        let htmlContent = generatePrintableHTML(reportId);
        newReport.data = htmlContent;
        newReport.isPrintable = true;
      } else if (format === 'csv') {
        // Generate actual CSV data for CSV exports
        let csvData = '';

        switch (reportId) {
          case 'roster_export':
            csvData = generateRosterCSV();
            break;
          case 'assessment_log':
            csvData = generateAssessmentLogCSV();
            break;
          case 'player_progress':
            csvData = generatePlayerProgressCSV();
            break;
          case 'team_summary':
            csvData = generateTeamSummaryCSV();
            break;
          case 'skill_breakdown':
            csvData = generateSkillBreakdownCSV();
            break;
          case 'coach_activity':
            csvData = generateCoachActivityCSV();
            break;
          default:
            csvData = generateGenericCSV(reportId);
        }

        newReport.data = csvData;
      }

      setGeneratedReports(prev => [newReport, ...prev]);
      setSelectedReport(null);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Generate printable HTML for PDF reports
  const generatePrintableHTML = (reportId) => {
    const reportDate = new Date().toLocaleDateString('en-AU');
    const teamFilter = selectedTeam === 'all' ? 'All Teams' : selectedTeam;

    let content = '';

    switch (reportId) {
      case 'player_progress':
        const progressPlayers = selectedTeam === 'all'
          ? players
          : players.filter(p => p.team === selectedTeam);
        content = `
          <h2>Player Progress Report</h2>
          <table>
            <thead>
              <tr><th>Player</th><th>Team</th><th>Assessments</th><th>Avg Level</th></tr>
            </thead>
            <tbody>
              ${progressPlayers.map(p => {
                const playerEvals = Object.values(evaluations || {}).filter(e => e.playerId === p.id);
                const avgLevel = playerEvals.length > 0
                  ? (playerEvals.reduce((sum, e) => sum + (e.level || 0), 0) / playerEvals.length).toFixed(1)
                  : '-';
                return `<tr><td>${p.name}</td><td>${p.team || '-'}</td><td>${playerEvals.length}</td><td>${avgLevel}</td></tr>`;
              }).join('')}
            </tbody>
          </table>
        `;
        break;
      case 'team_summary':
        const uniqueTeams = [...new Set(players.map(p => p.team))].filter(Boolean);
        content = `
          <h2>Team Summary Report</h2>
          <table>
            <thead>
              <tr><th>Team</th><th>Players</th><th>Total Assessments</th></tr>
            </thead>
            <tbody>
              ${uniqueTeams.map(team => {
                const teamPlayers = players.filter(p => p.team === team);
                const teamEvals = Object.values(evaluations || {}).filter(e =>
                  teamPlayers.some(p => p.id === e.playerId)
                );
                return `<tr><td>${team}</td><td>${teamPlayers.length}</td><td>${teamEvals.length}</td></tr>`;
              }).join('')}
            </tbody>
          </table>
        `;
        break;
      default:
        content = '<p>Report data unavailable</p>';
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Emerald Lakers Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #005028; }
          h2 { color: #005028; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #005028; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .header { border-bottom: 2px solid #005028; padding-bottom: 10px; margin-bottom: 20px; }
          .meta { color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Emerald Lakers Basketball Club</h1>
          <p class="meta">Generated: ${reportDate} | Team: ${teamFilter} | Date Range: ${dateRange.start} to ${dateRange.end}</p>
        </div>
        ${content}
      </body>
      </html>
    `;
  };

  // Generate Player Progress CSV
  const generatePlayerProgressCSV = () => {
    const headers = ['Player Name', 'Team', 'Age Group', 'Total Assessments', 'Average Level', 'Latest Assessment Date'];
    const filteredPlayers = selectedTeam === 'all' ? players : players.filter(p => p.team === selectedTeam);

    const rows = filteredPlayers.map(p => {
      const playerEvals = Object.values(evaluations || {}).filter(e => e.playerId === p.id);
      const avgLevel = playerEvals.length > 0
        ? (playerEvals.reduce((sum, e) => sum + (e.level || 0), 0) / playerEvals.length).toFixed(1)
        : 0;
      const latestEval = playerEvals.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))[0];

      return [
        p.name || '',
        p.team || '',
        p.team?.match(/U\d+/)?.[0] || '',
        playerEvals.length,
        avgLevel,
        latestEval ? (latestEval.date || latestEval.createdAt?.split('T')[0]) : ''
      ].map(v => `"${v}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  // Generate Team Summary CSV
  const generateTeamSummaryCSV = () => {
    const headers = ['Team Name', 'Age Group', 'Total Players', 'Total Assessments', 'Average Team Level', 'Active This Month'];
    const uniqueTeams = [...new Set(players.map(p => p.team))].filter(Boolean);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const rows = uniqueTeams
      .filter(team => selectedTeam === 'all' || team === selectedTeam)
      .map(team => {
        const teamPlayers = players.filter(p => p.team === team);
        const teamEvals = Object.values(evaluations || {}).filter(e =>
          teamPlayers.some(p => p.id === e.playerId)
        );
        const recentEvals = teamEvals.filter(e => new Date(e.date || e.createdAt) > monthAgo);
        const avgLevel = teamEvals.length > 0
          ? (teamEvals.reduce((sum, e) => sum + (e.level || 0), 0) / teamEvals.length).toFixed(1)
          : 0;

        return [
          team,
          team.match(/U\d+/)?.[0] || '',
          teamPlayers.length,
          teamEvals.length,
          avgLevel,
          recentEvals.length
        ].map(v => `"${v}"`).join(',');
      });

    return [headers.join(','), ...rows].join('\n');
  };

  // Generate Skill Breakdown CSV
  const generateSkillBreakdownCSV = () => {
    const headers = ['Skill Category', 'Total Assessments', 'Average Level', 'Players Assessed'];
    const allEvals = Object.values(evaluations || {});
    const skillMap = {};

    allEvals.forEach(e => {
      if (!e.skillId) return;
      if (!skillMap[e.skillId]) {
        skillMap[e.skillId] = { count: 0, totalLevel: 0, players: new Set() };
      }
      skillMap[e.skillId].count++;
      skillMap[e.skillId].totalLevel += e.level || 0;
      skillMap[e.skillId].players.add(e.playerId);
    });

    const rows = Object.entries(skillMap).map(([skillId, data]) => [
      skillId,
      data.count,
      (data.totalLevel / data.count).toFixed(1),
      data.players.size
    ].map(v => `"${v}"`).join(','));

    return [headers.join(','), ...rows].join('\n');
  };

  // Generate Coach Activity CSV
  const generateCoachActivityCSV = () => {
    const headers = ['Coach ID', 'Total Assessments', 'Players Assessed', 'Teams', 'Last Activity'];
    const allEvals = Object.values(evaluations || {});
    const coachMap = {};

    allEvals.forEach(e => {
      const coachId = e.coachId || 'Unknown';
      if (!coachMap[coachId]) {
        coachMap[coachId] = { count: 0, players: new Set(), teams: new Set(), lastDate: null };
      }
      coachMap[coachId].count++;
      coachMap[coachId].players.add(e.playerId);
      const player = players.find(p => p.id === e.playerId);
      if (player?.team) coachMap[coachId].teams.add(player.team);
      const evalDate = new Date(e.date || e.createdAt);
      if (!coachMap[coachId].lastDate || evalDate > coachMap[coachId].lastDate) {
        coachMap[coachId].lastDate = evalDate;
      }
    });

    const rows = Object.entries(coachMap).map(([coachId, data]) => [
      coachId,
      data.count,
      data.players.size,
      [...data.teams].join('; '),
      data.lastDate ? data.lastDate.toISOString().split('T')[0] : ''
    ].map(v => `"${v}"`).join(','));

    return [headers.join(','), ...rows].join('\n');
  };

  // CSV Generation functions
  const generateRosterCSV = () => {
    const headers = ['Name', 'Team', 'DOB', 'Role', 'Parent 1 Name', 'Parent 1 Email', 'Parent 2 Name', 'Parent 2 Email'];
    const filteredPlayers = selectedTeam === 'all'
      ? players
      : players.filter(p => p.team === selectedTeam);

    const rows = filteredPlayers.map(p => [
      p.name || '',
      p.team || '',
      p.dob || '',
      p.role || 'player',
      p.parent1Name || '',
      p.parent1Email || '',
      p.parent2Name || '',
      p.parent2Email || ''
    ].map(v => `"${v}"`).join(','));

    return [headers.join(','), ...rows].join('\n');
  };

  const generateAssessmentLogCSV = () => {
    const headers = ['Date', 'Player', 'Skill', 'Level', 'Coach', 'Notes'];
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    const filteredEvals = Object.values(evaluations || {}).filter(e => {
      const evalDate = new Date(e.date || e.createdAt);
      const inDateRange = evalDate >= startDate && evalDate <= endDate;

      if (selectedTeam === 'all') return inDateRange;

      const player = players.find(p => p.id === e.playerId);
      return inDateRange && player?.team === selectedTeam;
    });

    const rows = filteredEvals.map(e => {
      const player = players.find(p => p.id === e.playerId);
      return [
        e.date || e.createdAt?.split('T')[0] || '',
        player?.name || e.playerId,
        e.skillId || '',
        e.level || '',
        e.coachId || '',
        e.notes || ''
      ].map(v => `"${v}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const generateGenericCSV = (reportId) => {
    // Generic export based on report type
    const headers = ['Report Type', 'Date Range', 'Team', 'Generated At'];
    const rows = [[reportId, `${dateRange.start} - ${dateRange.end}`, selectedTeam, new Date().toISOString()].join(',')];
    return [headers.join(','), ...rows].join('\n');
  };

  // Download report
  const downloadReport = (report) => {
    if (!report.data) {
      setError('Report data not available. Please regenerate the report.');
      return;
    }

    try {
      if (report.isPrintable) {
        // Open printable HTML in new window for PDF printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(report.data);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
        setDownloadSuccess(`${report.name} opened for printing. Use "Save as PDF" in the print dialog.`);
      } else {
        // CSV download
        const blob = new Blob([report.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.name.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloadSuccess(`${report.name} downloaded successfully!`);
      }

      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download report. Please try again.');
    }
  };

  return (
    <PageShell
      title="Reports & Export"
      subtitle="Generate and download reports"
      backTo="/welcome"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Reports & Export' }
      ]}
    >
      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-2 bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Success Message */}
      {downloadSuccess && (
        <div className="mx-4 mt-2 bg-[#005028]/20 border border-[#00A651]/50 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-[#00A651] flex-shrink-0" size={20} />
            <p className="text-[#00A651] text-sm">{downloadSuccess}</p>
          </div>
          <button onClick={() => setDownloadSuccess(null)} className="text-[#00A651] hover:text-[#86efac]">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Report Templates */}
        <div>
          <h3 className="font-bold mb-4">Available Reports</h3>
          <div className="grid gap-3">
            {reportTemplates.map(report => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`flex items-start gap-4 p-4 rounded-xl text-left transition-all ${
                  selectedReport === report.id
                    ? 'bg-[#005028]/20 border-2 border-[#00A651]'
                    : 'bg-white border border-transparent hover:border-white/20'
                }`}
              >
                <div className="w-12 h-12 bg-[#005028]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <report.icon className="text-[#00A651]" size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold">{report.name}</h4>
                  <p className="text-sm text-gray-500">{report.description}</p>
                  <div className="flex gap-2 mt-2">
                    {report.format.map(fmt => (
                      <span
                        key={fmt}
                        className="px-2 py-0.5 bg-gray-100 rounded text-xs uppercase"
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Report Configuration */}
        {selectedReport && (
          <div className="bg-white rounded-xl p-4">
            <h3 className="font-bold mb-4">Configure Report</h3>

            {/* Date Range */}
            {reportTemplates.find(r => r.id === selectedReport)?.filters.includes('dateRange') && (
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">From</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full bg-gray-100 border border-white/20 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-[#00A651]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">To</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full bg-gray-100 border border-white/20 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-[#00A651]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Team Filter */}
            {reportTemplates.find(r => r.id === selectedReport)?.filters.includes('team') && (
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">Team</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full bg-gray-100 border border-white/20 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-[#00A651]"
                >
                  <option value="all">All Teams</option>
                  {teamList.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Generate Buttons */}
            <div className="flex gap-3">
              {reportTemplates.find(r => r.id === selectedReport)?.format.map(fmt => (
                <button
                  key={fmt}
                  onClick={() => generateReport(selectedReport, fmt)}
                  disabled={generating}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#005028] hover:bg-gray-100 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  {generating ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : fmt === 'pdf' ? (
                    <File size={18} />
                  ) : (
                    <FileSpreadsheet size={18} />
                  )}
                  Generate {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generated Reports */}
        {generatedReports.length > 0 && (
          <div>
            <h3 className="font-bold mb-4">Generated Reports</h3>
            <div className="space-y-3">
              {generatedReports.map(report => (
                <div
                  key={report.id}
                  className="bg-white rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#005028]/20 rounded-lg flex items-center justify-center">
                      {report.format === 'CSV' ? (
                        <FileSpreadsheet className="text-[#00A651]" size={20} />
                      ) : (
                        <File className="text-[#00A651]" size={20} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{report.format}</span>
                        <span>•</span>
                        <span>{report.team}</span>
                        <span>•</span>
                        <span>{new Date(report.generatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-[#00A651]">
                      <CheckCircle size={14} />
                      Ready
                    </span>
                    <button
                      onClick={() => downloadReport(report)}
                      className="p-2 bg-[#005028] hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Export Options */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-bold mb-4">Quick Export</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setSelectedReport('roster_export');
                generateReport('roster_export', 'csv');
              }}
              disabled={generating}
              className="flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              <Users size={18} />
              Export All Players
            </button>
            <button
              onClick={() => {
                setSelectedReport('assessment_log');
                generateReport('assessment_log', 'csv');
              }}
              disabled={generating}
              className="flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              <Target size={18} />
              Export Assessments
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default ReportsExportPage;
