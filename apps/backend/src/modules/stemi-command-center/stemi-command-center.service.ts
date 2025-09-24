import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CommandCenterDataDto, KPIMetricDto, HospitalPerformanceDto, ChartDataDto, CommandCenterSummaryDto, RecentCaseDto } from './dto/command-center.dto';

@Injectable()
export class StemiCommandCenterService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(filters: {
    hospitalId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<CommandCenterDataDto> {
    const { hospitalId, startDate, endDate } = filters;
    
    // Parse dates
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Build where clause for filtering
    const whereClause: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    if (hospitalId && hospitalId !== 'all') {
      whereClause.OR = [
        { originHospitalId: hospitalId },
        { destinationHospitalId: hospitalId },
      ];
    }

    // Get STEMI cases data
    const cases = await this.prisma.stemiCase.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
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
    });

    // Calculate summary statistics
    const summary = this.calculateSummary(cases);

    // Calculate KPIs
    const kpis = this.calculateKPIs(cases);

    // Calculate hospital performance
    const hospitals = await this.calculateHospitalPerformance(cases, hospitalId);

    // Generate chart data
    const charts = this.generateChartData(cases);

    // Get recent cases
    const recentCases = this.getRecentCases(cases);

    return {
      summary,
      kpis,
      hospitals,
      charts,
      recentCases,
    };
  }

  private calculateSummary(cases: any[]): CommandCenterSummaryDto {
    const totalCases = cases.length;
    const totalPCI = cases.filter(c => c.pciPerformed).length;
    const mortalityRate = totalCases > 0 ? (cases.filter(c => c.mortality).length / totalCases) * 100 : 0;
    
    // Calculate overall compliance rate based on D2B times
    const compliantCases = cases.filter(c => c.doorToBalloonMinutes && c.doorToBalloonMinutes <= 90).length;
    const complianceRate = totalCases > 0 ? (compliantCases / totalCases) * 100 : 0;

    return {
      totalCases,
      totalPCI,
      mortalityRate: Math.round(mortalityRate * 10) / 10,
      complianceRate: Math.round(complianceRate * 10) / 10,
    };
  }

  private calculateKPIs(cases: any[]): KPIMetricDto[] {
    const totalCases = cases.length;
    
    // D2B KPI
    const d2bCases = cases.filter(c => c.doorToBalloonMinutes !== null);
    const d2bCompliant = d2bCases.filter(c => c.doorToBalloonMinutes <= 90).length;
    const d2bRate = d2bCases.length > 0 ? (d2bCompliant / d2bCases.length) * 100 : 0;

    // D2N KPI
    const d2nCases = cases.filter(c => c.doorToNeedleMinutes !== null);
    const d2nCompliant = d2nCases.filter(c => c.doorToNeedleMinutes <= 30).length;
    const d2nRate = d2nCases.length > 0 ? (d2nCompliant / d2nCases.length) * 100 : 0;

    // DIDO KPI
    const didoCases = cases.filter(c => c.doorInDoorOutMinutes !== null);
    const didoCompliant = didoCases.filter(c => c.doorInDoorOutMinutes <= 30).length;
    const didoRate = didoCases.length > 0 ? (didoCompliant / didoCases.length) * 100 : 0;

    // PCI Success Rate
    const pciCases = cases.filter(c => c.pciPerformed);
    const pciSuccess = pciCases.filter(c => c.pciSuccessful).length;
    const pciSuccessRate = pciCases.length > 0 ? (pciSuccess / pciCases.length) * 100 : 0;

    // Mortality Rate
    const mortalityRate = totalCases > 0 ? (cases.filter(c => c.mortality).length / totalCases) * 100 : 0;

    return [
      {
        id: 'd2b',
        name: 'Door-to-Balloon Time',
        value: d2bRate,
        target: 90,
        unit: '%',
        status: d2bRate >= 90 ? 'met' : d2bRate >= 75 ? 'warning' : 'missed',
        trend: 'stable',
        percentage: Math.round(d2bRate),
      },
      {
        id: 'd2n',
        name: 'Door-to-Needle Time',
        value: d2nRate,
        target: 80,
        unit: '%',
        status: d2nRate >= 80 ? 'met' : d2nRate >= 60 ? 'warning' : 'missed',
        trend: 'stable',
        percentage: Math.round(d2nRate),
      },
      {
        id: 'dido',
        name: 'Door-In-Door-Out',
        value: didoRate,
        target: 85,
        unit: '%',
        status: didoRate >= 85 ? 'met' : didoRate >= 70 ? 'warning' : 'missed',
        trend: 'stable',
        percentage: Math.round(didoRate),
      },
      {
        id: 'pci-success',
        name: 'PCI Success Rate',
        value: pciSuccessRate,
        target: 90,
        unit: '%',
        status: pciSuccessRate >= 90 ? 'met' : pciSuccessRate >= 80 ? 'warning' : 'missed',
        trend: 'stable',
        percentage: Math.round(pciSuccessRate),
      },
      {
        id: 'mortality',
        name: 'Mortality Rate',
        value: mortalityRate,
        target: 10,
        unit: '%',
        status: mortalityRate <= 10 ? 'met' : mortalityRate <= 15 ? 'warning' : 'missed',
        trend: 'stable',
        percentage: Math.round(mortalityRate),
      },
    ];
  }

  private async calculateHospitalPerformance(cases: any[], hospitalId?: string): Promise<HospitalPerformanceDto[]> {
    // Group cases by hospital
    const hospitalGroups = cases.reduce((acc, case_) => {
      const hospitalId = case_.originHospitalId;
      if (!acc[hospitalId]) {
        acc[hospitalId] = {
          hospital: case_.originHospital,
          cases: [],
        };
      }
      acc[hospitalId].cases.push(case_);
      return acc;
    }, {});

    const hospitalPerformance: HospitalPerformanceDto[] = [];

    for (const [id, group] of Object.entries(hospitalGroups) as any[]) {
      const hospitalCases = group.cases;
      const hospital = group.hospital;

      // Calculate hospital-specific KPIs
      const d2bCases = hospitalCases.filter((c: any) => c.doorToBalloonMinutes !== null);
      const d2bCompliant = d2bCases.filter((c: any) => c.doorToBalloonMinutes <= 90).length;
      const d2bRate = d2bCases.length > 0 ? (d2bCompliant / d2bCases.length) * 100 : 0;

      const d2nCases = hospitalCases.filter((c: any) => c.doorToNeedleMinutes !== null);
      const d2nCompliant = d2nCases.filter((c: any) => c.doorToNeedleMinutes <= 30).length;
      const d2nRate = d2nCases.length > 0 ? (d2nCompliant / d2nCases.length) * 100 : 0;

      const didoCases = hospitalCases.filter((c: any) => c.doorInDoorOutMinutes !== null);
      const didoCompliant = didoCases.filter((c: any) => c.doorInDoorOutMinutes <= 30).length;
      const didoRate = didoCases.length > 0 ? (didoCompliant / didoCases.length) * 100 : 0;

      const pciCases = hospitalCases.filter((c: any) => c.pciPerformed);
      const pciSuccess = pciCases.filter((c: any) => c.pciSuccessful).length;
      const pciSuccessRate = pciCases.length > 0 ? (pciSuccess / pciCases.length) * 100 : 0;

      const mortalityRate = hospitalCases.length > 0 ? (hospitalCases.filter((c: any) => c.mortality).length / hospitalCases.length) * 100 : 0;

      hospitalPerformance.push({
        id: hospital.id,
        name: hospital.name,
        zone: hospital.cluster || 'Unknown',
        metrics: {
          d2b: {
            id: `${id}-d2b`,
            name: 'D2B',
            value: d2bRate,
            target: 90,
            unit: '%',
            status: d2bRate >= 90 ? 'met' : d2bRate >= 75 ? 'warning' : 'missed',
            trend: 'stable',
            percentage: Math.round(d2bRate),
          },
          d2n: {
            id: `${id}-d2n`,
            name: 'D2N',
            value: d2nRate,
            target: 80,
            unit: '%',
            status: d2nRate >= 80 ? 'met' : d2nRate >= 60 ? 'warning' : 'missed',
            trend: 'stable',
            percentage: Math.round(d2nRate),
          },
          dido: {
            id: `${id}-dido`,
            name: 'DIDO',
            value: didoRate,
            target: 85,
            unit: '%',
            status: didoRate >= 85 ? 'met' : didoRate >= 70 ? 'warning' : 'missed',
            trend: 'stable',
            percentage: Math.round(didoRate),
          },
          pciSuccess: {
            id: `${id}-pci`,
            name: 'PCI Success',
            value: pciSuccessRate,
            target: 90,
            unit: '%',
            status: pciSuccessRate >= 90 ? 'met' : pciSuccessRate >= 80 ? 'warning' : 'missed',
            trend: 'stable',
            percentage: Math.round(pciSuccessRate),
          },
          mortality: {
            id: `${id}-mortality`,
            name: 'Mortality',
            value: mortalityRate,
            target: 10,
            unit: '%',
            status: mortalityRate <= 10 ? 'met' : mortalityRate <= 15 ? 'warning' : 'missed',
            trend: 'stable',
            percentage: Math.round(mortalityRate),
          },
        },
      });
    }

    return hospitalPerformance;
  }

  private generateChartData(cases: any[]): any {
    // Referral Source Distribution
    const directCases = cases.filter(c => c.caseType === 'DIRECT').length;
    const transferCases = cases.filter(c => c.caseType === 'TRANSFER').length;

    // PCI Breakdown
    const primaryPCI = cases.filter(c => c.pciPerformed && c.caseType === 'DIRECT').length;
    const postFibrinolysis = cases.filter(c => c.pciPerformed && c.thrombolyticGiven).length;
    const transferredIn = cases.filter(c => c.pciPerformed && c.caseType === 'TRANSFER').length;

    // DIDO Compliance
    const didoCases = cases.filter(c => c.doorInDoorOutMinutes !== null);
    const didoCompliant = didoCases.filter(c => c.doorInDoorOutMinutes <= 30).length;
    const didoNonCompliant = didoCases.length - didoCompliant;

    // Treatment Distribution
    const pciOnly = cases.filter(c => c.pciPerformed && !c.thrombolyticGiven).length;
    const thrombolysisOnly = cases.filter(c => c.thrombolyticGiven && !c.pciPerformed).length;
    const combined = cases.filter(c => c.pciPerformed && c.thrombolyticGiven).length;
    const conservative = cases.filter(c => !c.pciPerformed && !c.thrombolyticGiven).length;

    // Patient Outcomes
    const excellent = cases.filter(c => c.dischargeModifiedRankinScale <= 1).length;
    const good = cases.filter(c => c.dischargeModifiedRankinScale === 2).length;
    const fair = cases.filter(c => c.dischargeModifiedRankinScale === 3).length;
    const poor = cases.filter(c => c.dischargeModifiedRankinScale >= 4).length;
    const death = cases.filter(c => c.mortality).length;

    return {
      referralSource: {
        labels: ['Direct', 'Transfer'],
        datasets: [{
          label: 'Cases',
          data: [directCases, transferCases],
          backgroundColor: ['#4caf50', '#2196f3'],
        }],
      },
      pciBreakdown: {
        labels: ['Primary PCI', 'Post-Fibrinolysis', 'Transferred-in'],
        datasets: [{
          label: 'PCI Cases',
          data: [primaryPCI, postFibrinolysis, transferredIn],
          backgroundColor: ['#ff9800', '#9c27b0', '#607d8b'],
        }],
      },
      didoCompliance: {
        labels: ['Compliant', 'Non-Compliant'],
        datasets: [{
          label: 'DIDO Compliance',
          data: [didoCompliant, didoNonCompliant],
          backgroundColor: ['#4caf50', '#f44336'],
        }],
      },
      treatmentDistribution: {
        labels: ['PCI Only', 'Thrombolysis Only', 'Combined', 'Conservative'],
        datasets: [{
          label: 'Treatment Type',
          data: [pciOnly, thrombolysisOnly, combined, conservative],
          backgroundColor: ['#2196f3', '#ff9800', '#4caf50', '#9e9e9e'],
        }],
      },
      outcomes: {
        labels: ['Excellent', 'Good', 'Fair', 'Poor', 'Death'],
        datasets: [{
          label: 'Patient Outcomes',
          data: [excellent, good, fair, poor, death],
          backgroundColor: ['#4caf50', '#8bc34a', '#ffc107', '#ff9800', '#f44336'],
        }],
      },
      hospitalPerformance: {
        labels: ['Hospital 1', 'Hospital 2', 'Hospital 3'],
        datasets: [{
          label: 'D2B Compliance %',
          data: [85, 92, 78],
          backgroundColor: '#2196f3',
        }],
      },
      trends: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'D2B Time (min)',
          data: [85, 82, 78, 75, 73, 71],
          borderColor: '#2196f3',
          fill: false,
        }],
      },
      heatmap: {
        labels: ['Hospital 1', 'Hospital 2', 'Hospital 3'],
        datasets: [{
          label: 'D2B Compliance',
          data: [85, 92, 78],
          backgroundColor: '#4caf50',
        }],
      },
    };
  }

  private getRecentCases(cases: any[]): RecentCaseDto[] {
    return cases
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(case_ => ({
        id: case_.id,
        patientName: `${case_.patient?.firstName || ''} ${case_.patient?.lastName || ''}`.trim() || 'Unknown Patient',
        hospital: case_.originHospital?.name || 'Unknown Hospital',
        status: case_.currentStatus?.replace(/_/g, ' ') || 'Unknown',
        timestamp: new Date(case_.createdAt).toLocaleString(),
      }));
  }
}
