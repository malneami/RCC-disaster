const API_BASE_URL = import.meta.env.VITE_REPORT_GENERATOR_API_URL || 'http://localhost:8000';

export interface InitializeResponse {
  success: boolean;
  message: string;
}

export interface ReportResponse {
  success: boolean;
  sql: string;
  data: Array<Record<string, any>>;
  report: string;
  total_rows: number;
  preview_rows: number;
  error?: string;
}

class ReportGeneratorService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async initialize(): Promise<InitializeResponse> {
    const response = await fetch(`${this.baseUrl}/api/initialize`);
    if (!response.ok) {
      throw new Error('Failed to initialize report generator');
    }
    return response.json();
  }

  async generateReport(prompt: string): Promise<ReportResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(errorData.detail || errorData.error || 'Failed to generate report');
    }

    return response.json();
  }

  async healthCheck(): Promise<{ status: string; initialized: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }
}

export const reportGeneratorService = new ReportGeneratorService();

