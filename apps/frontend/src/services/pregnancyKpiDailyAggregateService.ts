import { apiClient } from './apiClient';

export interface PregnancyKpiDailyAggregate {
  id: string;
  date: string;
  region: string;
  totalCases: number;
  maternalRedCount: number;
  maternalOrangeCount: number;
  avgActivationToOb?: number;
  avgActivationToDispatch?: number;
  avgDispatchToArrival?: number;
  maternalMortalityRate?: number;
  severeMorbidityRate?: number;
  perinatalMortalityRate?: number;
  nicuRate?: number;
  vaginalPercentage?: number;
  cesareanPercentage?: number;
  emergencyCsPercentage?: number;
  planChangePercentage?: number;
  documentationCompletenessAvg?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PregnancyKpiDailyAggregateFilters {
  startDate?: string;
  endDate?: string;
  region?: string;
  limit?: number;
  offset?: number;
}

class PregnancyKpiDailyAggregateService {
  async getAll(
    filters?: PregnancyKpiDailyAggregateFilters,
  ): Promise<{ data: PregnancyKpiDailyAggregate[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.region) params.append('region', filters.region);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get(
      `/pregnancy-kpi-daily-aggregates?${params.toString()}`,
    );
    return response.data;
  }

  async getById(id: string): Promise<PregnancyKpiDailyAggregate> {
    const response = await apiClient.get(`/pregnancy-kpi-daily-aggregates/${id}`);
    return response.data;
  }
}

export const pregnancyKpiDailyAggregateService =
  new PregnancyKpiDailyAggregateService();
