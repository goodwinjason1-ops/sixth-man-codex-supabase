import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
} from 'firebase/firestore';
import { db } from '../services/firebase';
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

  // Subscribe to notifications from Firestore
  useEffect(() => {
    if (!currentUser?.uid) return;

    // Get notifications targeted to this user or to all users
    const notifsQ = query(
      collection(db, 'notifications'),
      orderBy('sentAt', 'desc'),
      limit(50)
    );

    const unsubNotifs = onSnapshot(notifsQ, (snap) => {
      const allNotifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filter to notifications targeted to this user or broadcast
      const userNotifs = allNotifs.filter(n => {
        const audience = n.targetAudience;
        if (!audience) return true; // no targeting = broadcast
        if (audience.type === 'all') return true;
        if (audience.type === 'individual' && audience.userIds?.includes(currentUser.uid)) return true;
        if (audience.type === 'role' && audience.roles?.includes(userProfile?.role)) return true;
        if (audience.type === 'team' && audience.teamIds) return true; // could refine further
        return false;
      });
      setNotifications(userNotifs);
    }, (err) => {
      console.error('Notifications subscription error:', err);
    });

    return () => unsubNotifs();
  }, [currentUser?.uid, userProfile?.role]);

  // Subscribe to scoring assignments for this user
  useEffect(() => {
    if (!currentUser?.uid) return;

    const assignQ = query(
      collection(db, 'scoring_assignments')
    );

    const unsubAssign = onSnapshot(assignQ, (snap) => {
      const allAssignments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filter to assignments for this user (by userId or email)
      const myAssignments = allAssignments.filter(a =>
        a.assignedTo === currentUser.uid ||
        a.assignedEmail === userProfile?.email
      );
      setScoringAssignments(myAssignments);
    }, (err) => {
      console.error('Scoring assignments subscription error:', err);
    });

    return () => unsubAssign();
  }, [currentUser?.uid, userProfile?.email]);

  // Subscribe to received swap requests for this user
  useEffect(() => {
    if (!currentUser?.uid) return;

    const swapQ = query(
      collection(db, 'swap_requests'),
      where('swapToId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubSwap = onSnapshot(swapQ, (snap) => {
      setReceivedSwapRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error('Swap requests subscription error:', err);
    });

    return () => unsubSwap();
  }, [currentUser?.uid]);

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

  // Get navigation target based on notification type
  const getNavigationTarget = (notif) => {
    switch (notif.type) {
      case 'game_day':
        return '/admin/schedule';
      case 'training_change':
        return '/coach/training-plans';
      case 'event':
        return '/admin/schedule';
      default:
        return null; // scoring, announcement, uniform → open modal
    }
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

    // Sort by date (newest first) — handle Firestore Timestamps
    return filtered.sort((a, b) => {
      const da = a.sentAt?.toDate ? a.sentAt.toDate() : new Date(a.sentAt || 0);
      const db2 = b.sentAt?.toDate ? b.sentAt.toDate() : new Date(b.sentAt || 0);
      return db2 - da;
    });
  }, [notifications, filter, searchTerm, currentUser]);

  // Unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.readBy?.includes(currentUser?.uid)).length;
  }, [notifications, currentUser]);

  // Handle notification click
  const handleNotificationClick = (notif) => {
    // Mark as read
    if (!notif.readBy?.includes(currentUser?.uid)) {
      updateDocument('notifications', notif.id, {
        readBy: [...(notif.readBy || []), currentUser?.uid]
      }).catch(err => console.error('Error marking notification read:', err));
      setNotifications(prev => prev.map(n =>
        n.id === notif.id
          ? { ...n, readBy: [...(n.readBy || []), currentUser?.uid] }
          : n
      ));
    }

    // Navigate or open modal
    const target = getNavigationTarget(notif);
    if (target) {
      navigate(target);
    } else {
      setSelectedNotification(notif);
    }
  };

  // Handle delete — mark as deleted in Firestore
  const handleDelete = async (notifId) => {
    try {
      await updateDocument('notifications', notifId, { deletedBy: [...(notifications.find(n => n.id === notifId)?.deletedBy || []), currentUser?.uid] });
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
    // Also remove from local state immediately for responsiveness
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

    // Write to Firestore
    setTogglingRead(notif.id);
    try {
      await updateDocument('notifications', notif.id, { readBy: newReadBy });
    } catch (error) {
      console.error('Error updating read status:', error);
    } finally {
      setTogglingRead(null);
    }
  };

  // Handle scoring confirmation
  const handleConfirmScoring = async (notif) => {
    const assignmentId = notif.scoringAssignmentId;
    if (!assignmentId) {
      alert('No scoring assignment linked to this notification.');
      return;
    }

    try {
      await updateDocument('scoring_assignments', assignmentId, {
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
        confirmedBy: currentUser.uid
      });

      // Update local state after Firestore write succeeds
      setScoringAssignments(prev => prev.map(a =>
        a.id === assignmentId ? { ...a, status: 'confirmed' } : a
      ));
      alert('Scoring duty confirmed! Thank you.');
    } catch (error) {
      console.error('Failed to confirm scoring:', error);
      alert('Failed to confirm. Please try again.');
    }
    setSelectedNotification(null);
  };

  // Get scoring assignment for notification
  const getScoringAssignment = (notif) => {
    if (notif.type !== 'scoring') return null;
    return scoringAssignments.find(a => a.id === notif.scoringAssignmentId);
  };

  // Get other parents for swap (from the same team as the notification)
  const getOtherParents = () => {
    const teamId = selectedNotification?.gameData?.teamId;
    const teamName = selectedNotification?.gameData?.team;

    // Find players from the same team using multiple matching strategies
    let teamPlayers = [];
    if (teamId || teamName) {
      teamPlayers = players?.filter(p => {
        if (teamId) {
          if (p.teamId === teamId) return true;
          if (p.team?.toLowerCase().replace(/\s+/g, '-') === teamId) return true;
        }
        if (teamName) {
          if (p.team === teamName) return true;
          if (p.teamName === teamName) return true;
        }
        return false;
      }) || [];
    }

    // Fallback: if no team-specific players found, use all players with parent info
    if (teamPlayers.length === 0) {
      teamPlayers = players?.filter(p =>
        (p.parentName || p.parent1Name) && (p.parentEmail || p.parent1Email)
      ) || [];
    }

    // Get parent info from players, excluding current user
    const parents = teamPlayers
      .map(p => ({
        id: p.parentId || p.id,
        name: p.parentName || p.parent1Name || `Parent of ${p.name}`,
        playerName: p.name,
        email: p.parentEmail || p.parent1Email
      }))
      .filter(p => p.email && p.email !== userProfile?.email);

    // Deduplicate by email
    const seen = new Set();
    return parents.filter(p => {
      if (seen.has(p.email)) return false;
      seen.add(p.email);
      return true;
    }).slice(0, 10);
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
        requestedById: currentUser?.uid,
        requestedByName: userProfile?.name || userProfile?.displayName || 'Parent',
        requestedByEmail: userProfile?.email,
        swapToId: swapTarget.id,
        swapToName: swapTarget.name,
        swapToEmail: swapTarget.email,
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

      // Update scoring assignment status in Firestore
      if (selectedNotification.scoringAssignmentId) {
        await updateDocument('scoring_assignments', selectedNotification.scoringAssignmentId, {
          status: 'swap_requested'
        });
      }

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

      // Update the scoring assignment to reflect the new scorer
      if (swap.assignmentId) {
        await updateDocument('scoring_assignments', swap.assignmentId, {
          assignedTo: currentUser.uid,
          assignedName: userProfile?.name || userProfile?.displayName || 'Parent',
          assignedEmail: userProfile?.email,
          status: 'confirmed'
        });
      }

      // Send notification to requesting parent
      await addDocument('notifications', {
        type: 'info',
        subject: 'Swap Request Accepted',
        message: `${userProfile?.name || 'The parent'} has accepted your swap request for ${swap.gameName}. They will now handle scoring duty for this game.`,
        priority: 'normal',
        targetAudience: { type: 'individual', userIds: [swap.requestedById] },
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
        targetAudience: { type: 'individual', userIds: [swap.requestedById] },
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
    const date = dateString?.toDate ? dateString.toDate() : new Date(dateString);
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
    <div className="min-h-screen bg-[#F5F9F5] text-gray-800 pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/welcome')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Notifications</h1>
            <p className="text-gray-500 text-sm">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-[#005028]' : 'hover:bg-gray-100'}`}
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
        <span className="hover:text-gray-800 cursor-pointer" onClick={() => navigate('/welcome')}>Home</span>
        <ChevronRight size={14} />
        <span className="text-gray-800">Notifications</span>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-4 mb-4">
          <div className="bg-white rounded-xl p-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-100 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-gray-800 placeholder-white/40 focus:outline-none focus:border-[#00A651]"
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
                      ? 'bg-[#005028] text-white'
                      : 'bg-gray-100 text-gray-600'
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
                      ? 'bg-white/60 opacity-75'
                      : 'bg-white border-l-4 border-[#00A651]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      notif.priority === 'urgent' ? 'bg-red-500/20' : isRead ? 'bg-gray-100' : 'bg-[#005028]/20'
                    }`}>
                      {isRead ? (
                        <MailOpen className="text-gray-400" size={20} />
                      ) : (
                        <Icon className={notif.priority === 'urgent' ? 'text-red-400' : 'text-[#00A651]'} size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium truncate ${isRead ? 'text-gray-500' : 'text-gray-800'}`}>
                          {notif.subject}
                        </h4>
                        {notif.priority === 'urgent' && (
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded">URGENT</span>
                        )}
                        {isRead && (
                          <span className="text-xs text-[#00A651]/60 flex items-center gap-0.5">
                            <Check size={10} />
                            Read
                          </span>
                        )}
                      </div>
                      <p className={`text-sm line-clamp-1 mt-0.5 ${isRead ? 'text-gray-400' : 'text-gray-400'}`}>
                        {notif.message.split('\n')[0]}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400">{formatDate(notif.sentAt)}</span>
                        <span className="text-xs text-gray-400 capitalize">{config?.label || notif.type}</span>
                        {assignment && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            assignment.status === 'confirmed'
                              ? 'bg-[#005028]/20 text-[#00A651]'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {assignment.status}
                          </span>
                        )}
                      </div>
                    </div>
                    {getNavigationTarget(notif) ? (
                      <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
                    ) : !isRead ? (
                      <div className="w-2 h-2 bg-[#005028] rounded-full flex-shrink-0 mt-2" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 text-center">
            <Bell className="mx-auto mb-3 text-gray-800/30" size={40} />
            <p className="text-gray-400 mb-2">No notifications</p>
            <p className="text-gray-800/30 text-sm">
              {filter !== 'all' ? 'Try changing your filter' : 'You\'re all caught up!'}
            </p>
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-white/10 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = getTypeIcon(selectedNotification.type);
                  return (
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedNotification.priority === 'urgent' ? 'bg-red-500/20' : 'bg-[#005028]/20'
                    }`}>
                      <Icon className={selectedNotification.priority === 'urgent' ? 'text-red-400' : 'text-[#00A651]'} size={20} />
                    </div>
                  );
                })()}
                <div>
                  <span className="text-xs text-gray-400 capitalize">
                    {NOTIFICATION_TYPE_CONFIG[selectedNotification.type]?.label}
                  </span>
                  <p className="text-xs text-gray-400">
                    {(selectedNotification.sentAt?.toDate ? selectedNotification.sentAt.toDate() : new Date(selectedNotification.sentAt)).toLocaleDateString('en-AU', {
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
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto p-4 max-h-[60vh]">
              <h2 className="text-lg font-bold mb-4">{selectedNotification.subject}</h2>

              {/* Game Info for Scoring */}
              {selectedNotification.gameData && (
                <div className="bg-gray-100 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="text-[#00A651]" size={16} />
                    <span className="font-medium">{selectedNotification.gameData.team} vs {selectedNotification.gameData.opponent}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
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
              <div className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
                {selectedNotification.message}
              </div>

              {/* Attachments */}
              {selectedNotification.attachments?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-400">Links:</p>
                  {selectedNotification.attachments.map((att, i) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-[#005028]/20 rounded-lg hover:bg-[#00A651]/30 transition-colors"
                    >
                      <ExternalLink size={16} className="text-[#00A651]" />
                      <span className="text-[#00A651] font-medium">{att.name}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="sticky bottom-0 bg-white border-t border-white/10 p-4">
              {/* Scoring Actions */}
              {selectedNotification.type === 'scoring' && (
                <div className="space-y-3">
                  {(() => {
                    const assignment = getScoringAssignment(selectedNotification);
                    if (assignment?.status === 'confirmed') {
                      return (
                        <div className="bg-[#005028]/20 rounded-lg p-3 text-center">
                          <CheckCheck className="mx-auto mb-1 text-[#00A651]" size={24} />
                          <p className="text-[#00A651] font-medium">Confirmed</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleConfirmScoring(selectedNotification)}
                          className="py-3 bg-[#005028] hover:bg-gray-100 rounded-lg font-medium flex items-center justify-center gap-2"
                        >
                          <Check size={18} />
                          Confirm
                        </button>
                        <button
                          onClick={() => setShowSwapModal(true)}
                          className="py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium flex items-center justify-center gap-2"
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
                    className="flex-1 py-2 bg-[#005028]/20 border border-[#00A651]/30 rounded-lg text-sm flex items-center justify-center gap-2 text-[#00A651] hover:bg-[#00A651]/30 transition-colors disabled:opacity-50"
                  >
                    {togglingRead === selectedNotification.id
                      ? <Loader2 size={16} className="animate-spin" />
                      : <CheckCheck size={16} />}
                    Read
                    <span className="text-xs text-gray-400 ml-1">(Tap to unread)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleRead(selectedNotification)}
                    disabled={togglingRead === selectedNotification.id}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
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
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-[#00A651]" />
              Request Swap
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Select another parent from the team to send a swap request:
            </p>

            {/* Game details */}
            {selectedNotification?.gameData && (
              <div className="bg-gray-100 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600">Scoring duty for:</p>
                <p className="font-medium">{selectedNotification.gameData.team} vs {selectedNotification.gameData.opponent}</p>
                <p className="text-sm text-gray-500">
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
                        ? 'bg-[#005028] text-white'
                        : 'bg-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-medium">{parent.name}</p>
                    <p className="text-sm opacity-70">Parent of {parent.playerName}</p>
                  </button>
                ))
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <User className="mx-auto mb-2" size={24} />
                  <p>No other parents available for swap</p>
                </div>
              )}
            </div>

            {/* Message field */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">
                <MessageSquare size={14} className="inline mr-1" />
                Message (optional):
              </label>
              <textarea
                value={swapMessage}
                onChange={(e) => setSwapMessage(e.target.value)}
                placeholder="e.g., Can you cover for me? I have a work commitment..."
                rows={3}
                className="w-full bg-gray-100 border border-white/20 rounded-lg px-3 py-2 text-gray-800 placeholder-white/40 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSwapModal(false);
                  setSwapTarget(null);
                  setSwapMessage('');
                }}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestSwap}
                disabled={!swapTarget || isSendingSwap}
                className="flex-1 py-2 bg-[#005028] hover:bg-gray-100 disabled:bg-gray-600 rounded-lg font-medium flex items-center justify-center gap-2"
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
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-blue-400" />
              Swap Request
            </h3>

            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <p className="font-medium">{selectedReceivedSwap.gameName}</p>
              <p className="text-sm text-gray-500">
                {selectedReceivedSwap.gameDate && new Date(selectedReceivedSwap.gameDate).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                {selectedReceivedSwap.gameTime && ` at ${selectedReceivedSwap.gameTime}`}
              </p>

              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-gray-600">
                  <User size={14} className="inline mr-1" />
                  Request from: <span className="font-medium text-gray-800">{selectedReceivedSwap.requestingParentName}</span>
                </p>
              </div>

              {selectedReceivedSwap.message && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-600 mb-1">
                    <MessageSquare size={14} className="inline mr-1" />
                    Message:
                  </p>
                  <p className="text-sm italic bg-gray-100 rounded p-2">"{selectedReceivedSwap.message}"</p>
                </div>
              )}
            </div>

            <p className="text-gray-600 text-sm mb-4">
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
                className="flex-1 py-2 bg-[#005028] hover:bg-gray-100 rounded-lg font-medium flex items-center justify-center gap-2"
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
              className="w-full mt-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
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
