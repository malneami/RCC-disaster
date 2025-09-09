/**
 * DateTime Helper Functions
 * Utilities for handling date and time conversions in the EMS application
 */

/**
 * Converts UTC string to datetime-local input format
 * @param utcString - UTC date string (e.g., "2024-01-15T14:30:00.000Z")
 * @returns Formatted string for datetime-local input (e.g., "2024-01-15T17:30")
 */
export const formatForDateTimeLocal = (utcString: string): string => {
  if (!utcString) return '';
  
  const date = new Date(utcString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string provided to formatForDateTimeLocal:', utcString);
    return '';
  }
  
  // Use local timezone methods (getFullYear, getMonth, etc. return local timezone values)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Alternative implementation using explicit timezone conversion
 * Converts UTC string to datetime-local input format with explicit timezone handling
 * @param utcString - UTC date string (e.g., "2024-01-15T14:30:00.000Z")
 * @param timezone - Optional timezone (defaults to user's timezone)
 * @returns Formatted string for datetime-local input (e.g., "2024-01-15T17:30")
 */
export const formatForDateTimeLocalWithTimezone = (
  utcString: string, 
  timezone?: string
): string => {
  if (!utcString) return '';
  
  const date = new Date(utcString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string provided to formatForDateTimeLocalWithTimezone:', utcString);
    return '';
  }
  
  const targetTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Use Intl.DateTimeFormat to get local time in specific timezone
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: targetTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;
  const hour = parts.find(part => part.type === 'hour')?.value;
  const minute = parts.find(part => part.type === 'minute')?.value;
  
  return `${year}-${month}-${day}T${hour}:${minute}`;
};
/**
 * Converts local datetime string to UTC for backend storage
 * @param localDateTimeString - Local datetime string (e.g., "2024-01-15T17:30")
 * @returns UTC ISO string (e.g., "2024-01-15T14:30:00.000Z")
 */
export const formatForUTC = (localDateTimeString: string): string => {
  if (!localDateTimeString) return '';
  
  const date = new Date(localDateTimeString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string provided to formatForUTC:', localDateTimeString);
    return '';
  }
  
  return date.toISOString();
};

/**
 * Formats UTC string for display in local timezone
 * @param utcString - UTC date string
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted local time string
 */
export const formatForDisplay = (
  utcString: string, 
  options: Intl.DateTimeFormatOptions = {}
): string => {
  if (!utcString) return '';
  
  const date = new Date(utcString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string provided to formatForDisplay:', utcString);
    return '';
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...options
  };
  
  return date.toLocaleString(undefined, defaultOptions);
};

/**
 * Gets current time in UTC format
 * @returns Current UTC ISO string
 */
export const getCurrentUTC = (): string => {
  return new Date().toISOString();
};

/**
 * Gets current time in datetime-local format
 * @returns Current local time in datetime-local format
 */
export const getCurrentDateTimeLocal = (): string => {
  return formatForDateTimeLocal(getCurrentUTC());
};

/**
 * Validates if a string is a valid ISO date
 * @param dateString - Date string to validate
 * @returns True if valid ISO date, false otherwise
 */
export const isValidISODate = (dateString: string): boolean => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.includes('T');
};

/**
 * Converts datetime-local input to UTC and back to datetime-local
 * Useful for ensuring consistent timezone handling
 * @param localDateTimeString - Local datetime string
 * @returns Normalized datetime-local string
 */
export const normalizeDateTimeLocal = (localDateTimeString: string): string => {
  if (!localDateTimeString) return '';
  
  const utc = formatForUTC(localDateTimeString);
  return formatForDateTimeLocal(utc);
};

/**
 * Gets timezone offset in minutes
 * @returns Timezone offset in minutes from UTC
 */
export const getTimezoneOffset = (): number => {
  return new Date().getTimezoneOffset();
};

/**
 * Gets user's timezone
 * @returns User's timezone string (e.g., "Asia/Riyadh")
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};
