/**
 * Notification Service
 *
 * Handles all notification-related operations including:
 * - Creating and sending notifications
 * - Managing scoring assignments
 * - Notification preferences
 * - Future: Email, SMS, and Push notification integration
 */

// Notification types
export const NOTIFICATION_TYPES = {
  SCORING: 'scoring',
  UNIFORM: 'uniform',
  ANNOUNCEMENT: 'announcement',
  GAME_DAY: 'game_day',
  TRAINING_CHANGE: 'training_change',
  EVENT: 'event'
};

export const NOTIFICATION_TYPE_CONFIG = {
  scoring: {
    label: 'Scoring Roster Reminder',
    icon: 'Calendar',
    color: 'blue',
    description: 'Remind parents about scoring duties'
  },
  uniform: {
    label: 'Uniform Information',
    icon: 'Shirt',
    color: 'purple',
    description: 'Uniform orders, sizing, and collection'
  },
  announcement: {
    label: 'Club Announcement',
    icon: 'Megaphone',
    color: 'green',
    description: 'General club announcements'
  },
  game_day: {
    label: 'Game Day Reminder',
    icon: 'Trophy',
    color: 'orange',
    description: 'Game day information and reminders'
  },
  training_change: {
    label: 'Training Schedule Change',
    icon: 'Clock',
    color: 'yellow',
    description: 'Training time or venue changes'
  },
  event: {
    label: 'Event/Social Announcement',
    icon: 'PartyPopper',
    color: 'pink',
    description: 'Club events and social activities'
  }
};

export const PRIORITY_LEVELS = {
  NORMAL: 'normal',
  URGENT: 'urgent'
};

export const AUDIENCE_TYPES = {
  ALL: 'all',
  AGE_GROUP: 'age_group',
  TEAM: 'team',
  INDIVIDUAL: 'individual'
};

// Scoring assignment statuses
export const SCORING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DECLINED: 'declined',
  SWAPPED: 'swapped'
};

// Default notification templates
export const NOTIFICATION_TEMPLATES = {
  scoring: {
    subject: 'Scoring Duty Reminder - {teamName} vs {opponent}',
    message: `Hi {parentName},

You're scheduled to score for {teamName} vs {opponent} on {gameDate} at {gameTime}.

Venue: {venue}

Please confirm your availability or request a swap if you're unable to attend.

Thank you for your support!

Emerald Lakers Basketball Club`
  },
  uniform: {
    subject: 'Uniform Information - {teamName}',
    message: `Hi {parentName},

Uniform orders are now open for {teamName}.

Order Deadline: {deadline}
Collection: {collectionInfo}

Click the link below to order:
{shopUrl}

If you have any questions about sizing, please refer to the attached size guide or contact the club.

Emerald Lakers Basketball Club`
  },
  game_day: {
    subject: 'Game Day Reminder - {teamName} vs {opponent}',
    message: `Hi {parentName},

This is a reminder that {playerName} has a game coming up:

{teamName} vs {opponent}
Date: {gameDate}
Time: {gameTime}
Venue: {venue}

Please ensure your player arrives 30 minutes before game time for warm-up.

Go Lakers!

Emerald Lakers Basketball Club`
  },
  training_change: {
    subject: 'Training Schedule Change - {teamName}',
    message: `Hi {parentName},

Please note the following change to training for {teamName}:

{changeDetails}

If you have any questions, please contact your coach.

Emerald Lakers Basketball Club`
  },
  announcement: {
    subject: 'Club Announcement - Emerald Lakers',
    message: `Hi everyone,

{announcementContent}

For more information, please contact the club or speak with your coach.

Emerald Lakers Basketball Club`
  },
  event: {
    subject: 'Upcoming Event - {eventName}',
    message: `Hi everyone,

You're invited to our upcoming event:

Event: {eventName}
Date: {eventDate}
Time: {eventTime}
Location: {eventLocation}

{eventDetails}

Please RSVP by {rsvpDate} if required.

We look forward to seeing you there!

Emerald Lakers Basketball Club`
  }
};

