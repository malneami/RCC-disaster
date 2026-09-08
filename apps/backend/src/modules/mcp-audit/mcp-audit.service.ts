import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { McpClientService } from './mcp-client.service';
import { AuditDimension, AuditEventType, AuditSeverity, Prisma } from '@prisma/client';
import { 
  AuditFiltersDto, 
  DashboardData, 
  AuditEventResponse 
} from './dto/audit.dto';
import { McpAuditRequest } from './dto/mcp.dto';

interface AuditIssue {
  entityType: string;
  entityId: string;
  description: string;
  severity: AuditSeverity;
  details?: any;
}

interface DimensionAuditResult {
  dimension: AuditDimension;
  score: number;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  issues: AuditIssue[];
}

@Injectable()
export class McpAuditService {
  private readonly logger = new Logger(McpAuditService.name);

  constructor(
    private prisma: PrismaService,
    private mcpClient: McpClientService,
    private configService: ConfigService,
  ) {}

  /**
   * Build date filter for queries
   */
  private buildDateFilter(filters: AuditFiltersDto): any {
    const dateFilter: any = {};
    if (filters.startDate || filters.endDate) {
      dateFilter.createdAt = {};
      if (filters.startDate) {
        dateFilter.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.createdAt.lte = endDate;
      }
    }
    return dateFilter;
  }

