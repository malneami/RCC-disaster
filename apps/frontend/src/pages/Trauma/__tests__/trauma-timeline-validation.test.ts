/**
 * Timeline Validation Test Functions for Trauma Case Creation
 * 
 * These tests validate the timeline logic warnings for trauma cases:
 * 1. Incident time cannot be after arrival time
 * 2. Transfer request cannot be before arrival
 * 3. Transfer arrival cannot be before transfer request
 * 4. Transfer arrival cannot be before initial arrival
 */

import { describe, it, expect } from 'vitest';

interface TimelineData {
  arrivalDateTime?: string;
  incidentDateTime?: string;
  transferRequestDateTime?: string;
  transferArrivalDateTime?: string;
}

interface TimelineWarning {
  field: string;
  message: string;
}

/**
 * Parse date string to Date object
 */
function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
}

/**
 * Validate timeline and return warnings
 */
function validateTimeline(data: TimelineData): TimelineWarning[] {
  const warnings: TimelineWarning[] = [];

  const arrivalTime = parseDate(data.arrivalDateTime);
  const incidentTime = parseDate(data.incidentDateTime);
  const transferRequestTime = parseDate(data.transferRequestDateTime);
  const transferArrivalTime = parseDate(data.transferArrivalDateTime);

  // 1. Incident time cannot be after arrival time
  if (incidentTime && arrivalTime && incidentTime > arrivalTime) {
    warnings.push({
      field: 'incidentDetails.incidentDateTime',
      message: 'Incident time happens after arrival time. Please confirm the order of events.',
    });
  }

  // 2. Transfer request cannot be before arrival
  if (transferRequestTime && arrivalTime && transferRequestTime < arrivalTime) {
    warnings.push({
      field: 'incidentDetails.transferRequestDateTime',
      message: 'Transfer request is logged before arrival. Confirm the request time.',
    });
  }

  // 3. Transfer arrival cannot be before transfer request
  if (transferArrivalTime && transferRequestTime && transferArrivalTime < transferRequestTime) {
    warnings.push({
      field: 'incidentDetails.transferArrivalDateTime',
      message: 'Transfer arrival is before the request. Please correct these times.',
    });
  }

  // 4. Transfer arrival cannot be before initial arrival
  if (transferArrivalTime && arrivalTime && transferArrivalTime < arrivalTime) {
    warnings.push({
      field: 'incidentDetails.transferArrivalDateTime',
      message: 'Transfer arrival is before initial arrival. Check both timestamps.',
    });
  }

  return warnings;
}