/**
 * Create a new notification
 * @param {object} notificationData - The notification data
 * @returns {object} The created notification object
 */
export const createNotification = (notificationData) => {
  const now = new Date().toISOString();

  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: notificationData.type || NOTIFICATION_TYPES.ANNOUNCEMENT,
    subject: notificationData.subject || '',
    message: notificationData.message || '',
    priority: notificationData.priority || PRIORITY_LEVELS.NORMAL,
    targetAudience: {
      type: notificationData.audienceType || AUDIENCE_TYPES.ALL,
      ageGroups: notificationData.ageGroups || [],
      teamIds: notificationData.teamIds || [],
      userIds: notificationData.userIds || []
    },
    attachments: notificationData.attachments || [],
    scheduledFor: notificationData.scheduledFor || null,
    sentAt: notificationData.sendImmediately ? now : null,
    status: notificationData.sendImmediately ? 'sent' : (notificationData.scheduledFor ? 'scheduled' : 'draft'),
    createdBy: notificationData.createdBy || '',
    createdAt: now,
    readBy: [],
    deletedBy: []
  };
};

/**
 * Create a scoring assignment
 * @param {object} assignmentData - The assignment data
 * @returns {object} The created assignment object
 */
export const createScoringAssignment = (assignmentData) => {
  const now = new Date().toISOString();

  return {
    id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    gameId: assignmentData.gameId,
    teamId: assignmentData.teamId,
    parentId: assignmentData.parentId,
    parentName: assignmentData.parentName,
    parentEmail: assignmentData.parentEmail || '',
    gameDate: assignmentData.gameDate,
    opponent: assignmentData.opponent,
    venue: assignmentData.venue,
    status: SCORING_STATUS.PENDING,
    notificationSentAt: null,
    confirmedAt: null,
    swapRequests: [],
    createdAt: now,
    updatedAt: now
  };
};

/**
 * Parse template with data
 * @param {string} template - The template string
 * @param {object} data - The data to insert
 * @returns {string} The parsed template
 */
export const parseTemplate = (template, data) => {
  let result = template;

  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value || '');
  });

  return result;
};

/**
 * Get unread notification count for a user
 * @param {array} notifications - Array of notifications
 * @param {string} userId - The user ID
 * @returns {number} Count of unread notifications
 */
export const getUnreadCount = (notifications, userId) => {
  return notifications.filter(n =>
    !n.readBy?.includes(userId) &&
    !n.deletedBy?.includes(userId) &&
    n.status === 'sent'
  ).length;
};

/**
 * Filter notifications for a specific user
 * @param {array} notifications - All notifications
 * @param {object} user - The user object
 * @returns {array} Filtered notifications
 */
export const filterNotificationsForUser = (notifications, user) => {
  if (!user) return [];

  return notifications.filter(n => {
    if (n.deletedBy?.includes(user.id)) return false;
    if (n.status !== 'sent') return false;

    const audience = n.targetAudience;

    switch (audience.type) {
      case AUDIENCE_TYPES.ALL:
        return true;
      case AUDIENCE_TYPES.AGE_GROUP:
        return audience.ageGroups?.some(ag =>
          user.team?.toLowerCase().includes(ag.toLowerCase())
        );
      case AUDIENCE_TYPES.TEAM:
        return audience.teamIds?.includes(user.teamId);
      case AUDIENCE_TYPES.INDIVIDUAL:
        return audience.userIds?.includes(user.id);
      default:
        return false;
    }
  });
};

/**
 * Mark notification as read
 * @param {object} notification - The notification
 * @param {string} userId - The user ID
 * @returns {object} Updated notification
 */
export const markAsRead = (notification, userId) => {
  if (!notification.readBy) {
    notification.readBy = [];
  }
  if (!notification.readBy.includes(userId)) {
    notification.readBy.push(userId);
  }
  return notification;
};

/**
 * Mark notification as deleted for user
 * @param {object} notification - The notification
 * @param {string} userId - The user ID
 * @returns {object} Updated notification
 */
