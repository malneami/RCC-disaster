import { Injectable } from '@nestjs/common';

@Injectable()
export class TraumaDatetimeService {
  /**
   * Converts local datetime string to UTC for backend storage
   * @param localDateTimeString - Local datetime string (e.g., "2024-01-15T17:30")
   * @returns UTC ISO string (e.g., "2024-01-15T14:30:00.000Z")
   */
  formatForUTC(localDateTimeString: string): string {
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
  formatForLocal(utcString: string): string {
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
   * Calculates response time in minutes between incident and arrival
   * @param incidentDateTime - Incident datetime string
   * @param arrivalDateTime - Arrival datetime string
   * @returns Response time in minutes
   */
  calculateResponseTime(incidentDateTime: string, arrivalDateTime: string): number | null {
    if (!incidentDateTime || !arrivalDateTime) return null;
    
    const incident = new Date(incidentDateTime);
    const arrival = new Date(arrivalDateTime);
    
    if (isNaN(incident.getTime()) || isNaN(arrival.getTime())) return null;
    
    return Math.floor((arrival.getTime() - incident.getTime()) / (1000 * 60));
  }

  /**
   * Gets current UTC datetime
   * @returns Current UTC ISO string
   */
  getCurrentUTC(): string {
    return new Date().toISOString();
  }

  /**
   * Validates if a datetime string is valid
   * @param dateString - Date string to validate
   * @returns True if valid, false otherwise
   */
  isValidDateTime(dateString: string): boolean {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
}
