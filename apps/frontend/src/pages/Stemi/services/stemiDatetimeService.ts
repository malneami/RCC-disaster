/**
 * STEMI Datetime Service
 * Handles datetime formatting and conversion for STEMI cases
 */

export class StemiDatetimeService {
  /**
   * Converts local datetime string to UTC for backend storage
   * @param localDateTimeString - Local datetime string (e.g., "2024-01-15T17:30")
   * @returns UTC ISO string (e.g., "2024-01-15T14:30:00.000Z")
   */
  static formatForUTC(localDateTimeString: string): string {
    if (!localDateTimeString) return '';
    
    const date = new Date(localDateTimeString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string provided to formatForUTC:', localDateTimeString);
      return '';
    }
    
    return date.toISOString();
  }

  /**
   * Converts UTC string to local datetime for display
   * @param utcString - UTC date string (e.g., "2024-01-15T14:30:00.000Z")
   * @returns Local datetime string (e.g., "2024-01-15T17:30")
   */
  static formatForLocal(utcString: string): string {
    if (!utcString) return '';
    
    const date = new Date(utcString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string provided to formatForLocal:', utcString);
      return '';
    }
    
    // Use local timezone methods (getFullYear, getMonth, etc. return local timezone values)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /**
   * Formats datetime for display in UI
   * @param dateString - Date string (UTC or local)
   * @returns Formatted string for display
   */
  static formatForDisplay(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Calculates time difference in minutes between two datetime strings
   * @param startTime - Start time (UTC string)
   * @param endTime - End time (UTC string)
   * @returns Difference in minutes
   */
  static calculateTimeDifference(startTime: string, endTime: string): number {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }
    
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
  }

  /**
   * Gets current datetime in local format for form inputs
   * @returns Current datetime in local format
   */
  static getCurrentLocalDateTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /**
   * Validates if a datetime string is valid
   * @param dateString - Date string to validate
   * @returns True if valid, false otherwise
   */
  static isValidDateTime(dateString: string): boolean {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
}

