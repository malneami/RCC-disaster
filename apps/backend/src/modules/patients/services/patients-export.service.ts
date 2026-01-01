import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import * as PDFDocument from 'pdfkit';
import { AccessLogService, EntityType } from '../../../common/services/access-log.service';

@Injectable()
export class PatientsExportService {
  constructor(
    private prisma: PrismaService,
    private accessLogService: AccessLogService,
  ) {}

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
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Patient Report - ${patient.firstName} ${patient.lastName}`,
            Author: 'RCC Healthcare Platform',
            Subject: 'Patient Information Report',
            Keywords: 'patient, medical, report',
            CreationDate: new Date(),
          },
        });

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
        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text('PATIENT DETAILS')
          .moveDown(0.5);

        doc.fontSize(10)
          .font('Helvetica')
          .text(`Name: ${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`)
          .text(`MRN: ${patient.mrn || 'N/A'}`)
          .text(`National ID: ${this.normalizeNationalId(patient.nationalId) || 'N/A'}`);
        
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
        
        doc.text(`Gender: ${patient.gender}`)
          .text(`Marital Status: ${patient.maritalStatus || 'N/A'}`)
          .moveDown(1);

        // Contact Information Section
        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text('CONTACT INFORMATION')
          .moveDown(0.5);

        doc.fontSize(10)
          .font('Helvetica')
          .text(`Phone: ${patient.phoneNumber || 'N/A'}`)
          .text(`Email: ${patient.email || 'N/A'}`)
          .text(`Address: ${patient.address || 'N/A'}`)
          .text(`City: ${patient.city || 'N/A'}`)
          .text(`State: ${patient.state || 'N/A'}`)
          .text(`ZIP Code: ${patient.zipCode || 'N/A'}`)
          .text(`Country: ${patient.country || 'N/A'}`)
          .moveDown(1);

        // Emergency Contact Section
        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text('EMERGENCY CONTACT')
          .moveDown(0.5);

        doc.fontSize(10)
          .font('Helvetica')
          .text(`Name: ${patient.emergencyContact || 'N/A'}`)
          .text(`Phone: ${patient.emergencyPhone || 'N/A'}`)
          .text(`Email: ${patient.emergencyEmail || 'N/A'}`)
          .text(`Relationship: ${patient.emergencyRelationship || 'N/A'}`)
          .moveDown(1);

        // Insurance Information Section
        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text('INSURANCE INFORMATION')
          .moveDown(0.5);

        doc.fontSize(10)
          .font('Helvetica')
          .text(`Provider: ${patient.insuranceProvider || 'N/A'}`)
          .text(`Policy Number: ${patient.insuranceNumber || 'N/A'}`)
          .text(`Group: ${patient.insuranceGroup || 'N/A'}`)
          .text(`Expiry: ${patient.insuranceExpiry ? new Date(patient.insuranceExpiry).toLocaleDateString() : 'N/A'}`)
          .moveDown(1);

        // Medical Information Section
        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text('MEDICAL INFORMATION')
          .moveDown(0.5);

        doc.fontSize(10)
          .font('Helvetica')
          .text(`Blood Type: ${patient.bloodType || 'N/A'}`)
          .text(`RH Factor: ${patient.rhFactor || 'N/A'}`)
          .text(`Allergies: ${patient.allergies || 'N/A'}`)
          .text(`Medications: ${patient.medications || 'N/A'}`)
          .text(`Medical History: ${patient.medicalHistory || 'N/A'}`)
          .text(`Risk Factors: ${patient.riskFactors || 'N/A'}`)
          .text(`Chronic Conditions: ${patient.chronicConditions || 'N/A'}`)
          .text(`Weight: ${patient.weight || 'N/A'} kg`)
          .text(`Height: ${patient.height || 'N/A'} cm`)
          .text(`BMI: ${patient.bmi || 'N/A'}`)
          .moveDown(1);

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
          .text(`Created By: ${patient.createdBy ? `${patient.createdBy.firstName} ${patient.createdBy.lastName}` : 'N/A'}`)
          .text(`Last Accessed By: ${patient.lastAccessedByUser ? `${patient.lastAccessedByUser.firstName} ${patient.lastAccessedByUser.lastName}` : 'N/A'}`)
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
            .text(`${index + 1}. ${record.title}`)
            .moveDown(0.2);

            doc.fontSize(10)
            .font('Helvetica')
            .text(`Type: ${record.recordType}`)
            .text(`Date: ${new Date(record.recordDate).toLocaleDateString()}`)
            .text(`Description: ${record.description || 'N/A'}`)
            .text(`Diagnosis: ${record.diagnosis || 'N/A'}`)
            .text(`Treatment: ${record.treatment || 'N/A'}`)
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
            .text(`Origin: ${ticket.originHospital?.name || 'N/A'}`)
            .text(`Destination: ${ticket.destinationHospital?.name || 'N/A'}`)
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
            .text(`User: ${log.user.firstName} ${log.user.lastName} (${log.user.role})`)
            .text(`Access Type: ${log.accessType}`)
            .text(`Method: ${log.accessMethod}`)
            .text(`Reason: ${log.reason || 'N/A'}`)
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
