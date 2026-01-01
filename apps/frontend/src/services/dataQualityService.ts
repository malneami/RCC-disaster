import { apiClient } from './apiClient';
import {
  AuditKPIData,
  AuditKPIFilters,
  KPIType,
  FailedRecordsResponse,
  RecordType,
} from '../types/dataQuality';

class DataQualityService {
  /**
   * Get all audit KPIs with filters
   */
  async getAuditKPIs(filters?: AuditKPIFilters): Promise<AuditKPIData> {
    const params = new URLSearchParams();

    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }
    if (filters?.hospitalId && filters.hospitalId !== 'all') {
      params.append('hospitalId', filters.hospitalId);
    }
    if (filters?.recordType && filters.recordType !== RecordType.ALL) {
      params.append('recordType', filters.recordType);
    }
    if (filters?.patientId) {
      params.append('patientId', filters.patientId);
    }

    const queryString = params.toString();
    const url = queryString ? `/data-quality/audit/kpis?${queryString}` : '/data-quality/audit/kpis';

    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Get specific KPI details
   */
  async getKPIDetails(kpiType: KPIType, filters?: AuditKPIFilters): Promise<any> {
    const params = new URLSearchParams();

    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }
    if (filters?.hospitalId && filters.hospitalId !== 'all') {
      params.append('hospitalId', filters.hospitalId);
    }
    if (filters?.recordType && filters.recordType !== RecordType.ALL) {
      params.append('recordType', filters.recordType);
    }
    if (filters?.patientId) {
      params.append('patientId', filters.patientId);
    }

    const queryString = params.toString();
    const url = queryString
      ? `/data-quality/audit/kpis/${kpiType}?${queryString}`
      : `/data-quality/audit/kpis/${kpiType}`;

    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Get failed records for a specific KPI
   */
  async getFailedRecords(
    kpiType: KPIType,
    filters?: AuditKPIFilters & { page?: number; pageSize?: number },
  ): Promise<FailedRecordsResponse> {
    const params = new URLSearchParams();

    params.append('kpiType', kpiType);

    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }
    if (filters?.hospitalId && filters.hospitalId !== 'all') {
      params.append('hospitalId', filters.hospitalId);
    }
    if (filters?.recordType && filters.recordType !== RecordType.ALL) {
      params.append('recordType', filters.recordType);
    }
    if (filters?.patientId) {
      params.append('patientId', filters.patientId);
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.pageSize) {
      params.append('pageSize', filters.pageSize.toString());
    }

    const url = `/data-quality/audit/failed-records?${params.toString()}`;
    const response = await apiClient.get(url);
    return response.data;
  }
}

export const dataQualityService = new DataQualityService();

