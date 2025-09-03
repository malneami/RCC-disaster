import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
} from '@mui/material';
import {
  Visibility,
  Edit,
  Warning,
  Download,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { PatientAccessLog } from '../../../services/patientService';

interface PatientAccessLogsTabProps {
  accessLogs: PatientAccessLog[];
}

const PatientAccessLogsTab: React.FC<PatientAccessLogsTabProps> = ({ accessLogs }) => {
  const getAccessTypeIcon = (accessType: string) => {
    switch (accessType) {
      case 'VIEW': return <Visibility />;
      case 'CREATE': return <Edit />;
      case 'UPDATE': return <Edit />;
      case 'DELETE': return <Warning />;
      case 'EXPORT': return <Download />;
      case 'SEARCH': return <Visibility />;
      default: return <Visibility />;
    }
  };

  return (
    <Card>
      <CardHeader title="Access Logs" />
      <CardContent>
        {accessLogs && accessLogs.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Access Type</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accessLogs.map((log: PatientAccessLog) => (
                  <TableRow key={log.id}>
                    <TableCell>{format(new Date(log.timestamp), 'PPp')}</TableCell>
                    <TableCell>
                      {log.user?.firstName} {log.user?.lastName}
                      <Typography variant="caption" display="block" color="text.secondary">
                        {log.user?.role}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getAccessTypeIcon(log.accessType)}
                        {log.accessType}
                      </Box>
                    </TableCell>
                    <TableCell>{log.accessMethod}</TableCell>
                    <TableCell>{log.ipAddress || 'N/A'}</TableCell>
                    <TableCell>{log.reason || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No access logs found
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientAccessLogsTab;
