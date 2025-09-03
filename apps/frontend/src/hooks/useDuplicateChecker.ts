import { useState, useEffect, useCallback } from 'react';
import { Patient, patientService } from '../services/patientService';

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  duplicates: Patient[];
  loading: boolean;
  error: string | null;
}

export interface UseDuplicateCheckerProps {
  nationalId?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  enabled?: boolean;
  debounceMs?: number;
}

export const useDuplicateChecker = ({
  nationalId,
  firstName,
  lastName,
  dateOfBirth,
  enabled = true,
  debounceMs = 500,
}: UseDuplicateCheckerProps): DuplicateCheckResult => {
  const [duplicates, setDuplicates] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDuplicates = useCallback(async () => {
    if (!enabled) return;

    // Don't check if we don't have enough data
    if (!nationalId && !firstName && !lastName) {
      setDuplicates([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const results: Patient[] = [];

      // Check by national ID if provided
      if (nationalId && nationalId.trim().length >= 2) {
        try {
          const nationalIdResults = await patientService.searchPatients(nationalId);
          const exactNationalIdMatches = nationalIdResults.filter(
            patient => patient.nationalId === nationalId
          );
          results.push(...exactNationalIdMatches);
        } catch (err) {
          console.error('Error checking national ID duplicates:', err);
        }
      }

      // Check by name if provided
      if (firstName && lastName && firstName.trim() && lastName.trim()) {
        try {
          const nameResults = await patientService.searchPatients(`${firstName} ${lastName}`);
          const nameMatches = nameResults.filter(patient => {
            const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
            const searchName = `${firstName} ${lastName}`.toLowerCase();
            return fullName.includes(searchName) || searchName.includes(fullName);
          });
          results.push(...nameMatches);
        } catch (err) {
          console.error('Error checking name duplicates:', err);
        }
      }

      // Remove duplicates based on patient ID
      const uniqueDuplicates = results.filter((patient, index, self) => 
        index === self.findIndex(p => p.id === patient.id)
      );

      setDuplicates(uniqueDuplicates);
    } catch (err) {
      console.error('Error checking duplicates:', err);
      setError('Failed to check for duplicates');
    } finally {
      setLoading(false);
    }
  }, [nationalId, firstName, lastName, dateOfBirth, enabled]);

  // Debounced effect for duplicate checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkDuplicates();
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [checkDuplicates, debounceMs]);

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
    loading,
    error,
  };
};
