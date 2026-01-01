import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  CircularProgress,
  alpha,
  Stack,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faRedo,
} from '@fortawesome/free-solid-svg-icons';

import { useFilteredCriticalCases } from '../hooks/useFilteredCriticalCases';
import { CriticalCaseCard } from './tracker/CriticalCaseCard';
import { TrackerStats } from './tracker/TrackerStats';
import { TrackerHeader } from './tracker/TrackerHeader';

interface HospitalCriticalCaseTrackerProps {
  hospitalId: string;
}

const HospitalCriticalCaseTracker: React.FC<HospitalCriticalCaseTrackerProps> = ({
  hospitalId,
}) => {
  const {
    criticalCases: allCriticalCases,
    stemiStrokeCases,
    otherCriticalCases,
    isLoading,
    error,
    refetch,
  } = useFilteredCriticalCases(hospitalId);

  if (isLoading) {
    return (
      <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              style={{ color: '#d32f2f', marginRight: '16px', fontSize: '28px' }}
            />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                Real-Time Critical Case Tracker
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Live countdown tracking for STEMI (120 min) and Stroke (4.5 hr) cases with hospital routes and progress monitoring.
              </Typography>
            </Box>
          </Box>

          <Card sx={{
            borderRadius: 2,
            border: '1px solid rgba(211, 47, 47, 0.3)',
            backgroundColor: alpha('#d32f2f', 0.05),
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  style={{ color: '#d32f2f', marginRight: '8px' }}
                />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                  Error Loading Alerts
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Failed to load critical ticket alerts. Please try again.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<FontAwesomeIcon icon={faRedo} />}
                onClick={() => refetch()}
                sx={{
                  borderColor: '#666',
                  color: '#666',
                  '&:hover': {
                    borderColor: '#d32f2f',
                    color: '#d32f2f',
                  },
                }}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        backgroundColor: '#FFFFFF',
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 4 } }}>
        <TrackerHeader />

        {allCriticalCases.length > 0 && (
          <TrackerStats
            stemiCount={stemiStrokeCases.filter(c => c.pathway === 'STEMI').length}
            strokeCount={stemiStrokeCases.filter(c => c.pathway === 'STROKE').length}
            otherCriticalCount={otherCriticalCases.length}
            incomingCount={allCriticalCases.filter(c => c.originHospital?.id !== hospitalId).length}
            outgoingCount={allCriticalCases.filter(c => c.originHospital?.id === hospitalId).length}
          />
        )}

        {/* Cases Display */}
        {allCriticalCases.length === 0 ? (
          <Alert severity="success" sx={{ borderRadius: '12px' }}>
            No unacknowledged critical cases requiring tracking.
          </Alert>
        ) : (
          <Stack spacing={2}>
            {allCriticalCases.map((case_) => (
              <CriticalCaseCard
                key={case_.id}
                criticalCase={case_}
                refetch={refetch}
                currentHospitalId={hospitalId}
              />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default HospitalCriticalCaseTracker;
