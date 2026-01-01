import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  AuditKPIFiltersDto,
  KPIMetricDto,
  KPIType,
  RecordType,
  FailedRecordDto,
  AuditKPIsResponseDto,
  FailedRecordsResponseDto,
} from './dto/audit-kpi.dto';

@Injectable()
export class DataQualityService {
  private readonly logger = new Logger(DataQualityService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all audit KPIs with filters
   */
  async getAuditKPIs(filters: AuditKPIFiltersDto): Promise<AuditKPIsResponseDto> {
    this.logger.log(`Calculating audit KPIs with filters: ${JSON.stringify(filters)}`);

    const kpis = await Promise.all([
      this.calculateAccuracyKPI(filters),
      this.calculateTimelinessKPI(filters),
      this.calculateCompletenessKPI(filters),
      this.calculateCoverageKPI(filters),
      this.calculatePrecisionKPI(filters),
      this.calculateDuplicationKPI(filters),
    ]);

    const totalRecords = Math.max(...kpis.map((kpi) => kpi.totalRecords), 0);
    const validRecords = kpis.reduce((sum, kpi) => sum + kpi.validRecords, 0);
    const invalidRecords = kpis.reduce((sum, kpi) => sum + kpi.invalidRecords, 0);
    const overallScore = totalRecords > 0 ? (validRecords / totalRecords) * 100 : 0;

    return {
      kpis,
      overallScore: Math.round(overallScore * 100) / 100,
      totalRecords,
      summary: {
        totalRecords,
        validRecords,
        invalidRecords,
      },
    };
  }

  /**
   * KPI 1: Data Accuracy - Date of Birth validation
   * Validates date of birth format and logical ranges
   */
  private async calculateAccuracyKPI(filters: AuditKPIFiltersDto): Promise<KPIMetricDto> {
    const dateFilter = this.buildDateFilter(filters);

    // Query all case types and tickets with their patients
    const [stemiCases, strokeCases, traumaCases, tickets] = await Promise.all([
      this.shouldIncludeRecordType(filters, RecordType.STEMI)
        ? this.prisma.stemiCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
              patient: {
                ...(filters.patientId && { id: filters.patientId }),
                deletedAt: null,
              },
            },
            include: { patient: true },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.STROKE)
        ? this.prisma.strokeCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
              patient: {
                ...(filters.patientId && { id: filters.patientId }),
                deletedAt: null,
              },
            },
            include: { patient: true },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TRAUMA)
        ? this.prisma.traumaCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
              patient: {
                ...(filters.patientId && { id: filters.patientId }),
                deletedAt: null,
              },
            },
            include: { patient: true },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TICKET)
        ? this.prisma.ticket.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
              patient: {
                ...(filters.patientId && { id: filters.patientId }),
                deletedAt: null,
              },
            },
            include: { patient: true },
          })
        : [],
    ]);

    const allRecords = [
      ...stemiCases.map((c) => ({ type: 'stemi' as const, patient: c.patient, recordId: c.id })),
      ...strokeCases.map((c) => ({ type: 'stroke' as const, patient: c.patient, recordId: c.id })),
      ...traumaCases.map((c) => ({ type: 'trauma' as const, patient: c.patient, recordId: c.id })),
      ...tickets.map((t) => ({ type: 'ticket' as const, patient: t.patient, recordId: t.id })),
    ];

    const totalRecords = allRecords.length;
    let validRecords = 0;
    const invalidRecords: Array<{ caseId: string; reason: string }> = [];

    const now = new Date();
    const minDate = new Date('1900-01-01'); // Reasonable minimum birth date

    for (const record of allRecords) {
      if (!record.patient) {
        invalidRecords.push({ caseId: record.recordId, reason: 'Missing patient record' });
        continue;
      }

      const dateOfBirth = record.patient.dateOfBirth;
      if (!dateOfBirth) {
        invalidRecords.push({ caseId: record.recordId, reason: 'Missing date of birth' });
        continue;
      }

      // Validate date is not in the future
      if (new Date(dateOfBirth) > now) {
        invalidRecords.push({ caseId: record.recordId, reason: 'Date of birth is in the future' });
        continue;
      }

      // Validate date is not too old (before 1900)
      if (new Date(dateOfBirth) < minDate) {
        invalidRecords.push({ caseId: record.recordId, reason: 'Date of birth is before 1900' });
        continue;
      }

      // Additional validation: Check if date is reasonable (not too recent for adult patients)
      // This is a basic check - can be enhanced based on business rules
      validRecords++;
    }

    const invalidCount = invalidRecords.length;
    const percentage = totalRecords > 0 ? (validRecords / totalRecords) * 100 : 0;
    const status = percentage >= 95 ? 'PASS' : percentage >= 80 ? 'WARNING' : 'FAIL';

    return {
      kpiType: KPIType.ACCURACY,
      percentage: Math.round(percentage * 100) / 100,
      totalRecords,
      validRecords,
      invalidRecords: invalidCount,
      status,
    };
  }

  /**
   * KPI 2: Data Timeliness - Submission deadlines and date format issues
   */
  private async calculateTimelinessKPI(filters: AuditKPIFiltersDto): Promise<KPIMetricDto> {
    // This KPI would require tracking submission deadlines
    // For now, we'll check if records are submitted within expected timeframes
    // and validate date formats in key date fields

    const dateFilter = this.buildDateFilter(filters);

    const [stemiCases, strokeCases, traumaCases, tickets] = await Promise.all([
      this.shouldIncludeRecordType(filters, RecordType.STEMI)
        ? this.prisma.stemiCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.STROKE)
        ? this.prisma.strokeCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TRAUMA)
        ? this.prisma.traumaCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TICKET)
        ? this.prisma.ticket.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
          })
        : [],
    ]);

    const allRecords = [
      ...stemiCases.map((c) => ({ type: 'stemi' as const, record: c })),
      ...strokeCases.map((c) => ({ type: 'stroke' as const, record: c })),
      ...traumaCases.map((c) => ({ type: 'trauma' as const, record: c })),
      ...tickets.map((t) => ({ type: 'ticket' as const, record: t })),
    ];

    const totalRecords = allRecords.length;
    let validRecords = 0;

    // Check if records are created within reasonable time of their case date
    // and if key date fields are properly formatted
    for (const { record } of allRecords) {
      let isValid = true;

      // Check if record was created within 7 days of the case date (reasonable submission window)
      const caseDate = record.createdAt;
      if (caseDate) {
        const daysSinceCreation = Math.floor(
          (new Date().getTime() - new Date(caseDate).getTime()) / (1000 * 60 * 60 * 24),
        );
        // For now, consider valid if created within last 30 days (this should be configurable based on deadlines)
        if (daysSinceCreation > 30) {
          isValid = false;
        }
      }

      if (isValid) {
        validRecords++;
      }
    }

    const invalidRecords = totalRecords - validRecords;
    const percentage = totalRecords > 0 ? (validRecords / totalRecords) * 100 : 0;
    const status = percentage >= 95 ? 'PASS' : percentage >= 80 ? 'WARNING' : 'FAIL';

    return {
      kpiType: KPIType.TIMELINESS,
      percentage: Math.round(percentage * 100) / 100,
      totalRecords,
      validRecords,
      invalidRecords,
      status,
    };
  }

  /**
   * KPI 3: Data Completeness - Missing patient ID/national ID
   */
  private async calculateCompletenessKPI(filters: AuditKPIFiltersDto): Promise<KPIMetricDto> {
    const dateFilter = this.buildDateFilter(filters);

    const [stemiCases, strokeCases, traumaCases, tickets] = await Promise.all([
      this.shouldIncludeRecordType(filters, RecordType.STEMI)
        ? this.prisma.stemiCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
              patient: {
                ...(filters.patientId && { id: filters.patientId }),
              },
            },
            include: { patient: true },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.STROKE)
        ? this.prisma.strokeCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
              patient: {
                ...(filters.patientId && { id: filters.patientId }),
              },
            },
            include: { patient: true },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TRAUMA)
        ? this.prisma.traumaCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
              patient: {
                ...(filters.patientId && { id: filters.patientId }),
              },
            },
            include: { patient: true },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TICKET)
        ? this.prisma.ticket.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
              patient: {
                ...(filters.patientId && { id: filters.patientId }),
              },
            },
            include: { patient: true },
          })
        : [],
    ]);

    const allRecords = [
      ...stemiCases.map((c) => ({ patient: c.patient })),
      ...strokeCases.map((c) => ({ patient: c.patient })),
      ...traumaCases.map((c) => ({ patient: c.patient })),
      ...tickets.map((t) => ({ patient: t.patient })),
    ];

    const totalRecords = allRecords.length;
    let validRecords = 0;

    for (const record of allRecords) {
      if (record.patient?.nationalId && record.patient.nationalId.trim() !== '') {
        // Exclude the placeholder ID for new babies
        if (record.patient.nationalId !== '00000000000000') {
          validRecords++;
        }
      }
    }

    const invalidRecords = totalRecords - validRecords;
    const percentage = totalRecords > 0 ? (validRecords / totalRecords) * 100 : 0;
    const status = percentage >= 95 ? 'PASS' : percentage >= 80 ? 'WARNING' : 'FAIL';

    return {
      kpiType: KPIType.COMPLETENESS,
      percentage: Math.round(percentage * 100) / 100,
      totalRecords,
      validRecords,
      invalidRecords,
      status,
    };
  }

  /**
   * KPI 4: Coverage - Expected vs submitted entries, change rates
   */
  private async calculateCoverageKPI(filters: AuditKPIFiltersDto): Promise<KPIMetricDto> {
    // This KPI requires knowing expected entries per month
    // For now, we'll calculate based on historical averages or use a simple metric
    // This should be enhanced with actual expected submission targets

    const dateFilter = this.buildDateFilter(filters);

    const [stemiCases, strokeCases, traumaCases, tickets] = await Promise.all([
      this.shouldIncludeRecordType(filters, RecordType.STEMI)
        ? this.prisma.stemiCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.STROKE)
        ? this.prisma.strokeCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TRAUMA)
        ? this.prisma.traumaCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TICKET)
        ? this.prisma.ticket.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
          })
        : [],
    ]);

    const allRecords = [
      ...stemiCases.map((c) => ({ record: c, type: 'stemi' })),
      ...strokeCases.map((c) => ({ record: c, type: 'stroke' })),
      ...traumaCases.map((c) => ({ record: c, type: 'trauma' })),
      ...tickets.map((t) => ({ record: t, type: 'ticket' })),
    ];

    const totalRecords = allRecords.length;

    // Calculate month-over-month change rate
    // Group by month and calculate change rates
    const monthlyGroups = new Map<string, number>();
    for (const { record } of allRecords) {
      const monthKey = new Date(record.createdAt).toISOString().substring(0, 7); // YYYY-MM
      monthlyGroups.set(monthKey, (monthlyGroups.get(monthKey) || 0) + 1);
    }

    const monthlyCounts = Array.from(monthlyGroups.values()).sort((a, b) => a - b);
    let validRecords = totalRecords;

    // Flag records if there's an unusually high change rate (>50% month-over-month)
    if (monthlyCounts.length >= 2) {
      const changes = [];
      for (let i = 1; i < monthlyCounts.length; i++) {
        const changeRate = Math.abs((monthlyCounts[i] - monthlyCounts[i - 1]) / monthlyCounts[i - 1]);
        changes.push(changeRate);
      }
      const avgChangeRate = changes.reduce((sum, rate) => sum + rate, 0) / changes.length;

      // If average change rate is > 0.5 (50%), consider it high change rate
      if (avgChangeRate > 0.5) {
        // For now, we'll mark all records as valid but this should be refined
        // based on specific business rules about expected vs actual submissions
        validRecords = Math.floor(totalRecords * 0.8); // Placeholder logic
      }
    }

    const invalidRecords = totalRecords - validRecords;
    const percentage = totalRecords > 0 ? (validRecords / totalRecords) * 100 : 100;
    const status = percentage >= 95 ? 'PASS' : percentage >= 80 ? 'WARNING' : 'FAIL';

    return {
      kpiType: KPIType.COVERAGE,
      percentage: Math.round(percentage * 100) / 100,
      totalRecords,
      validRecords,
      invalidRecords,
      status,
    };
  }

  /**
   * KPI 5: Data Precision - Timing anomalies and logical inconsistencies
   */
  private async calculatePrecisionKPI(filters: AuditKPIFiltersDto): Promise<KPIMetricDto> {
    const dateFilter = this.buildDateFilter(filters);

    const [stemiCases, strokeCases, traumaCases] = await Promise.all([
      this.shouldIncludeRecordType(filters, RecordType.STEMI)
        ? this.prisma.stemiCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
            include: { patient: true },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.STROKE)
        ? this.prisma.strokeCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
            include: { patient: true },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TRAUMA)
        ? this.prisma.traumaCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
            include: { patient: true },
          })
        : [],
    ]);

    let totalRecords = 0;
    let validRecords = 0;

    // Check STEMI cases
    for (const stemiCase of stemiCases) {
      totalRecords++;
      let isValid = true;

      // Check admission to doctor time (triageTime to firstEcgTime or similar)
      if (stemiCase.triageTime && stemiCase.firstEcgTime) {
        const minutes = this.calculateMinutesDifference(stemiCase.triageTime, stemiCase.firstEcgTime);
        // Flag if 0 minutes or >30 minutes (as per requirement)
        if (minutes === 0 || minutes > 30) {
          isValid = false;
        }
      }

      // Note: Death date check removed as dateOfDeath field doesn't exist in Patient schema

      if (isValid) {
        validRecords++;
      }
    }

    // Check Stroke cases
    for (const strokeCase of strokeCases) {
      totalRecords++;
      let isValid = true;

      // Check admission to physician time
      if (strokeCase.timeOfTriage && strokeCase.timeOfPhysicianAssessment) {
        const minutes = this.calculateMinutesDifference(
          strokeCase.timeOfTriage,
          strokeCase.timeOfPhysicianAssessment,
        );
        if (minutes === 0 || minutes > 30) {
          isValid = false;
        }
      }

      // Note: Death date check removed as dateOfDeath field doesn't exist in Patient schema

      if (isValid) {
        validRecords++;
      }
    }

    // Check Trauma cases
    for (const traumaCase of traumaCases) {
      totalRecords++;
      let isValid = true;

      // Check admission to assessment time (if available)
      // Note: Trauma schema may have different timing fields

      // Note: Death date check removed as dateOfDeath field doesn't exist in Patient schema

      if (isValid) {
        validRecords++;
      }
    }

    const invalidRecords = totalRecords - validRecords;
    const percentage = totalRecords > 0 ? (validRecords / totalRecords) * 100 : 100;
    const status = percentage >= 95 ? 'PASS' : percentage >= 80 ? 'WARNING' : 'FAIL';

    return {
      kpiType: KPIType.PRECISION,
      percentage: Math.round(percentage * 100) / 100,
      totalRecords,
      validRecords,
      invalidRecords,
      status,
    };
  }

  /**
   * KPI 6: Data Duplication - Same patient registered twice for same visit
   */
  private async calculateDuplicationKPI(filters: AuditKPIFiltersDto): Promise<KPIMetricDto> {
    const dateFilter = this.buildDateFilter(filters);

    const [stemiCases, strokeCases, traumaCases, tickets] = await Promise.all([
      this.shouldIncludeRecordType(filters, RecordType.STEMI)
        ? this.prisma.stemiCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
            include: { patient: true },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.STROKE)
        ? this.prisma.strokeCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
            include: { patient: true },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TRAUMA)
        ? this.prisma.traumaCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
            include: { patient: true },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TICKET)
        ? this.prisma.ticket.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
            include: { patient: true },
          })
        : [],
    ]);

    // Group by nationalId + case date to find duplicates
    const duplicateMap = new Map<string, number>();

    const processCases = (cases: any[], type: string) => {
      for (const caseRecord of cases) {
        if (!caseRecord.patient?.nationalId || caseRecord.patient.nationalId === '00000000000000') {
          continue; // Skip records without national ID or placeholder ID
        }

        const caseDate = caseRecord.dateOfAdmission || caseRecord.createdAt;
        const dateKey = caseDate ? new Date(caseDate).toISOString().split('T')[0] : 'unknown';
        const key = `${caseRecord.patient.nationalId}_${type}_${dateKey}`;

        duplicateMap.set(key, (duplicateMap.get(key) || 0) + 1);
      }
    };

    processCases(stemiCases, 'stemi');
    processCases(strokeCases, 'stroke');
    processCases(traumaCases, 'trauma');
    processCases(tickets, 'ticket');

    const totalRecords = stemiCases.length + strokeCases.length + traumaCases.length + tickets.length;
    let duplicateCount = 0;

    // Count records that are duplicates (appear more than once)
    for (const count of duplicateMap.values()) {
      if (count > 1) {
        duplicateCount += count; // Count all occurrences of duplicates
      }
    }

    const validRecords = totalRecords - duplicateCount;
    const invalidRecords = duplicateCount;
    const percentage = totalRecords > 0 ? (validRecords / totalRecords) * 100 : 100;
    const status = percentage >= 95 ? 'PASS' : percentage >= 80 ? 'WARNING' : 'FAIL';

    return {
      kpiType: KPIType.DUPLICATION,
      percentage: Math.round(percentage * 100) / 100,
      totalRecords,
      validRecords,
      invalidRecords,
      status,
    };
  }

  /**
   * Get failed records for a specific KPI
   */
  async getFailedRecords(
    kpiType: KPIType,
    filters: AuditKPIFiltersDto,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<FailedRecordsResponseDto> {
    this.logger.log(`Getting failed records for KPI: ${kpiType} with filters: ${JSON.stringify(filters)}`);

    let failedRecords: FailedRecordDto[] = [];

    switch (kpiType) {
      case KPIType.ACCURACY:
        failedRecords = await this.getFailedAccuracyRecords(filters);
        break;
      case KPIType.TIMELINESS:
        failedRecords = await this.getFailedTimelinessRecords(filters);
        break;
      case KPIType.COMPLETENESS:
        failedRecords = await this.getFailedCompletenessRecords(filters);
        break;
      case KPIType.COVERAGE:
        failedRecords = await this.getFailedCoverageRecords(filters);
        break;
      case KPIType.PRECISION:
        failedRecords = await this.getFailedPrecisionRecords(filters);
        break;
      case KPIType.DUPLICATION:
        failedRecords = await this.getFailedDuplicationRecords(filters);
        break;
    }

    // Apply pagination
    const total = failedRecords.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRecords = failedRecords.slice(startIndex, endIndex);

    return {
      kpiType,
      records: paginatedRecords,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * Helper: Check if a record type should be included in the query
   */
  private shouldIncludeRecordType(filters: AuditKPIFiltersDto, recordType: RecordType): boolean {
    return !filters.recordType || filters.recordType === RecordType.ALL || filters.recordType === recordType;
  }

  /**
   * Helper: Build date filter for Prisma queries
   */
  private buildDateFilter(filters: AuditKPIFiltersDto) {
    if (!filters.startDate && !filters.endDate) {
      return {};
    }

    const dateFilter: any = {};
    if (filters.startDate) {
      dateFilter.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      dateFilter.lte = new Date(filters.endDate);
    }

    return {
      createdAt: dateFilter,
    };
  }

  /**
   * Helper: Calculate minutes difference between two dates
   */
  private calculateMinutesDifference(date1: Date | string, date2: Date | string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60));
  }

  /**
   * Get failed records for Accuracy KPI
   */
  private async getFailedAccuracyRecords(filters: AuditKPIFiltersDto): Promise<FailedRecordDto[]> {
    const dateFilter = this.buildDateFilter(filters);

    const [stemiCases, strokeCases, traumaCases, tickets] = await Promise.all([
      this.shouldIncludeRecordType(filters, RecordType.STEMI)
        ? this.prisma.stemiCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
              patient: {
                ...(filters.patientId && { id: filters.patientId }),
                deletedAt: null,
              },
            },
            include: { patient: true, originHospital: { select: { id: true, name: true } } },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.STROKE)
        ? this.prisma.strokeCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
              patient: {
                ...(filters.patientId && { id: filters.patientId }),
                deletedAt: null,
              },
            },
            include: { patient: true, originHospital: { select: { id: true, name: true } } },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TRAUMA)
        ? this.prisma.traumaCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
              patient: {
                ...(filters.patientId && { id: filters.patientId }),
                deletedAt: null,
              },
            },
            include: { patient: true, originHospital: { select: { id: true, name: true } } },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TICKET)
        ? this.prisma.ticket.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
              patient: {
                ...(filters.patientId && { id: filters.patientId }),
                deletedAt: null,
              },
            },
            include: { patient: true, originHospital: { select: { id: true, name: true } } },
          })
        : [],
    ]);

    const allRecords = [
      ...stemiCases.map((c) => ({ type: RecordType.STEMI, record: c, recordId: c.id })),
      ...strokeCases.map((c) => ({ type: RecordType.STROKE, record: c, recordId: c.id })),
      ...traumaCases.map((c) => ({ type: RecordType.TRAUMA, record: c, recordId: c.id })),
      ...tickets.map((t) => ({ type: RecordType.TICKET, record: t, recordId: t.id })),
    ];

    const failedRecords: FailedRecordDto[] = [];
    const now = new Date();
    const minDate = new Date('1900-01-01');

    for (const { type, record, recordId } of allRecords) {
      const failureReasons: string[] = [];

      if (!record.patient) {
        failureReasons.push('Missing patient record');
      } else {
        const dateOfBirth = record.patient.dateOfBirth;
        if (!dateOfBirth) {
          failureReasons.push('Missing date of birth');
        } else {
          if (new Date(dateOfBirth) > now) {
            failureReasons.push('Date of birth is in the future');
          }
          if (new Date(dateOfBirth) < minDate) {
            failureReasons.push('Date of birth is before 1900');
          }
        }
      }

      if (failureReasons.length > 0) {
        failedRecords.push({
          recordId,
          patientId: record.patient?.id,
          recordType: type,
          hospitalId: (record as any).originHospitalId,
          hospitalName: (record as any).originHospital?.name,
          failureReasons,
          createdAt: record.createdAt,
        });
      }
    }

    return failedRecords;
  }

  /**
   * Get failed records for Timeliness KPI
   */
  private async getFailedTimelinessRecords(filters: AuditKPIFiltersDto): Promise<FailedRecordDto[]> {
    const dateFilter = this.buildDateFilter(filters);

    const [stemiCases, strokeCases, traumaCases, tickets] = await Promise.all([
      this.shouldIncludeRecordType(filters, RecordType.STEMI)
        ? this.prisma.stemiCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
            include: { patient: true, originHospital: { select: { id: true, name: true } } },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.STROKE)
        ? this.prisma.strokeCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
            include: { patient: true, originHospital: { select: { id: true, name: true } } },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TRAUMA)
        ? this.prisma.traumaCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
            include: { patient: true, originHospital: { select: { id: true, name: true } } },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TICKET)
        ? this.prisma.ticket.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
            include: { patient: true, originHospital: { select: { id: true, name: true } } },
          })
        : [],
    ]);

    const allRecords = [
      ...stemiCases.map((c) => ({ type: RecordType.STEMI, record: c, recordId: c.id })),
      ...strokeCases.map((c) => ({ type: RecordType.STROKE, record: c, recordId: c.id })),
      ...traumaCases.map((c) => ({ type: RecordType.TRAUMA, record: c, recordId: c.id })),
      ...tickets.map((t) => ({ type: RecordType.TICKET, record: t, recordId: t.id })),
    ];

    const failedRecords: FailedRecordDto[] = [];

    for (const { type, record, recordId } of allRecords) {
      const failureReasons: string[] = [];
      const caseDate = record.createdAt;
      if (caseDate) {
        const daysSinceCreation = Math.floor((new Date().getTime() - new Date(caseDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceCreation > 30) {
          failureReasons.push(`Record created ${daysSinceCreation} days ago (exceeds 30-day submission window)`);
        }
      }

      if (failureReasons.length > 0) {
        failedRecords.push({
          recordId,
          patientId: (record as any).patientId,
          recordType: type,
          hospitalId: (record as any).originHospitalId,
          hospitalName: (record as any).originHospital?.name,
          failureReasons,
          createdAt: record.createdAt,
        });
      }
    }

    return failedRecords;
  }

  /**
   * Get failed records for Completeness KPI
   */
  private async getFailedCompletenessRecords(filters: AuditKPIFiltersDto): Promise<FailedRecordDto[]> {
    const dateFilter = this.buildDateFilter(filters);

    const [stemiCases, strokeCases, traumaCases, tickets] = await Promise.all([
      this.shouldIncludeRecordType(filters, RecordType.STEMI)
        ? this.prisma.stemiCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
              patient: {
                ...(filters.patientId && { id: filters.patientId }),
              },
            },
            include: { patient: true, originHospital: { select: { id: true, name: true } } },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.STROKE)
        ? this.prisma.strokeCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
              patient: {
                ...(filters.patientId && { id: filters.patientId }),
              },
            },
            include: { patient: true, originHospital: { select: { id: true, name: true } } },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TRAUMA)
        ? this.prisma.traumaCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
              patient: {
                ...(filters.patientId && { id: filters.patientId }),
              },
            },
            include: { patient: true, originHospital: { select: { id: true, name: true } } },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TICKET)
        ? this.prisma.ticket.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
              patient: {
                ...(filters.patientId && { id: filters.patientId }),
              },
            },
            include: { patient: true, originHospital: { select: { id: true, name: true } } },
          })
        : [],
    ]);

    const allRecords = [
      ...stemiCases.map((c) => ({ type: RecordType.STEMI, record: c, recordId: c.id })),
      ...strokeCases.map((c) => ({ type: RecordType.STROKE, record: c, recordId: c.id })),
      ...traumaCases.map((c) => ({ type: RecordType.TRAUMA, record: c, recordId: c.id })),
      ...tickets.map((t) => ({ type: RecordType.TICKET, record: t, recordId: t.id })),
    ];

    const failedRecords: FailedRecordDto[] = [];

    for (const { type, record, recordId } of allRecords) {
      const failureReasons: string[] = [];
      if (!record.patient?.nationalId || record.patient.nationalId.trim() === '') {
        failureReasons.push('Missing patient national ID');
      } else if (record.patient.nationalId === '00000000000000') {
        failureReasons.push('Placeholder national ID (00000000000000)');
      }

      if (failureReasons.length > 0) {
        failedRecords.push({
          recordId,
          patientId: record.patient?.id,
          recordType: type,
          hospitalId: (record as any).originHospitalId,
          hospitalName: (record as any).originHospital?.name,
          failureReasons,
          createdAt: record.createdAt,
        });
      }
    }

    return failedRecords;
  }

  /**
   * Get failed records for Coverage KPI
   */
  private async getFailedCoverageRecords(filters: AuditKPIFiltersDto): Promise<FailedRecordDto[]> {
    // Coverage KPI currently doesn't have specific failed records logic
    // It's based on change rate analysis, so return empty for now
    return [];
  }

  /**
   * Get failed records for Precision KPI
   */
  private async getFailedPrecisionRecords(filters: AuditKPIFiltersDto): Promise<FailedRecordDto[]> {
    const dateFilter = this.buildDateFilter(filters);

    const [stemiCases, strokeCases, traumaCases] = await Promise.all([
      this.shouldIncludeRecordType(filters, RecordType.STEMI)
        ? this.prisma.stemiCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
            include: { patient: true, originHospital: { select: { id: true, name: true } } },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.STROKE)
        ? this.prisma.strokeCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
            include: { patient: true, originHospital: { select: { id: true, name: true } } },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TRAUMA)
        ? this.prisma.traumaCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
            include: { patient: true, originHospital: { select: { id: true, name: true } } },
          })
        : [],
    ]);

    const failedRecords: FailedRecordDto[] = [];

    // Check STEMI cases
    for (const stemiCase of stemiCases) {
      const failureReasons: string[] = [];
      if (stemiCase.triageTime && stemiCase.firstEcgTime) {
        const minutes = this.calculateMinutesDifference(stemiCase.triageTime, stemiCase.firstEcgTime);
        if (minutes === 0 || minutes > 30) {
          failureReasons.push(`Time between admission and doctor visit is ${minutes} minutes (expected: 1-30 minutes)`);
        }
      }
      if (failureReasons.length > 0) {
        failedRecords.push({
          recordId: stemiCase.id,
          patientId: stemiCase.patientId,
          recordType: RecordType.STEMI,
          hospitalId: stemiCase.originHospitalId,
          hospitalName: stemiCase.originHospital?.name,
          failureReasons,
          createdAt: stemiCase.createdAt,
        });
      }
    }

    // Check Stroke cases
    for (const strokeCase of strokeCases) {
      const failureReasons: string[] = [];
      if (strokeCase.timeOfTriage && strokeCase.timeOfPhysicianAssessment) {
        const minutes = this.calculateMinutesDifference(strokeCase.timeOfTriage, strokeCase.timeOfPhysicianAssessment);
        if (minutes === 0 || minutes > 30) {
          failureReasons.push(`Time between admission and doctor visit is ${minutes} minutes (expected: 1-30 minutes)`);
        }
      }
      if (failureReasons.length > 0) {
        failedRecords.push({
          recordId: strokeCase.id,
          patientId: strokeCase.patientId,
          recordType: RecordType.STROKE,
          hospitalId: strokeCase.originHospitalId,
          hospitalName: strokeCase.originHospital?.name,
          failureReasons,
          createdAt: strokeCase.createdAt,
        });
      }
    }

    // Trauma cases don't have timing fields, so skip for now
    return failedRecords;
  }

  /**
   * Get failed records for Duplication KPI
   */
  private async getFailedDuplicationRecords(filters: AuditKPIFiltersDto): Promise<FailedRecordDto[]> {
    const dateFilter = this.buildDateFilter(filters);

    const [stemiCases, strokeCases, traumaCases, tickets] = await Promise.all([
      this.shouldIncludeRecordType(filters, RecordType.STEMI)
        ? this.prisma.stemiCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
            include: { patient: true, originHospital: { select: { id: true, name: true } } },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.STROKE)
        ? this.prisma.strokeCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
            include: { patient: true, originHospital: { select: { id: true, name: true } } },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TRAUMA)
        ? this.prisma.traumaCase.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
            include: { patient: true, originHospital: { select: { id: true, name: true } } },
          })
        : [],
      this.shouldIncludeRecordType(filters, RecordType.TICKET)
        ? this.prisma.ticket.findMany({
            where: {
              ...dateFilter,
              ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
            },
            include: { patient: true, originHospital: { select: { id: true, name: true } } },
          })
        : [],
    ]);

    // Group by nationalId + case date to find duplicates
    const duplicateMap = new Map<string, any[]>();

    const processCases = (cases: any[], type: RecordType) => {
      for (const caseRecord of cases) {
        if (!caseRecord.patient?.nationalId || caseRecord.patient.nationalId === '00000000000000') {
          continue;
        }
        const caseDate = (caseRecord as any).dateOfAdmission || caseRecord.createdAt;
        const dateKey = caseDate ? new Date(caseDate).toISOString().split('T')[0] : 'unknown';
        const key = `${caseRecord.patient.nationalId}_${type}_${dateKey}`;

        if (!duplicateMap.has(key)) {
          duplicateMap.set(key, []);
        }
        duplicateMap.get(key)!.push({ record: caseRecord, type });
      }
    };

    processCases(stemiCases, RecordType.STEMI);
    processCases(strokeCases, RecordType.STROKE);
    processCases(traumaCases, RecordType.TRAUMA);
    processCases(tickets, RecordType.TICKET);

    const failedRecords: FailedRecordDto[] = [];

    // Add all records that are duplicates (appear more than once)
    for (const [key, records] of duplicateMap.entries()) {
      if (records.length > 1) {
        for (const { record, type } of records) {
          failedRecords.push({
            recordId: record.id,
            patientId: record.patient?.id,
            recordType: type,
            hospitalId: record.originHospitalId,
            hospitalName: record.originHospital?.name,
            failureReasons: [`Duplicate record: Same patient (${record.patient?.nationalId}) registered ${records.length} times for the same visit date`],
            createdAt: record.createdAt,
          });
        }
      }
    }

    return failedRecords;
  }
}

