import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Link2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Upload,
  Download,
  Clock,
  AlertTriangle,
  Database,
  Users,
  Calendar,
  Trophy,
  FileText,
  Settings,
  Play,
  Pause,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  isConfigured,
  testConnection,
  getConnectionStatus,
  syncGameResults,
  syncPlayerStats,
  importFromCSV,
  getCSVTemplate,
  exportToCSV,
  getSyncLogs,
  addSyncLog,
  clearSyncLogs
} from '../../services/playerHQService';

const PlayerHQIntegrationPage = () => {
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('status');
  const [syncLogs, setSyncLogs] = useState([]);
  const [importData, setImportData] = useState({ type: 'players', file: null, preview: null });
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    setConnectionStatus(getConnectionStatus());
    setSyncLogs(getSyncLogs());
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    const result = await testConnection();
    setConnectionStatus(getConnectionStatus());
    addSyncLog({
      type: 'connection_test',
      success: result.success,
      message: result.message
    });
    setSyncLogs(getSyncLogs());
    setTesting(false);
  };

  const handleSync = async (syncType) => {
    setSyncing(true);
    let result;

    if (syncType === 'games') {
      const fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - 1);
      result = await syncGameResults(fromDate, new Date());
    } else if (syncType === 'players') {
      result = await syncPlayerStats([]);
    }

    addSyncLog({
      type: `sync_${syncType}`,
      success: result.success,
      message: result.message || `${syncType} sync completed`,
      synced: result.synced,
      errors: result.errors
    });
    setSyncLogs(getSyncLogs());
    setSyncing(false);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvData = event.target.result;
      const result = await importFromCSV(csvData, importData.type);
      setImportData(prev => ({
        ...prev,
        file,
        preview: result
      }));
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = (type) => {
    const template = getCSVTemplate(type);
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const configured = isConfigured();

  const tabs = [
    { id: 'status', label: 'Connection Status', icon: Link2 },
    { id: 'sync', label: 'Data Sync', icon: RefreshCw },
    { id: 'import', label: 'CSV Import', icon: Upload },
    { id: 'logs', label: 'Sync Logs', icon: FileText }
  ];

  const syncOptions = [
    { id: 'games', label: 'Game Results', icon: Trophy, description: 'Sync scores and game data from PlayerHQ' },
    { id: 'players', label: 'Player Stats', icon: Users, description: 'Import player statistics and records' },
    { id: 'ladder', label: 'Ladder Positions', icon: Database, description: 'Update team standings and rankings' },
    { id: 'schedule', label: 'Fixtures', icon: Calendar, description: 'Sync upcoming game schedule' }
  ];

  return (
    <div className="min-h-screen bg-[#0a3d2e] text-white pb-20">
      {/* Header */}
      <div className="bg-[#0d5943] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold">PlayerHQ Integration</h1>
            <p className="text-white/60 text-sm">Manage Basketball Victoria data sync</p>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-2 text-sm text-white/60 flex items-center gap-2">
        <span className="hover:text-white cursor-pointer" onClick={() => navigate('/admin')}>Admin</span>
        <ChevronRight size={14} />
        <span className="text-white">PlayerHQ Integration</span>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#22c55e] text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        {/* Connection Status Tab */}
        {activeTab === 'status' && (
          <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-[#0d5943] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                {configured ? (
                  connectionStatus?.isConnected ? (
                    <div className="w-12 h-12 bg-[#22c55e]/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="text-[#22c55e]" size={24} />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <AlertTriangle className="text-yellow-400" size={24} />
                    </div>
                  )
                ) : (
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                    <XCircle className="text-red-400" size={24} />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg">
                    {configured
                      ? connectionStatus?.isConnected
                        ? 'Connected'
                        : 'Awaiting API Access'
                      : 'Not Configured'}
                  </h3>
                  <p className="text-white/60 text-sm">
                    {configured
                      ? 'API credentials configured'
                      : 'API credentials not set'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Last Connection Test</span>
                  <span>{connectionStatus?.lastChecked
                    ? new Date(connectionStatus.lastChecked).toLocaleString()
                    : 'Never'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Last Successful Sync</span>
                  <span>{connectionStatus?.lastSync
                    ? new Date(connectionStatus.lastSync).toLocaleString()
                    : 'Never'}</span>
                </div>
                {connectionStatus?.error && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Status</span>
                    <span className="text-yellow-400">{connectionStatus.error}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="w-full bg-[#22c55e] hover:bg-[#1a8a68] disabled:bg-gray-500 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {testing ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Test Connection
                  </>
                )}
              </button>
            </div>

            {/* Info Card */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex gap-3">
                <Info className="text-blue-400 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-medium text-blue-400 mb-1">About PlayerHQ Integration</h4>
                  <p className="text-sm text-white/70 mb-3">
                    PlayerHQ is the official basketball statistics platform used by Basketball Victoria.
                    Once API access is granted, this integration will enable:
                  </p>
                  <ul className="text-sm text-white/70 space-y-1">
                    <li>• Live game scores and results</li>
                    <li>• Automatic player statistics sync</li>
                    <li>• Ladder positions and standings</li>
                    <li>• Team and player data import</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Configuration Guide */}
            <div className="bg-[#0d5943] rounded-xl p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Settings size={18} />
                Configuration
              </h3>
              <p className="text-sm text-white/70 mb-3">
                To enable PlayerHQ integration, add the following environment variables:
              </p>
              <div className="bg-black/30 rounded-lg p-3 font-mono text-sm text-[#4ade80] space-y-1">
                <p>VITE_PLAYERHQ_API_KEY=your_api_key</p>
                <p>VITE_PLAYERHQ_API_SECRET=your_api_secret</p>
                <p>VITE_PLAYERHQ_ORG_ID=your_org_id</p>
              </div>
              <p className="text-xs text-white/50 mt-2">
                Contact Basketball Victoria to request API access credentials.
              </p>
            </div>
          </div>
        )}

        {/* Data Sync Tab */}
        {activeTab === 'sync' && (
          <div className="space-y-4">
            {!configured && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
                <div className="flex gap-3">
                  <AlertTriangle className="text-yellow-400 flex-shrink-0" size={20} />
                  <p className="text-sm text-yellow-400">
                    API credentials not configured. Use CSV import as an alternative.
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-3">
              {syncOptions.map(option => (
                <div key={option.id} className="bg-[#0d5943] rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#22c55e]/20 rounded-lg flex items-center justify-center">
                        <option.icon className="text-[#4ade80]" size={20} />
                      </div>
                      <div>
                        <h4 className="font-medium">{option.label}</h4>
                        <p className="text-sm text-white/60">{option.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSync(option.id)}
                      disabled={!configured || syncing}
                      className="bg-[#22c55e] hover:bg-[#1a8a68] disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                      {syncing ? (
                        <RefreshCw className="animate-spin" size={16} />
                      ) : (
                        <RefreshCw size={16} />
                      )}
                      Sync
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-[#0d5943] rounded-xl p-4">
              <h3 className="font-bold mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    // Sync all
                    handleSync('games');
                    handleSync('players');
                  }}
                  disabled={!configured || syncing}
                  className="bg-[#22c55e] hover:bg-[#1a8a68] disabled:bg-gray-600 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw size={18} />
                  Sync All
                </button>
                <button
                  onClick={() => setActiveTab('import')}
                  className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload size={18} />
                  Import CSV
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CSV Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            <div className="bg-[#0d5943] rounded-xl p-4">
              <h3 className="font-bold mb-3">Import Data from CSV</h3>
              <p className="text-sm text-white/70 mb-4">
                Use CSV import as an interim solution while awaiting PlayerHQ API access.
              </p>

              {/* Import Type Selection */}
              <div className="mb-4">
                <label className="block text-sm text-white/70 mb-2">Data Type</label>
                <div className="flex gap-2">
                  {['players', 'games', 'stats'].map(type => (
                    <button
                      key={type}
                      onClick={() => setImportData(prev => ({ ...prev, type, file: null, preview: null }))}
                      className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                        importData.type === type
                          ? 'bg-[#22c55e] text-white'
                          : 'bg-white/10 text-white/70'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Download */}
              <button
                onClick={() => handleDownloadTemplate(importData.type)}
                className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-lg font-medium flex items-center justify-center gap-2 mb-4 transition-colors"
              >
                <Download size={18} />
                Download {importData.type} Template
              </button>

              {/* File Upload */}
              <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="mx-auto mb-2 text-white/50" size={32} />
                  <p className="text-white/70 mb-1">Click to upload CSV file</p>
                  <p className="text-sm text-white/50">or drag and drop</p>
                </label>
              </div>

              {/* Preview */}
              {importData.preview && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Preview</h4>
                    <span className={`text-sm ${importData.preview.success ? 'text-[#4ade80]' : 'text-yellow-400'}`}>
                      {importData.preview.imported} rows parsed
                    </span>
                  </div>

                  {importData.preview.errors.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3">
                      <p className="text-sm text-red-400 font-medium mb-1">Errors:</p>
                      {importData.preview.errors.slice(0, 5).map((err, i) => (
                        <p key={i} className="text-xs text-red-400/80">{err}</p>
                      ))}
                    </div>
                  )}

                  <div className="bg-black/30 rounded-lg p-3 max-h-40 overflow-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-white/50">
                          {importData.preview.data[0] && Object.keys(importData.preview.data[0]).slice(0, 4).map(key => (
                            <th key={key} className="text-left p-1">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importData.preview.data.slice(0, 5).map((row, i) => (
                          <tr key={i} className="text-white/70">
                            {Object.values(row).slice(0, 4).map((val, j) => (
                              <td key={j} className="p-1 truncate max-w-[100px]">{val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={() => {
                      addSyncLog({
                        type: `csv_import_${importData.type}`,
                        success: true,
                        message: `Imported ${importData.preview.imported} ${importData.type}`,
                        synced: importData.preview.imported
                      });
                      setSyncLogs(getSyncLogs());
                      setImportData({ type: 'players', file: null, preview: null });
                    }}
                    disabled={importData.preview.imported === 0}
                    className="w-full bg-[#22c55e] hover:bg-[#1a8a68] disabled:bg-gray-600 text-white py-3 rounded-lg font-medium mt-4 transition-colors"
                  >
                    Import {importData.preview.imported} Records
                  </button>
                </div>
              )}
            </div>

            {/* Export Options */}
            <div className="bg-[#0d5943] rounded-xl p-4">
              <h3 className="font-bold mb-3">Export Data</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-white/10 hover:bg-white/20 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
                  <Download size={18} />
                  Export Players
                </button>
                <button className="bg-white/10 hover:bg-white/20 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
                  <Download size={18} />
                  Export Games
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sync Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Recent Activity</h3>
              <button
                onClick={() => {
                  clearSyncLogs();
                  setSyncLogs([]);
                }}
                className="text-sm text-white/60 hover:text-white"
              >
                Clear Logs
              </button>
            </div>

            {syncLogs.length === 0 ? (
              <div className="bg-[#0d5943] rounded-xl p-8 text-center">
                <Clock className="mx-auto mb-2 text-white/30" size={32} />
                <p className="text-white/50">No sync activity yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {syncLogs.map((log, index) => (
                  <div key={index} className="bg-[#0d5943] rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        log.success ? 'bg-[#22c55e]/20' : 'bg-yellow-500/20'
                      }`}>
                        {log.success ? (
                          <CheckCircle className="text-[#22c55e]" size={16} />
                        ) : (
                          <AlertTriangle className="text-yellow-400" size={16} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">
                            {log.type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-white/50">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-white/70 mt-1">{log.message}</p>
                        {log.synced > 0 && (
                          <p className="text-xs text-[#4ade80] mt-1">
                            {log.synced} records synced
                          </p>
                        )}
                        {log.errors && log.errors.length > 0 && (
                          <p className="text-xs text-yellow-400 mt-1">
                            {log.errors.length} error(s)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerHQIntegrationPage;
