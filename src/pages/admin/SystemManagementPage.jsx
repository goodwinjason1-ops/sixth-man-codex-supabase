import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Shield,
  Users,
  Database,
  Bell,
  Palette,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  Info,
  ChevronDown
} from 'lucide-react';
import PageShell from '../../components/PageShell';

const SystemManagementPage = () => {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState(null);
  const [settings, setSettings] = useState({
    autoSaveEnabled: true,
    offlineMode: true,
    notificationsEnabled: true,
    darkMode: true,
    assessmentReminders: true,
    reminderDays: 14,
    dataRetentionMonths: 24
  });
  const [showConfirmation, setShowConfirmation] = useState(null);

  // Settings sections
  const sections = [
    {
      id: 'benchmarks',
      title: 'Benchmark Management',
      icon: Settings,
      description: 'Configure skill assessment benchmarks and criteria'
    },
    {
      id: 'users',
      title: 'User Management',
      icon: Users,
      description: 'Manage coaches, admins, and player accounts'
    },
    {
      id: 'data',
      title: 'Data Management',
      icon: Database,
      description: 'Backup, restore, and manage club data'
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      icon: Bell,
      description: 'Configure alerts and reminders'
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: Palette,
      description: 'Customize app appearance and branding'
    }
  ];

  // Handle setting change
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Handle dangerous actions
  const handleDangerousAction = (action) => {
    setShowConfirmation(action);
  };

  const confirmAction = () => {
    // Perform the action
    console.log(`Performing action: ${showConfirmation}`);
    setShowConfirmation(null);
  };

  return (
    <PageShell
      title="System Management"
      subtitle="Configure app settings"
      backTo="/welcome"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'System Management' }
      ]}
    >
      <div className="space-y-4">
        {/* Quick Settings */}
        <div className="bg-[#0d5943] rounded-xl p-4">
          <h3 className="font-bold mb-4">Quick Settings</h3>
          <div className="space-y-4">
            <ToggleSetting
              label="Auto-save enabled"
              description="Automatically save changes as you work"
              enabled={settings.autoSaveEnabled}
              onChange={(val) => updateSetting('autoSaveEnabled', val)}
            />
            <ToggleSetting
              label="Offline mode"
              description="Allow app to work without internet"
              enabled={settings.offlineMode}
              onChange={(val) => updateSetting('offlineMode', val)}
            />
            <ToggleSetting
              label="Push notifications"
              description="Receive alerts and reminders"
              enabled={settings.notificationsEnabled}
              onChange={(val) => updateSetting('notificationsEnabled', val)}
            />
            <ToggleSetting
              label="Assessment reminders"
              description={`Remind coaches after ${settings.reminderDays} days`}
              enabled={settings.assessmentReminders}
              onChange={(val) => updateSetting('assessmentReminders', val)}
            />
          </div>
        </div>

        {/* Main Settings Sections */}
        {sections.map(section => (
          <div key={section.id} className="bg-[#0d5943] rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#22c55e]/20 rounded-lg flex items-center justify-center">
                  <section.icon className="text-[#4ade80]" size={20} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold">{section.title}</h3>
                  <p className="text-sm text-white/60">{section.description}</p>
                </div>
              </div>
              <ChevronDown
                size={20}
                className={`text-white/50 transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`}
              />
            </button>

            {expandedSection === section.id && (
              <div className="px-4 pb-4 border-t border-white/10 pt-4">
                {section.id === 'benchmarks' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/admin/benchmarks')}
                      className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Settings size={18} className="text-[#4ade80]" />
                      <span>Edit Skill Benchmarks</span>
                    </button>
                    <button
                      onClick={() => navigate('/admin/match-benchmarks')}
                      className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Settings size={18} className="text-[#4ade80]" />
                      <span>Edit Match Day Benchmarks</span>
                    </button>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-sm text-blue-400">
                        <Info size={14} className="inline mr-1" />
                        Benchmarks define the criteria for each skill level across age groups.
                      </p>
                    </div>
                  </div>
                )}

                {section.id === 'users' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3 text-center mb-3">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xl font-bold">3</p>
                        <p className="text-xs text-white/50">Admins</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xl font-bold">8</p>
                        <p className="text-xs text-white/50">Coaches</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xl font-bold">45</p>
                        <p className="text-xs text-white/50">Players</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/admin/rosters')}
                      className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Users size={18} className="text-[#4ade80]" />
                      <span>Manage Users</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                      <Shield size={18} className="text-[#4ade80]" />
                      <span>Role Permissions</span>
                    </button>
                  </div>
                )}

                {section.id === 'data' && (
                  <div className="space-y-3">
                    <button className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                      <Download size={18} className="text-[#4ade80]" />
                      <span>Backup All Data</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                      <Upload size={18} className="text-[#4ade80]" />
                      <span>Restore from Backup</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                      <RefreshCw size={18} className="text-[#4ade80]" />
                      <span>Sync with Cloud</span>
                    </button>

                    <div className="pt-3 border-t border-white/10">
                      <h4 className="text-sm font-medium text-red-400 mb-2">Danger Zone</h4>
                      <button
                        onClick={() => handleDangerousAction('clear_cache')}
                        className="w-full flex items-center gap-3 p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors text-red-400"
                      >
                        <Trash2 size={18} />
                        <span>Clear Cache</span>
                      </button>
                    </div>
                  </div>
                )}

                {section.id === 'notifications' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Reminder frequency (days)</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={settings.reminderDays}
                        onChange={(e) => updateSetting('reminderDays', parseInt(e.target.value))}
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#22c55e]"
                      />
                    </div>
                    <ToggleSetting
                      label="Email notifications"
                      description="Send email summaries to coaches"
                      enabled={false}
                      onChange={() => {}}
                    />
                    <ToggleSetting
                      label="Weekly digest"
                      description="Send weekly club summary to admins"
                      enabled={false}
                      onChange={() => {}}
                    />
                  </div>
                )}

                {section.id === 'appearance' && (
                  <div className="space-y-4">
                    <ToggleSetting
                      label="Dark mode"
                      description="Use dark theme (always enabled)"
                      enabled={settings.darkMode}
                      onChange={(val) => updateSetting('darkMode', val)}
                    />
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Club branding</label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#22c55e] to-[#0d5943] rounded-xl flex items-center justify-center">
                          <span className="text-2xl font-bold">EL</span>
                        </div>
                        <div>
                          <p className="font-medium">Emerald Lakers</p>
                          <p className="text-sm text-white/50">Green color scheme</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* System Info */}
        <div className="bg-[#0d5943] rounded-xl p-4">
          <h3 className="font-bold mb-4">System Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">App Version</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Last Sync</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Storage Used</span>
              <span>12.4 MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Data Retention</span>
              <span>{settings.dataRetentionMonths} months</span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-[#0d5943] rounded-xl p-4">
          <h3 className="font-bold mb-4">System Status</h3>
          <div className="space-y-3">
            <StatusItem label="Database" status="healthy" />
            <StatusItem label="Cloud Sync" status="healthy" />
            <StatusItem label="PlayerHQ API" status="warning" message="Not configured" />
            <StatusItem label="Offline Storage" status="healthy" />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d5943] rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-yellow-400" size={24} />
              <h3 className="text-lg font-bold">Confirm Action</h3>
            </div>
            <p className="text-white/70 mb-6">
              Are you sure you want to {showConfirmation.replace(/_/g, ' ')}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(null)}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

// Toggle Setting Component
const ToggleSetting = ({ label, description, enabled, onChange }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="font-medium">{label}</p>
      <p className="text-sm text-white/50">{description}</p>
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`w-12 h-6 rounded-full transition-colors relative ${
        enabled ? 'bg-[#22c55e]' : 'bg-white/20'
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? 'left-7' : 'left-1'
        }`}
      />
    </button>
  </div>
);

// Status Item Component
const StatusItem = ({ label, status, message }) => {
  const statusConfig = {
    healthy: { color: 'text-[#4ade80]', bg: 'bg-[#22c55e]/20', icon: CheckCircle },
    warning: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: AlertTriangle },
    error: { color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertTriangle }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between">
      <span className="text-white/60">{label}</span>
      <div className={`flex items-center gap-2 ${config.color}`}>
        <Icon size={14} />
        <span className="text-sm capitalize">{message || status}</span>
      </div>
    </div>
  );
};

export default SystemManagementPage;
