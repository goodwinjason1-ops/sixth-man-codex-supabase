import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  ChevronRight,
  Bell,
  Mail,
  Smartphone,
  Phone,
  Globe,
  Calendar,
  Shirt,
  Megaphone,
  Trophy,
  Clock,
  PartyPopper,
  Save,
  Check,
  Info,
  AlertTriangle,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';
import {
  NOTIFICATION_TYPE_CONFIG,
  getDefaultUserPreferences
} from '../services/notificationService';

const NotificationPreferencesPage = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, updateUserProfile } = useAuth();

  // Get default preferences structure
  const defaultPrefs = getDefaultUserPreferences().notifications;

  const [preferences, setPreferences] = useState({
    // Channel preferences
    inApp: defaultPrefs.inApp,
    email: defaultPrefs.email,
    sms: defaultPrefs.sms,
    // Type preferences
    types: defaultPrefs.types
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');

  // Load preferences from user profile
  useEffect(() => {
    if (userProfile?.preferences?.notifications) {
      setPreferences(prev => ({
        ...prev,
        ...userProfile.preferences.notifications
      }));
    }

    // Check push notification permission
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, [userProfile]);

  // Get icon for notification type
  const getTypeIcon = (type) => {
    const icons = {
      scoring: Calendar,
      uniform: Shirt,
      announcements: Megaphone,
      gameDay: Trophy,
      training: Clock,
      events: PartyPopper
    };
    return icons[type] || Bell;
  };

  // Toggle channel preference
  const handleChannelToggle = (channel) => {
    if (channel === 'inApp') return; // Always on
    setPreferences(prev => ({
      ...prev,
      [channel]: !prev[channel]
    }));
    setSaved(false);
  };

  // Toggle type preference
  const handleTypeToggle = (type) => {
    setPreferences(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: !prev.types?.[type]
      }
    }));
    setSaved(false);
  };

  // Request push permission
  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('Push notifications are not supported in this browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
    } catch (error) {
      console.error('Error requesting push permission:', error);
    }
  };

  // Enable all types
  const handleEnableAllTypes = () => {
    setPreferences(prev => ({
      ...prev,
      types: Object.keys(prev.types || {}).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {})
    }));
    setSaved(false);
  };

  // Disable optional channels
  const handleQuietMode = () => {
    setPreferences(prev => ({
      ...prev,
      email: false,
      sms: false
    }));
    setSaved(false);
  };

  // Save preferences
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In real app, save to Firestore
      if (updateUserProfile) {
        await updateUserProfile({
          preferences: {
            ...userProfile?.preferences,
            notifications: preferences
          }
        });
      }
      console.log('Saving preferences:', preferences);

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Notification type configurations with display info
  const notificationTypes = [
    {
      id: 'scoring',
      label: 'Scoring Reminders',
      description: 'Reminders about scoring duty assignments',
      icon: Calendar,
      critical: true
    },
    {
      id: 'gameDay',
      label: 'Game Day Alerts',
      description: 'Reminders about upcoming games',
      icon: Trophy,
      critical: true
    },
    {
      id: 'uniform',
      label: 'Uniform Information',
      description: 'Uniform orders, sizing, and collection',
      icon: Shirt
    },
    {
      id: 'announcements',
      label: 'Club Announcements',
      description: 'General club news and updates',
      icon: Megaphone
    },
    {
      id: 'training',
      label: 'Training Changes',
      description: 'Training schedule changes and cancellations',
      icon: Clock,
      critical: true
    },
    {
      id: 'events',
      label: 'Events & Social',
      description: 'Club events and social activities',
      icon: PartyPopper
    }
  ];

  // Delivery channel configurations
  const channels = [
    {
      id: 'inApp',
      label: 'In-App Notifications',
      description: 'See notifications when you open the app',
      icon: Globe,
      alwaysOn: true
    },
    {
      id: 'email',
      label: 'Email Notifications',
      description: 'Receive notifications via email',
      icon: Mail
    },
    {
      id: 'sms',
      label: 'SMS Notifications',
      description: 'Receive urgent notifications via text message',
      icon: Phone,
      premium: true
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a3d2e] text-white pb-20">
      {/* Header */}
      <div className="bg-[#0d5943] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Notification Settings</h1>
            <p className="text-white/60 text-sm">Manage how you receive notifications</p>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-2 text-sm text-white/60 flex items-center gap-2">
        <span className="hover:text-white cursor-pointer" onClick={() => navigate('/welcome')}>Home</span>
        <ChevronRight size={14} />
        <span className="hover:text-white cursor-pointer" onClick={() => navigate('/notifications')}>Notifications</span>
        <ChevronRight size={14} />
        <span className="text-white">Settings</span>
      </div>

      <div className="px-4 space-y-4">
        {/* Push Notification Permission */}
        {pushPermission !== 'granted' && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Smartphone className="text-blue-400 flex-shrink-0" size={20} />
              <div className="flex-1">
                <h3 className="font-medium text-blue-400 mb-1">Enable Push Notifications</h3>
                <p className="text-sm text-white/70 mb-3">
                  Get instant alerts for urgent messages, scoring reminders, and training changes.
                </p>
                <button
                  onClick={handleRequestPushPermission}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Enable Push Notifications
                </button>
                {pushPermission === 'denied' && (
                  <p className="text-xs text-yellow-400 mt-2">
                    <AlertTriangle size={12} className="inline mr-1" />
                    Push notifications are blocked. Please enable in browser settings.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delivery Channels Section */}
        <div className="bg-[#0d5943] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={18} className="text-[#4ade80]" />
            <h2 className="font-bold">Delivery Channels</h2>
          </div>
          <p className="text-sm text-white/60 mb-4">
            Choose how you want to receive notifications
          </p>

          <div className="space-y-3">
            {channels.map(channel => {
              const isEnabled = channel.alwaysOn ? true : preferences[channel.id];
              const Icon = channel.icon;

              return (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                      <Icon size={20} className="text-white/70" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{channel.label}</span>
                        {channel.alwaysOn && (
                          <span className="text-xs text-[#4ade80] bg-[#22c55e]/20 px-2 py-0.5 rounded">
                            Always on
                          </span>
                        )}
                        {channel.premium && (
                          <span className="text-xs text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded">
                            Premium
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/50">{channel.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleChannelToggle(channel.id)}
                    disabled={channel.alwaysOn}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      isEnabled
                        ? channel.alwaysOn ? 'bg-[#22c55e]/50' : 'bg-[#22c55e]'
                        : 'bg-white/20'
                    } ${channel.alwaysOn ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        isEnabled ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notification Types Section */}
        <div className="bg-[#0d5943] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-[#4ade80]" />
              <h2 className="font-bold">Notification Types</h2>
            </div>
            <button
              onClick={handleEnableAllTypes}
              className="text-xs text-[#4ade80] hover:underline"
            >
              Enable All
            </button>
          </div>
          <p className="text-sm text-white/60 mb-4">
            Choose which types of notifications you want to receive
          </p>

          <div className="space-y-3">
            {notificationTypes.map(type => {
              const isEnabled = preferences.types?.[type.id] !== false;
              const Icon = type.icon;

              return (
                <div
                  key={type.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      type.critical ? 'bg-orange-500/20' : 'bg-white/10'
                    }`}>
                      <Icon size={20} className={type.critical ? 'text-orange-400' : 'text-white/70'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{type.label}</span>
                        {type.critical && (
                          <span className="text-xs text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded">
                            Important
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/50">{type.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTypeToggle(type.id)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      isEnabled ? 'bg-[#22c55e]' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        isEnabled ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#0d5943] rounded-xl p-4">
          <h3 className="font-medium mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setPreferences(prev => ({
                  ...prev,
                  email: true,
                  sms: false
                }));
                setSaved(false);
              }}
              className="py-3 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Mail size={16} />
              Email Only
            </button>
            <button
              onClick={handleQuietMode}
              className="py-3 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <VolumeX size={16} />
              Quiet Mode
            </button>
            <button
              onClick={() => {
                setPreferences(prev => ({
                  ...prev,
                  email: true,
                  sms: true
                }));
                setSaved(false);
              }}
              className="py-3 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Volume2 size={16} />
              All Channels
            </button>
            <button
              onClick={handleEnableAllTypes}
              className="py-3 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Bell size={16} />
              All Types
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="text-[#4ade80] flex-shrink-0" size={20} />
            <div>
              <p className="text-sm text-white/70">
                <strong>Important:</strong> Notifications marked as "Important" are recommended to keep enabled
                as they contain time-sensitive information about games, scoring duties, and training changes.
              </p>
              <p className="text-sm text-white/50 mt-2">
                SMS notifications are only sent for urgent alerts like training cancellations.
              </p>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-[#0d5943] rounded-xl p-4">
          <h3 className="font-medium mb-3">Your Current Settings</h3>
          <div className="bg-white/5 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">In-App:</span>
              <span className="text-[#4ade80]">Always On</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Email:</span>
              <span className={preferences.email ? 'text-[#4ade80]' : 'text-white/50'}>
                {preferences.email ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">SMS:</span>
              <span className={preferences.sms ? 'text-[#4ade80]' : 'text-white/50'}>
                {preferences.sms ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="border-t border-white/10 pt-2 mt-2">
              <span className="text-white/60">Active notification types: </span>
              <span className="text-white">
                {Object.entries(preferences.types || {}).filter(([, v]) => v).length} / {notificationTypes.length}
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || saved}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
            saved
              ? 'bg-[#22c55e] text-white'
              : 'bg-[#22c55e] hover:bg-[#1a8a68] text-white'
          }`}
        >
          {saved ? (
            <>
              <Check size={20} />
              Saved!
            </>
          ) : isSaving ? (
            'Saving...'
          ) : (
            <>
              <Save size={20} />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferencesPage;
