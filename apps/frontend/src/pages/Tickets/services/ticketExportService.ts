import { TicketFilter } from '../../../services/ticketService';
import apiClient from '../../../services/apiClient';

export class TicketExportService {
  static async exportToExcel(filters?: TicketFilter & { emsStatus?: string }): Promise<void> {
    try {
      const queryParams = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (key === 'limit' || key === 'offset' || key === 'page') {
            return;
          }
          
          if (key === 'sortBy' || key === 'sortOrder') {
            return;
          }
          
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      const response = await apiClient.get(`/tickets/export${queryString}`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'tickets-export.xlsx';
      
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
      throw new Error('Failed to export tickets to Excel');
    }
  }
}
