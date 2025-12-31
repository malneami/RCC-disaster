import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { TicketFilterDto } from '../dto/ticket-filter.dto';
import { AssignmentStatus } from '@prisma/client';
import * as ExcelJS from 'exceljs';

@Injectable()
export class TicketExportService {
  constructor(private prisma: PrismaService) {}

  async exportTicketsToExcel(filters: TicketFilterDto = {}) {
    try {
      const where = this.buildWhereClause(filters);
 
      const tickets = await this.prisma.ticket.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true,
              mrn: true,
              dateOfBirth: true,
              gender: true,
              phoneNumber: true,
              email: true,
            },
          },
          originHospital: {
            select: {
              id: true,
              name: true,
              cluster: true,
            },
          },
          destinationHospital: {
            select: {
              id: true,
              name: true,
              cluster: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          emsAssignments: {
            select: {
              id: true,
              status: true,
              assignedAt: true,
              notes: true,
            },
            orderBy: {
              assignedAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const exportData = tickets.map((ticket) => {
        const emsAssignment = ticket.emsAssignments?.[0];
        let vitals = null;
        let diagnostics = null;
        let requiredResources = null;

        try {
          if (ticket.vitals) vitals = JSON.parse(ticket.vitals);
          if (ticket.diagnostics) diagnostics = JSON.parse(ticket.diagnostics);
          if (ticket.requiredResources) requiredResources = JSON.parse(ticket.requiredResources);
        } catch (error) {
          console.warn('Failed to parse JSON fields:', error);
        }

        return {
          'Ticket Number': ticket.ticketNumber,
          'Patient Name': ticket.patient ? `${ticket.patient.firstName} ${ticket.patient.lastName}` : '',
          'Patient ID (National ID)': ticket.patient?.nationalId || '',
          'MRN': ticket.patient?.mrn || '',
          'Age': ticket.patient?.dateOfBirth ? this.calculateAge(ticket.patient.dateOfBirth) : '',
          'Gender': ticket.patient?.gender || '',
          'Phone Number': ticket.patient?.phoneNumber || '',
          'Email': ticket.patient?.email || '',
          'Priority': ticket.priority,
          'Status': ticket.status,
          'Pathway': ticket.pathway,
          'Origin Hospital': ticket.originHospital?.name || '',
          'Destination Hospital': ticket.destinationHospital?.name || '',
          'EMS Contact Time': ticket.emsContactTime ? new Date(ticket.emsContactTime).toLocaleString() : '',
          'Blood Pressure': vitals?.bloodPressure || '',
          'Heart Rate': vitals?.heartRate || '',
          'Temperature': vitals?.temperature || '',
          'Oxygen Saturation': vitals?.oxygenSaturation || '',
          'Respiratory Rate': vitals?.respiratoryRate || '',
          'ECG': diagnostics?.ecg || '',
          'Lab Results': diagnostics?.labResults || '',
          'CT Scan': diagnostics?.ctScan || '',
          'Other Tests': diagnostics?.otherTests || '',
          'Treatment Plan': ticket.treatmentPlan || '',
          'Transport Mode': ticket.transportMode || '',
          'EMS Unit': ticket.emsUnit || '',
          'Is Emergency': ticket.isEmergency ? 'Yes' : 'No',
          'Requires Blood': ticket.requiresBlood ? 'Yes' : 'No',
          'Requires Specialist': ticket.requiresSpecialist ? 'Yes' : 'No',
          'ICU Required': requiredResources?.icu ? 'Yes' : 'No',
          'Ventilator Required': requiredResources?.ventilator ? 'Yes' : 'No',
          'Cardiology Required': requiredResources?.cardiology ? 'Yes' : 'No',
          'Neurology Required': requiredResources?.neurology ? 'Yes' : 'No',
          'Trauma Required': requiredResources?.trauma ? 'Yes' : 'No',
          'NICU Required': requiredResources?.nicu ? 'Yes' : 'No',
          'PICU Required': requiredResources?.picu ? 'Yes' : 'No',
          'EMS Status': emsAssignment?.status || '',
          'EMS Assigned At': emsAssignment?.assignedAt ? new Date(emsAssignment.assignedAt).toLocaleString() : '',
          'EMS Notes': emsAssignment?.notes || '',
          'Assigned To': ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : '',
          'Created By': ticket.createdBy ? `${ticket.createdBy.firstName} ${ticket.createdBy.lastName}` : '',
          'Created At': ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '',
          'Updated At': ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : '',
          'Notes': ticket.notes || '',
        };
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Tickets');

      const headers = exportData.length > 0 
        ? Object.keys(exportData[0])
        : [
            'Ticket Number', 'Patient Name', 'Patient ID (National ID)', 'MRN', 'Age', 'Gender',
            'Phone Number', 'Email', 'Priority', 'Status', 'Pathway', 'Origin Hospital',
            'Destination Hospital', 'Chief Complaint', 'Symptoms', 'Triage Time',
            'Symptom Onset Time', 'EMS Contact Time', 'Blood Pressure', 'Heart Rate',
            'Temperature', 'Oxygen Saturation', 'Respiratory Rate', 'ECG', 'Lab Results',
            'CT Scan', 'Other Tests', 'Treatment Plan', 'Transport Mode', 'EMS Unit',
            'Is Emergency', 'Requires Blood', 'Requires Specialist', 'ICU Required',
            'Ventilator Required', 'Cardiology Required', 'Neurology Required', 'Trauma Required',
            'NICU Required', 'PICU Required', 'EMS Status', 'EMS Assigned At', 'EMS Notes',
            'Assigned To', 'Created By', 'Created At', 'Updated At', 'Notes'
          ];

      const headerRow = worksheet.addRow(headers);
      headerRow.height = 50; 
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1976d2' } 
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: 'center',
          wrapText: true
        };
      });

      const columnWidths = headers.map(() => 40); 
      const widthMap: { [key: string]: number } = {
        'Ticket Number': 30,
        'Patient Name': 30,
        'Patient ID (National ID)': 30,
        'MRN': 20,
        'Origin Hospital': 35,
        'Destination Hospital': 35,
        'Chief Complaint': 35,
        'Symptoms': 35,
        'Treatment Plan': 45,
        'EMS Notes': 45,
        'Notes': 45,
        'Created By': 30,
        'Assigned To': 30,
        'Phone Number': 25,
        'Email': 30,
        'Priority': 20,
        'Status': 20,
        'Pathway': 25,
        'Triage Time': 25,
        'Symptom Onset Time': 25,
        'EMS Contact Time': 25,
        'Transport Mode': 25,
        'EMS Unit': 25,
        'EMS Status': 25,
        'EMS Assigned At': 25,
        'Created At': 25,
        'Updated At': 25,
      };

      headers.forEach((header, index) => {
        columnWidths[index] = widthMap[header] || 25;
      });

      worksheet.columns.forEach((column, index) => {
        column.width = columnWidths[index] || 25;
      });

      exportData.forEach((rowData) => {
        const row = worksheet.addRow(Object.values(rowData));
        row.height = 35; 
        row.eachCell((cell) => {
          cell.font = { size: 13 }; 
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { 
            vertical: 'middle', 
            horizontal: 'left',
            wrapText: true
          };
        });
      });

      const excelBuffer = await workbook.xlsx.writeBuffer();

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `tickets-export-${timestamp}.xlsx`;

      return {
        buffer: excelBuffer,
        filename: filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };

    } catch (error) {
      console.error('Error exporting tickets to Excel:', error);
      throw new Error('Failed to export tickets to Excel');
    }
  }

  private buildWhereClause(filters: TicketFilterDto): any {
    const where: any = {
      deletedAt: null,
    };

    const stringFilters: (keyof TicketFilterDto)[] = [
      'pathway',
      'originHospitalId',
      'destinationHospitalId',
      'patientId',
      'assignedToId',
    ];

    stringFilters.forEach((key) => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        where[key] = value;
      }
    });