  /**
   * DIMENSION 1: Completeness Audit
   * Check for missing required fields across all entities
   */
  async auditCompleteness(filters: AuditFiltersDto): Promise<DimensionAuditResult> {
    this.logger.log('Running completeness audit');
    const dateFilter = this.buildDateFilter(filters);
    const issues: AuditIssue[] = [];

    // Patient completeness
    const patients = await this.prisma.patient.findMany({
      where: {
        ...dateFilter,
        ...(filters.patientId && { id: filters.patientId }),
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        dateOfBirth: true,
        age: true,
        nationalId: true,
        nationalIdNotAvailable: true,
        mrn: true,
      },
    });

    let totalPatientRecords = patients.length;
    let validPatientRecords = 0;

    for (const patient of patients) {
      const missing: string[] = [];
      if (!patient.firstName) missing.push('firstName');
      if (!patient.lastName) missing.push('lastName');
      if (!patient.dateOfBirth && !patient.age) missing.push('dateOfBirth or age');
      if (!patient.nationalIdNotAvailable && !patient.nationalId) missing.push('nationalId');

      if (missing.length > 0) {
        issues.push({
          entityType: 'PATIENT',
          entityId: patient.id,
          description: `Missing required fields: ${missing.join(', ')}`,
          severity: AuditSeverity.WARNING,
          details: { missingFields: missing },
        });
      } else {
        validPatientRecords++;
      }
    }

    // Ticket completeness
    const tickets = await this.prisma.ticket.findMany({
      where: {
        ...dateFilter,
        ...(filters.hospitalId && {
          OR: [
            { originHospitalId: filters.hospitalId },
            { destinationHospitalId: filters.hospitalId },
          ],
        }),
        deletedAt: null,
      },
      select: {
        id: true,
        patientId: true,
        originHospitalId: true,
        priority: true,
        pathway: true,
        vitals: true,
      },
    });

    let totalTicketRecords = tickets.length;
    let validTicketRecords = 0;

    for (const ticket of tickets) {
      const missing: string[] = [];
      if (!ticket.patientId) missing.push('patientId');
      if (!ticket.originHospitalId) missing.push('originHospitalId');
      if (!ticket.priority) missing.push('priority');
      if (!ticket.pathway) missing.push('pathway');

      if (missing.length > 0) {
        issues.push({
          entityType: 'TICKET',
          entityId: ticket.id,
          description: `Missing required fields: ${missing.join(', ')}`,
          severity: AuditSeverity.ERROR,
          details: { missingFields: missing },
        });
      } else {
        validTicketRecords++;
      }
    }

    // Disaster incident completeness
    const disasters = await this.prisma.disasterIncident.findMany({
      where: {
        ...dateFilter,
      },
      select: {
        id: true,
        incidentType: true,
        locationLat: true,
        locationLng: true,
        locationAddress: true,
        estimatedGreen: true,
        estimatedYellow: true,
        estimatedRed: true,
        estimatedBlack: true,
      },
    });

    let totalDisasterRecords = disasters.length;
    let validDisasterRecords = 0;

    for (const disaster of disasters) {
      const missing: string[] = [];
      if (!disaster.locationLat) missing.push('locationLat');
      if (!disaster.locationLng) missing.push('locationLng');
      const hasCasualtyEstimates = (disaster.estimatedGreen || 0) + (disaster.estimatedYellow || 0) + 
        (disaster.estimatedRed || 0) + (disaster.estimatedBlack || 0) > 0;
      if (!hasCasualtyEstimates) missing.push('casualty estimates');

      if (missing.length > 0) {
        issues.push({
          entityType: 'DISASTER',
          entityId: disaster.id,
          description: `Missing required fields: ${missing.join(', ')}`,
          severity: AuditSeverity.WARNING,
          details: { missingFields: missing },
        });
      } else {
        validDisasterRecords++;
      }
    }

    // Ambulance completeness
    const ambulances = await this.prisma.ambulance.findMany({
      where: {
        ...dateFilter,
        deletedAt: null,
      },
      select: {
        id: true,
        vehicleImei: true,
        callSign: true,
        plateNumber: true,
        status: true,
        currentLocationLat: true,
        currentLocationLng: true,
      },
    });

    let totalAmbulanceRecords = ambulances.length;
    let validAmbulanceRecords = 0;

    for (const ambulance of ambulances) {
      const missing: string[] = [];
      if (!ambulance.vehicleImei) missing.push('vehicleImei');
      if (!ambulance.callSign) missing.push('callSign');
      if (!ambulance.plateNumber) missing.push('plateNumber');
      if (ambulance.status === 'AVAILABLE' && (!ambulance.currentLocationLat || !ambulance.currentLocationLng)) {
        missing.push('currentLocation');
      }

      if (missing.length > 0) {
        issues.push({
          entityType: 'AMBULANCE',
          entityId: ambulance.id,
          description: `Missing required fields: ${missing.join(', ')}`,
          severity: AuditSeverity.ERROR,
          details: { missingFields: missing },
        });
      } else {
        validAmbulanceRecords++;
      }
    }

    const totalRecords = totalPatientRecords + totalTicketRecords + totalDisasterRecords + totalAmbulanceRecords;
    const validRecords = validPatientRecords + validTicketRecords + validDisasterRecords + validAmbulanceRecords;
    const score = totalRecords > 0 ? (validRecords / totalRecords) * 100 : 100;

    return {
      dimension: AuditDimension.COMPLETENESS,
      score: Math.round(score * 100) / 100,
      totalRecords,
      validRecords,
      invalidRecords: totalRecords - validRecords,
      issues,
    };
  }

