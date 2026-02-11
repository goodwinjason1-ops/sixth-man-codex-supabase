import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  ArrowLeft,
  ChevronRight,
  Bell,
  Calendar,
  Shirt,
  Megaphone,
  Trophy,
  Clock,
  PartyPopper,
  Filter,
  Search,
  Check,
  CheckCheck,
  Trash2,
  X,
  ExternalLink,
  MapPin,
  User,
  AlertTriangle,
  RefreshCw,
  Mail,
  MailOpen,
  ChevronDown,
  ArrowRightLeft,
  MessageSquare,
  Send,
  Loader2
} from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import {
  NOTIFICATION_TYPE_CONFIG,
  SCORING_STATUS,
  filterNotificationsForUser,
  getUnreadCount,
  markAsRead,
  markAsDeleted
} from '../services/notificationService';

const NotificationsInboxPage = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { updateDocument, addDocument, players } = useData();

  // State
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scoringAssignments, setScoringAssignments] = useState([]);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapTarget, setSwapTarget] = useState(null);
  const [swapMessage, setSwapMessage] = useState('');
  const [isSendingSwap, setIsSendingSwap] = useState(false);
  const [receivedSwapRequests, setReceivedSwapRequests] = useState([]);
  const [showReceivedSwapModal, setShowReceivedSwapModal] = useState(false);
  const [selectedReceivedSwap, setSelectedReceivedSwap] = useState(null);
  const [isRespondingToSwap, setIsRespondingToSwap] = useState(false);

  // Sample notifications data
  useEffect(() => {
    // In real app, this would come from Firestore listener
    setNotifications([
      {
        id: 'n1',
        type: 'scoring',
        subject: 'Scoring Duty Reminder - U12 Emerald vs Hawks',
        message: `Hi Parent,

You're scheduled to score for U12 Emerald vs Hawks on Saturday, February 10th at 9:00 AM.

Venue: Emerald Indoor Courts

Please confirm your availability or request a swap if you're unable to attend.

Thank you for your support!

Emerald Lakers Basketball Club`,
        priority: 'normal',
        sentAt: '2024-02-05T08:00:00Z',
        status: 'sent',
        readBy: [],
        gameData: {
          gameId: 'g1',
          teamId: 'u12-emerald',
          team: 'U12 Emerald',
          opponent: 'Hawks',
          date: '2024-02-10',
          time: '09:00',
          venue: 'Emerald Indoor Courts'
        },
        scoringAssignmentId: 'sa1'
      },
      {
        id: 'n2',
        type: 'announcement',
        subject: 'Club Photos This Saturday',
        message: `Hi Lakers Families,

Reminder that team photos will be taken this Saturday at the club.

Please ensure your player wears their full uniform.

Schedule:
- U8/U10: 8:00 AM - 9:00 AM
- U12/U14: 9:00 AM - 10:00 AM
- U16/U18: 10:00 AM - 11:00 AM

See you there!

Emerald Lakers Basketball Club`,
        priority: 'normal',
        sentAt: '2024-02-01T10:00:00Z',
        status: 'sent',
        readBy: ['user123'],
        attachments: [{ name: 'Photo Schedule', url: '#' }]
      },
      {
        id: 'n3',
        type: 'training_change',
        subject: 'Training Cancelled - Thursday 8th Feb',
        message: `Hi Lakers Families,

Due to scheduled court maintenance, training this Thursday (8th February) is CANCELLED.

Training will resume as normal the following week.

Apologies for any inconvenience.

Emerald Lakers Basketball Club`,
        priority: 'urgent',
        sentAt: '2024-02-06T14:00:00Z',
        status: 'sent',
        readBy: []
      },
      {
        id: 'n4',
        type: 'uniform',
        subject: 'Uniform Orders Now Open',
        message: `Hi Lakers Families,

Uniform orders for the 2024 season are now open!

Order Deadline: February 28th, 2024
Collection: Will be available at training from March 15th

Click the link below to order:

Sizing guides are available at the shop.

Emerald Lakers Basketball Club`,
        priority: 'normal',
        sentAt: '2024-01-25T09:00:00Z',
        status: 'sent',
        readBy: ['user123'],
        attachments: [{ name: 'Shop Now', url: 'https://example.com/shop' }]
      },
      {
        id: 'n5',
        type: 'event',
        subject: 'End of Season Presentation Night',
        message: `Hi Lakers Families,

Save the date for our End of Season Presentation Night!

Date: Saturday, September 14th
Time: 6:00 PM
Venue: Emerald Community Hall

More details to follow.

Emerald Lakers Basketball Club`,
        priority: 'normal',
        sentAt: '2024-01-20T11:00:00Z',
        status: 'sent',
        readBy: []
      }
    ]);

    // Sample scoring assignment
    setScoringAssignments([
      {
        id: 'sa1',
        gameId: 'g1',
        teamId: 'u12-emerald',
        parentId: currentUser?.uid,
        status: 'pending',
        gameDate: '2024-02-10',
        opponent: 'Hawks',
        venue: 'Emerald Indoor Courts'
      }
    ]);
  }, [currentUser]);

  // Get type icon
  const getTypeIcon = (type) => {
    const icons = {
      scoring: Calendar,
      uniform: Shirt,
      announcement: Megaphone,
      game_day: Trophy,
      training_change: Clock,
      event: PartyPopper
    };
    return icons[type] || Bell;
  };

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by type
    if (filter !== 'all') {
      if (filter === 'unread') {
        filtered = filtered.filter(n => !n.readBy?.includes(currentUser?.uid));
      } else {
        filtered = filtered.filter(n => n.type === filter);
      }
    }

    // Search
    if (searchTerm) {
      filtered = filtered.filter(n =>
        n.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
  }, [notifications, filter, searchTerm, currentUser]);

  // Unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.readBy?.includes(currentUser?.uid)).length;
  }, [notifications, currentUser]);

  // Handle notification click
  const handleNotificationClick = (notif) => {
    setSelectedNotification(notif);

    // Mark as read
    if (!notif.readBy?.includes(currentUser?.uid)) {
      setNotifications(prev => prev.map(n =>
        n.id === notif.id
          ? { ...n, readBy: [...(n.readBy || []), currentUser?.uid] }
          : n
      ));
    }
  };

  // Handle delete
  const handleDelete = (notifId) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    setSelectedNotification(null);
  };

  // Handle mark as read/unread
  const [togglingRead, setTogglingRead] = useState(null);
  const handleToggleRead = async (notif) => {
    const isRead = notif.readBy?.includes(currentUser?.uid);
    const newReadBy = isRead
      ? (notif.readBy || []).filter(id => id !== currentUser?.uid)
      : [...(notif.readBy || []), currentUser?.uid];

    // Optimistic local update
    setNotifications(prev => prev.map(n =>
      n.id === notif.id ? { ...n, readBy: newReadBy } : n
    ));
    // Update selected notification if open
    if (selectedNotification?.id === notif.id) {
      setSelectedNotification(prev => prev ? { ...prev, readBy: newReadBy } : prev);
    }

    // Write to Firestore if the notification has a real ID (not sample data)
    setTogglingRead(notif.id);
    try {
      if (notif.id && !notif.id.startsWith('n')) {
        await updateDocument('notifications', notif.id, { readBy: newReadBy });
      }
    } catch (error) {
      console.error('Error updating read status:', error);
    } finally {
      setTogglingRead(null);
    }
  };

  // Handle scoring confirmation
  const handleConfirmScoring = async (notif) => {
    setScoringAssignments(prev => prev.map(a =>
      a.id === notif.scoringAssignmentId
        ? { ...a, status: 'confirmed' }
        : a
    ));
    alert('Scoring duty confirmed! Thank you.');
    setSelectedNotification(null);
  };

  // Get scoring assignment for notification
  const getScoringAssignment = (notif) => {
    if (notif.type !== 'scoring') return null;
    return scoringAssignments.find(a => a.id === notif.scoringAssignmentId);
  };

  // Get other parents for swap (from the same team as the notification)
  const getOtherParents = () => {
    if (!selectedNotification?.gameData?.teamId) {
      // Fallback to sample data
      return [
        { id: 'p1', name: 'Sarah Jones', playerName: 'Emma Jones', email: 'sarah@test.com' },
        { id: 'p2', name: 'Mike Wilson', playerName: 'Jack Wilson', email: 'mike@test.com' },
        { id: 'p3', name: 'Lisa Brown', playerName: 'Olivia Brown', email: 'lisa@test.com' }
      ];
    }

    const teamId = selectedNotification.gameData.teamId;
    const teamName = selectedNotification.gameData.team;

    // Find players from the same team
    const teamPlayers = players?.filter(p => {
      const matchById = p.teamId === teamId;
      const matchByName = p.team === teamName;
      return matchById || matchByName;
    }) || [];

    // Get parent info from players, excluding current user
    return teamPlayers
      .map(p => ({
        id: p.id,
        name: p.parentName || `Parent of ${p.name}`,
        playerName: p.name,
        email: p.parentEmail || p.parent1Email
      }))
      .filter(p => p.email && p.email !== userProfile?.email)
      .slice(0, 10); // Limit to 10 parents
  };

  // Handle swap request - create in Firestore
  const handleRequestSwap = async () => {
    if (!swapTarget || !selectedNotification) return;
    setIsSendingSwap(true);

    try {
      const assignment = getScoringAssignment(selectedNotification);
      const gameData = selectedNotification.gameData;

      // Create swap request document
      const swapRequest = {
        gameId: gameData?.gameId,
        gameName: `${gameData?.team} vs ${gameData?.opponent || 'TBD'}`,
        gameDate: gameData?.date,
        gameTime: gameData?.time,
        teamId: gameData?.teamId,
        assignmentId: selectedNotification.scoringAssignmentId,
        requestingParentId: currentUser?.uid,
        requestingParentName: userProfile?.name || userProfile?.displayName || 'Parent',
        requestingParentEmail: userProfile?.email,
        requestedParentId: swapTarget.id,
        requestedParentName: swapTarget.name,
        requestedParentEmail: swapTarget.email,
        message: swapMessage.trim() || null,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        respondedAt: null
      };

      await addDocument('swap_requests', swapRequest);

      // Send notification to the target parent
      await addDocument('notifications', {
        type: 'swap_request',
        subject: `Swap Request: ${swapRequest.gameName}`,
        message: `${swapRequest.requestingParentName} has requested to swap scoring duty with you for ${swapRequest.gameName} on ${gameData?.date ? new Date(gameData.date).toLocaleDateString('en-AU') : 'the scheduled date'}.${swapMessage ? `\n\nMessage: "${swapMessage}"` : ''}\n\nPlease accept or decline this request.`,
        priority: 'normal',
        targetAudience: { type: 'individual', userIds: [swapTarget.id] },
        sentAt: new Date().toISOString(),
        status: 'sent',
        swapRequestData: swapRequest
      });

      // Update assignment status
      if (assignment) {
        setScoringAssignments(prev => prev.map(a =>
          a.id === assignment.id
            ? { ...a, status: 'swap_requested' }
            : a
        ));
      }

      alert(`Swap request sent to ${swapTarget.name}! You'll be notified when they respond.`);
      setShowSwapModal(false);
      setSwapTarget(null);
      setSwapMessage('');
      setSelectedNotification(null);

    } catch (error) {
      console.error('Error sending swap request:', error);
      alert('Failed to send swap request. Please try again.');
    } finally {
      setIsSendingSwap(false);
    }
  };

  // Handle accepting a received swap request
  const handleAcceptSwap = async (swap) => {
    setIsRespondingToSwap(true);

    try {
      // Update swap request status
      if (swap.id) {
        await updateDocument('swap_requests', swap.id, {
          status: 'accepted',
          respondedAt: new Date().toISOString()
        });
      }

      // Send notification to requesting parent
      await addDocument('notifications', {
        type: 'info',
        subject: 'Swap Request Accepted',
        message: `${userProfile?.name || 'The parent'} has accepted your swap request for ${swap.gameName}. They will now handle scoring duty for this game.`,
        priority: 'normal',
        targetAudience: { type: 'individual', userIds: [swap.requestingParentId] },
        sentAt: new Date().toISOString(),
        status: 'sent'
      });

      // Update local state
      setReceivedSwapRequests(prev => prev.filter(s => s.id !== swap.id));
      setShowReceivedSwapModal(false);
      setSelectedReceivedSwap(null);

      alert('Swap accepted! You are now assigned to score for this game.');

    } catch (error) {
      console.error('Error accepting swap:', error);
      alert('Failed to accept swap. Please try again.');
    } finally {
      setIsRespondingToSwap(false);
    }
  };

  // Handle declining a received swap request
  const handleDeclineSwap = async (swap) => {
    setIsRespondingToSwap(true);

    try {
      // Update swap request status
      if (swap.id) {
        await updateDocument('swap_requests', swap.id, {
          status: 'declined',
          respondedAt: new Date().toISOString()
        });
      }

      // Send notification to requesting parent
      await addDocument('notifications', {
        type: 'info',
        subject: 'Swap Request Declined',
        message: `${userProfile?.name || 'The parent'} has declined your swap request for ${swap.gameName}. You are still assigned to score for this game.`,
        priority: 'normal',
        targetAudience: { type: 'individual', userIds: [swap.requestingParentId] },
        sentAt: new Date().toISOString(),
        status: 'sent'
      });

      // Update local state
      setReceivedSwapRequests(prev => prev.filter(s => s.id !== swap.id));
      setShowReceivedSwapModal(false);
      setSelectedReceivedSwap(null);

      alert('Swap declined.');

    } catch (error) {
      console.error('Error declining swap:', error);
      alert('Failed to decline swap. Please try again.');
    } finally {
      setIsRespondingToSwap(false);
    }
  };

  // Pending swap requests count for current user
  const pendingReceivedSwaps = receivedSwapRequests.filter(s => s.status === 'pending').length;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 86400000) { // Less than 24 hours
      return date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 604800000) { // Less than 7 days
      return date.toLocaleDateString('en-AU', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a3d2e] text-white pb-20">
      {/* Header */}
      <div className="bg-[#0d5943] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/welcome')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Notifications</h1>
            <p className="text-white/60 text-sm">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-[#22c55e]' : 'hover:bg-white/10'}`}
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-2 text-sm text-white/60 flex items-center gap-2">
        <span className="hover:text-white cursor-pointer" onClick={() => navigate('/welcome')}>Home</span>
        <ChevronRight size={14} />
        <span className="text-white">Notifications</span>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-4 mb-4">
          <div className="bg-[#0d5943] rounded-xl p-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-[#22c55e]"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'scoring', label: 'Scoring' },
                { id: 'announcement', label: 'Announcements' },
                { id: 'training_change', label: 'Training' },
                { id: 'event', label: 'Events' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    filter === f.id
                      ? 'bg-[#22c55e] text-white'
                      : 'bg-white/10 text-white/70'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notification List */}
      <div className="px-4">
        {filteredNotifications.length > 0 ? (
          <div className="space-y-2">
            {filteredNotifications.map(notif => {
              const Icon = getTypeIcon(notif.type);
              const isRead = notif.readBy?.includes(currentUser?.uid);
              const config = NOTIFICATION_TYPE_CONFIG[notif.type];
              const assignment = getScoringAssignment(notif);

              return (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    isRead
                      ? 'bg-[#0d5943]/60 opacity-75'
                      : 'bg-[#0d5943] border-l-4 border-[#22c55e]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      notif.priority === 'urgent' ? 'bg-red-500/20' : isRead ? 'bg-white/10' : 'bg-[#22c55e]/20'
                    }`}>
                      {isRead ? (
                        <MailOpen className="text-white/50" size={20} />
                      ) : (
                        <Icon className={notif.priority === 'urgent' ? 'text-red-400' : 'text-[#4ade80]'} size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium truncate ${isRead ? 'text-white/60' : 'text-white'}`}>
                          {notif.subject}
                        </h4>
                        {notif.priority === 'urgent' && (
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded">URGENT</span>
                        )}
                        {isRead && (
                          <span className="text-xs text-[#4ade80]/60 flex items-center gap-0.5">
                            <Check size={10} />
                            Read
                          </span>
                        )}
                      </div>
                      <p className={`text-sm line-clamp-1 mt-0.5 ${isRead ? 'text-white/40' : 'text-white/50'}`}>
                        {notif.message.split('\n')[0]}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-white/40">{formatDate(notif.sentAt)}</span>
                        <span className="text-xs text-white/40 capitalize">{config?.label || notif.type}</span>
                        {assignment && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            assignment.status === 'confirmed'
                              ? 'bg-[#22c55e]/20 text-[#4ade80]'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {assignment.status}
                          </span>
                        )}
                      </div>
                    </div>
                    {!isRead && (
                      <div className="w-2 h-2 bg-[#22c55e] rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#0d5943] rounded-xl p-8 text-center">
            <Bell className="mx-auto mb-3 text-white/30" size={40} />
            <p className="text-white/50 mb-2">No notifications</p>
            <p className="text-white/30 text-sm">
              {filter !== 'all' ? 'Try changing your filter' : 'You\'re all caught up!'}
            </p>
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-[#0d5943] rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#0d5943] border-b border-white/10 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = getTypeIcon(selectedNotification.type);
                  return (
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedNotification.priority === 'urgent' ? 'bg-red-500/20' : 'bg-[#22c55e]/20'
                    }`}>
                      <Icon className={selectedNotification.priority === 'urgent' ? 'text-red-400' : 'text-[#4ade80]'} size={20} />
                    </div>
                  );
                })()}
                <div>
                  <span className="text-xs text-white/50 capitalize">
                    {NOTIFICATION_TYPE_CONFIG[selectedNotification.type]?.label}
                  </span>
                  <p className="text-xs text-white/40">
                    {new Date(selectedNotification.sentAt).toLocaleDateString('en-AU', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto p-4 max-h-[60vh]">
              <h2 className="text-lg font-bold mb-4">{selectedNotification.subject}</h2>

              {/* Game Info for Scoring */}
              {selectedNotification.gameData && (
                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="text-[#4ade80]" size={16} />
                    <span className="font-medium">{selectedNotification.gameData.team} vs {selectedNotification.gameData.opponent}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-white/70">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {new Date(selectedNotification.gameData.date).toLocaleDateString('en-AU', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      {selectedNotification.gameData.time}
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <MapPin size={14} />
                      {selectedNotification.gameData.venue}
                    </div>
                  </div>
                </div>
              )}

              {/* Message */}
              <div className="text-white/80 whitespace-pre-line text-sm leading-relaxed">
                {selectedNotification.message}
              </div>

              {/* Attachments */}
              {selectedNotification.attachments?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-white/50">Links:</p>
                  {selectedNotification.attachments.map((att, i) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-[#22c55e]/20 rounded-lg hover:bg-[#22c55e]/30 transition-colors"
                    >
                      <ExternalLink size={16} className="text-[#4ade80]" />
                      <span className="text-[#4ade80] font-medium">{att.name}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="sticky bottom-0 bg-[#0d5943] border-t border-white/10 p-4">
              {/* Scoring Actions */}
              {selectedNotification.type === 'scoring' && (
                <div className="space-y-3">
                  {(() => {
                    const assignment = getScoringAssignment(selectedNotification);
                    if (assignment?.status === 'confirmed') {
                      return (
                        <div className="bg-[#22c55e]/20 rounded-lg p-3 text-center">
                          <CheckCheck className="mx-auto mb-1 text-[#4ade80]" size={24} />
                          <p className="text-[#4ade80] font-medium">Confirmed</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleConfirmScoring(selectedNotification)}
                          className="py-3 bg-[#22c55e] hover:bg-[#1a8a68] rounded-lg font-medium flex items-center justify-center gap-2"
                        >
                          <Check size={18} />
                          Confirm
                        </button>
                        <button
                          onClick={() => setShowSwapModal(true)}
                          className="py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium flex items-center justify-center gap-2"
                        >
                          <RefreshCw size={18} />
                          Request Swap
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* General Actions */}
              <div className={`flex gap-2 ${selectedNotification.type === 'scoring' ? 'mt-3 pt-3 border-t border-white/10' : ''}`}>
                {selectedNotification.readBy?.includes(currentUser?.uid) ? (
                  <button
                    onClick={() => handleToggleRead(selectedNotification)}
                    disabled={togglingRead === selectedNotification.id}
                    className="flex-1 py-2 bg-[#22c55e]/20 border border-[#22c55e]/30 rounded-lg text-sm flex items-center justify-center gap-2 text-[#4ade80] hover:bg-[#22c55e]/30 transition-colors disabled:opacity-50"
                  >
                    {togglingRead === selectedNotification.id
                      ? <Loader2 size={16} className="animate-spin" />
                      : <CheckCheck size={16} />}
                    Read
                    <span className="text-xs text-white/40 ml-1">(Tap to unread)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleRead(selectedNotification)}
                    disabled={togglingRead === selectedNotification.id}
                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {togglingRead === selectedNotification.id
                      ? <Loader2 size={16} className="animate-spin" />
                      : <MailOpen size={16} />}
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selectedNotification.id)}
                  className="py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swap Request Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d5943] rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-[#4ade80]" />
              Request Swap
            </h3>
            <p className="text-white/70 text-sm mb-4">
              Select another parent from the team to send a swap request:
            </p>

            {/* Game details */}
            {selectedNotification?.gameData && (
              <div className="bg-white/5 rounded-lg p-3 mb-4">
                <p className="text-sm text-white/70">Scoring duty for:</p>
                <p className="font-medium">{selectedNotification.gameData.team} vs {selectedNotification.gameData.opponent}</p>
                <p className="text-sm text-white/60">
                  {new Date(selectedNotification.gameData.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} at {selectedNotification.gameData.time}
                </p>
              </div>
            )}

            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {getOtherParents().length > 0 ? (
                getOtherParents().map(parent => (
                  <button
                    key={parent.id}
                    onClick={() => setSwapTarget(parent)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      swapTarget?.id === parent.id
                        ? 'bg-[#22c55e] text-white'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <p className="font-medium">{parent.name}</p>
                    <p className="text-sm opacity-70">Parent of {parent.playerName}</p>
                  </button>
                ))
              ) : (
                <div className="text-center py-4 text-white/50">
                  <User className="mx-auto mb-2" size={24} />
                  <p>No other parents available for swap</p>
                </div>
              )}
            </div>

            {/* Message field */}
            <div className="mb-4">
              <label className="block text-sm text-white/70 mb-2">
                <MessageSquare size={14} className="inline mr-1" />
                Message (optional):
              </label>
              <textarea
                value={swapMessage}
                onChange={(e) => setSwapMessage(e.target.value)}
                placeholder="e.g., Can you cover for me? I have a work commitment..."
                rows={3}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSwapModal(false);
                  setSwapTarget(null);
                  setSwapMessage('');
                }}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestSwap}
                disabled={!swapTarget || isSendingSwap}
                className="flex-1 py-2 bg-[#22c55e] hover:bg-[#1a8a68] disabled:bg-gray-600 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                {isSendingSwap ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Received Swap Request Modal */}
      {showReceivedSwapModal && selectedReceivedSwap && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d5943] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-blue-400" />
              Swap Request
            </h3>

            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <p className="font-medium">{selectedReceivedSwap.gameName}</p>
              <p className="text-sm text-white/60">
                {selectedReceivedSwap.gameDate && new Date(selectedReceivedSwap.gameDate).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                {selectedReceivedSwap.gameTime && ` at ${selectedReceivedSwap.gameTime}`}
              </p>

              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-white/70">
                  <User size={14} className="inline mr-1" />
                  Request from: <span className="font-medium text-white">{selectedReceivedSwap.requestingParentName}</span>
                </p>
              </div>

              {selectedReceivedSwap.message && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-white/70 mb-1">
                    <MessageSquare size={14} className="inline mr-1" />
                    Message:
                  </p>
                  <p className="text-sm italic bg-white/5 rounded p-2">"{selectedReceivedSwap.message}"</p>
                </div>
              )}
            </div>

            <p className="text-white/70 text-sm mb-4">
              If you accept, you will be assigned to score for this game instead of {selectedReceivedSwap.requestingParentName}.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => handleDeclineSwap(selectedReceivedSwap)}
                disabled={isRespondingToSwap}
                className="flex-1 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <X size={16} />
                Decline
              </button>
              <button
                onClick={() => handleAcceptSwap(selectedReceivedSwap)}
                disabled={isRespondingToSwap}
                className="flex-1 py-2 bg-[#22c55e] hover:bg-[#1a8a68] rounded-lg font-medium flex items-center justify-center gap-2"
              >
                {isRespondingToSwap ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <Check size={16} />
                    Accept
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => {
                setShowReceivedSwapModal(false);
                setSelectedReceivedSwap(null);
              }}
              className="w-full mt-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsInboxPage;