export const markAsDeleted = (notification, userId) => {
  if (!notification.deletedBy) {
    notification.deletedBy = [];
  }
  if (!notification.deletedBy.includes(userId)) {
    notification.deletedBy.push(userId);
  }
  return notification;
};

// ============================================
// Future Integration Placeholders
// ============================================

/**
 * Send email notification (placeholder for future integration)
 * @param {string} userId - The user ID
 * @param {string} email - The email address
 * @param {string} subject - Email subject
 * @param {string} message - Email body
 * @returns {Promise<object>} Result
 */
export const sendEmailNotification = async (userId, email, subject, message) => {
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`[EMAIL PLACEHOLDER] To: ${email}, Subject: ${subject}`);

  return {
    success: false,
    message: 'Email service not yet configured',
    queued: true
  };
};

/**
 * Send SMS notification (placeholder for future integration)
 * @param {string} userId - The user ID
 * @param {string} phone - The phone number
 * @param {string} message - SMS message
 * @returns {Promise<object>} Result
 */
export const sendSMSNotification = async (userId, phone, message) => {
  // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
  console.log(`[SMS PLACEHOLDER] To: ${phone}, Message: ${message.substring(0, 50)}...`);

  return {
    success: false,
    message: 'SMS service not yet configured',
    queued: true
  };
};

/**
 * Send push notification (placeholder for future PWA integration)
 * @param {string} userId - The user ID
 * @param {string} fcmToken - The FCM token
 * @param {object} payload - Notification payload
 * @returns {Promise<object>} Result
 */
export const sendPushNotification = async (userId, fcmToken, payload) => {
  // TODO: Integrate with Firebase Cloud Messaging
  console.log(`[PUSH PLACEHOLDER] To: ${userId}, Title: ${payload.title}`);

  return {
    success: false,
    message: 'Push notifications not yet configured',
    queued: true
  };
};

/**
 * Request notification permission for PWA
 * @returns {Promise<string>} Permission status
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return 'denied';
};

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES = {
  scoring: { inApp: true, email: true, sms: false, push: true },
  uniform: { inApp: true, email: true, sms: false, push: false },
  announcement: { inApp: true, email: true, sms: false, push: false },
  game_day: { inApp: true, email: true, sms: false, push: true },
  training_change: { inApp: true, email: true, sms: true, push: true },
  event: { inApp: true, email: true, sms: false, push: false }
};

/**
 * Get default user preferences object for new users
 */
export const getDefaultUserPreferences = () => ({
  notifications: {
    inApp: true,
    email: true,
    sms: false,
    types: {
      scoring: true,
      gameDay: true,
      uniform: true,
      announcements: true,
      training: true,
      events: true
    }
  }
});

/**
 * Swap request statuses
 */
export const SWAP_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  CANCELLED: 'cancelled'
};

/**
 * Create a swap request
 * @param {object} data - Swap request data
 * @returns {object} The swap request object
 */
