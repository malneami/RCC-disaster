import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NicuLevel, NicuCotType } from '@prisma/client';

const LEVEL_RANK: Record<string, number> = { LEVEL_I: 1, LEVEL_II: 2, LEVEL_III: 3 };

@Injectable()
export class NicuCapacityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Live NICU cot availability across the network, grouped by hospital.
   * Reuses the existing Bed/Unit model (BedType.NICU) — no separate capacity store.
   */
  async getCapacity(filters: { hospitalId?: string; cluster?: string }) {
    const bedWhere: any = {
      deletedAt: null,
      isOperational: true,
      unit: { bedType: 'NICU', isActive: true },
    };
    if (filters.hospitalId) bedWhere.hospitalId = filters.hospitalId;

    const hospitalWhere: any = { deletedAt: null, hasNicuService: true };
    if (filters.hospitalId) hospitalWhere.id = filters.hospitalId;
    if (filters.cluster) hospitalWhere.cluster = filters.cluster;

    const [hospitals, beds] = await Promise.all([
      this.prisma.hospital.findMany({
        where: hospitalWhere,
        select: { id: true, name: true, cluster: true, nicuLevel: true },
      }),
      this.prisma.bed.findMany({
        where: bedWhere,
        select: {
          id: true,
          hospitalId: true,
          bedNumber: true,
          status: true,
          nicuCotType: true,
          nicuLevel: true,
        },
      }),
    ]);

    const byHospital = hospitals.map((h) => {
      const hospitalBeds = beds.filter((b) => b.hospitalId === h.id);
      const total = hospitalBeds.length;
      const vacant = hospitalBeds.filter((b) => b.status === 'VACANT').length;
      const occupied = hospitalBeds.filter((b) => b.status === 'OCCUPIED').length;
      const reserved = hospitalBeds.filter((b) => b.status === 'RESERVED').length;

      const byCotType: Record<string, { total: number; vacant: number }> = {};
      for (const ct of ['INCUBATOR', 'OPEN_WARMER', 'VENTILATED'] as NicuCotType[]) {
        const cotBeds = hospitalBeds.filter((b) => b.nicuCotType === ct);
        byCotType[ct] = {
          total: cotBeds.length,
          vacant: cotBeds.filter((b) => b.status === 'VACANT').length,
        };
      }

      return {
        hospitalId: h.id,
        hospitalName: h.name,
        cluster: h.cluster,
        nicuLevel: h.nicuLevel,
        total,
        vacant,
        occupied,
        reserved,
        byCotType,
      };
    });

    const totals = {
      total: byHospital.reduce((s, h) => s + h.total, 0),
      vacant: byHospital.reduce((s, h) => s + h.vacant, 0),
      occupied: byHospital.reduce((s, h) => s + h.occupied, 0),
      reserved: byHospital.reduce((s, h) => s + h.reserved, 0),
    };

    return { totals, byHospital };
  }

  /**
   * Ranked destination suggestions for a neonatal transfer requirement.
   * Filters facilities by level fitness and available cot of the required type,
   * ranked by level fit (closest level up), then vacant-cot count.
   * (ETA ranking via OSRM can be layered in — see spec.)
   */
  async match(params: {
    requiredNicuLevel: NicuLevel;
    requiredCotType: NicuCotType;
    cluster?: string;
    originHospitalId?: string;
  }) {
    const capacity = await this.getCapacity({ cluster: params.cluster });
    const requiredRank = LEVEL_RANK[params.requiredNicuLevel];

    const candidates = capacity.byHospital
      .filter((h) => h.nicuLevel && LEVEL_RANK[h.nicuLevel as string] >= requiredRank)
      .filter((h) => (h.byCotType[params.requiredCotType]?.vacant ?? 0) > 0)
      .map((h) => ({
        hospitalId: h.hospitalId,
        hospitalName: h.hospitalName,
        nicuLevel: h.nicuLevel,
        levelFit: LEVEL_RANK[h.nicuLevel as string] - requiredRank, // 0 = exact level
        vacantOfRequiredCot: h.byCotType[params.requiredCotType]?.vacant ?? 0,
        totalVacant: h.vacant,
      }))
      .sort(
        (a, b) =>
          a.levelFit - b.levelFit ||
          b.vacantOfRequiredCot - a.vacantOfRequiredCot ||
          b.totalVacant - a.totalVacant,
      );

    return { requirement: params, matches: candidates };
  }

  /**
   * Reserve a specific vacant NICU cot for a neonatal transfer.
   * Sets Bed.status=RESERVED and stamps the case linkage (caseType=NICU).
   */
  async reserveCot(bedId: string, neonatalTransferId: string) {
    const bed = await this.prisma.bed.findUnique({ where: { id: bedId } });
    if (!bed) throw new Error(`Bed ${bedId} not found`);
    if (bed.status !== 'VACANT') throw new Error(`Bed ${bedId} is not vacant`);

    return this.prisma.bed.update({
      where: { id: bedId },
      data: { status: 'RESERVED', caseId: neonatalTransferId, caseType: 'NICU' },
    });
  }
}
