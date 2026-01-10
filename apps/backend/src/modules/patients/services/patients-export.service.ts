import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import * as PDFDocument from 'pdfkit';
import { AccessLogService, EntityType } from '../../../common/services/access-log.service';
import * as path from 'path';
import * as fs from 'fs';

// Helper function to detect if text contains Arabic characters
function hasArabicText(text: string): boolean {
  if (!text) return false;
  // Arabic Unicode range: \u0600-\u06FF (Arabic) and \u0750-\u077F (Arabic Supplement)
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
  return arabicPattern.test(text);
}

// Get the path to a font that supports Arabic
function getArabicFontPath(): string | null {
  const possiblePaths = [
    'C:\\Windows\\Fonts\\arial.ttf',
    'C:\\Windows\\Fonts\\tahoma.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', // Linux
    '/System/Library/Fonts/Arial.ttf', // macOS
  ];

  for (const fontPath of possiblePaths) {
    if (fs.existsSync(fontPath)) {
      return fontPath;
    }
  }
  return null;
}

// Sanitize text for use in PDF metadata/filename (remove Arabic characters)
// This prevents PDFKit from crashing when processing document info with Arabic text
function sanitizeForPdfMeta(text: string): string {
  if (!text) return 'Unknown';
  // Remove Arabic characters and replace with empty string
  const sanitized = text.replace(/[\u0600-\u06FF\u0750-\u077F]/g, '').trim();
  return sanitized || 'Patient';
}

// Sanitize text for PDF content - if Arabic is detected, indicate it clearly
// PDFKit's Helvetica font cannot render Arabic and will hang/crash
function safeText(text: string | null | undefined): string {
  if (!text) return 'N/A';
  const textStr = String(text);
  if (hasArabicText(textStr)) {
    // Strip Arabic characters and add indicator if content had Arabic
    const sanitized = textStr.replace(/[\u0600-\u06FF\u0750-\u077F]/g, '').trim();
    if (sanitized) {
      return `${sanitized} [Arabic text removed - use JSON/CSV export]`;
    }
    return '[Arabic content - use JSON/CSV export]';
  }
  return textStr;
}


@Injectable()
export class PatientsExportService {
  private arabicFontPath: string | null = null;

  constructor(
    private prisma: PrismaService,
    private accessLogService: AccessLogService,
  ) {
    // Try to find an Arabic-supporting font at initialization
    this.arabicFontPath = getArabicFontPath();
    if (this.arabicFontPath) {
      console.log(`Arabic font found at: ${this.arabicFontPath}`);
    } else {
      console.warn('No Arabic-supporting font found. Arabic text in PDFs may not render correctly.');
    }
  }


