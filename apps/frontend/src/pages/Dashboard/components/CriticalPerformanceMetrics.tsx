import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  alpha,
  Alert,
  CircularProgress,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faBrain, faHeart, faAmbulance } from '@fortawesome/free-solid-svg-icons';
import { dashboardService, PathwayPerformanceMetrics } from '../../../services/dashboardService';

const CriticalPerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = React.useState<PathwayPerformanceMetrics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch pathway performance metrics on component mount
  React.useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dashboardService.getPathwayPerformanceMetrics();
        setMetrics(data);
      } catch (err: any) {
        console.error('Failed to fetch pathway performance metrics:', err);
        setError('Failed to load pathway performance metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Refresh metrics every 60 seconds (less frequent than main metrics)
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <FontAwesomeIcon icon={faChartLine} style={{ color: '#1976d2', marginRight: '16px', fontSize: '28px' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Critical Performance Metrics
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
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
            <FontAwesomeIcon icon={faChartLine} style={{ color: '#1976d2', marginRight: '16px', fontSize: '28px' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Critical Performance Metrics
            </Typography>
          </Box>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <FontAwesomeIcon icon={faChartLine} style={{ color: '#1976d2', marginRight: '16px', fontSize: '28px' }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Critical Performance Metrics
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            Real-time pathway performance indicators
          </Typography>
        </Box>

        {metrics && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
            Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
          </Typography>
        )}
        
        <Grid container spacing={3}>
          {metrics?.pathways.map((pathway, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${alpha(pathway.color, 0.08)} 0%, ${alpha(pathway.color, 0.02)} 100%)`,
                  border: `1px solid ${alpha(pathway.color, 0.15)}`,
                  height: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {pathway.pathway === 'Stroke Pathway' && (
                    <FontAwesomeIcon 
                      icon={faBrain} 
                      style={{ color: pathway.color, marginRight: '8px' }} 
                    />
                  )}
                  {pathway.pathway === 'STEMI Pathway' && (
                    <FontAwesomeIcon 
                      icon={faHeart} 
                      style={{ color: pathway.color, marginRight: '8px' }} 
                    />
                  )}
                  {pathway.pathway === 'Trauma Pathway' && (
                    <FontAwesomeIcon 
                      icon={faAmbulance} 
                      style={{ color: pathway.color, marginRight: '8px' }} 
                    />
                  )}
                  <Typography variant="h6" sx={{ fontWeight: 600, color: pathway.color }}>
                    {pathway.pathway}
                  </Typography>
                </Box>
                
                <Chip
                  label={pathway.activeCount}
                  size="small"
                  sx={{
                    bgcolor: pathway.color,
                    color: 'white',
                    fontWeight: 600,
                    mb: 3,
                  }}
                />

                <Stack spacing={2.5}>
                  {pathway.metrics.map((metric, metricIndex) => (
                    <Box key={metricIndex}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {metric.label}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: metric.color }}
                        >
                          {metric.value}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={metric.progress}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: alpha(metric.color, 0.1),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: metric.color,
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {(!metrics?.pathways || metrics.pathways.length === 0) && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No pathway performance data available
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CriticalPerformanceMetrics;
