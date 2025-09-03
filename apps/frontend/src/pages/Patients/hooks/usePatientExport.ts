import { useState } from 'react';
import { Patient } from '../../../services/patientService';
import { patientService } from '../../../services/patientService';
import { ExportOptions } from '../../../components/common/ExportDialog';
import { downloadFile, isPdfFile, validatePdfContent, sanitizeFilename } from '../../../utils/fileUtils';

export const usePatientExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportPatient = async (patient: Patient, options: ExportOptions) => {
    try {
      setLoading(true);
      setError(null);

      const blob = await patientService.exportPatient(patient.id, options.format, {
        includeMedicalRecords: options.includeMedicalRecords,
        includeAccessLogs: options.includeAccessLogs,
      });

      // Validate PDF content if it's a PDF file
      if (options.format === 'PDF' && isPdfFile(blob)) {
        const isValidPdf = await validatePdfContent(blob);
        if (!isValidPdf) {
          throw new Error('Invalid PDF file received from server');
        }
      }

      // Create filename
      const filename = sanitizeFilename(`patient-${patient.firstName}-${patient.lastName}-${patient.id}.${options.format.toLowerCase()}`);

      // Download the file
      downloadFile(blob, filename);

      return blob;
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export patient data. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportMultiplePatients = async (patients: Patient[], options: ExportOptions) => {
    try {
      setLoading(true);
      setError(null);

      // For multiple patients, we'll create a ZIP file or combine them
      // For now, we'll export them individually
      const promises = patients.map(patient => 
        patientService.exportPatient(patient.id, options.format, {
          includeMedicalRecords: options.includeMedicalRecords,
          includeAccessLogs: options.includeAccessLogs,
        })
      );

      const blobs = await Promise.all(promises);

      // Create a ZIP file or download them individually
      if (blobs.length === 1) {
        const blob = blobs[0];
        const filename = sanitizeFilename(`patient-${patients[0].firstName}-${patients[0].lastName}.${options.format.toLowerCase()}`);
        downloadFile(blob, filename);
      } else {
        // For multiple files, we could implement ZIP creation here
        // For now, download them individually
        blobs.forEach((blob, index) => {
          const patient = patients[index];
          const filename = sanitizeFilename(`patient-${patient.firstName}-${patient.lastName}-${patient.id}.${options.format.toLowerCase()}`);
          downloadFile(blob, filename);
        });
      }

      return blobs;
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export patient data. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    loading,
    error,
    exportPatient,
    exportMultiplePatients,
    clearError,
  };
};
