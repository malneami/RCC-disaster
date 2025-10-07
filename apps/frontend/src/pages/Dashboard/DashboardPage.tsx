import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  Stack,
  Paper,
  alpha,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faHeart,
  faBrain,
  faChartLine,
  faAmbulance,
} from '@fortawesome/free-solid-svg-icons';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import PerformanceComparison from './PerformanceComparison';
import LivePerformanceMetrics from './LivePerformanceMetrics';
import PeakAnalysisDashboard from './PeakAnalysisDashboard';
import EMSStatusDemo from './EMSStatusDemo';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Main KPI Cards
  const kpiCards = [
    {
      title: 'Active Transfers',
      value: '0',
      subtitle: 'Currently in progress',
      // icon: <FontAwesomeIcon icon={faTrendingUp} />,
      color: '#2196f3',
      bgColor: alpha('#2196f3', 0.1),
    },
    {
      title: 'Urgent Pathway Cases',
      value: '0',
      subtitle: 'Requiring immediate attention',
      icon: <FontAwesomeIcon icon={faExclamationTriangle} />,
      color: '#ff5722',
      bgColor: alpha('#ff5722', 0.1),
    },
    {
      title: 'Completed Today',
      value: '0',
      subtitle: 'Successfully transferred',
      icon: <FontAwesomeIcon icon={faCheckCircle} />,
      color: '#4caf50',
      bgColor: alpha('#4caf50', 0.1),
    },
    {
      title: 'Delayed Transfers',
      value: '0',
      subtitle: 'Exceeding target time',
      icon: <FontAwesomeIcon icon={faClock} />,
      color: '#ff9800',
      bgColor: alpha('#ff9800', 0.1),
    },
  ];

  // Pathway Performance Metrics
  const pathwayMetrics = [
    {
      pathway: 'Stroke Pathway',
      color: '#9c27b0',
      activeCount: '107 Active',
      metrics: [
        { label: 'Door to CT Scan Target: ≤25 min', value: '22 min avg', progress: 88, color: '#4caf50' },
        { label: 'Door to Needle Target: ≤60 min', value: '45 min avg', progress: 75, color: '#4caf50' },
        { label: 'Door to Physician Target: ≤15 min', value: '12 min avg', progress: 80, color: '#4caf50' },
        { label: 'Stroke Unit Admission Target: ≥80%', value: '85% achieved', progress: 85, color: '#4caf50' },
      ],
    },
    {
      pathway: 'STEMI Pathway',
      color: '#d32f2f',
      activeCount: '122 Active',
      metrics: [
        { label: 'Door-to-Balloon Target: ≤90 min', value: '78 min avg', progress: 87, color: '#4caf50' },
        { label: 'First ECG Target: ≤10 min', value: '8 min avg', progress: 80, color: '#4caf50' },
        { label: 'Door to Needle Target: ≤30 min', value: '25 min avg', progress: 83, color: '#4caf50' },
        { label: 'RCC Activation Target: ≤15 min', value: '12 min avg', progress: 80, color: '#4caf50' },
      ],
    },
    {
      pathway: 'Trauma Pathway',
      color: '#ff5722',
      activeCount: '56 Active',
      metrics: [
        { label: 'Response Time Target: ≤8 min', value: '6 min avg', progress: 75, color: '#4caf50' },
        { label: 'Assessment Time Target: ≤15 min', value: '12 min avg', progress: 80, color: '#4caf50' },
        { label: 'Triage Time Target: ≤15 min', value: '12 min avg', progress: 80, color: '#4caf50' },
        { label: 'CT Scan Target: ≤30 min', value: '25 min avg', progress: 83, color: '#4caf50' },
      ],
    },
  ];

  const recentTickets = [
    {
      id: 'T-2024-001',
      patient: 'John D.',
      pathway: 'STEMI',
      priority: 'CRITICAL',
      time: '15 min ago',
    },
    {
      id: 'T-2024-002',
      patient: 'Sarah M.',
      pathway: 'STROKE',
      priority: 'HIGH',
      time: '32 min ago',
    },
    {
      id: 'T-2024-003',
      patient: 'Robert L.',
      pathway: 'TRAUMA',
      priority: 'MEDIUM',
      time: '1 hour ago',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - RCC Healthcare Platform</title>
      </Helmet>

      <Box>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Welcome back, {user?.firstName}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Regional Coordination Center Dashboard
        </Typography>

        <Grid container spacing={3}>
          {/* Main KPI Cards */}
          {kpiCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  background: `linear-gradient(135deg, ${card.bgColor} 0%, ${alpha(card.color, 0.05)} 100%)`,
                  border: `1px solid ${alpha(card.color, 0.2)}`,
                  borderRadius: 3,
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${alpha(card.color, 0.15)}`,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: card.color,
                        width: 56,
                        height: 56,
                        boxShadow: `0 4px 14px ${alpha(card.color, 0.3)}`,
                      }}
                    >
                      {card.icon}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h3"
                        sx={{
                          color: card.color,
                          fontWeight: 700,
                          fontSize: '2.5rem',
                          lineHeight: 1,
                        }}
                      >
                        {card.value}
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.subtitle}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Critical Performance Metrics */}
          <Grid item xs={12}>
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
                
                <Grid container spacing={3}>
                  {pathwayMetrics.map((pathway, index) => (
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
                          {pathway.pathway === 'Stroke Pathway' && <FontAwesomeIcon icon={faBrain} style={{ color: pathway.color, marginRight: '8px' }} />}
                          {pathway.pathway === 'STEMI Pathway' && <FontAwesomeIcon icon={faHeart} style={{ color: pathway.color, marginRight: '8px' }} />}
                          {pathway.pathway === 'Trauma Pathway' && <FontAwesomeIcon icon={faAmbulance} style={{ color: pathway.color, marginRight: '8px' }} />}
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
              </CardContent>
            </Card>
          </Grid>

          {/* Performance Comparison */}
          <Grid item xs={12}>
            <PerformanceComparison />
          </Grid>

          {/* EMS Status Update Demo */}
          <Grid item xs={12}>
            <EMSStatusDemo />
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Recent Transfer Requests
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {recentTickets.map((ticket, index) => (
                    <Box
                      key={ticket.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 2.5,
                        px: 2,
                        borderRadius: 2,
                        backgroundColor: index % 2 === 0 ? alpha('#f5f5f5', 0.3) : 'transparent',
                        mb: 1,
                        transition: 'background-color 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha('#f5f5f5', 0.5),
                        },
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {ticket.id} - {ticket.patient}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {ticket.pathway} • {ticket.time}
                        </Typography>
                      </Box>
                      <Chip
                        label={ticket.priority}
                        size="small"
                        color={getPriorityColor(ticket.priority) as any}
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  ))}
                </Box>
                <Box sx={{ mt: 3 }}>
                  <Button variant="outlined" size="medium" sx={{ borderRadius: 2 }}>
                    View All Tickets
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Live Performance Metrics and Peak Analysis */}
          <Grid item xs={12} md={6}>
            <LivePerformanceMetrics />
          </Grid>
          <Grid item xs={12} md={6}>
            <PeakAnalysisDashboard />
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default DashboardPage;