export const createSwapRequest = (data) => {
  const now = new Date().toISOString();
  return {
    id: `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    assignmentId: data.assignmentId,
    gameId: data.gameId,
    requestingParentId: data.requestingParentId,
    requestingParentName: data.requestingParentName,
    targetParentId: data.targetParentId,
    targetParentName: data.targetParentName,
    reason: data.reason || '',
    status: SWAP_STATUS.PENDING,
    createdAt: now,
    updatedAt: now,
    respondedAt: null
  };
};

/**
 * Send notification via multiple channels based on user preferences
 * @param {object} notification - The notification to send
 * @param {array} recipients - Array of recipient user objects with preferences
 * @returns {Promise<object>} Delivery results
 */
export const sendMultiChannelNotification = async (notification, recipients) => {
  const results = {
    inApp: 0,
    email: 0,
    sms: 0,
    push: 0,
    failed: 0,
    details: []
  };

  for (const recipient of recipients) {
    const prefs = recipient.preferences?.notifications || getDefaultUserPreferences().notifications;
    const typePrefs = prefs.types || {};
    const notifType = notification.type;

    // Check if user wants this notification type
    const typeMapping = {
      scoring: 'scoring',
      uniform: 'uniform',
      announcement: 'announcements',
      game_day: 'gameDay',
      training_change: 'training',
      event: 'events'
    };

    const typeKey = typeMapping[notifType] || 'announcements';
    if (typePrefs[typeKey] === false) {
      results.details.push({
        userId: recipient.id,
        status: 'skipped',
        reason: 'User disabled this notification type'
      });
      continue;
    }

    // Send via enabled channels
    if (prefs.inApp !== false) {
      results.inApp++;
      console.log(`[IN-APP] Notification sent to ${recipient.id}`);
    }

    if (prefs.email && recipient.email) {
      const emailResult = await sendEmailNotification(
        recipient.id,
        recipient.email,
        notification.subject,
        notification.message
      );
      if (emailResult.success || emailResult.queued) {
        results.email++;
      }
    }

    if (prefs.sms && recipient.phone) {
      const smsResult = await sendSMSNotification(
        recipient.id,
        recipient.phone,
        `${notification.subject}: ${notification.message.substring(0, 100)}...`
      );
      if (smsResult.success || smsResult.queued) {
        results.sms++;
      }
    }

    results.details.push({
      userId: recipient.id,
      status: 'sent',
      channels: {
        inApp: prefs.inApp !== false,
        email: prefs.email && !!recipient.email,
        sms: prefs.sms && !!recipient.phone
      }
    });
  }

  return results;
};

/**
 * Get recipients for a notification based on audience type
 * @param {object} notification - The notification
 * @param {array} players - All players
 * @param {array} users - All users (optional)
 * @returns {array} Array of recipients
 */
export const getNotificationRecipients = (notification, players, users = []) => {
  const audience = notification.targetAudience;

  switch (audience.type) {
    case AUDIENCE_TYPES.ALL:
      return players.map(p => ({
        id: p.id,
        email: p.parent1Email || p.email,
        phone: p.parent1Phone || p.phone,
        name: p.parent1Name || p.name,
        preferences: p.preferences
      }));

    case AUDIENCE_TYPES.AGE_GROUP:
      return players
        .filter(p => audience.ageGroups?.some(ag =>
          p.team?.toLowerCase().includes(ag.toLowerCase())
        ))
        .map(p => ({
          id: p.id,
          email: p.parent1Email || p.email,
          phone: p.parent1Phone || p.phone,
          name: p.parent1Name || p.name,
          preferences: p.preferences
        }));

    case AUDIENCE_TYPES.TEAM:
      return players
        .filter(p => audience.teamIds?.some(t =>
          p.team?.toLowerCase().replace(/\s+/g, '-') === t ||
          p.team === t
        ))
        .map(p => ({
          id: p.id,
          email: p.parent1Email || p.email,
          phone: p.parent1Phone || p.phone,
          name: p.parent1Name || p.name,
          preferences: p.preferences
        }));

    case AUDIENCE_TYPES.INDIVIDUAL:
      return (audience.userIds || []).map(userId => {
        const player = players.find(p => p.id === userId);
        const user = users.find(u => u.id === userId);
        return {
          id: userId,
          email: player?.parent1Email || user?.email,
          phone: player?.parent1Phone || user?.phone,
          name: player?.parent1Name || user?.name || 'Unknown',
          preferences: player?.preferences || user?.preferences
        };
      });

    default:
      return [];
  }
};

// Export service object
export const notificationService = {
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_CONFIG,
  PRIORITY_LEVELS,
  AUDIENCE_TYPES,
  SCORING_STATUS,
  NOTIFICATION_TEMPLATES,
  createNotification,
  createScoringAssignment,
  parseTemplate,
  getUnreadCount,
  filterNotificationsForUser,
  markAsRead,
  markAsDeleted,
  sendEmailNotification,
  sendSMSNotification,
  sendPushNotification,
  requestNotificationPermission,
  DEFAULT_NOTIFICATION_PREFERENCES
};

export default notificationService;
