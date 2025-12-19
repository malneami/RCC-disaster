import axios from 'axios';
import { TraumaCaseFilters } from '../../../services/traumaService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export class TraumaExportService {
  static async exportToExcel(filters?: TraumaCaseFilters): Promise<void> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (key === 'criticalCase' || key === 'transferCase') {
            if (value !== undefined && value !== null && value !== '') {
              queryParams.append(key, value === true || value === 'true' ? 'true' : 'false');
            }
          } else if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const exportUrl = `${API_BASE_URL}/trauma-cases/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await axios.get(exportUrl, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'trauma-cases-export.xlsx';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export trauma cases to Excel');
    }
  }
}