  /**
   * DIMENSION 2: Accuracy Audit
   * Validate data correctness (dates, vital signs, clinical scores, coordinates)
   */
  async auditAccuracy(filters: AuditFiltersDto): Promise<DimensionAuditResult> {
    this.logger.log('Running accuracy audit');
    const dateFilter = this.buildDateFilter(filters);
    const issues: AuditIssue[] = [];

    // Patient date of birth validation
    const patients = await this.prisma.patient.findMany({
      where: {
        ...dateFilter,
        ...(filters.patientId && { id: filters.patientId }),
        deletedAt: null,
        dateOfBirth: { not: null },
      },
      select: {
        id: true,
        dateOfBirth: true,
        age: true,
      },
    });

    let totalRecords = patients.length;
    let validRecords = 0;

    const now = new Date();
    const minDate = new Date('1900-01-01');

    for (const patient of patients) {
      if (patient.dateOfBirth) {
        const dob = new Date(patient.dateOfBirth);
        if (dob > now) {
          issues.push({
            entityType: 'PATIENT',
            entityId: patient.id,
            description: 'Date of birth is in the future',
            severity: AuditSeverity.ERROR,
            details: { dateOfBirth: patient.dateOfBirth },
          });
        } else if (dob < minDate) {
          issues.push({
            entityType: 'PATIENT',
            entityId: patient.id,
            description: 'Date of birth is before 1900',
            severity: AuditSeverity.WARNING,
            details: { dateOfBirth: patient.dateOfBirth },
          });
        } else {
          validRecords++;
        }
      }
    }

    // OB Maternal vital signs validation
    const obTransfers = await this.prisma.obMaternalTransfer.findMany({
      where: {
        ...dateFilter,
      },
      select: {
        id: true,
        sbp: true,
        dbp: true,
        hr: true,
        rr: true,
        temp: true,
        spo2: true,
        gestationalAgeWeeks: true,
      },
    });

    for (const transfer of obTransfers) {
      totalRecords++;
      let isValid = true;

      if (transfer.sbp !== null && (transfer.sbp < 50 || transfer.sbp > 250)) {
        issues.push({
          entityType: 'OB_MATERNAL',
          entityId: transfer.id,
          description: `Invalid systolic BP: ${transfer.sbp} (expected: 50-250)`,
          severity: AuditSeverity.WARNING,
        });
        isValid = false;
      }

      if (transfer.hr !== null && (transfer.hr < 20 || transfer.hr > 250)) {
        issues.push({
          entityType: 'OB_MATERNAL',
          entityId: transfer.id,
          description: `Invalid heart rate: ${transfer.hr} (expected: 20-250)`,
          severity: AuditSeverity.WARNING,
        });
        isValid = false;
      }

      if (transfer.spo2 !== null && (transfer.spo2 < 0 || transfer.spo2 > 100)) {
        issues.push({
          entityType: 'OB_MATERNAL',
          entityId: transfer.id,
          description: `Invalid SpO2: ${transfer.spo2} (expected: 0-100)`,
          severity: AuditSeverity.WARNING,
        });
        isValid = false;
      }

      if (transfer.gestationalAgeWeeks !== null && (transfer.gestationalAgeWeeks < 1 || transfer.gestationalAgeWeeks > 45)) {
        issues.push({
          entityType: 'OB_MATERNAL',
          entityId: transfer.id,
          description: `Invalid gestational age: ${transfer.gestationalAgeWeeks} (expected: 1-45)`,
          severity: AuditSeverity.ERROR,
        });
        isValid = false;
      }

      if (isValid) validRecords++;
    }

    // Geographic coordinates validation
    const hospitals = await this.prisma.hospital.findMany({
      where: {
        ...(filters.hospitalId && { id: filters.hospitalId }),
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
      },
    });

    for (const hospital of hospitals) {
      totalRecords++;
      let isValid = true;

      if (hospital.latitude !== null && (hospital.latitude < -90 || hospital.latitude > 90)) {
        issues.push({
          entityType: 'HOSPITAL',
          entityId: hospital.id,
          description: `Invalid latitude: ${hospital.latitude} (expected: -90 to 90)`,
          severity: AuditSeverity.ERROR,
        });
        isValid = false;
      }

      if (hospital.longitude !== null && (hospital.longitude < -180 || hospital.longitude > 180)) {
        issues.push({
          entityType: 'HOSPITAL',
          entityId: hospital.id,
          description: `Invalid longitude: ${hospital.longitude} (expected: -180 to 180)`,
          severity: AuditSeverity.ERROR,
        });
        isValid = false;
      }

      if (isValid) validRecords++;
    }

    const score = totalRecords > 0 ? (validRecords / totalRecords) * 100 : 100;

    return {
      dimension: AuditDimension.ACCURACY,
      score: Math.round(score * 100) / 100,
      totalRecords,
      validRecords,
      invalidRecords: totalRecords - validRecords,
      issues,
    };
  }

