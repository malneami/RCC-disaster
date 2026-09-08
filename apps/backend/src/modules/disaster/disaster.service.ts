import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import axios from 'axios';
import { PrismaService } from '../../database/prisma.service';
import { DisasterGateway } from './disaster.gateway';
import { DisasterNotificationService } from './disaster-notification.service';
import { TelegramService } from '../support/telegram.service';
import { HospitalsService } from '../hospitals/hospitals.service';
import { VideoCallsService } from '../video-calls/video-calls.service';
import {
  CreateDisasterIncidentDto,
  CreateAnnouncementDto,
  AssignAmbulanceDto,
  AssignCommandRoleDto,
  EscalateCommandRoomDto,
  LogCommandDecisionDto,
} from './dto';
import {
  DisasterIncidentType,
  DisasterScope,
  DisasterStatus,
  DisasterAnnouncementStatus,
  AmbulanceStatus,
  DisasterAssignmentStatus,
  DisasterCommandRole,
  DisasterEscalationLevel,
  DisasterCommandDecisionAction,
  UserRole,
} from '@prisma/client';
import { getRequiredRolesForLevel } from './constants/level-role-config';

const INTERNAL_INCIDENT_TYPES: DisasterIncidentType[] = [
  'INTERNAL_FIRE',
  'SMOKE_ELECTRICAL_FAILURE',
  'POWER_FAILURE',
  'WATER_LEAKAGE_FLOODING',
  'IT_SYSTEM_FAILURE',
];
const EXTERNAL_INCIDENT_TYPES: DisasterIncidentType[] = [
  'RTA_MCI',
  'CODE_YELLOW',
  'EARTHQUAKE',
  'FLOOD',
  'FIRE',
  'CHEMICAL_SPILL',
  'OUTBREAK',
];

// Haversine formula - returns distance in km
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Parses coordinates from a Google Maps URL (long format).
 * Supports: @lat,lng, !3dlat!4dlng, q=lat,lng, place/.../@lat,lng
 */
function parseCoordinatesFromUrl(url: string): { lat: number; lng: number } | null {
  if (!url || typeof url !== 'string') return null;
  const decoded = decodeURIComponent(url);
  // @lat,lng (e.g. /@24.7136,46.6753,15z)
  const atMatch = decoded.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
  }
  // !3dlat!4dlng (older format)
  const exMatch = decoded.match(/!3d(-?\d+\.?\d*)\s*!4d(-?\d+\.?\d*)/);
  if (exMatch) {
    const lat = parseFloat(exMatch[1]);
    const lng = parseFloat(exMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
  }
  // q=lat,lng or query=lat,lng
  const qMatch = decoded.match(/(?:^|[?&])(?:q|query)=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
  }
  return null;
}

const ANNOUNCEMENT_TEMPLATES: Record<DisasterIncidentType, string> = {
  RTA_MCI:
    'ATTENTION: Mass Casualty Incident (RTA) in progress. Prepare emergency department. Expect multiple casualties. Stand by for updates.',
  CODE_YELLOW:
    'ATTENTION: Code Yellow activated. Internal emergency. All relevant staff please respond as per protocol.',
  EARTHQUAKE:
    'ATTENTION: Earthquake disaster declared. Prepare for structural injuries, crush syndrome, mass casualties. Activate emergency protocols.',
  FLOOD:
    'ATTENTION: Flood disaster declared. Prepare for water-related injuries, evacuation support. Activate emergency protocols.',
  FIRE:
    'ATTENTION: Fire disaster declared. Prepare for burn injuries, smoke inhalation, mass casualties. Activate emergency protocols.',
  CHEMICAL_SPILL:
    'ATTENTION: Chemical spill/hazard declared. Prepare for chemical exposure, decontamination. Activate hazmat protocols.',
  OUTBREAK:
    'ATTENTION: Infectious disease outbreak declared. Prepare for isolation, PPE, infection control. Activate outbreak protocols.',
  // Internal (hospital) disaster types
  INTERNAL_FIRE:
    'ATTENTION: Internal fire incident in facility. Evacuate affected area. Activate fire response protocol. Stand by for updates.',
  SMOKE_ELECTRICAL_FAILURE:
    'ATTENTION: Smoke/electrical failure or short circuit detected. Isolate area. Engineering and safety teams respond. Stand by.',
  POWER_FAILURE:
    'ATTENTION: Power failure in facility. Activate backup systems. Critical areas prioritized. Stand by for updates.',
  WATER_LEAKAGE_FLOODING:
    'ATTENTION: Water leakage or flooding in facility. Isolate area. Prevent electrical hazards. Engineering respond.',
  IT_SYSTEM_FAILURE:
    'ATTENTION: IT system failure. Activate contingency protocols. Critical systems prioritized. IT team respond.',
};

@Injectable()
export class DisasterService {
  private readonly logger = new Logger(DisasterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly disasterGateway: DisasterGateway,
    private readonly disasterNotificationService: DisasterNotificationService,
    private readonly telegramService: TelegramService,
    private readonly hospitalsService: HospitalsService,
    private readonly videoCallsService: VideoCallsService,
  ) {}

