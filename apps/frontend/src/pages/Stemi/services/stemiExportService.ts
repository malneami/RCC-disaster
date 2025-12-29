import { StemiFilterParams } from './stemiService';
import apiClient from '../../../services/apiClient';

export class StemiExportService {
  static async exportToExcel(filters?: StemiFilterParams): Promise<void> {
    try {
      const queryParams = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (key === 'limit' || key === 'offset') {
            return;
          }
          
          if (key === 'rccActivated') {
            if (value !== undefined && value !== null && value !== '') {
              queryParams.append(key, value === true || value === 'true' ? 'true' : 'false');
            }
          } else if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      const response = await apiClient.get(`/stemi-cases/export${queryString}`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'stemi-cases-export.xlsx';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export STEMI cases to Excel');
    }
  }
}
