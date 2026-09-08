import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material';
import { LocalHospital, Refresh } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { hospitalService, Hospital } from '../../../../services/hospitalService';
import { getTheme } from '../../../../components/Common/KPI/kpiStyles';

const getAvailabilityPercentage = (h: Hospital): number => {
  const total =
    (h.icuBeds || 0) +
    (h.picuBeds || 0) +
    (h.maleBeds || 0) +
    (h.femaleBeds || 0) +
    (h.pediatricBeds || 0) +
    (h.standardBeds || 0) +
    (h.nicuBeds || 0);
  const available =
    (h.icuBedsAvailable || 0) +
    (h.picuBedsAvailable || 0) +
    (h.maleBedsAvailable || 0) +
    (h.femaleBedsAvailable || 0) +
    (h.pediatricBedsAvailable || 0) +
    (h.standardBedsAvailable || 0) +
    (h.nicuBedsAvailable || 0);
  if (total <= 0) return 100;
  return Math.round((available / total) * 100);
};

interface CommandCapacityPanelProps {
  theme: ReturnType<typeof getTheme>;
}

export const CommandCapacityPanel: React.FC<CommandCapacityPanelProps> = ({ theme }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHospitals = () => {
    setLoading(true);
    hospitalService
      .getAllHospitals()
      .then(setHospitals)
      .catch(() => {
        setHospitals([]);
        enqueueSnackbar('Failed to load hospital capacity', { variant: 'error' });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const sorted = [...hospitals].sort(
    (a, b) => getAvailabilityPercentage(b) - getAvailabilityPercentage(a)
  );

  return (
    <Card sx={{ border: `1px solid ${theme.borderColor}`, borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalHospital sx={{ color: theme.primary, fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Hospital Capacity
            </Typography>
          </Box>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={fetchHospitals} disabled={loading} sx={{ color: theme.primary }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
        {loading ? (
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
        ) : sorted.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hospital capacity data available.
          </Typography>
        ) : (
          <TableContainer sx={{ maxHeight: 320 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Hospital</TableCell>
                  <TableCell align="right">Availability</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sorted.map((h) => {
                  const pct = getAvailabilityPercentage(h);
                  const statusColor =
                    pct <= 15 ? '#DC2626' : pct <= 35 ? '#D97706' : '#059669';
                  return (
                    <TableRow key={h.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {h.name}
                        </Typography>
                        {h.cluster && (
                          <Typography variant="caption" color="text.secondary">
                            {h.cluster}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{
                              width: 80,
                              height: 8,
                              borderRadius: 1,
                              bgcolor: `${theme.borderColor}40`,
                              '& .MuiLinearProgress-bar': { bgcolor: statusColor },
                            }}
                          />
                          <Typography variant="body2" fontWeight={600}>
                            {pct}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={pct <= 15 ? 'Critical' : pct <= 35 ? 'Warning' : 'OK'}
                          size="small"
                          sx={{
                            bgcolor: `${statusColor}20`,
                            color: statusColor,
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};
