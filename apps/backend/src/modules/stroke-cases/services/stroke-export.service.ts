import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StrokeFilterDto } from '../dto/stroke-filter.dto';
import * as ExcelJS from 'exceljs';

@Injectable()
export class StrokeExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportStrokeCasesToExcel(filters: StrokeFilterDto = {}) {
    try {
      const where = this.buildWhereClause(filters);

      const strokeCases = await this.prisma.strokeCase.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true,
              mrn: true,
              age: true,
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
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const exportData = strokeCases.map((case_) => this.transformCaseForExport(case_));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Stroke Cases');

      // Define headers
      const headers = [
        'Date of Admission',
        'Patient ID',
        'MRN',
        'First Name',
        'Last Name',
        'Age',
        'Gender',
        'Stroke Type',
        'Status',
        'Mode of Arrival',
        'Origin Hospital',
        'Destination Hospital',
        'NIHSS Baseline',
        'NIHSS 24hr',
        'NIHSS Discharge',
        'Selected Treatment',
        'Created At',
        'Updated At',
      ];

      const headerRow = worksheet.addRow(headers);
      headerRow.height = 40; 
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 13 };
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

      const columnWidths = [30, 25, 20, 22, 22, 15, 15, 22, 25, 30, 30, 30, 20, 20, 20, 30, 25, 25];
      worksheet.columns.forEach((column, index) => {
        column.width = columnWidths[index] || 25;
      });

      exportData.forEach((rowData) => {
        const row = worksheet.addRow(Object.values(rowData));
        row.height = 30; 
        row.eachCell((cell) => {
          cell.font = { size: 12 }; 
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

      // Add data validation (dropdowns) for categorical fields
      this.addDataValidation(worksheet);

      const excelBuffer = await workbook.xlsx.writeBuffer();

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `stroke-cases-export-${timestamp}.xlsx`;

      return {
        buffer: excelBuffer,
        filename: filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };

    } catch (error) {
      console.error('Error exporting stroke cases to Excel:', error);
      throw new Error('Failed to export stroke cases to Excel');
    }
  }

  private addDataValidation(worksheet: ExcelJS.Worksheet): void {
    // Create a hidden worksheet for validation values
    const workbook = worksheet.workbook;
    let valuesSheet = workbook.getWorksheet('Values');
    if (!valuesSheet) {
      valuesSheet = workbook.addWorksheet('Values');
    }
    valuesSheet.state = 'hidden';

    // Define options for categorical fields
    const strokeTypeOptions = [
      'Ischemic',
      'Hemorrhagic',
      'TIA',
      'Unknown'
    ];

    const statusOptions = [
      'New Case',
      'Active',
      'Completed',
      'Cancelled'
    ];

    const modeOfArrivalOptions = [
      'AMBULANCE',
      'Private Vehicle',
      'Walk-In',
      'Helicopter',
      'Transfer'
    ];

    const genderOptions = [
      'Male',
      'Female'
    ];

    // Helper to write options to the hidden sheet and return the range formula
    const writeOptions = (colIndex: number, options: string[]): string => {
      const colLetter = valuesSheet.getColumn(colIndex).letter;
      options.forEach((option, idx) => {
        valuesSheet.getCell(idx + 1, colIndex).value = option;
      });
      return `Values!$${colLetter}$1:$${colLetter}$${options.length}`;
    };

    // Write options to the hidden sheet
    const strokeTypeFormula = writeOptions(1, strokeTypeOptions);     // Column A
    const statusFormula = writeOptions(2, statusOptions);             // Column B
    const modeOfArrivalFormula = writeOptions(3, modeOfArrivalOptions); // Column C
    const genderFormula = writeOptions(4, genderOptions);             // Column D

    // Stroke Type (Column H - 8th column)
    for (let row = 2; row <= 1000; row++) {
      const cellAddress = `H${row}`;
      worksheet.getCell(cellAddress).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [strokeTypeFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Selection',
        error: 'Please select a valid stroke type.',
        showInputMessage: true,
        promptTitle: 'Select Stroke Type',
        prompt: 'Choose the stroke type from the dropdown list.'
      };
    }

    // Status (Column I - 9th column)
    for (let row = 2; row <= 1000; row++) {
      const cellAddress = `I${row}`;
      worksheet.getCell(cellAddress).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [statusFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Selection',
        error: 'Please select a valid status.',
        showInputMessage: true,
        promptTitle: 'Select Status',
        prompt: 'Choose the status from the dropdown list.'
      };
    }

    // Mode of Arrival (Column J - 10th column)
    for (let row = 2; row <= 1000; row++) {
      const cellAddress = `J${row}`;
      worksheet.getCell(cellAddress).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [modeOfArrivalFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Selection',
        error: 'Please select a valid mode of arrival.',
        showInputMessage: true,
        promptTitle: 'Select Mode of Arrival',
        prompt: 'Choose the mode of arrival from the dropdown list.'
      };
    }

    // Gender (Column G - 7th column)
    for (let row = 2; row <= 1000; row++) {
      const cellAddress = `G${row}`;
      worksheet.getCell(cellAddress).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [genderFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Selection',
        error: 'Please select a valid gender.',
        showInputMessage: true,
        promptTitle: 'Select Gender',
        prompt: 'Choose the gender from the dropdown list.'
      };
    }
  }

  private buildWhereClause(filters: StrokeFilterDto): any {
    const where: any = {
      deletedAt: null,
    };

    const stringFilters: (keyof StrokeFilterDto)[] = [
      'originHospitalId',
      'destinationHospitalId',
      'strokeType',
      'status',
      'modeOfArrival',
    ];

    stringFilters.forEach((key) => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'status') {
          where.currentStatus = value;
        } else {
          where[key] = value;
        }
      }
    });

    if (filters.hospitalId) {
      where.OR = [
        { originHospitalId: filters.hospitalId },
        { destinationHospitalId: filters.hospitalId },
      ];
    }

    const { dateFrom, dateTo } = filters;
    if (dateFrom || dateTo) {
      where.timeOfTriage = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        where.timeOfTriage.gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.timeOfTriage.lte = to;
      }
    }

    if (filters.search && filters.search.trim()) {
      const search = filters.search.trim();
      if (!where.AND) {
        where.AND = [];
      }
      where.AND.push({
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
        ],
      });
    }

    return where;
  }

  private transformCaseForExport(case_: any): Record<string, string | number | null> {
    return {
      'Date of Admission': case_.dateOfAdmission 
        ? new Date(case_.dateOfAdmission).toLocaleDateString() 
        : '',
      'Patient ID': case_.patient?.nationalId || '',
      'MRN': case_.patient?.mrn || '',
      'First Name': case_.patient?.firstName || '',
      'Last Name': case_.patient?.lastName || '',
      'Age': case_.patient?.age || '',
      'Gender': case_.patient?.gender || '',
      'Stroke Type': case_.strokeType || '',
      'Status': case_.currentStatus || '',
      'Mode of Arrival': case_.modeOfArrival || '',
      'Origin Hospital': case_.originHospital?.name || '',
      'Destination Hospital': case_.destinationHospital?.name || '',
      'NIHSS Baseline': case_.nihssBaseline || '',
      'NIHSS 24hr': case_.nihss24hr || '',
      'NIHSS Discharge': case_.nihssDischarge || '',
      'Selected Treatment': case_.selectedTreatment || '',
      'Created At': case_.createdAt 
        ? new Date(case_.createdAt).toLocaleString() 
        : '',
      'Updated At': case_.updatedAt 
        ? new Date(case_.updatedAt).toLocaleString() 
        : '',
    };
  }
}