describe('Trauma Timeline Validation', () => {
  describe('Incident Time vs Arrival Time', () => {
    it('TC-061: Should allow incident time before arrival time', () => {
      const data: TimelineData = {
        arrivalDateTime: '2025-11-10T14:00:00',
        incidentDateTime: '2025-11-10T13:30:00',
      };

      const warnings = validateTimeline(data);
      expect(warnings).toHaveLength(0);
    });

    it('TC-062: Should allow incident time same as arrival time', () => {
      const data: TimelineData = {
        arrivalDateTime: '2025-11-10T14:00:00',
        incidentDateTime: '2025-11-10T14:00:00',
      };

      const warnings = validateTimeline(data);
      expect(warnings).toHaveLength(0);
    });

    it('TC-063: Should warn when incident time is after arrival time', () => {
      const data: TimelineData = {
        arrivalDateTime: '2025-11-10T14:00:00',
        incidentDateTime: '2025-11-10T14:30:00',
      };

      const warnings = validateTimeline(data);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].field).toBe('incidentDetails.incidentDateTime');
      expect(warnings[0].message).toBe('Incident time happens after arrival time. Please confirm the order of events.');
    });

    it('TC-064: Should clear warning when incident time is corrected', () => {
      // First, create a warning
      const invalidData: TimelineData = {
        arrivalDateTime: '2025-11-10T14:00:00',
        incidentDateTime: '2025-11-10T14:30:00',
      };
      const warningsBefore = validateTimeline(invalidData);
      expect(warningsBefore).toHaveLength(1);

      // Then, correct it
      const validData: TimelineData = {
        arrivalDateTime: '2025-11-10T14:00:00',
        incidentDateTime: '2025-11-10T13:30:00',
      };
      const warningsAfter = validateTimeline(validData);
      expect(warningsAfter).toHaveLength(0);
    });
  });

  describe('Transfer Request Time vs Arrival Time', () => {
    it('TC-065: Should allow transfer request time after arrival time', () => {
      const data: TimelineData = {
        arrivalDateTime: '2025-11-10T14:00:00',
        transferRequestDateTime: '2025-11-10T14:30:00',
      };

      const warnings = validateTimeline(data);
      expect(warnings).toHaveLength(0);
    });

    it('TC-066: Should warn when transfer request time is before arrival time', () => {
      const data: TimelineData = {
        arrivalDateTime: '2025-11-10T14:00:00',
        transferRequestDateTime: '2025-11-10T13:30:00',
      };

      const warnings = validateTimeline(data);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].field).toBe('incidentDetails.transferRequestDateTime');
      expect(warnings[0].message).toBe('Transfer request is logged before arrival. Confirm the request time.');
    });

    it('Should allow transfer request time same as arrival time', () => {
      const data: TimelineData = {
        arrivalDateTime: '2025-11-10T14:00:00',
        transferRequestDateTime: '2025-11-10T14:00:00',
      };

      const warnings = validateTimeline(data);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('Transfer Arrival Time vs Transfer Request Time', () => {
    it('TC-067: Should allow transfer arrival time after transfer request time', () => {
      const data: TimelineData = {
        transferRequestDateTime: '2025-11-10T14:00:00',
        transferArrivalDateTime: '2025-11-10T14:30:00',
      };

      const warnings = validateTimeline(data);
      expect(warnings).toHaveLength(0);
    });

    it('TC-068: Should warn when transfer arrival time is before transfer request time', () => {
      const data: TimelineData = {
        transferRequestDateTime: '2025-11-10T14:00:00',
        transferArrivalDateTime: '2025-11-10T13:30:00',
      };

      const warnings = validateTimeline(data);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].field).toBe('incidentDetails.transferArrivalDateTime');
      expect(warnings[0].message).toBe('Transfer arrival is before the request. Please correct these times.');
    });

    it('Should allow transfer arrival time same as transfer request time', () => {
      const data: TimelineData = {
        transferRequestDateTime: '2025-11-10T14:00:00',
        transferArrivalDateTime: '2025-11-10T14:00:00',
      };

      const warnings = validateTimeline(data);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('Transfer Arrival Time vs Initial Arrival Time', () => {
    it('TC-068A: Should warn when transfer arrival time is before initial arrival time', () => {
      const data: TimelineData = {
        arrivalDateTime: '2025-11-10T14:00:00',
        transferArrivalDateTime: '2025-11-10T13:30:00',
      };

      const warnings = validateTimeline(data);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].field).toBe('incidentDetails.transferArrivalDateTime');
      expect(warnings[0].message).toBe('Transfer arrival is before initial arrival. Check both timestamps.');
    });

    it('Should allow transfer arrival time after initial arrival time', () => {
      const data: TimelineData = {
        arrivalDateTime: '2025-11-10T14:00:00',
        transferArrivalDateTime: '2025-11-10T14:30:00',
      };

      const warnings = validateTimeline(data);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('Multiple Timeline Warnings', () => {
    it('Should detect multiple warnings simultaneously', () => {
      const data: TimelineData = {
        arrivalDateTime: '2025-11-10T14:00:00',
        incidentDateTime: '2025-11-10T14:30:00', // After arrival - warning
        transferRequestDateTime: '2025-11-10T13:30:00', // Before arrival - warning
        transferArrivalDateTime: '2025-11-10T13:00:00', // Before request and arrival - multiple warnings
      };

      const warnings = validateTimeline(data);
      expect(warnings.length).toBeGreaterThan(1);
      
      // Should have incident time warning
      expect(warnings.some(w => w.field === 'incidentDetails.incidentDateTime')).toBe(true);
      
      // Should have transfer request warning
      expect(warnings.some(w => w.field === 'incidentDetails.transferRequestDateTime')).toBe(true);
      
      // Should have transfer arrival warnings
      const transferArrivalWarnings = warnings.filter(
        w => w.field === 'incidentDetails.transferArrivalDateTime'
      );
      expect(transferArrivalWarnings.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('Should handle missing dates gracefully', () => {
      const data: TimelineData = {
        arrivalDateTime: '2025-11-10T14:00:00',
        // Other dates are undefined
      };

      const warnings = validateTimeline(data);
      expect(warnings).toHaveLength(0);
    });

    it('Should handle invalid date strings', () => {
      const data: TimelineData = {
        arrivalDateTime: 'invalid-date',
        incidentDateTime: '2025-11-10T14:30:00',
      };

      const warnings = validateTimeline(data);
      // Invalid dates should be parsed as null and not cause warnings
      expect(warnings).toHaveLength(0);
    });

    it('Should handle empty strings', () => {
      const data: TimelineData = {
        arrivalDateTime: '',
        incidentDateTime: '2025-11-10T14:30:00',
      };

      const warnings = validateTimeline(data);
      expect(warnings).toHaveLength(0);
    });

    it('TC-095: Should allow exact same times', () => {
      const data: TimelineData = {
        arrivalDateTime: '2025-11-10T14:00:00',
        incidentDateTime: '2025-11-10T14:00:00',
        transferRequestDateTime: '2025-11-10T14:00:00',
        transferArrivalDateTime: '2025-11-10T14:00:00',
      };

      const warnings = validateTimeline(data);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('Form Submission Blocking', () => {
    it('TC-078: Should prevent submission when timeline warnings exist', () => {
      const data: TimelineData = {
        arrivalDateTime: '2025-11-10T14:00:00',
        incidentDateTime: '2025-11-10T14:30:00', // Warning
      };

      const warnings = validateTimeline(data);
      const canSubmit = warnings.length === 0;
      
      expect(warnings.length).toBeGreaterThan(0);
      expect(canSubmit).toBe(false);
    });

    it('TC-079: Should allow submission when no timeline warnings exist', () => {
      const data: TimelineData = {
        arrivalDateTime: '2025-11-10T14:00:00',
        incidentDateTime: '2025-11-10T13:30:00',
        transferRequestDateTime: '2025-11-10T14:30:00',
        transferArrivalDateTime: '2025-11-10T15:00:00',
      };

      const warnings = validateTimeline(data);
      const canSubmit = warnings.length === 0;
      
      expect(warnings).toHaveLength(0);
      expect(canSubmit).toBe(true);
    });
  });

  describe('Real-time Validation Updates', () => {
    it('TC-088: Should update warnings in real-time when times change', () => {
      // Start with valid data
      let data: TimelineData = {
        arrivalDateTime: '2025-11-10T14:00:00',
        incidentDateTime: '2025-11-10T13:30:00',
      };
      let warnings = validateTimeline(data);
      expect(warnings).toHaveLength(0);

      // Change to invalid (incident after arrival)
      data.incidentDateTime = '2025-11-10T14:30:00';
      warnings = validateTimeline(data);
      expect(warnings).toHaveLength(1);

      // Fix it back
      data.incidentDateTime = '2025-11-10T13:30:00';
      warnings = validateTimeline(data);
      expect(warnings).toHaveLength(0);
    });
  });
});

/**
 * Integration test helper function
 * This can be used in E2E tests to validate timeline warnings in the UI
 */
export function validateTimelineInForm(formData: TimelineData): {
  hasWarnings: boolean;
  warnings: TimelineWarning[];
  canSubmit: boolean;
} {
  const warnings = validateTimeline(formData);
  return {
    hasWarnings: warnings.length > 0,
    warnings,
    canSubmit: warnings.length === 0,
  };
}

/**
 * Helper function to format warnings for display in Review step
 */
export function formatTimelineWarningsForReview(warnings: TimelineWarning[]): {
  field: string;
  message: string;
  keywords: string[];
}[] {
  return warnings.map(warning => {
    // Extract keywords from message (words that should be bolded)
    const keywords: string[] = [];
    
    if (warning.message.includes('Incident time')) keywords.push('Incident time');
    if (warning.message.includes('arrival time')) keywords.push('arrival time');
    if (warning.message.includes('Transfer request')) keywords.push('Transfer request');
    if (warning.message.includes('Transfer arrival')) keywords.push('Transfer arrival');
    if (warning.message.includes('initial arrival')) keywords.push('initial arrival');
    if (warning.message.includes('request')) keywords.push('request');
    
    return {
      ...warning,
      keywords: [...new Set(keywords)], // Remove duplicates
    };
  });
}