    if (filters.status && filters.status != null)  {
      where.status = filters.status;
    }

    if (filters.priority && filters.priority != null) {
      where.priority = filters.priority;
    }

    const { startDate, endDate } = filters;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate && startDate !== '') {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate && endDate !== '') {
        const to = new Date(endDate);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }


    if (filters.emsStatus && filters.emsStatus != null) {
      if (filters.emsStatus === 'ASSIGNED') {
        where.emsAssignments = {
          some: {
            status: {
              in: [AssignmentStatus.EMS_CONTACT, AssignmentStatus.EMS_ARRIVAL],
            },
          },
        };
      } else {
        where.emsAssignments = {
          some: {
            status: filters.emsStatus as AssignmentStatus,
          },
        };
      }
    }

    if (filters.search && filters.search.trim()) {
      const search = filters.search.trim();
      const searchCondition = {
        OR: [
          {
            patient: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { nationalId: { contains: search, mode: 'insensitive' } },
                { mrn: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
          {
            ticketNumber: { contains: search, mode: 'insensitive' },
          },
          {
            chiefComplaint: { contains: search, mode: 'insensitive' },
          },
        ],
      };

      const hasOtherFilters = Object.keys(where).filter(k => k !== 'deletedAt' && k !== 'emsAssignments').length > 0;
      if (hasOtherFilters || where.emsAssignments) {
        if (!where.AND) {
          where.AND = [];
        }
        where.AND.push(searchCondition);
      } else {
        where.OR = searchCondition.OR;
      }
    }

    return where;
  }

  private calculateAge(dateOfBirth: string | Date): number {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
}