  /**
   * DIMENSION 3: Consistency Audit
   * Check duplicates and cross-reference validation
   */
  async auditConsistency(filters: AuditFiltersDto): Promise<DimensionAuditResult> {
    this.logger.log('Running consistency audit');
    const dateFilter = this.buildDateFilter(filters);
    const issues: AuditIssue[] = [];
    let totalRecords = 0;
    let validRecords = 0;

    // Patient duplicates by National ID
    const patientDuplicates = await this.prisma.$queryRaw<Array<{ national_id: string; count: bigint }>>`
      SELECT national_id, COUNT(*) as count
      FROM patients
      WHERE national_id IS NOT NULL
        AND deleted_at IS NULL
        ${filters.patientId ? Prisma.sql`AND id = ${filters.patientId}` : Prisma.empty}
      GROUP BY national_id
      HAVING COUNT(*) > 1
    `;

    for (const dup of patientDuplicates) {
      totalRecords++;
      const duplicatePatients = await this.prisma.patient.findMany({
        where: { nationalId: dup.national_id, deletedAt: null },
        select: { id: true },
      });

      issues.push({
        entityType: 'PATIENT',
        entityId: duplicatePatients.map(p => p.id).join(','),
        description: `Duplicate National ID: ${dup.national_id} (${Number(dup.count)} records)`,
        severity: AuditSeverity.ERROR,
        details: { nationalId: dup.national_id, count: Number(dup.count) },
      });
    }

    // Tickets referencing missing or deleted patients
    const ticketsWithoutPatients = await this.prisma.$queryRaw<Array<{ id: string; patient_id: string }>>`
      SELECT t.id, t.patient_id
      FROM tickets t
      LEFT JOIN patients p ON p.id = t.patient_id AND p.deleted_at IS NULL
      WHERE t.deleted_at IS NULL
        AND p.id IS NULL
        ${filters.hospitalId ? Prisma.sql`AND (t.origin_hospital_id = ${filters.hospitalId} OR t.destination_hospital_id = ${filters.hospitalId})` : Prisma.empty}
        ${filters.startDate ? Prisma.sql`AND t.created_at >= ${new Date(filters.startDate)}` : Prisma.empty}
        ${filters.endDate ? Prisma.sql`AND t.created_at <= ${new Date(filters.endDate)}` : Prisma.empty}
    `;

    totalRecords += ticketsWithoutPatients.length;
    for (const ticket of ticketsWithoutPatients) {
      issues.push({
        entityType: 'TICKET',
        entityId: ticket.id,
        description: `Ticket references non-existent patient: ${ticket.patient_id}`,
        severity: AuditSeverity.CRITICAL,
      });
    }

    // Ambulance assignments without ambulances
    const assignmentsWithoutAmbulance = await this.prisma.$queryRaw<Array<{ id: string; ambulance_id: string }>>`
      SELECT a.id, a.ambulance_id
      FROM ems_assignments a
      LEFT JOIN ambulances amb ON amb.id = a.ambulance_id AND amb.deleted_at IS NULL
      WHERE a.ambulance_id IS NOT NULL
        AND amb.id IS NULL
        ${filters.startDate ? Prisma.sql`AND a.created_at >= ${new Date(filters.startDate)}` : Prisma.empty}
        ${filters.endDate ? Prisma.sql`AND a.created_at <= ${new Date(filters.endDate)}` : Prisma.empty}
    `;

    totalRecords += assignmentsWithoutAmbulance.length;
    for (const assignment of assignmentsWithoutAmbulance) {
      issues.push({
        entityType: 'EMS_ASSIGNMENT',
        entityId: assignment.id,
        description: `Assignment references non-existent ambulance: ${assignment.ambulance_id}`,
        severity: AuditSeverity.CRITICAL,
      });
    }

    validRecords = totalRecords - issues.length;
    const score = totalRecords > 0 ? (validRecords / totalRecords) * 100 : 100;

    return {
      dimension: AuditDimension.CONSISTENCY,
      score: Math.round(score * 100) / 100,
      totalRecords,
      validRecords,
      invalidRecords: totalRecords - validRecords,
      issues,
    };
  }

