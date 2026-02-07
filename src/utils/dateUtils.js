/**
 * Australian Date Formatting Utilities
 * All dates displayed in DD/MM/YYYY format
 * All times in 12-hour format with AM/PM
 */

/**
 * Convert Firestore Timestamp or various date formats to JavaScript Date
 * Handles: Firestore Timestamp, ISO string, YYYY-MM-DD string, Date object, timestamp with seconds
 * @param {any} dateValue - The date value to convert
 * @returns {Date|null} JavaScript Date object or null if invalid
 */
export const toJsDate = (dateValue) => {
  if (!dateValue) return null;

  // Already a Date object
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }

  // Firestore Timestamp (has toDate method)
  if (typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }

  // Firestore Timestamp from JSON serialization (has seconds property)
  if (dateValue.seconds !== undefined) {
    return new Date(dateValue.seconds * 1000);
  }

  // String date
  if (typeof dateValue === 'string') {
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? null : d;
  }

  // Number (timestamp in milliseconds)
  if (typeof dateValue === 'number') {
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
};

/**
 * Format a date to Australian format (DD/MM/YYYY)
 * @param {Date|string|number} date - The date to format
 * @returns {string} Formatted date string (e.g., "17/02/2026")
 */
export const formatDateAU = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Format a date to Australian long format
 * @param {Date|string|number} date - The date to format
 * @returns {string} Formatted date string (e.g., "Saturday, 17 February 2026")
 */
export const formatDateLongAU = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Format a date to Australian medium format
 * @param {Date|string|number} date - The date to format
 * @returns {string} Formatted date string (e.g., "Sat, 17 Feb 2026")
 */
export const formatDateMediumAU = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Format a date to short Australian format without year
 * @param {Date|string|number} date - The date to format
 * @returns {string} Formatted date string (e.g., "Sat, 17 Feb")
 */
export const formatDateShortAU = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
};

/**
 * Format time to 12-hour format with AM/PM
 * @param {Date|string|number} date - The date/time to format
 * @returns {string} Formatted time string (e.g., "10:00 AM")
 */
export const formatTimeAU = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format a time string (HH:MM) to 12-hour format with AM/PM
 * @param {string} timeString - Time in 24-hour format (e.g., "14:30")
 * @returns {string} Formatted time string (e.g., "2:30 PM")
 */
export const formatTimeStringAU = (timeString) => {
  if (!timeString) return '';

  // Handle already formatted times (e.g., "10:00 AM")
  if (timeString.toLowerCase().includes('am') || timeString.toLowerCase().includes('pm')) {
    return timeString;
  }

  const [hours, minutes] = timeString.split(':').map(Number);
  if (isNaN(hours)) return timeString;

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = (minutes || 0).toString().padStart(2, '0');

  return `${displayHours}:${displayMinutes} ${period}`;
};

/**
 * Format a date and time together in Australian format
 * @param {Date|string|number} date - The date to format
 * @returns {string} Formatted datetime string (e.g., "17/02/2026 at 10:00 AM")
 */
export const formatDateTimeAU = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return `${formatDateAU(d)} at ${formatTimeAU(d)}`;
};

/**
 * Format a date and time for game display
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @param {string} timeStr - Time string (HH:MM)
 * @returns {string} Formatted string (e.g., "Sat 17 Feb, 10:00 AM")
 */
export const formatGameDateTime = (dateStr, timeStr) => {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const formattedDate = date.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const formattedTime = formatTimeStringAU(timeStr);

  return timeStr ? `${formattedDate}, ${formattedTime}` : formattedDate;
};

/**
 * Get the next Saturday from a given date
 * @param {number} weeksFromNow - Number of weeks ahead
 * @returns {Date} The next Saturday date
 */
export const getNextSaturday = (weeksFromNow = 0) => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  const nextSat = new Date(today);
  nextSat.setDate(today.getDate() + daysUntilSaturday + (weeksFromNow * 7));
  // Reset time to noon to avoid timezone issues
  nextSat.setHours(12, 0, 0, 0);
  return nextSat;
};

/**
 * Format date for storage (YYYY-MM-DD format for consistency)
 * @param {Date} date - The date to format
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
export const formatDateForStorage = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Parse an Australian format date string (DD/MM/YYYY)
 * @param {string} dateStr - Date string in DD/MM/YYYY format
 * @returns {Date|null} Parsed Date object or null if invalid
 */
export const parseDateAU = (dateStr) => {
  if (!dateStr) return null;

  // Handle YYYY-MM-DD format
  if (dateStr.includes('-')) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  // Handle DD/MM/YYYY format
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;

  const [day, month, year] = parts.map(Number);
  const d = new Date(year, month - 1, day);

  return isNaN(d.getTime()) ? null : d;
};

/**
 * Check if a date is in the future
 * @param {Date|string} date - The date to check
 * @returns {boolean} True if date is in the future
 */
export const isFutureDate = (date) => {
  if (!date) return false;
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
};

/**
 * Get relative date description
 * @param {Date|string} date - The date to describe
 * @returns {string} Relative description (e.g., "Today", "Tomorrow", "In 3 days")
 */
export const getRelativeDateDescription = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  const diffTime = d.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return formatDateAU(date);
};

/**
 * Convert a date to the current year (2026)
 * Used for fixing dates that were incorrectly set to old years
 * @param {Date|string} date - The date to convert
 * @param {number} targetYear - The year to set (default: current year)
 * @returns {Date} New date with updated year
 */
export const convertToCurrentYear = (date, targetYear = new Date().getFullYear()) => {
  if (!date) return new Date();
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date();

  d.setFullYear(targetYear);
  return d;
};

export default {
  toJsDate,
  formatDateAU,
  formatDateLongAU,
  formatDateMediumAU,
  formatDateShortAU,
  formatTimeAU,
  formatTimeStringAU,
  formatDateTimeAU,
  formatGameDateTime,
  getNextSaturday,
  formatDateForStorage,
  parseDateAU,
  isFutureDate,
  getRelativeDateDescription,
  convertToCurrentYear
};
