import React from 'react';
import {
  Box,
  Typography,
  alpha,
} from '@mui/material';
import {
  Security,
  Inbox,
} from '@mui/icons-material';
import { PatientAccessLog } from '../../../../services/patientService';
import PatientAccessLogCard from './PatientAccessLogCard';

interface PatientAccessLogsTabProps {
  accessLogs: PatientAccessLog[];
}

const PatientAccessLogsTab: React.FC<PatientAccessLogsTabProps> = ({ accessLogs }) => {
  const cardColor = '#42a5f5';

  return (
    <Box>
      {/* Header Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(cardColor, 0.1)} 0%, ${alpha(cardColor, 0.05)} 100%)`,
          borderRadius: '16px',
          border: `1px solid ${alpha(cardColor, 0.2)}`,
          padding: '18px 24px',
          marginBottom: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${cardColor} 0%, ${alpha(cardColor, 0.8)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 2px 8px ${alpha(cardColor, 0.3)}`,
            }}
          >
            <Security sx={{ color: '#ffffff', fontSize: '24px' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.1rem' }}>
              Access Logs
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 0.25 }}>
              {accessLogs?.length || 0} log{accessLogs?.length !== 1 ? 's' : ''} found
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Access Logs List */}
      {accessLogs && accessLogs.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {accessLogs.map((log: PatientAccessLog, index: number) => (
            <PatientAccessLogCard
              key={log.id}
              log={log}
              index={index}
              totalLogs={accessLogs.length}
            />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            background: '#ffffff',
            borderRadius: '16px',
            border: `1px solid ${alpha(cardColor, 0.2)}`,
            padding: '60px 24px',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${alpha(cardColor, 0.1)} 0%, ${alpha(cardColor, 0.05)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Inbox sx={{ color: cardColor, fontSize: '40px' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
            No Access Logs Found
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            This patient has no access logs associated
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PatientAccessLogsTab;