  /**
   * DIMENSION 4: Timeliness Audit
   * Check data freshness and timestamp anomalies
   */
  async auditTimeliness(filters: AuditFiltersDto): Promise<DimensionAuditResult> {
    this.logger.log('Running timeliness audit');
    const dateFilter = this.buildDateFilter(filters);
    const issues: AuditIssue[] = [];
    let totalRecords = 0;
    let validRecords = 0;

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Ambulances with stale location data
    const staleAmbulances = await this.prisma.ambulance.findMany({
      where: {
        status: { in: ['IN_USE'] },
        OR: [
          { lastUpdated: { lt: fiveMinutesAgo } },
          { lastUpdated: null },
        ],
        deletedAt: null,
      },
      select: {
        id: true,
        callSign: true,
        lastUpdated: true,
        status: true,
      },
    });

    totalRecords += staleAmbulances.length;
    for (const ambulance of staleAmbulances) {
      issues.push({
        entityType: 'AMBULANCE',
        entityId: ambulance.id,
        description: `Stale GPS data: Last update ${ambulance.lastUpdated ? new Date(ambulance.lastUpdated).toISOString() : 'never'}`,
        severity: AuditSeverity.WARNING,
        details: { lastUpdate: ambulance.lastUpdated, status: ambulance.status },
      });
    }

    // Pending tickets older than 24 hours
    const stalePendingTickets = await this.prisma.ticket.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: oneDayAgo },
        ...(filters.hospitalId && {
          OR: [
            { originHospitalId: filters.hospitalId },
            { destinationHospitalId: filters.hospitalId },
          ],
        }),
        deletedAt: null,
      },
      select: {
        id: true,
        ticketNumber: true,
        createdAt: true,
      },
    });

    totalRecords += stalePendingTickets.length;
    for (const ticket of stalePendingTickets) {
      const hours = Math.floor((now.getTime() - new Date(ticket.createdAt).getTime()) / (60 * 60 * 1000));
      issues.push({
        entityType: 'TICKET',
        entityId: ticket.id,
        description: `Ticket pending for ${hours} hours`,
        severity: AuditSeverity.WARNING,
        details: { createdAt: ticket.createdAt, hoursOld: hours },
      });
    }

    // Future timestamps
    const futureTickets = await this.prisma.ticket.findMany({
      where: {
        ...dateFilter,
        createdAt: { gt: now },
        ...(filters.hospitalId && {
          OR: [
            { originHospitalId: filters.hospitalId },
            { destinationHospitalId: filters.hospitalId },
          ],
        }),
        deletedAt: null,
      },
      select: { id: true, createdAt: true },
    });

    totalRecords += futureTickets.length;
    for (const ticket of futureTickets) {
      issues.push({
        entityType: 'TICKET',
        entityId: ticket.id,
        description: 'Created date is in the future',
        severity: AuditSeverity.ERROR,
        details: { createdAt: ticket.createdAt },
      });
    }

    validRecords = totalRecords - issues.length;
    const score = totalRecords > 0 ? (validRecords / totalRecords) * 100 : 100;

    return {
      dimension: AuditDimension.TIMELINESS,
      score: Math.round(score * 100) / 100,
      totalRecords,
      validRecords,
      invalidRecords: totalRecords - validRecords,
      issues,
    };
  }

  /**
   * DIMENSION 5: Compliance Audit
   * Validate against clinical protocols and MoH standards
   */
  async auditCompliance(filters: AuditFiltersDto): Promise<DimensionAuditResult> {
    this.logger.log('Running compliance audit');
    const dateFilter = this.buildDateFilter(filters);
    const issues: AuditIssue[] = [];
    let totalRecords = 0;
    let validRecords = 0;

    // STEMI cases: Door-to-balloon time (using triage as door time)
    const stemiCases = await this.prisma.stemiCase.findMany({
      where: {
        ...dateFilter,
        ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
        deletedAt: null,
      },
      select: {
        id: true,
        triageTime: true,
        balloonInflationTime: true,
      },
    });

    for (const stemiCase of stemiCases) {
      totalRecords++;
      if (stemiCase.triageTime && stemiCase.balloonInflationTime) {
        const doorToBalloon = (new Date(stemiCase.balloonInflationTime).getTime() - new Date(stemiCase.triageTime).getTime()) / (60 * 1000);
        if (doorToBalloon > 90) {
          issues.push({
            entityType: 'STEMI_CASE',
            entityId: stemiCase.id,
            description: `Door-to-balloon time ${Math.round(doorToBalloon)} minutes (target: <90 min)`,
            severity: AuditSeverity.WARNING,
            details: { doorToBalloonMinutes: Math.round(doorToBalloon) },
          });
        } else {
          validRecords++;
        }
      }
    }

    // Stroke cases: Door-to-needle time (using dateOfAdmission as door time)
    const strokeCases = await this.prisma.strokeCase.findMany({
      where: {
        ...dateFilter,
        ...(filters.hospitalId && { originHospitalId: filters.hospitalId }),
        deletedAt: null,
      },
      select: {
        id: true,
        dateOfAdmission: true,
        ivThrombolysisAdministrationTime: true,
      },
    });

    for (const strokeCase of strokeCases) {
      totalRecords++;
      if (strokeCase.dateOfAdmission && strokeCase.ivThrombolysisAdministrationTime) {
        const doorToNeedle = (new Date(strokeCase.ivThrombolysisAdministrationTime).getTime() - new Date(strokeCase.dateOfAdmission).getTime()) / (60 * 1000);
        if (doorToNeedle > 60) {
          issues.push({
            entityType: 'STROKE_CASE',
            entityId: strokeCase.id,
            description: `Door-to-needle time ${Math.round(doorToNeedle)} minutes (target: <60 min)`,
            severity: AuditSeverity.WARNING,
            details: { doorToNeedleMinutes: Math.round(doorToNeedle) },
          });
        } else {
          validRecords++;
        }
      }
    }

    // Disaster incidents: Check if announcement was sent
    const disasters = await this.prisma.disasterIncident.findMany({
      where: {
        ...dateFilter,
        status: { in: ['ACTIVE', 'RESOLVED'] },
      },
      select: {
        id: true,
        incidentType: true,
        createdAt: true,
        announcements: {
          where: { status: 'SENT' },
          select: { id: true },
        },
      },
    });

    for (const disaster of disasters) {
      totalRecords++;
      if (disaster.announcements.length === 0) {
        issues.push({
          entityType: 'DISASTER',
          entityId: disaster.id,
          description: 'No hospital announcement sent',
          severity: AuditSeverity.ERROR,
        });
      } else {
        validRecords++;
      }
    }

    const score = totalRecords > 0 ? (validRecords / totalRecords) * 100 : 100;

    return {
      dimension: AuditDimension.COMPLIANCE,
      score: Math.round(score * 100) / 100,
      totalRecords,
      validRecords,
      invalidRecords: totalRecords - validRecords,
      issues,
    };
  }

  /**
   * DIMENSION 6: Integrity Audit
   * Check referential integrity and orphaned records
   */
  async auditIntegrity(filters: AuditFiltersDto): Promise<DimensionAuditResult> {
    this.logger.log('Running integrity audit');
    const dateFilter = this.buildDateFilter(filters);
    const issues: AuditIssue[] = [];
    let totalRecords = 0;
    let validRecords = 0;

    // Bed requests without patients
    const bedRequestsWithoutPatients = await this.prisma.$queryRaw<Array<{ id: string; patient_id: string; request_number: string }>>`
      SELECT br.id, br.patient_id, br.request_number
      FROM bed_requests br
      LEFT JOIN patients p ON p.id = br.patient_id AND p.deleted_at IS NULL
      WHERE br.deleted_at IS NULL
        AND p.id IS NULL
        ${filters.hospitalId ? Prisma.sql`AND br.hospital_id = ${filters.hospitalId}` : Prisma.empty}
        ${filters.startDate ? Prisma.sql`AND br.created_at >= ${new Date(filters.startDate)}` : Prisma.empty}
        ${filters.endDate ? Prisma.sql`AND br.created_at <= ${new Date(filters.endDate)}` : Prisma.empty}
    `;

    totalRecords += bedRequestsWithoutPatients.length;
    for (const request of bedRequestsWithoutPatients) {
      issues.push({
        entityType: 'BED_REQUEST',
        entityId: request.id,
        description: `Bed request references non-existent patient: ${request.patient_id}`,
        severity: AuditSeverity.CRITICAL,
      });
    }

    // Cases without patients
    const stemiCasesWithoutPatients = await this.prisma.$queryRaw<Array<{ id: string; patient_id: string }>>`
      SELECT sc.id, sc.patient_id
      FROM stemi_cases sc
      LEFT JOIN patients p ON p.id = sc.patient_id AND p.deleted_at IS NULL
      WHERE sc.deleted_at IS NULL
        AND p.id IS NULL
        ${filters.hospitalId ? Prisma.sql`AND sc.origin_hospital_id = ${filters.hospitalId}` : Prisma.empty}
        ${filters.startDate ? Prisma.sql`AND sc.created_at >= ${new Date(filters.startDate)}` : Prisma.empty}
        ${filters.endDate ? Prisma.sql`AND sc.created_at <= ${new Date(filters.endDate)}` : Prisma.empty}
    `;

    totalRecords += stemiCasesWithoutPatients.length;
    for (const stemiCase of stemiCasesWithoutPatients) {
      issues.push({
        entityType: 'STEMI_CASE',
        entityId: stemiCase.id,
        description: `STEMI case references non-existent patient: ${stemiCase.patient_id}`,
        severity: AuditSeverity.CRITICAL,
      });
    }

    // EMS assignments without tickets
    const assignmentsWithoutTickets = await this.prisma.$queryRaw<Array<{ id: string; ticket_id: string }>>`
      SELECT a.id, a.ticket_id
      FROM ems_assignments a
      LEFT JOIN tickets t ON t.id = a.ticket_id AND t.deleted_at IS NULL
      WHERE t.id IS NULL
        ${filters.startDate ? Prisma.sql`AND a.created_at >= ${new Date(filters.startDate)}` : Prisma.empty}
        ${filters.endDate ? Prisma.sql`AND a.created_at <= ${new Date(filters.endDate)}` : Prisma.empty}
    `;

    totalRecords += assignmentsWithoutTickets.length;
    for (const assignment of assignmentsWithoutTickets) {
      issues.push({
        entityType: 'EMS_ASSIGNMENT',
        entityId: assignment.id,
        description: `EMS assignment references non-existent ticket: ${assignment.ticket_id}`,
        severity: AuditSeverity.CRITICAL,
      });
    }

    validRecords = totalRecords - issues.length;
    const score = totalRecords > 0 ? (validRecords / totalRecords) * 100 : 100;

    return {
      dimension: AuditDimension.INTEGRITY,
      score: Math.round(score * 100) / 100,
      totalRecords,
      validRecords,
      invalidRecords: totalRecords - validRecords,
      issues,
    };
  }

  /**
   * Generate comprehensive audit report across all dimensions
   */
  async generateComprehensiveReport(
    filters: AuditFiltersDto,
    userId?: string | null,
    submitToMcp = true,
    persistResults = true,
  ): Promise<{
    results: DimensionAuditResult[];
    overallScore: number;
    reportId?: string;
  }> {
    this.logger.log('Generating comprehensive audit report');

    const resolvedUserId = userId && userId !== 'system' ? userId : undefined;
    const dimensions = filters.dimensions || Object.values(AuditDimension);
    const results: DimensionAuditResult[] = [];

    // Run audits for requested dimensions
    for (const dimension of dimensions) {
      let result: DimensionAuditResult;
      switch (dimension) {
        case AuditDimension.COMPLETENESS:
          result = await this.auditCompleteness(filters);
          break;
        case AuditDimension.ACCURACY:
          result = await this.auditAccuracy(filters);
          break;
        case AuditDimension.CONSISTENCY:
          result = await this.auditConsistency(filters);
          break;
        case AuditDimension.TIMELINESS:
          result = await this.auditTimeliness(filters);
          break;
        case AuditDimension.COMPLIANCE:
          result = await this.auditCompliance(filters);
          break;
        case AuditDimension.INTEGRITY:
          result = await this.auditIntegrity(filters);
          break;
        default:
          continue;
      }
      results.push(result);

      if (!persistResults) {
        continue;
      }

      // Save audit events for issues
      for (const issue of result.issues) {
        await this.prisma.auditEvent.create({
          data: {
            eventType: AuditEventType.SCHEDULED_AUDIT,
            dimension: result.dimension,
            entityType: issue.entityType,
            entityId: issue.entityId,
            severity: issue.severity,
            description: issue.description,
            details: issue.details || {},
            createdById: resolvedUserId,
          },
        });
      }
    }

    // Calculate overall score
    const overallScore = results.length > 0
      ? results.reduce((sum, r) => sum + r.score, 0) / results.length
      : 100;

    if (!persistResults) {
      return {
        results,
        overallScore: Math.round(overallScore * 100) / 100,
      };
    }

    // Create audit report
    const reportNumber = `AUDIT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const report = await this.prisma.auditReport.create({
      data: {
        reportNumber,
        reportType: 'ON_DEMAND',
        startDate: filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: filters.endDate ? new Date(filters.endDate) : new Date(),
        overallScore,
        dimensionScores: results.reduce((acc, r) => ({ ...acc, [r.dimension]: r.score }), {}),
        summary: {
          totalDimensions: results.length,
          results: results.map(r => ({
            dimension: r.dimension,
            score: r.score,
            totalRecords: r.totalRecords,
            issueCount: r.issues.length,
          })),
        },
        generatedById: resolvedUserId,
      },
    });

    // Submit to MCP if enabled
    if (submitToMcp && this.mcpClient.isEnabled()) {
      const mcpRequest: McpAuditRequest = {
        auditId: report.id,
        timestamp: new Date().toISOString(),
        auditType: 'ON_DEMAND',
        dimensions: results.map(r => r.dimension),
        filters: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          hospitalId: filters.hospitalId,
          entityTypes: [...new Set(results.flatMap(r => r.issues.map(i => i.entityType)))],
        },
        data: results.reduce((acc, r) => ({
          ...acc,
          [r.dimension]: {
            score: r.score,
            issues: r.issues.map(i => ({
              entityType: i.entityType,
              entityId: i.entityId,
              description: i.description,
              severity: i.severity,
            })),
          },
        }), {}),
      };

      const mcpResponse = await this.mcpClient.requestAuditReport(mcpRequest);
      if (mcpResponse) {
        await this.prisma.auditReport.update({
          where: { id: report.id },
          data: {
            mcpReportUrl: mcpResponse.analysisUrl,
          },
        });
      }
    }

    return {
      results,
      overallScore: Math.round(overallScore * 100) / 100,
      reportId: report.id,
    };
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(filters: AuditFiltersDto): Promise<DashboardData> {
    const { results, overallScore } = await this.generateComprehensiveReport(filters, null, false, false);

    // Get recent events
    const recentEvents = await this.prisma.auditEvent.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Calculate severity breakdown
    const severityBreakdown = await this.prisma.auditEvent.groupBy({
      by: ['severity'],
      _count: { severity: true },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      overallScore,
      dimensionScores: results.reduce((acc, r) => ({ ...acc, [r.dimension]: r.score }), {} as Record<AuditDimension, number>),
      recentEvents: recentEvents as AuditEventResponse[],
      trends: results.map(r => ({
        dimension: r.dimension,
        trend: 'stable' as const, // TODO: Calculate trends from historical data
        change: 0,
      })),
      severityBreakdown: severityBreakdown.reduce((acc, s) => ({
        ...acc,
        [s.severity]: s._count.severity,
      }), {} as Record<AuditSeverity, number>),
    };
  }
}
