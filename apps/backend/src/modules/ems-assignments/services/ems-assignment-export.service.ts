import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmsAssignmentExportService {
  constructor(private prisma: PrismaService) {}

  async exportAssignment(
    id: string,
    format: 'PDF' | 'JSON' = 'PDF',
  ) {
    try {
      // Get assignment with all related data
      const assignment = await this.prisma.eMSAssignment.findFirst({
        where: { id, deletedAt: null },
        include: {
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              priority: true,
              status: true,
              pathway: true,
              createdAt: true,
              isEmergency: true,
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  mrn: true,
                },
              },
              originHospital: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                },
              },
              destinationHospital: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                },
              },
            },
          },
          ambulance: {
            select: {
              id: true,
              callSign: true,
              plateNumber: true,
              type: true,
              status: true,
            },
          },
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      });

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      if (format === 'JSON') {
        return this.generateJsonExport(assignment);
      }
      return await this.generatePdfExport(assignment);
    } catch (error) {
      throw error;
    }
  }

  private generateJsonExport(assignment: any) {
    const data = {
      assignment: {
        id: assignment.id,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
        emsContactTime: assignment.emsContactTime,
        actualArrivalTime: assignment.actualArrivalTime,
        journeyStartTime: assignment.journeyStartTime,
        journeyEndTime: assignment.journeyEndTime,
        distanceKm: assignment.distanceKm,
        estimatedArrivalMinutes: assignment.estimatedArrivalMinutes,
        estimatedArrivalTime: assignment.estimatedArrivalTime,
        notes: assignment.notes,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      },
      ticket: assignment.ticket,
      ambulance: assignment.ambulance,
      driver: assignment.driver,
    };

    const jsonString = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');

    return {
      data: buffer,
      contentType: 'application/json',
      filename: `assignment-${assignment.id.slice(-8)}-${Date.now()}.json`,
    };
  }

  private async ensureArabicFont(): Promise<string | null> {
    const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'NotoSansArabic-Regular.ttf');
    if (fs.existsSync(fontPath) && fs.statSync(fontPath).size > 1000) return fontPath;
    const winFont = path.join(process.env.SYSTEMROOT || 'C:/Windows', 'Fonts', 'arialuni.ttf');
    return fs.existsSync(winFont) ? winFont : null;
  }

  private containsArabic(text: string): boolean {
    if (!text) return false;
    return /[\u0600-\u06FF]/.test(text);
  }

  private generatePdfExport(assignment: any) {
    return new Promise<{ data: Buffer; contentType: string; filename: string }>((resolve, reject) => {
      (async () => {
        try {
          const doc = new PDFDocument({
            size: 'A4',
            margin: 40,
            info: {
              Title: `EMS Assignment Report - ${assignment.id.slice(-8).toUpperCase()}`,
              Author: 'RCC Healthcare Platform',
              Subject: 'EMS Assignment Information Report',
              Keywords: 'ems, assignment, transport',
              CreationDate: new Date(),
            },
          });

          let arabicFontPath: string | null = null;
          let arabicFontRegistered = false;
          try {
            arabicFontPath = await this.ensureArabicFont();
            if (arabicFontPath) {
              doc.registerFont('Arabic', arabicFontPath);
              arabicFontRegistered = true;
            }
          } catch (error) {
            // Font not available, continue without Arabic support
          }

          const getFont = (text: string, bold: boolean = false): string => {
            if (arabicFontPath && this.containsArabic(text)) {
              return bold ? 'Arabic' : 'Arabic';
            }
            return bold ? 'Helvetica-Bold' : 'Helvetica';
          };

        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));

        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            data: buffer,
            contentType: 'application/pdf',
            filename: `assignment-${assignment.id.slice(-8).toUpperCase()}-${Date.now()}.pdf`,
          });
        });

        doc.on('error', (err) => {
          reject(err);
        });

        doc.fontSize(24)
          .font('Helvetica-Bold')
          .text('EMS Assignment Report', { align: 'center' })
          .moveDown(0.4);

        doc.fontSize(12)
          .font('Helvetica')
          .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
          .moveDown(1.3);

        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text('ASSIGNMENT DETAILS')
          .moveDown(0.4);

        doc.fontSize(10)
          .font('Helvetica')
          .text(`Assignment ID: ${assignment.id.slice(-8).toUpperCase()}`)
          .text(`Status: ${this.formatStatus(assignment.status)}`)
          .text(`Assigned At: ${assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleString() : 'N/A'}`)
          .text(`Distance: ${assignment.distanceKm ? `${assignment.distanceKm} km` : 'N/A'}`)
          .text(`Estimated Arrival: ${assignment.estimatedArrivalMinutes ? `${assignment.estimatedArrivalMinutes} minutes` : 'N/A'}`)
          .moveDown(0.7);

        if (assignment.ticket?.patient) {
          doc.fontSize(16)
            .font('Helvetica-Bold')
            .text('PATIENT INFORMATION')
            .moveDown(0.4);

          const patientName = `${assignment.ticket.patient.firstName} ${assignment.ticket.patient.lastName}`;
          doc.fontSize(10)
            .font(getFont(patientName))
            .text(`Name: ${patientName}`)
            .font('Helvetica')
            .text(`MRN: ${assignment.ticket.patient.mrn || 'N/A'}`)
            .moveDown(0.7);
        }

        if (assignment.ticket) {
          doc.fontSize(16)
            .font('Helvetica-Bold')
            .text('TICKET INFORMATION')
            .moveDown(0.4);

          doc.fontSize(10)
            .font('Helvetica')
            .text(`Ticket Number: ${assignment.ticket.ticketNumber || assignment.ticket.id}`)
            .text(`Priority: ${assignment.ticket.priority || 'N/A'}`)
            .text(`Case Type: ${assignment.ticket.pathway || 'GENERAL'}`)
            .text(`Emergency: ${assignment.ticket.isEmergency ? 'Yes' : 'No'}`)
            .text(`Created: ${assignment.ticket.createdAt ? new Date(assignment.ticket.createdAt).toLocaleString() : 'N/A'}`)
            .moveDown(0.7);
        }

        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text('HOSPITAL INFORMATION')
          .moveDown(0.4);

        doc.fontSize(10)
          .font('Helvetica');

        if (assignment.ticket?.originHospital) {
          const originName = assignment.ticket.originHospital.name || 'N/A';
          const originAddress = assignment.ticket.originHospital.address || 'N/A';
          doc.font(getFont(originName))
            .text(`Origin Hospital: ${originName}`)
            .font(getFont(originAddress))
            .text(`Origin Address: ${originAddress}`)
            .font('Helvetica')
            .moveDown(0.4);
        } else {
          doc.text('Origin Hospital: N/A')
            .moveDown(0.4);
        }

        if (assignment.ticket?.destinationHospital) {
          const destName = assignment.ticket.destinationHospital.name || 'N/A';
          const destAddress = assignment.ticket.destinationHospital.address || 'N/A';
          doc.font(getFont(destName))
            .text(`Destination Hospital: ${destName}`)
            .font(getFont(destAddress))
            .text(`Destination Address: ${destAddress}`)
            .font('Helvetica')
            .moveDown(0.7);
        } else {
          doc.text('Destination Hospital: N/A')
            .moveDown(0.7);
        }

        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text('AMBULANCE & DRIVER')
          .moveDown(0.4);

        doc.fontSize(10)
          .font('Helvetica');

        if (assignment.ambulance) {
          const callSign = assignment.ambulance.callSign || 'N/A';
          const plateNumber = assignment.ambulance.plateNumber || 'N/A';

          if (callSign !== 'N/A' && this.containsArabic(callSign) && arabicFontRegistered) {
            doc.font('Helvetica')
              .text('Ambulance Call Sign: ')
              .font('Arabic')
              .text(callSign);
          } else {
            doc.font('Helvetica')
              .text(`Ambulance Call Sign: ${callSign}`);
          }

          if (plateNumber !== 'N/A' && this.containsArabic(plateNumber) && arabicFontRegistered) {
            doc.font('Helvetica')
              .text('Plate Number: ')
              .font('Arabic')
              .text(plateNumber);
          } else {
            doc.font('Helvetica')
              .text(`Plate Number: ${plateNumber}`);
          }
          
          doc.font('Helvetica')
            .text(`Type: ${assignment.ambulance.type || 'N/A'}`)
            .text(`Status: ${assignment.ambulance.status || 'N/A'}`)
            .moveDown(0.4);
        } else {
          doc.text('Ambulance: Not Assigned')
            .moveDown(0.4);
        }

        if (assignment.driver) {
          const driverName = `${assignment.driver.firstName} ${assignment.driver.lastName}`;
          doc.font(getFont(driverName))
            .text(`Driver: ${driverName}`)
            .font('Helvetica')
            .text(`Phone: ${assignment.driver.phoneNumber || 'N/A'}`)
            .text(`Email: ${assignment.driver.email || 'N/A'}`)
            .moveDown(0.7);
        } else {
          doc.text('Driver: Not Assigned')
            .moveDown(0.7);
        }

        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text('JOURNEY TIMELINE')
          .moveDown(0.4);

        doc.fontSize(10)
          .font('Helvetica')
          .text(`EMS Contact Time: ${assignment.emsContactTime ? new Date(assignment.emsContactTime).toLocaleString() : 'Not recorded'}`)
          .text(`Actual Arrival Time: ${assignment.actualArrivalTime ? new Date(assignment.actualArrivalTime).toLocaleString() : 'Not recorded'}`)
          .text(`Journey Start Time: ${assignment.journeyStartTime ? new Date(assignment.journeyStartTime).toLocaleString() : 'Not recorded'}`)
          .text(`Journey End Time: ${assignment.journeyEndTime ? new Date(assignment.journeyEndTime).toLocaleString() : 'Not recorded'}`)
          .moveDown(0.7);

        if (assignment.notes) {
          doc.fontSize(16)
            .font('Helvetica-Bold')
            .text('NOTES')
            .moveDown(0.4);

          doc.fontSize(10)
            .font(getFont(assignment.notes))
            .text(assignment.notes, { align: 'left' })
            .font('Helvetica')
            .moveDown(0.7);
        }

        const pageHeight = doc.page.height;
        const margin = 40;
        const footerHeight = 75;
        const currentY = doc.y;
        const footerY = pageHeight - footerHeight - margin;

        if (currentY < footerY) {
          doc.y = footerY;
        } else {
          doc.moveDown(0.3);
        }

        doc.fontSize(10)
          .font('Helvetica')
          .text('---', { align: 'center' })
          .moveDown(0.4)
          .text('This report was generated automatically by the RCC Healthcare Platform.', { align: 'center' })
          .text('For questions or concerns, please contact the system administrator.', { align: 'center' })
          .moveDown(0.7)
          .text(`Assignment ID: ${assignment.id}`, { align: 'center' })
          .text(`Generated: ${new Date().toISOString()}`, { align: 'center' });

          doc.end();
        } catch (error) {
          reject(error);
        }
      })();
    });
  }

  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'EMS_CONTACT': 'EMS Contact',
      'EMS_ARRIVAL': 'EMS Arrival',
      'DEPARTED': 'Departed',
      'ARRIVED': 'Arrived',
      'CANCELLED': 'Cancelled',
    };
    return statusMap[status] || status;
  }
}