  async exportPatient(
    id: string,
    format: 'PDF' | 'JSON' | 'CSV' = 'PDF',
    options: {
      includeMedicalRecords?: boolean;
      includeAccessLogs?: boolean;
      includeTickets?: boolean;
    } = {},
    userId: string,
  ) {
    try {
      // Get patient with all related data
      const patient = await this.prisma.patient.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          lastAccessedByUser: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          tickets: options.includeTickets ? {
            include: {
              originHospital: true,
              destinationHospital: true,
              createdBy: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              assignedTo: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          } : false,
          medicalRecords: options.includeMedicalRecords ? {
            include: {
              createdBy: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            orderBy: { recordDate: 'desc' },
          } : false,
          accessLogs: options.includeAccessLogs ? {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                },
              },
            },
            orderBy: { timestamp: 'desc' },
            take: 50,
          } : false,
        },
      });

      if (!patient) {
        throw new Error('Patient not found');
      }

      // Log the export activity
      await this.prisma.patientAccessLog.create({
        data: {
          patientId: id,
          userId,
          accessType: 'EXPORT',
          accessMethod: 'API',
          reason: `Exported patient data in ${format} format`,
        },
      });

      // Generate export based on format
      switch (format) {
        case 'JSON':
          return this.generateJsonExport(patient);
        case 'CSV':
          return this.generateCsvExport(patient);
        case 'PDF':
        default:
          return await this.generatePdfExport(patient);
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  /**
   * Normalize National ID for display/export
   * Removes the UUID suffix from "00000000000000-XXXXXX" format
   */
  private normalizeNationalId(nationalId: string | null | undefined): string {
    if (!nationalId) return '';
    // If it starts with "00000000000000-", normalize it back to "00000000000000"
    if (nationalId.startsWith('00000000000000-')) {
      return '00000000000000';
    }
    return nationalId;
  }

  private generateJsonExport(patient: any) {
    const data = {
      patient: {
        id: patient.id,
        mrn: patient.mrn,
        nationalId: this.normalizeNationalId(patient.nationalId),
        firstName: patient.firstName,
        lastName: patient.lastName,
        middleName: patient.middleName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        maritalStatus: patient.maritalStatus,
        phoneNumber: patient.phoneNumber,
        email: patient.email,
        address: patient.address,
        city: patient.city,
        state: patient.state,
        zipCode: patient.zipCode,
        country: patient.country,
        emergencyContact: patient.emergencyContact,
        emergencyPhone: patient.emergencyPhone,
        emergencyEmail: patient.emergencyEmail,
        emergencyRelationship: patient.emergencyRelationship,
        insuranceProvider: patient.insuranceProvider,
        insuranceNumber: patient.insuranceNumber,
        insuranceGroup: patient.insuranceGroup,
        insuranceExpiry: patient.insuranceExpiry,
        bloodType: patient.bloodType,
        rhFactor: patient.rhFactor,
        allergies: patient.allergies,
        medications: patient.medications,
        medicalHistory: patient.medicalHistory,
        riskFactors: patient.riskFactors,
        chronicConditions: patient.chronicConditions,
        weight: patient.weight,
        height: patient.height,
        bmi: patient.bmi,
        privacyLevel: patient.privacyLevel,
        consentGiven: patient.consentGiven,
        consentDate: patient.consentDate,
        dataRetentionPolicy: patient.dataRetentionPolicy,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
        lastAccessedAt: patient.lastAccessedAt,
        createdBy: patient.createdBy,
        lastAccessedByUser: patient.lastAccessedByUser,
      },
      medicalRecords: patient.medicalRecords || [],
      tickets: patient.tickets || [],
      accessLogs: patient.accessLogs || [],
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        format: 'JSON',
        version: '1.0',
      },
    };

    const jsonString = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');

    return {
      data: buffer,
      contentType: 'application/json',
      filename: `patient-${patient.firstName}-${patient.lastName}-${patient.id}.json`,
    };
  }

  private generateCsvExport(patient: any) {
    // Create CSV content
    const csvRows = [
      ['Field', 'Value'],
      ['ID', patient.id],
      ['MRN', patient.mrn || ''],
      ['National ID', this.normalizeNationalId(patient.nationalId)],
      ['First Name', patient.firstName],
      ['Last Name', patient.lastName],
      ['Middle Name', patient.middleName || ''],
      ['Date of Birth', patient.dateOfBirth],
      ['Gender', patient.gender],
      ['Marital Status', patient.maritalStatus || ''],
      ['Phone Number', patient.phoneNumber || ''],
      ['Email', patient.email || ''],
      ['Address', patient.address || ''],
      ['City', patient.city || ''],
      ['State', patient.state || ''],
      ['ZIP Code', patient.zipCode || ''],
      ['Country', patient.country || ''],
      ['Emergency Contact', patient.emergencyContact || ''],
      ['Emergency Phone', patient.emergencyPhone || ''],
      ['Emergency Email', patient.emergencyEmail || ''],
      ['Emergency Relationship', patient.emergencyRelationship || ''],
      ['Insurance Provider', patient.insuranceProvider || ''],
      ['Insurance Number', patient.insuranceNumber || ''],
      ['Insurance Group', patient.insuranceGroup || ''],
      ['Insurance Expiry', patient.insuranceExpiry || ''],
      ['Blood Type', patient.bloodType || ''],
      ['RH Factor', patient.rhFactor || ''],
      ['Allergies', patient.allergies || ''],
      ['Medications', patient.medications || ''],
      ['Medical History', patient.medicalHistory || ''],
      ['Risk Factors', patient.riskFactors || ''],
      ['Chronic Conditions', patient.chronicConditions || ''],
      ['Weight (kg)', patient.weight || ''],
      ['Height (cm)', patient.height || ''],
      ['BMI', patient.bmi || ''],
      ['Privacy Level', patient.privacyLevel],
      ['Consent Given', patient.consentGiven],
      ['Consent Date', patient.consentDate || ''],
      ['Data Retention Policy', patient.dataRetentionPolicy || ''],
      ['Created At', patient.createdAt],
      ['Updated At', patient.updatedAt],
      ['Last Accessed At', patient.lastAccessedAt || ''],
      ['Created By', patient.createdBy ? `${patient.createdBy.firstName} ${patient.createdBy.lastName}` : ''],
      ['Last Accessed By', patient.lastAccessedByUser ? `${patient.lastAccessedByUser.firstName} ${patient.lastAccessedByUser.lastName}` : ''],
    ];

    const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\\n');
    const buffer = Buffer.from(csvContent, 'utf-8');

    return {
      data: buffer,
      contentType: 'text/csv',
      filename: `patient-${patient.firstName}-${patient.lastName}-${patient.id}.csv`,
    };
  }

  private formatAgeForDisplay(patient: any): string {
    // If date of birth exists, calculate age from it
    if (patient.dateOfBirth) {
      try {
        const birthDate = new Date(patient.dateOfBirth);
        const today = new Date();

        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        let days = today.getDate() - birthDate.getDate();

        // Adjust for negative days
        if (days < 0) {
          months--;
          const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
          days += lastMonth.getDate();
        }

        // Adjust for negative months
        if (months < 0) {
          years--;
          months += 12;
        }

        const parts: string[] = [];
        if (years > 0) {
          parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
        }
        if (months > 0) {
          parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
        }
        if (days > 0 || parts.length === 0) {
          parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
        }

        return parts.join(', ');
      } catch (error) {
        // If DOB is invalid, fall through to stored values
      }
    }

    return 'N/A';
  }

  private generatePdfExport(patient: any) {
    console.log('Starting PDF Export generation...');
    return new Promise<{ data: Buffer; contentType: string; filename: string }>((resolve, reject) => {
      try {
        console.log('Initializing PDFDocument...');
        // Sanitize patient name for PDF metadata (PDFKit crashes with Arabic in metadata)
        const safeName = sanitizeForPdfMeta(`${patient.firstName || ''} ${patient.lastName || ''}`);
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Patient Report - ${safeName}`,
            Author: 'RCC Healthcare Platform',
            Subject: 'Patient Information Report',
            Keywords: 'patient, medical, report',
            CreationDate: new Date(),
          },
        });

        // Register Arabic-supporting font if available
        let arabicFontRegistered = false;
        if (this.arabicFontPath) {
          try {
            doc.registerFont('Arabic', this.arabicFontPath);
            arabicFontRegistered = true;
            console.log('Arabic font registered successfully for PDF');
          } catch (fontError) {
            console.error('Failed to register Arabic font:', fontError);
          }
        }

        // Helper for section headers (always use Helvetica for headers)
        const sectionHeader = (title: string) => {
          doc.fontSize(16).font('Helvetica-Bold').text(title).moveDown(0.5);
          doc.fontSize(10).font('Helvetica');
        };

        // Check if string contains only Arabic numerals (٠-٩) and non-letter characters
        const isOnlyArabicNumerals = (text: string): boolean => {
          if (!text) return false;
          // Arabic-Indic digits: ٠١٢٣٤٥٦٧٨٩ (U+0660-U+0669)
          // Extended Arabic-Indic: ۰۱۲۳۴۵۶۷۸۹ (U+06F0-U+06F9)
          // Allow spaces, punctuation, and Western digits too
          const onlyNumeralsPattern = /^[\u0660-\u0669\u06F0-\u06F9\s\d\-\+\(\)\.]+$/;
          return onlyNumeralsPattern.test(text);
        };

        // Helper to reverse only Arabic numerals in a string
        // This fixes RTL display for numbers while keeping letters correct
        const fixArabicNumeralsOrder = (text: string): string => {
          if (!text) return text;
          // If string is only Arabic numerals, reverse the whole thing
          if (isOnlyArabicNumerals(text)) {
            return text.split('').reverse().join('');
          }
          // For mixed content, don't reverse - letters are more important to be readable
          return text;
        };

        // Helper for labeled field with Arabic support
        // Uses registered Arabic font (Arial) when Arabic text is detected
        const labeledField = (label: string, value: string | null | undefined) => {
          const textValue = value || 'N/A';
          if (hasArabicText(textValue) && arabicFontRegistered) {
            // Fix Arabic numeral order (only reverses if purely numerals)
            const displayText = fixArabicNumeralsOrder(textValue);
            doc.font('Helvetica').text(`${label}: `, { continued: true });
            doc.font('Arabic').text(displayText);
            doc.font('Helvetica');
          } else if (hasArabicText(textValue)) {
            // Arabic font not available - show placeholder
            doc.text(`${label}: [Arabic text - font not available]`);
          } else {
            doc.text(`${label}: ${textValue}`);
          }
        };







        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));

        doc.on('end', () => {
          console.log('PDF generation finished.');
          const buffer = Buffer.concat(chunks);
          resolve({
            data: buffer,
            contentType: 'application/pdf',
            filename: `patient-${patient.firstName}-${patient.lastName}-${patient.id}.pdf`,
          });
        });

        doc.on('error', (err) => {
          console.error('PDF generation error (stream):', err);
          reject(err);
        });

        // Header
        console.log('Writing Header...');
        doc.fontSize(24)
          .font('Helvetica-Bold')
          .text('Patient Information Report', { align: 'center' })
          .moveDown(0.5);

        doc.fontSize(12)
          .font('Helvetica')
          .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
          .moveDown(2);

        // Patient Details Section
        console.log('Writing Patient Details...');
        sectionHeader('PATIENT DETAILS');


        doc.fontSize(10).font('Helvetica');
        // Patient name - may contain Arabic
        labeledField('Name', `${patient.firstName || ''} ${patient.middleName || ''} ${patient.lastName || ''}`.trim());
        doc.text(`MRN: ${patient.mrn || 'N/A'}`);
        doc.text(`National ID: ${this.normalizeNationalId(patient.nationalId) || 'N/A'}`);

        console.log('Writing Age...');
        // Safe Age Printing
        try {
          const ageStr = this.formatAgeForDisplay(patient);
          doc.text(`Age: ${ageStr}`);
        } catch (e) {
          console.error('Error formatting age in PDF:', e);
          doc.text('Age: Error');
        }

        // Only show date of birth if it exists
        if (patient.dateOfBirth) {
          try {
            doc.text(`Date of Birth: ${new Date(patient.dateOfBirth).toLocaleDateString()}`);
          } catch (error) {
            // If date is invalid, skip it
          }
        }

        doc.text(`Gender: ${patient.gender}`);
        doc.text(`Marital Status: ${patient.maritalStatus || 'N/A'}`);
        doc.moveDown(1);

        // Contact Information Section
        sectionHeader('CONTACT INFORMATION');
        labeledField('Phone', patient.phoneNumber);
        labeledField('Email', patient.email);
        labeledField('Address', patient.address);
        labeledField('City', patient.city);
        labeledField('State', patient.state);
        labeledField('ZIP Code', patient.zipCode);
        labeledField('Country', patient.country);
        doc.moveDown(1);

        // Emergency Contact Section
        sectionHeader('EMERGENCY CONTACT');
        labeledField('Name', patient.emergencyContact);
        labeledField('Phone', patient.emergencyPhone);
        labeledField('Email', patient.emergencyEmail);
        labeledField('Relationship', patient.emergencyRelationship);
        doc.moveDown(1);

        // Insurance Information Section
        sectionHeader('INSURANCE INFORMATION');
        labeledField('Provider', patient.insuranceProvider);
        labeledField('Policy Number', patient.insuranceNumber);
        labeledField('Group', patient.insuranceGroup);
        doc.text(`Expiry: ${patient.insuranceExpiry ? new Date(patient.insuranceExpiry).toLocaleDateString() : 'N/A'}`);
        doc.moveDown(1);


        // Medical Information Section
        sectionHeader('MEDICAL INFORMATION');

        // Fields that might contain Arabic text - use labeledField helper
        labeledField('Blood Type', patient.bloodType);
        labeledField('RH Factor', patient.rhFactor);
        labeledField('Allergies', patient.allergies);
        labeledField('Medications', patient.medications);
        labeledField('Medical History', patient.medicalHistory);
        labeledField('Risk Factors', patient.riskFactors);
        labeledField('Chronic Conditions', patient.chronicConditions);
        doc.text(`Weight: ${patient.weight || 'N/A'} kg`);
        doc.text(`Height: ${patient.height || 'N/A'} cm`);
        doc.text(`BMI: ${patient.bmi || 'N/A'}`);
        doc.moveDown(1);


        // Privacy & Consent Section
        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text('PRIVACY & CONSENT')
          .moveDown(0.5);

        doc.fontSize(10)
          .font('Helvetica')
          .text(`Privacy Level: ${patient.privacyLevel}`)
          .text(`Consent Given: ${patient.consentGiven ? 'Yes' : 'No'}`)
          .text(`Consent Date: ${patient.consentDate ? new Date(patient.consentDate).toLocaleDateString() : 'N/A'}`)
          .text(`Data Retention Policy: ${patient.dataRetentionPolicy || 'N/A'}`)
          .moveDown(1);

        // System Information Section
        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text('SYSTEM INFORMATION')
          .moveDown(0.5);

        doc.fontSize(10)
          .font('Helvetica')
          .text(`Created At: ${new Date(patient.createdAt).toLocaleString()}`)
          .text(`Updated At: ${new Date(patient.updatedAt).toLocaleString()}`)
          .text(`Last Accessed At: ${patient.lastAccessedAt ? new Date(patient.lastAccessedAt).toLocaleString() : 'Never'}`)
          .text(`Created By: ${patient.createdBy ? `${safeText(patient.createdBy.firstName)} ${safeText(patient.createdBy.lastName)}` : 'N/A'}`)
          .text(`Last Accessed By: ${patient.lastAccessedByUser ? `${safeText(patient.lastAccessedByUser.firstName)} ${safeText(patient.lastAccessedByUser.lastName)}` : 'N/A'}`)
          .moveDown(1);


        // Medical Records Section (if included)
        if (patient.medicalRecords && patient.medicalRecords.length > 0) {
          doc.addPage();
          doc.fontSize(16)
            .font('Helvetica-Bold')
            .text(`MEDICAL RECORDS (${patient.medicalRecords.length} records)`)
            .moveDown(0.5);

          patient.medicalRecords.forEach((record: any, index: number) => {
            doc.fontSize(12)
              .font('Helvetica-Bold')
              .text(`${index + 1}. ${safeText(record.title)}`)
              .moveDown(0.2);

            doc.fontSize(10)
              .font('Helvetica')
              .text(`Type: ${record.recordType || 'N/A'}`)
              .text(`Date: ${new Date(record.recordDate).toLocaleDateString()}`)
              .text(`Description: ${safeText(record.description)}`)
              .text(`Diagnosis: ${safeText(record.diagnosis)}`)
              .text(`Treatment: ${safeText(record.treatment)}`)
              .moveDown(0.5);
          });

        }

        // Tickets Section (if included)
        if (patient.tickets && patient.tickets.length > 0) {
          doc.addPage();
          doc.fontSize(16)
            .font('Helvetica-Bold')
            .text(`TICKETS (${patient.tickets.length} tickets)`)
            .moveDown(0.5);

          patient.tickets.forEach((ticket: any, index: number) => {
            doc.fontSize(12)
              .font('Helvetica-Bold')
              .text(`${index + 1}. Ticket ID: ${ticket.id}`)
              .moveDown(0.2);

            doc.fontSize(10)
              .font('Helvetica')
              .text(`Status: ${ticket.status}`)
              .text(`Priority: ${ticket.priority}`)
              .text(`Created: ${new Date(ticket.createdAt).toLocaleString()}`)
              .text(`Origin: ${safeText(ticket.originHospital?.name)}`)
              .text(`Destination: ${safeText(ticket.destinationHospital?.name)}`)
              .moveDown(0.5);
          });
        }

        // Access Logs Section (if included)
        if (patient.accessLogs && patient.accessLogs.length > 0) {
          doc.addPage();
          doc.fontSize(16)
            .font('Helvetica-Bold')
            .text(`ACCESS LOGS (${patient.accessLogs.length} recent entries)`)
            .moveDown(0.5);

          patient.accessLogs.forEach((log: any, index: number) => {
            doc.fontSize(12)
              .font('Helvetica-Bold')
              .text(`${index + 1}. ${new Date(log.timestamp).toLocaleString()}`)
              .moveDown(0.2);

            doc.fontSize(10)
              .font('Helvetica')
              .text(`User: ${safeText(log.user?.firstName)} ${safeText(log.user?.lastName)} (${log.user?.role || 'N/A'})`)
              .text(`Access Type: ${log.accessType}`)
              .text(`Method: ${log.accessMethod}`)
              .text(`Reason: ${safeText(log.reason)}`)
              .moveDown(0.5);
          });
        }

        // Footer
        doc.addPage();
        doc.fontSize(10)
          .font('Helvetica')
          .text('---', { align: 'center' })
          .moveDown(0.5)
          .text('This report was generated automatically by the RCC Healthcare Platform.', { align: 'center' })
          .text('For questions or concerns, please contact the system administrator.', { align: 'center' })
          .moveDown(1)
          .text(`Report ID: ${patient.id}`, { align: 'center' })
          .text(`Generated: ${new Date().toISOString()}`, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
