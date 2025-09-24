import { useState, useEffect, useCallback } from 'react';
import { CommandCenterFilters, CommandCenterData } from '../types';
import { commandCenterService } from '../api/commandCenterService';

export const useCommandCenterData = (filters: CommandCenterFilters) => {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Call the real API service
      const apiData = await commandCenterService.getDashboardData(filters);
      
      // Transform API response to match our frontend types
      const transformedData: CommandCenterData = {
        summary: apiData.summary,
        kpis: apiData.kpis,
        hospitals: apiData.hospitals,
        charts: apiData.charts,
        recentCases: apiData.recentCases,
      };
      
      setData(transformedData);
    } catch (err) {
      console.error('Error fetching command center data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      
      // Fallback to mock data if API fails
      console.log('Falling back to mock data...');
      const mockData = generateMockData(filters);
      setData(mockData);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refreshData,
  };
};

// Keep mock data as fallback
const generateMockData = (_filters: CommandCenterFilters): CommandCenterData => {
  return {
    summary: {
      totalCases: 156,
      totalPCI: 89,
      mortalityRate: 8.5,
      complianceRate: 87.2,
    },
    kpis: [
      {
        id: 'd2b',
        name: 'Door-to-Balloon Time',
        value: 78,
        target: 90,
        unit: 'min',
        status: 'missed',
        trend: 'up',
        percentage: 87,
      },
      {
        id: 'd2n',
        name: 'Door-to-Needle Time',
        value: 25,
        target: 30,
        unit: 'min',
        status: 'met',
        trend: 'down',
        percentage: 83,
      },
      {
        id: 'dido',
        name: 'Door-In-Door-Out',
        value: 35,
        target: 30,
        unit: 'min',
        status: 'missed',
        trend: 'stable',
        percentage: 86,
      },
      {
        id: 'pci-success',
        name: 'PCI Success Rate',
        value: 92,
        target: 90,
        unit: '%',
        status: 'met',
        trend: 'up',
        percentage: 102,
      },
      {
        id: 'mortality',
        name: 'Mortality Rate',
        value: 8.5,
        target: 10,
        unit: '%',
        status: 'met',
        trend: 'down',
        percentage: 85,
      },
      {
        id: 'compliance',
        name: 'Overall Compliance',
        value: 87,
        target: 90,
        unit: '%',
        status: 'warning',
        trend: 'up',
        percentage: 97,
      },
    ],
    hospitals: [
      {
        id: 'h1',
        name: 'King Fahd Hospital',
        zone: 'Zone 1',
        metrics: {
          d2b: {
            id: 'h1-d2b',
            name: 'D2B',
            value: 75,
            target: 90,
            unit: 'min',
            status: 'met',
            trend: 'up',
            percentage: 83,
          },
          d2n: {
            id: 'h1-d2n',
            name: 'D2N',
            value: 28,
            target: 30,
            unit: 'min',
            status: 'met',
            trend: 'down',
            percentage: 93,
          },
          dido: {
            id: 'h1-dido',
            name: 'DIDO',
            value: 32,
            target: 30,
            unit: 'min',
            status: 'missed',
            trend: 'stable',
            percentage: 94,
          },
          pciSuccess: {
            id: 'h1-pci',
            name: 'PCI Success',
            value: 94,
            target: 90,
            unit: '%',
            status: 'met',
            trend: 'up',
            percentage: 104,
          },
          mortality: {
            id: 'h1-mortality',
            name: 'Mortality',
            value: 7.2,
            target: 10,
            unit: '%',
            status: 'met',
            trend: 'down',
            percentage: 72,
          },
        },
      },
      {
        id: 'h2',
        name: 'Prince Sultan Hospital',
        zone: 'Zone 1',
        metrics: {
          d2b: {
            id: 'h2-d2b',
            name: 'D2B',
            value: 85,
            target: 90,
            unit: 'min',
            status: 'met',
            trend: 'up',
            percentage: 94,
          },
          d2n: {
            id: 'h2-d2n',
            name: 'D2N',
            value: 22,
            target: 30,
            unit: 'min',
            status: 'met',
            trend: 'down',
            percentage: 73,
          },
          dido: {
            id: 'h2-dido',
            name: 'DIDO',
            value: 28,
            target: 30,
            unit: 'min',
            status: 'met',
            trend: 'down',
            percentage: 93,
          },
          pciSuccess: {
            id: 'h2-pci',
            name: 'PCI Success',
            value: 91,
            target: 90,
            unit: '%',
            status: 'met',
            trend: 'stable',
            percentage: 101,
          },
          mortality: {
            id: 'h2-mortality',
            name: 'Mortality',
            value: 9.1,
            target: 10,
            unit: '%',
            status: 'met',
            trend: 'stable',
            percentage: 91,
          },
        },
      },
    ],
    charts: {
      referralSource: {
        labels: ['Direct', 'RCC Referral'],
        datasets: [{
          label: 'Cases',
          data: [89, 67],
          backgroundColor: ['#4caf50', '#2196f3'],
        }],
      },
      pciBreakdown: {
        labels: ['Primary PCI', 'Post-Fibrinolysis', 'Transferred-in'],
        datasets: [{
          label: 'PCI Cases',
          data: [45, 23, 21],
          backgroundColor: ['#ff9800', '#9c27b0', '#607d8b'],
        }],
      },
      didoCompliance: {
        labels: ['Compliant', 'Non-Compliant'],
        datasets: [{
          label: 'DIDO Compliance',
          data: [78, 22],
          backgroundColor: ['#4caf50', '#f44336'],
        }],
      },
      treatmentDistribution: {
        labels: ['PCI Only', 'Thrombolysis Only', 'Combined', 'Conservative'],
        datasets: [{
          label: 'Treatment Type',
          data: [67, 23, 12, 8],
          backgroundColor: ['#2196f3', '#ff9800', '#4caf50', '#9e9e9e'],
        }],
      },
      outcomes: {
        labels: ['Excellent', 'Good', 'Fair', 'Poor', 'Death'],
        datasets: [{
          label: 'Patient Outcomes',
          data: [45, 32, 18, 8, 7],
          backgroundColor: ['#4caf50', '#8bc34a', '#ffc107', '#ff9800', '#f44336'],
        }],
      },
      hospitalPerformance: {
        labels: ['KFH', 'PSH', 'ANH', 'KFH-B', 'PSH-B'],
        datasets: [{
          label: 'D2B Compliance %',
          data: [94, 87, 82, 79, 76],
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
        labels: ['KFH', 'PSH', 'ANH', 'KFH-B', 'PSH-B'],
        datasets: [{
          label: 'D2B Compliance',
          data: [94, 87, 82, 79, 76],
          backgroundColor: '#4caf50',
        }],
      },
    },
    recentCases: [
      {
        id: 'case1',
        patientName: 'Ahmed Al-Rashid',
        hospital: 'King Fahd Hospital',
        status: 'PCI Completed',
        timestamp: '2024-01-15 14:30',
      },
      {
        id: 'case2',
        patientName: 'Fatima Al-Zahra',
        hospital: 'Prince Sultan Hospital',
        status: 'In Progress',
        timestamp: '2024-01-15 13:45',
      },
      {
        id: 'case3',
        patientName: 'Mohammed Al-Sayed',
        hospital: 'Al-Noor Hospital',
        status: 'Discharged',
        timestamp: '2024-01-15 12:20',
      },
    ],
  };
};