  /**
   * Resolves a Google Maps URL (including short links like maps.app.goo.gl)
   * and returns lat/lng coordinates.
   */
  async resolveMapUrl(url: string): Promise<{ lat: number; lng: number }> {
    const trimmed = (url || '').trim();
    if (!trimmed) {
      throw new BadRequestException('URL is required');
    }

    // Try parsing direct URLs first (no fetch needed)
    const directCoords = parseCoordinatesFromUrl(trimmed);
    if (directCoords) return directCoords;

    let finalUrl = trimmed;

    // Check if it's a short link that needs resolution
    const isShortLink =
      /^https?:\/\/(www\.)?(maps\.app\.)?goo\.gl\/maps?\//i.test(trimmed) ||
      /^https?:\/\/(www\.)?maps\.app\.goo\.gl\//i.test(trimmed);

    if (isShortLink) {
      try {
        let current = trimmed;
        for (let i = 0; i < 5; i++) {
          const res = await axios.get(current, {
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RCC-Disaster/1.0)' },
            timeout: 10000,
          });
          const location = res.headers?.location;
          if (location) {
            current = location.startsWith('/') ? `https://www.google.com${location}` : location;
          } else {
            finalUrl = current;
            break;
          }
        }
        finalUrl = current;
      } catch (err: any) {
        if (err.response?.status === 301 || err.response?.status === 302) {
          const loc = err.response.headers?.location;
          if (loc) {
            finalUrl = loc.startsWith('/') ? `https://www.google.com${loc}` : loc;
          }
        }
        if (!parseCoordinatesFromUrl(finalUrl)) {
          this.logger.warn(`resolveMapUrl fetch failed: ${err.message}`);
          throw new BadRequestException('Could not resolve map link. Please use a direct Google Maps URL with coordinates.');
        }
      }
    }

    const coords = parseCoordinatesFromUrl(finalUrl);
    if (!coords) {
      throw new BadRequestException(
        'Could not extract coordinates from the link. Please share a Google Maps link with a specific location (not just a search).'
      );
    }
    return coords;
  }

  async createIncident(
    dto: CreateDisasterIncidentDto,
    userId: string,
  ): Promise<{ incident: any; nearestAmbulances: any[] }> {
    const scope = dto.disasterScope ?? DisasterScope.EXTERNAL;
    const validForScope =
      scope === DisasterScope.INTERNAL
        ? INTERNAL_INCIDENT_TYPES.includes(dto.incidentType)
        : EXTERNAL_INCIDENT_TYPES.includes(dto.incidentType);
    if (!validForScope) {
      throw new BadRequestException(
        `Incident type ${dto.incidentType} is not valid for ${scope} disaster scope`,
      );
    }
    if (dto.incidentType === DisasterIncidentType.RTA_MCI && !dto.colorCode) {
      throw new ForbiddenException('Color code is required for RTA_MCI incidents');
    }

    const incident = await this.prisma.disasterIncident.create({
      data: {
        disasterScope: scope,
        incidentType: dto.incidentType,
        colorCode: dto.colorCode,
        status: DisasterStatus.ACTIVE,
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        locationAddress: dto.locationAddress,
        locationDescription: dto.locationDescription,
        estimatedGreen: dto.estimatedGreen ?? 0,
        estimatedYellow: dto.estimatedYellow ?? 0,
        estimatedRed: dto.estimatedRed ?? 0,
        estimatedBlack: dto.estimatedBlack ?? 0,
        estimatedETA: dto.estimatedETA ? new Date(dto.estimatedETA) : null,
        notes: dto.notes,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    await this.auditLog(incident.id, userId, 'CREATE_INCIDENT', JSON.stringify(dto));

    const nearestAmbulances = await this.findNearestAmbulances(
      incident.locationLat,
      incident.locationLng,
      5,
    );

    this.disasterGateway.broadcastIncidentCreated({
      ...incident,
      nearestAmbulances,
    });

    this.disasterNotificationService
      .getDisasterRoleUserIds()
      .then((userIds) =>
        this.disasterNotificationService.createDisasterNotification(
          incident.id,
          'INCIDENT_CREATED',
          userIds,
          userId,
        ),
      )
      .catch((err) => this.logger.warn('Failed to create disaster notification', err));

    return { incident, nearestAmbulances };
  }

  async findNearestAmbulances(
    lat: number,
    lng: number,
    limit = 5,
  ): Promise<any[]> {
    const ambulances = await this.prisma.ambulance.findMany({
      where: {
        status: AmbulanceStatus.AVAILABLE,
        isActive: true,
        deletedAt: null,
        currentLocationLat: { not: null },
        currentLocationLng: { not: null },
      },
      include: {
        driver: { select: { firstName: true, lastName: true, phoneNumber: true } },
      },
    });

    const withDistance = ambulances.map((a) => ({
      ...a,
      distanceKm: haversineDistance(
        lat,
        lng,
        a.currentLocationLat!,
        a.currentLocationLng!,
      ),
    }));

    withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
    return withDistance.slice(0, limit);
  }

  async assignAmbulance(
    incidentId: string,
    dto: AssignAmbulanceDto,
    userId: string,
  ): Promise<any> {
    this.logger.log(
      `Assign ambulance: incidentId=${incidentId}, ambulanceId=${dto.ambulanceId}, triageCategory=${dto.triageCategory ?? 'none'}`,
    );

    const incident = await this.prisma.disasterIncident.findUnique({
      where: { id: incidentId },
      include: { ambulanceAssignments: { include: { ambulance: true } } },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    if (incident.status !== DisasterStatus.ACTIVE) {
      throw new ForbiddenException('Cannot assign to non-active incident');
    }

    const ambulance = await this.prisma.ambulance.findUnique({
      where: { id: dto.ambulanceId },
    });
    if (!ambulance) throw new NotFoundException('Ambulance not found');

    const distanceKm =
      ambulance.currentLocationLat && ambulance.currentLocationLng
        ? haversineDistance(
            incident.locationLat,
            incident.locationLng,
            ambulance.currentLocationLat,
            ambulance.currentLocationLng,
          )
        : null;

    try {
      const assignment = await this.prisma.disasterAmbulanceAssignment.create({
        data: {
          disasterIncidentId: incidentId,
          ambulanceId: dto.ambulanceId,
          assignedById: userId,
          triageCategory: dto.triageCategory ?? undefined,
          distanceKm,
          status: DisasterAssignmentStatus.EN_ROUTE,
        },
        include: {
          ambulance: true,
          assignedBy: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      });

      await this.prisma.ambulance.update({
        where: { id: dto.ambulanceId },
        data: { status: AmbulanceStatus.IN_USE },
      });

      await this.auditLog(
        incidentId,
        userId,
        'ASSIGN_AMBULANCE',
        JSON.stringify({ ambulanceId: dto.ambulanceId, assignmentId: assignment.id }),
      );

      try {
        this.disasterGateway.broadcastAmbulanceAssigned(assignment);
        this.disasterGateway.broadcastSituationalAwarenessUpdated(incidentId);
      } catch (broadcastErr) {
        this.logger.warn(
          'WebSocket broadcast failed (assignment still saved)',
          broadcastErr instanceof Error ? broadcastErr.message : String(broadcastErr),
        );
      }

      this.disasterNotificationService
        .getDisasterRoleUserIds()
        .then((userIds) =>
          this.disasterNotificationService.createDisasterNotification(
            incidentId,
            'AMBULANCE_ASSIGNED',
            userIds,
            userId,
          ),
        )
        .catch((err) => this.logger.warn('Failed to create disaster notification', err));

      return assignment;
    } catch (error) {
      const errName = error instanceof Error ? error.constructor.name : 'Unknown';
      const errCode = (error as any)?.code;
      const errMessage = error instanceof Error ? error.message : String(error);
      const errMeta = (error as any)?.meta;
      this.logger.error(
        `Assign ambulance failed: name=${errName}, code=${errCode ?? 'n/a'}, message=${errMessage}`,
        errMeta ? `meta=${JSON.stringify(errMeta)}` : undefined,
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'This ambulance is already assigned to this incident or another active incident.',
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Invalid ambulance or incident reference. The ambulance may not exist in the system.',
          );
        }
        if (error.code === 'P2025') {
          throw new BadRequestException(
            'Record not found. The ambulance or incident may have been removed.',
          );
        }
        this.logger.error(`Prisma KnownRequestError: ${error.code}`, error.message);
      } else if (error instanceof Prisma.PrismaClientValidationError) {
        throw new BadRequestException(
          'Invalid data for ambulance assignment. Please check triage category and other fields.',
        );
      } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
        this.logger.error('Prisma UnknownRequestError', errMessage);
        throw new BadRequestException(
          'Database error during assignment. Please try again.',
        );
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to assign ambulance. Please try again.',
      );
    }
  }

  async getActiveIncidents(): Promise<any[]> {
    return this.prisma.disasterIncident.findMany({
      where: { status: DisasterStatus.ACTIVE },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        ambulanceAssignments: {
          include: {
            ambulance: { select: { id: true, callSign: true, status: true } },
            assignedBy: { select: { firstName: true, lastName: true } },
            destinationHospital: { select: { id: true, name: true } },
          },
        },
        announcements: {
          include: { createdBy: { select: { firstName: true, lastName: true } } },
        },
        commandRoom: {
          include: {
            activatedBy: { select: { firstName: true, lastName: true } },
            closedBy: { select: { firstName: true, lastName: true } },
            roleAssignments: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getIncidentById(id: string): Promise<any> {
    const incident = await this.prisma.disasterIncident.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        resolvedBy: { select: { firstName: true, lastName: true } },
        ambulanceAssignments: {
          include: {
            ambulance: true,
            assignedBy: { select: { firstName: true, lastName: true } },
            destinationHospital: { select: { id: true, name: true } },
          },
        },
        announcements: {
          include: {
            createdBy: { select: { firstName: true, lastName: true } },
            hospitalLogs: { include: { hospital: { select: { name: true } } } },
          },
        },
        commandRoom: {
          include: {
            activatedBy: { select: { id: true, firstName: true, lastName: true } },
            closedBy: { select: { firstName: true, lastName: true } },
            roleAssignments: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true } },
                assignedBy: { select: { firstName: true, lastName: true } },
              },
            },
            decisionLogs: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        auditLogs: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async resolveIncident(id: string, userId: string): Promise<any> {
    const incident = await this.prisma.disasterIncident.findUnique({
      where: { id },
      include: { ambulanceAssignments: true },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    if (incident.status !== DisasterStatus.ACTIVE) {
      throw new ForbiddenException('Incident is not active');
    }

    const updated = await this.prisma.disasterIncident.update({
      where: { id },
      data: {
        status: DisasterStatus.RESOLVED,
        resolvedById: userId,
        resolvedAt: new Date(),
      },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        resolvedBy: { select: { firstName: true, lastName: true } },
      },
    });

    for (const a of incident.ambulanceAssignments) {
      await this.prisma.ambulance.update({
        where: { id: a.ambulanceId },
        data: { status: AmbulanceStatus.AVAILABLE },
      });
    }

    await this.auditLog(id, userId, 'RESOLVE_INCIDENT', null);
    this.disasterGateway.broadcastIncidentResolved(updated);

    this.disasterNotificationService
      .getDisasterRoleUserIds()
      .then((userIds) =>
        this.disasterNotificationService.createDisasterNotification(
          id,
          'INCIDENT_RESOLVED',
          userIds,
          userId,
        ),
      )
      .catch((err) => this.logger.warn('Failed to create disaster notification', err));

    return updated;
  }

  async createAnnouncement(dto: CreateAnnouncementDto, userId: string): Promise<any> {
    const incident = await this.prisma.disasterIncident.findUnique({
      where: { id: dto.incidentId },
    });
    if (!incident) throw new NotFoundException('Incident not found');

    const announcementText =
      ANNOUNCEMENT_TEMPLATES[incident.incidentType] || ANNOUNCEMENT_TEMPLATES.RTA_MCI;

    const announcement = await this.prisma.disasterAnnouncement.create({
      data: {
        disasterIncidentId: dto.incidentId,
        templateType: incident.incidentType,
        announcementText,
        status: DisasterAnnouncementStatus.QUEUED,
        createdById: userId,
      },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        disasterIncident: { select: { incidentType: true, locationAddress: true } },
      },
    });

    await this.prisma.disasterAnnouncementHospitalLog.createMany({
      data: dto.targetHospitalIds.map((hospitalId) => ({
        announcementId: announcement.id,
        hospitalId,
        status: DisasterAnnouncementStatus.QUEUED,
      })),
    });

    await this.auditLog(
      dto.incidentId,
      userId,
      'CREATE_ANNOUNCEMENT',
      JSON.stringify({ announcementId: announcement.id, targetCount: dto.targetHospitalIds.length }),
    );

    this.disasterGateway.broadcastAnnouncement(announcement);
    return announcement;
  }

  async approveAnnouncement(id: string, userId: string): Promise<any> {
    const announcement = await this.prisma.disasterAnnouncement.findUnique({
      where: { id },
      include: { hospitalLogs: true },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    if (announcement.status !== DisasterAnnouncementStatus.QUEUED) {
      throw new ForbiddenException('Announcement is not queued');
    }

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.disasterAnnouncement.update({
        where: { id },
        data: {
          status: DisasterAnnouncementStatus.SENT,
          approvedById: userId,
          approvedAt: now,
          broadcastedAt: now,
        },
      }),
      ...announcement.hospitalLogs.map((log) =>
        this.prisma.disasterAnnouncementHospitalLog.update({
          where: { id: log.id },
          data: { status: DisasterAnnouncementStatus.SENT, sentAt: now },
        }),
      ),
    ]);

    const updated = await this.prisma.disasterAnnouncement.findUnique({
      where: { id },
      include: {
        approvedBy: { select: { firstName: true, lastName: true } },
        hospitalLogs: { include: { hospital: { select: { name: true } } } },
      },
    });

    await this.auditLog(
      announcement.disasterIncidentId,
      userId,
      'APPROVE_ANNOUNCEMENT',
      JSON.stringify({ announcementId: id }),
    );

    this.disasterGateway.broadcastAnnouncement(updated);

    const hospitalIds = announcement.hospitalLogs.map((log) => log.hospitalId);
    this.disasterNotificationService
      .getUserIdsByHospitalIds(hospitalIds)
      .then((userIds) => {
        if (userIds.length > 0) {
          return this.disasterNotificationService.createDisasterNotification(
            announcement.disasterIncidentId,
            'ANNOUNCEMENT_SENT',
            userIds,
            userId,
          );
        }
      })
      .catch((err) => this.logger.warn('Failed to create disaster announcement notification', err));

    const incident = await this.prisma.disasterIncident.findUnique({
      where: { id: announcement.disasterIncidentId },
    });
    if (incident) {
      this.telegramService
        .sendDisasterAlert(
          { announcementText: announcement.announcementText },
          { incidentType: incident.incidentType, locationAddress: incident.locationAddress },
        )
        .catch((err) => this.logger.warn('Failed to send disaster Telegram alert', err));
    }

    return updated;
  }

  async markAmbulanceArrived(
    incidentId: string,
    assignmentId: string,
    userId: string,
  ): Promise<any> {
    await this.ensureAssignmentBelongsToIncident(incidentId, assignmentId);
    const assignment = await this.prisma.disasterAmbulanceAssignment.update({
      where: { id: assignmentId },
      data: { status: DisasterAssignmentStatus.AT_SCENE, arrivedAt: new Date() },
      include: {
        ambulance: true,
        assignedBy: { select: { firstName: true, lastName: true } },
        destinationHospital: { select: { id: true, name: true } },
      },
    });
    await this.auditLog(incidentId, userId, 'MARK_ARRIVED', JSON.stringify({ assignmentId }));
    this.disasterGateway.broadcastAmbulanceAssigned(assignment);
    this.disasterGateway.broadcastSituationalAwarenessUpdated(incidentId);
    return assignment;
  }

  async updateAssignmentDestination(
    incidentId: string,
    assignmentId: string,
    destinationHospitalId: string,
    userId: string,
  ): Promise<any> {
    await this.ensureAssignmentBelongsToIncident(incidentId, assignmentId);
    const hospital = await this.prisma.hospital.findUnique({ where: { id: destinationHospitalId } });
    if (!hospital) throw new NotFoundException('Hospital not found');
    const assignment = await this.prisma.disasterAmbulanceAssignment.update({
      where: { id: assignmentId },
      data: { destinationHospitalId },
      include: {
        ambulance: true,
        assignedBy: { select: { firstName: true, lastName: true } },
        destinationHospital: { select: { id: true, name: true } },
      },
    });
    await this.auditLog(incidentId, userId, 'SET_DESTINATION', JSON.stringify({ assignmentId, destinationHospitalId }));
    this.disasterGateway.broadcastSituationalAwarenessUpdated(incidentId);
    return assignment;
  }

  async updateAssignmentTriageCategory(
    incidentId: string,
    assignmentId: string,
    triageCategory: string,
    userId: string,
  ): Promise<any> {
    await this.ensureAssignmentBelongsToIncident(incidentId, assignmentId);
    const assignment = await this.prisma.disasterAmbulanceAssignment.update({
      where: { id: assignmentId },
      data: { triageCategory: triageCategory as any },
      include: {
        ambulance: true,
        assignedBy: { select: { firstName: true, lastName: true } },
        destinationHospital: { select: { id: true, name: true } },
      },
    });
    await this.auditLog(
      incidentId,
      userId,
      'UPDATE_TRIAGE_CATEGORY',
      JSON.stringify({ assignmentId, triageCategory }),
    );
    this.disasterGateway.broadcastSituationalAwarenessUpdated(incidentId);
    return assignment;
  }

  async bulkSetDestinationByCategory(
    incidentId: string,
    triageCategory: string,
    hospitalId: string,
    userId: string,
  ): Promise<any> {
    const incident = await this.prisma.disasterIncident.findUnique({ where: { id: incidentId } });
    if (!incident) throw new NotFoundException('Incident not found');
    const hospital = await this.prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) throw new NotFoundException('Hospital not found');
    const updated = await this.prisma.disasterAmbulanceAssignment.updateMany({
      where: {
        disasterIncidentId: incidentId,
        triageCategory: triageCategory as any,
        destinationHospitalId: null,
      },
      data: { destinationHospitalId: hospitalId },
    });
    await this.auditLog(incidentId, userId, 'BULK_SET_DESTINATION', JSON.stringify({ triageCategory, hospitalId, count: updated.count }));
    this.disasterGateway.broadcastSituationalAwarenessUpdated(incidentId);
    return { updated: updated.count };
  }

  async markPatientLoaded(incidentId: string, assignmentId: string, userId: string): Promise<any> {
    await this.ensureAssignmentBelongsToIncident(incidentId, assignmentId);
    const assignment = await this.prisma.disasterAmbulanceAssignment.update({
      where: { id: assignmentId },
      data: { status: DisasterAssignmentStatus.PATIENT_LOADED },
      include: {
        ambulance: true,
        assignedBy: { select: { firstName: true, lastName: true } },
        destinationHospital: { select: { id: true, name: true } },
      },
    });
    await this.auditLog(incidentId, userId, 'MARK_PATIENT_LOADED', JSON.stringify({ assignmentId }));
    this.disasterGateway.broadcastSituationalAwarenessUpdated(incidentId);
    return assignment;
  }

  async markDepartedToHospital(incidentId: string, assignmentId: string, userId: string): Promise<any> {
    await this.ensureAssignmentBelongsToIncident(incidentId, assignmentId);
    const assignment = await this.prisma.disasterAmbulanceAssignment.update({
      where: { id: assignmentId },
      data: { status: DisasterAssignmentStatus.EN_ROUTE_TO_HOSPITAL },
      include: {
        ambulance: true,
        assignedBy: { select: { firstName: true, lastName: true } },
        destinationHospital: { select: { id: true, name: true } },
      },
    });
    await this.auditLog(incidentId, userId, 'MARK_DEPARTED', JSON.stringify({ assignmentId }));
    this.disasterGateway.broadcastSituationalAwarenessUpdated(incidentId);
    return assignment;
  }

  async createMessage(incidentId: string, content: string, userId: string): Promise<any> {
    const incident = await this.prisma.disasterIncident.findUnique({
      where: { id: incidentId },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    if (incident.status !== DisasterStatus.ACTIVE) {
      throw new ForbiddenException('Cannot add messages to resolved or cancelled incidents');
    }
    const trimmed = (content || '').trim();
    if (!trimmed) throw new BadRequestException('Message content is required');

    const message = await this.prisma.disasterMessage.create({
      data: {
        disasterIncidentId: incidentId,
        content: trimmed,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    this.disasterGateway.broadcastMessageCreated(message);
    return message;
  }

  async getMessages(incidentId: string): Promise<any[]> {
    const incident = await this.prisma.disasterIncident.findUnique({
      where: { id: incidentId },
    });
    if (!incident) throw new NotFoundException('Incident not found');

    return this.prisma.disasterMessage.findMany({
      where: { disasterIncidentId: incidentId },
      orderBy: { createdAt: 'asc' },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  // ---------- Command Room ----------

  async getCommandRoom(incidentId: string): Promise<any> {
    const incident = await this.prisma.disasterIncident.findUnique({
      where: { id: incidentId },
      include: {
        commandRoom: {
          include: {
            activatedBy: { select: { id: true, firstName: true, lastName: true } },
            closedBy: { select: { firstName: true, lastName: true } },
            roleAssignments: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true } },
                assignedBy: { select: { firstName: true, lastName: true } },
              },
            },
            decisionLogs: {
              include: { user: { select: { firstName: true, lastName: true } } },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident.commandRoom ?? null;
  }

  private async isCommanderOrAdmin(incidentId: string, userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user) return false;
    if (user.role === UserRole.ADMIN || user.role === UserRole.RCC) return true;
    const room = await this.prisma.disasterCommandRoom.findFirst({
      where: { disasterIncidentId: incidentId, closedAt: null },
      include: {
        roleAssignments: {
          where: { role: DisasterCommandRole.COMMANDER },
          select: { userId: true },
        },
      },
    });
    return room?.roleAssignments.some((a) => a.userId === userId) ?? false;
  }

  async activateCommandRoom(incidentId: string, userId: string): Promise<any> {
    const incident = await this.prisma.disasterIncident.findUnique({
      where: { id: incidentId },
      include: { commandRoom: true },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    if (incident.status !== DisasterStatus.ACTIVE) {
      throw new ForbiddenException('Cannot activate command room for non-active incident');
    }
    if (incident.commandRoom) {
      if (incident.commandRoom.closedAt) {
        throw new ForbiddenException('Command room was closed. Cannot reactivate.');
      }
      return incident.commandRoom;
    }

    const room = await this.prisma.disasterCommandRoom.create({
      data: {
        disasterIncidentId: incidentId,
        activatedById: userId,
        escalationLevel: DisasterEscalationLevel.LEVEL_1,
      },
      include: {
        activatedBy: { select: { id: true, firstName: true, lastName: true } },
        roleAssignments: true,
        decisionLogs: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    await this.prisma.disasterCommandDecisionLog.create({
      data: {
        commandRoomId: room.id,
        userId,
        action: DisasterCommandDecisionAction.ACTIVATED,
      },
    });

    await this.auditLog(incidentId, userId, 'COMMAND_ROOM_ACTIVATED', null);
    this.disasterGateway.broadcastCommandRoomUpdated(incidentId, { type: 'activated', room });
    this.disasterGateway.broadcastSituationalAwarenessUpdated(incidentId);
    return room;
  }

  async assignCommandRole(
    incidentId: string,
    dto: AssignCommandRoleDto,
    assignedByUserId: string,
  ): Promise<any> {
    const canAssign = await this.isCommanderOrAdmin(incidentId, assignedByUserId);
    if (!canAssign) {
      throw new ForbiddenException('Only Commander or Admin can assign command roles');
    }

    const room = await this.prisma.disasterCommandRoom.findFirst({
      where: { disasterIncidentId: incidentId, closedAt: null },
    });
    if (!room) throw new NotFoundException('Command room not active for this incident');

    const targetUser = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!targetUser) throw new NotFoundException('User not found');

    const assignment = await this.prisma.disasterCommandRoleAssignment.upsert({
      where: {
        commandRoomId_role: { commandRoomId: room.id, role: dto.role },
      },
      create: {
        commandRoomId: room.id,
        userId: dto.userId,
        role: dto.role,
        assignedById: assignedByUserId,
      },
      update: {
        userId: dto.userId,
        assignedById: assignedByUserId,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true } },
        assignedBy: { select: { firstName: true, lastName: true } },
      },
    });

    await this.prisma.disasterCommandDecisionLog.create({
      data: {
        commandRoomId: room.id,
        userId: assignedByUserId,
        action: DisasterCommandDecisionAction.TEAM_ASSIGNED,
        details: { role: dto.role, assignedUserId: dto.userId } as any,
      },
    });

    await this.auditLog(incidentId, assignedByUserId, 'COMMAND_ROLE_ASSIGNED', JSON.stringify({ role: dto.role, userId: dto.userId }));
    this.disasterGateway.broadcastCommandRoomUpdated(incidentId, { type: 'role-assigned', assignment });
    this.disasterGateway.broadcastSituationalAwarenessUpdated(incidentId);
    return assignment;
  }

  async escalateCommandRoom(
    incidentId: string,
    dto: EscalateCommandRoomDto,
    userId: string,
  ): Promise<any> {
    const canEscalate = await this.isCommanderOrAdmin(incidentId, userId);
    if (!canEscalate) {
      throw new ForbiddenException('Only Commander or Admin can escalate');
    }

    const room = await this.prisma.disasterCommandRoom.findFirst({
      where: { disasterIncidentId: incidentId, closedAt: null },
    });
    if (!room) throw new NotFoundException('Command room not active for this incident');

    const updated = await this.prisma.disasterCommandRoom.update({
      where: { id: room.id },
      data: { escalationLevel: dto.escalationLevel },
      include: {
        activatedBy: { select: { firstName: true, lastName: true } },
        roleAssignments: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    await this.prisma.disasterCommandDecisionLog.create({
      data: {
        commandRoomId: room.id,
        userId,
        action: DisasterCommandDecisionAction.ESCALATED,
        details: { escalationLevel: dto.escalationLevel } as any,
      },
    });

    await this.auditLog(incidentId, userId, 'COMMAND_ROOM_ESCALATED', JSON.stringify({ level: dto.escalationLevel }));
    this.disasterGateway.broadcastCommandRoomUpdated(incidentId, { type: 'escalated', room: updated });
    this.disasterGateway.broadcastSituationalAwarenessUpdated(incidentId);
    return updated;
  }

  async logCommandDecision(
    incidentId: string,
    dto: LogCommandDecisionDto,
    userId: string,
  ): Promise<any> {
    const room = await this.prisma.disasterCommandRoom.findFirst({
      where: { disasterIncidentId: incidentId, closedAt: null },
    });
    if (!room) throw new NotFoundException('Command room not active for this incident');

    const isCommander = await this.isCommanderOrAdmin(incidentId, userId);
    const isRecorder = await this.prisma.disasterCommandRoleAssignment.findFirst({
      where: {
        commandRoomId: room.id,
        role: DisasterCommandRole.RECORDER,
        userId,
      },
    });
    if (!isCommander && !isRecorder) {
      throw new ForbiddenException('Only Commander or Recorder can log decisions');
    }

    const log = await this.prisma.disasterCommandDecisionLog.create({
      data: {
        commandRoomId: room.id,
        userId,
        action: dto.action,
        details: (dto.details ?? undefined) as Prisma.InputJsonValue | undefined,
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    this.disasterGateway.broadcastCommandRoomUpdated(incidentId, { type: 'decision-logged', log });
    this.disasterGateway.broadcastSituationalAwarenessUpdated(incidentId);
    return log;
  }

  async closeCommandRoom(incidentId: string, userId: string): Promise<any> {
    const canClose = await this.isCommanderOrAdmin(incidentId, userId);
    if (!canClose) {
      throw new ForbiddenException('Only Commander or Admin can close the command room');
    }

    const room = await this.prisma.disasterCommandRoom.findFirst({
      where: { disasterIncidentId: incidentId, closedAt: null },
    });
    if (!room) throw new NotFoundException('Command room not active or already closed');

    const now = new Date();
    const updated = await this.prisma.disasterCommandRoom.update({
      where: { id: room.id },
      data: { closedById: userId, closedAt: now },
      include: {
        activatedBy: { select: { firstName: true, lastName: true } },
        closedBy: { select: { firstName: true, lastName: true } },
        roleAssignments: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    await this.prisma.disasterCommandDecisionLog.create({
      data: {
        commandRoomId: room.id,
        userId,
        action: DisasterCommandDecisionAction.CLOSED,
      },
    });

    await this.auditLog(incidentId, userId, 'COMMAND_ROOM_CLOSED', null);
    this.disasterGateway.broadcastCommandRoomUpdated(incidentId, { type: 'closed', room: updated });
    this.disasterGateway.broadcastSituationalAwarenessUpdated(incidentId);
    return updated;
  }

  private async ensureAssignmentBelongsToIncident(incidentId: string, assignmentId: string): Promise<void> {
    const assignment = await this.prisma.disasterAmbulanceAssignment.findFirst({
      where: { id: assignmentId, disasterIncidentId: incidentId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
  }

  private getAffectedPathways(incidentType: DisasterIncidentType): string[] {
    switch (incidentType) {
      case 'RTA_MCI':
        return ['Trauma'];
      case 'CODE_YELLOW':
        return ['General'];
      case 'FIRE':
      case 'EARTHQUAKE':
      case 'CHEMICAL_SPILL':
        return ['Trauma', 'General'];
      case 'OUTBREAK':
        return ['General'];
      default:
        if (INTERNAL_INCIDENT_TYPES.includes(incidentType)) return ['General'];
        return ['General'];
    }
  }

  async getSituationalAwareness(incidentId: string): Promise<any> {
    const incident = await this.prisma.disasterIncident.findUnique({
      where: { id: incidentId },
      include: {
        commandRoom: true,
        ambulanceAssignments: true,
      },
    });
    if (!incident) throw new NotFoundException('Incident not found');

    const now = new Date();
    const room = incident.commandRoom;
    const assignments = incident.ambulanceAssignments ?? [];
    const DELAY_THRESHOLD_MIN = 30;

    const dispatched = assignments.length;
    const onScene = assignments.filter((a) => a.status === DisasterAssignmentStatus.AT_SCENE).length;
    const enRoute = assignments.filter(
      (a) =>
        a.status === DisasterAssignmentStatus.EN_ROUTE ||
        a.status === DisasterAssignmentStatus.EN_ROUTE_TO_HOSPITAL,
    ).length;
    const delayedUnits = assignments.filter((a) => {
      if (a.status === DisasterAssignmentStatus.ARRIVED) return false;
      const assignedAt = new Date(a.assignedAt).getTime();
      return (now.getTime() - assignedAt) / 60000 > DELAY_THRESHOLD_MIN;
    }).length;

    const green = incident.estimatedGreen ?? 0;
    const yellow = incident.estimatedYellow ?? 0;
    const red = incident.estimatedRed ?? 0;
    const black = incident.estimatedBlack ?? 0;
    const total = green + yellow + red + black;

    let timeSinceActivationMinutes = 0;
    let activationToDispatchMinutes: number | null = null;
    let dispatchToArrivalMinutes: number | null = null;

    if (room && !room.closedAt) {
      const activatedAt = new Date(room.activatedAt).getTime();
      timeSinceActivationMinutes = (now.getTime() - activatedAt) / 60000;

      const arrivedWithTimes = assignments.filter(
        (a) => a.status === DisasterAssignmentStatus.ARRIVED && a.arrivedAt,
      );
      if (arrivedWithTimes.length > 0) {
        const times = arrivedWithTimes.map((a) => {
          const assigned = new Date(a.assignedAt).getTime();
          const arrived = new Date(a.arrivedAt!).getTime();
          return (arrived - assigned) / 60000;
        });
        dispatchToArrivalMinutes = times.reduce((s, t) => s + t, 0) / times.length;
      }

      const minAssignedAt = assignments
        .map((a) => new Date(a.assignedAt).getTime())
        .filter((t) => !isNaN(t));
      if (minAssignedAt.length > 0) {
        const min = Math.min(...minAssignedAt);
        activationToDispatchMinutes = (min - activatedAt) / 60000;
      }
    }

    const redCasesPending = assignments.filter(
      (a) => a.triageCategory === 'RED' && a.status !== DisasterAssignmentStatus.ARRIVED,
    ).length;

    let bedAllocationDelayMinutes: number | null = null;
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentAssigned = await this.prisma.bedRequest.findMany({
      where: {
        assignedAt: { gte: oneDayAgo },
        deletedAt: null,
      },
      select: { requestedAt: true, assignedAt: true },
      take: 100,
    });
    const withBoth = recentAssigned.filter((r) => r.assignedAt && r.requestedAt);
    if (withBoth.length > 0) {
      const delays = withBoth.map(
        (r) => (new Date(r.assignedAt!).getTime() - new Date(r.requestedAt!).getTime()) / 60000,
      );
      bedAllocationDelayMinutes = delays.reduce((s, d) => s + d, 0) / delays.length;
    }

    const hospitals = await this.hospitalsService.findAll({});
    const icuTotal = hospitals.reduce((s, h) => s + ((h as any).icuBeds ?? 0), 0);
    const icuAvailable = hospitals.reduce((s, h) => s + ((h as any).icuBedsAvailable ?? 0), 0);
    const nicuTotal = hospitals.reduce((s, h) => s + ((h as any).nicuBeds ?? 0), 0);
    const nicuAvailable = hospitals.reduce((s, h) => s + ((h as any).nicuBedsAvailable ?? 0), 0);

    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const redCasesLast10Min = assignments.filter(
      (a) =>
        a.triageCategory === 'RED' &&
        new Date(a.assignedAt).getTime() >= tenMinutesAgo.getTime(),
    ).length;
    const activeCriticalCases = assignments.filter(
      (a) =>
        a.triageCategory === 'RED' &&
        a.status !== DisasterAssignmentStatus.ARRIVED,
    ).length;
    const icuCapacityPercent =
      icuTotal > 0 ? (icuAvailable / icuTotal) * 100 : 100;

    const currentLevel = room?.escalationLevel ?? DisasterEscalationLevel.LEVEL_1;
    let suggestedLevel: DisasterEscalationLevel = currentLevel;
    if (currentLevel === DisasterEscalationLevel.LEVEL_1) {
      if (redCasesLast10Min >= 5 || activeCriticalCases >= 6) {
        suggestedLevel = DisasterEscalationLevel.LEVEL_2;
      }
    } else if (currentLevel === DisasterEscalationLevel.LEVEL_2) {
      if (activeCriticalCases >= 15 || icuCapacityPercent < 10) {
        suggestedLevel = DisasterEscalationLevel.LEVEL_3;
      }
    }

    const requiredRolesForLevel = getRequiredRolesForLevel(currentLevel);

    return {
      incident: {
        id: incident.id,
        incidentType: incident.incidentType,
        escalationLevel: room?.escalationLevel ?? null,
        activatedAt: room?.activatedAt ?? null,
        timeSinceActivationMinutes: Math.round(timeSinceActivationMinutes * 10) / 10,
        estimatedCasualties: { green, yellow, red, black, total },
        affectedPathways: this.getAffectedPathways(incident.incidentType as DisasterIncidentType),
      },
      ems: { dispatched, onScene, enRoute, delayedUnits },
      hospital: {
        icuAvailable,
        icuTotal,
        nicuAvailable,
        nicuTotal,
        orReadiness: 'N/A',
        bloodBankStatus: 'N/A',
      },
      kpis: {
        activationToDispatchMinutes: activationToDispatchMinutes != null ? Math.round(activationToDispatchMinutes * 10) / 10 : null,
        dispatchToArrivalMinutes: dispatchToArrivalMinutes != null ? Math.round(dispatchToArrivalMinutes * 10) / 10 : null,
        redCasesPending,
        bedAllocationDelayMinutes: bedAllocationDelayMinutes != null ? Math.round(bedAllocationDelayMinutes * 10) / 10 : null,
      },
      suggestedLevel,
      escalationTriggers: {
        redCasesLast10Min,
        activeCriticalCases,
        icuCapacityPercent: Math.round(icuCapacityPercent * 10) / 10,
      },
      requiredRolesForLevel,
    };
  }

  private async auditLog(
    incidentId: string | null,
    userId: string,
    action: string,
    details: string | null,
  ): Promise<void> {
    await this.prisma.disasterAuditLog.create({
      data: { disasterIncidentId: incidentId, userId, action, details },
    });
  }

  private static readonly ACTION_LABELS: Record<string, string> = {
    CREATE_INCIDENT: 'Incident created',
    RESOLVE_INCIDENT: 'Incident resolved',
    ASSIGN_AMBULANCE: 'Ambulance assigned',
    MARK_ARRIVED: 'Ambulance arrived at scene',
    SET_DESTINATION: 'Destination set',
    BULK_SET_DESTINATION: 'Bulk destination set',
    MARK_PATIENT_LOADED: 'Patient loaded',
    MARK_DEPARTED: 'Departed to hospital',
    COMMAND_ROOM_ACTIVATED: 'Command room activated',
    COMMAND_ROLE_ASSIGNED: 'Role assigned',
    COMMAND_ROOM_ESCALATED: 'Level escalated',
    COMMAND_ROOM_CLOSED: 'Command room closed',
    ACTIVATED: 'Command room activated',
    ESCALATED: 'Level escalated',
    TEAM_ASSIGNED: 'Team role assigned',
    CLOSED: 'Command room closed',
    CUSTOM: 'Custom decision',
  };

  async getOperationalActions(incidentId: string): Promise<{ actions: any[] }> {
    const [auditLogs, room] = await Promise.all([
      this.prisma.disasterAuditLog.findMany({
        where: { disasterIncidentId: incidentId },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.disasterCommandRoom.findFirst({
        where: { disasterIncidentId: incidentId },
        include: {
          decisionLogs: {
            include: { user: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    ]);

    const auditEntries = auditLogs.map((a) => ({
      id: `audit-${a.id}`,
      action: DisasterService.ACTION_LABELS[a.action] || a.action,
      details: a.details,
      userId: a.userId,
      user: a.user,
      createdAt: a.createdAt,
      source: 'audit' as const,
      rawAction: a.action,
    }));

    const decisionEntries = (room?.decisionLogs ?? []).map((d) => {
      let label = DisasterService.ACTION_LABELS[d.action] || d.action;
      if (d.action === 'CUSTOM' && d.details && typeof d.details === 'object') {
        const details = d.details as Record<string, unknown>;
        if (details.note && typeof details.note === 'string') {
          label = details.note;
        }
      }
      return {
        id: `decision-${d.id}`,
        action: label,
        details: d.details,
        userId: d.userId,
        user: d.user,
        createdAt: d.createdAt,
        source: 'decision' as const,
        rawAction: d.action,
      };
    });

    const merged = [...auditEntries, ...decisionEntries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return { actions: merged };
  }

  async getCommandRoomVideoToken(incidentId: string, userId: string): Promise<{ token: string }> {
    const incident = await this.prisma.disasterIncident.findUnique({
      where: { id: incidentId },
      include: { commandRoom: true },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    if (!incident.commandRoom || incident.commandRoom.closedAt) {
      throw new ForbiddenException('Command room is not active for this incident');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const roomName = `command-room:${incidentId}`;
    const participantName = this.videoCallsService.getUserDisplayName(user);
    const participantIdentity = user.id;

    const token = await this.videoCallsService.createToken(
      roomName,
      participantName,
      participantIdentity,
    );

    return { token };
  }
}
