import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Grid,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  LocalHospital as HospitalIcon,
  Favorite as HeartIcon,
  AccessTime as ClockIcon,
  ArrowForward as ArrowRightIcon,
  Dashboard as LayoutDashboardIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subDays, isWithinInterval, isSameDay, parseISO } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Static mock data
const mockTickets = [
  { id: 1, status: 'completed', priority: 'high', createdAt: new Date(), fromHospitalId: 1, toHospitalId: 2 },
  { id: 2, status: 'pending', priority: 'medium', createdAt: new Date(), fromHospitalId: 2, toHospitalId: 3 },
  { id: 3, status: 'in_transit', priority: 'high', createdAt: new Date(), fromHospitalId: 1, toHospitalId: 3 },
  { id: 4, status: 'completed', priority: 'low', createdAt: new Date(), fromHospitalId: 3, toHospitalId: 1 },
  { id: 5, status: 'confirmed', priority: 'medium', createdAt: new Date(), fromHospitalId: 2, toHospitalId: 1 },
];

const mockHospitals = [
  { id: 1, name: 'Hospital A', icuBedsAvailable: 10, standardBedsAvailable: 50, ventilatorsAvailable: 5 },
  { id: 2, name: 'Hospital B', icuBedsAvailable: 15, standardBedsAvailable: 60, ventilatorsAvailable: 8 },
  { id: 3, name: 'Hospital C', icuBedsAvailable: 8, standardBedsAvailable: 40, ventilatorsAvailable: 3 },
];

export default function Reports() {
  const [reportPeriod, setReportPeriod] = useState('7days');
  const [tabValue, setTabValue] = useState(0);

  // Using static data for now
  const tickets = mockTickets;
  const hospitals = mockHospitals;
  const isLoading = false;

  // Get date range based on selected period
  const getDateRange = () => {
    const today = new Date();
    let startDate;

    switch (reportPeriod) {
      case '7days':
        startDate = subDays(today, 7);
        break;
      case '30days':
        startDate = subDays(today, 30);
        break;
      case '90days':
        startDate = subDays(today, 90);
        break;
      default:
        startDate = subDays(today, 7);
    }

    return { startDate, endDate: today };
  };

  // Filter tickets by date range
  const getFilteredTickets = () => {
    if (!tickets) return [];

    const { startDate, endDate } = getDateRange();

    return tickets.filter((ticket: any) => {
      if (!ticket.createdAt) return false;
      const ticketDate = typeof ticket.createdAt === 'string' ? parseISO(ticket.createdAt) : ticket.createdAt;

      return isWithinInterval(ticketDate, { start: startDate, end: endDate });
    });
  };

  // Generate transfer status data for charts
  const generateStatusData = () => {
    if (!tickets) return [];

    const filteredTickets = getFilteredTickets();
    const statusCount: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      in_transit: 0,
      completed: 0,
      cancelled: 0,
    };

    filteredTickets.forEach((ticket: any) => {
      if (statusCount[ticket.status] !== undefined) {
        statusCount[ticket.status]++;
      }
    });

    return [
      { name: 'Pending', value: statusCount.pending, fill: '#F59E0B' },
      { name: 'Confirmed', value: statusCount.confirmed, fill: '#10B981' },
      { name: 'In Transit', value: statusCount.in_transit, fill: '#1D4ED8' },
      { name: 'Completed', value: statusCount.completed, fill: '#059669' },
      { name: 'Cancelled', value: statusCount.cancelled, fill: '#EF4444' },
    ];
  };

  // Generate priority data for charts
  const generatePriorityData = () => {
    if (!tickets) return [];

    const filteredTickets = getFilteredTickets();
    const priorityCount: Record<string, number> = {
      high: 0,
      medium: 0,
      low: 0,
    };

    filteredTickets.forEach((ticket: any) => {
      if (priorityCount[ticket.priority] !== undefined) {
        priorityCount[ticket.priority]++;
      }
    });

    return [
      { name: 'High', value: priorityCount.high, fill: '#EF4444' },
      { name: 'Medium', value: priorityCount.medium, fill: '#F59E0B' },
      { name: 'Low', value: priorityCount.low, fill: '#10B981' },
    ];
  };

  // Generate daily transfer data
  const generateDailyData = () => {
    if (!tickets) return [];

    const { startDate, endDate } = getDateRange();
    const daysArray = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      daysArray.push(new Date(currentDate));
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return daysArray.map((date) => {
      const dayTickets = tickets.filter((ticket: any) => {
        if (!ticket.createdAt) return false;
        const ticketDate =
          typeof ticket.createdAt === 'string' ? parseISO(ticket.createdAt) : ticket.createdAt;
        return isSameDay(ticketDate, date);
      });

      return {
        date: format(date, 'MMM dd'),
        created: dayTickets.length,
        completed: dayTickets.filter((t: any) => t.status === 'completed').length,
      };
    });
  };

  // Generate hospital resource data
  const generateHospitalData = () => {
    if (!hospitals) return [];

    return hospitals.map((hospital: any) => ({
      name: hospital.name,
      icuAvailable: hospital.icuBedsAvailable || 0,
      standardAvailable: hospital.standardBedsAvailable || 0,
      ventilatorsAvailable: hospital.ventilatorsAvailable || 0,
    }));
  };

  // Get hospital with the most transfers
  const getMostActiveHospitals = () => {
    if (!tickets || !hospitals) return [];

    const filteredTickets = getFilteredTickets();
    const hospitalCount: Record<number, { sending: number; receiving: number }> = {};

    hospitals.forEach((hospital: any) => {
      hospitalCount[hospital.id] = { sending: 0, receiving: 0 };
    });

    filteredTickets.forEach((ticket: any) => {
      if (hospitalCount[ticket.fromHospitalId]) {
        hospitalCount[ticket.fromHospitalId].sending++;
      }
      if (hospitalCount[ticket.toHospitalId]) {
        hospitalCount[ticket.toHospitalId].receiving++;
      }
    });

    return hospitals
      .map((hospital: any) => ({
        name: hospital.name,
        sending: hospitalCount[hospital.id]?.sending || 0,
        receiving: hospitalCount[hospital.id]?.receiving || 0,
        total: (hospitalCount[hospital.id]?.sending || 0) + (hospitalCount[hospital.id]?.receiving || 0),
      }))
      .sort((a, b) => b.total - a.total);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Reports & Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View statistics and analytics for patient transfers and hospital resources.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Time Period</InputLabel>
            <Select value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)} label="Time Period">
              <MenuItem value="7days">Last 7 Days</MenuItem>
              <MenuItem value="30days">Last 30 Days</MenuItem>
              <MenuItem value="90days">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<DownloadIcon />}>
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Specialized Reports Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChartIcon color="primary" />
                Performance Metrics
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                System-wide performance KPIs
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Review RCC, EMS and STEMI performance indicators with detailed metrics and targets.
              </Typography>
            </CardContent>
            <Box sx={{ p: 2, pt: 0 }}>
              <Button component={Link} to="/reports/performance" fullWidth variant="text" endIcon={<ArrowRightIcon />}>
                View Report
              </Button>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HospitalIcon color="primary" />
                Hospital Resources
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Bed availability & resources
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Track ICU, PICU, and NICU bed availability across all hospitals with resource status.
              </Typography>
            </CardContent>
            <Box sx={{ p: 2, pt: 0 }}>
              <Button
                component={Link}
                to="/reports/hospital-resources"
                fullWidth
                variant="text"
                endIcon={<ArrowRightIcon />}
              >
                View Report
              </Button>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HeartIcon color="error" />
                STEMI Case Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                STEMI patient outcomes & metrics
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Analyze STEMI case details, treatment approaches, and clinical outcomes in detail.
              </Typography>
            </CardContent>
            <Box sx={{ p: 2, pt: 0 }}>
              <Button component={Link} to="/reports/stemi-cases" fullWidth variant="text" endIcon={<ArrowRightIcon />}>
                View Report
              </Button>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ClockIcon color="warning" />
                Transfer Time Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Transport & transfer metrics
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Track transport times, transfer rates, and EMS performance across all facilities.
              </Typography>
            </CardContent>
            <Box sx={{ p: 2, pt: 0 }}>
              <Button
                component={Link}
                to="/reports/transfer-times"
                fullWidth
                variant="text"
                endIcon={<ArrowRightIcon />}
              >
                View Report
              </Button>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LayoutDashboardIcon color="secondary" />
                Custom Report Builder
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Build tailored healthcare reports
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Create custom reports by combining data sources, applying filters, and selecting
                visualizations.
              </Typography>
            </CardContent>
            <Box sx={{ p: 2, pt: 0 }}>
              <Button component={Link} to="/reports/custom" fullWidth variant="text" endIcon={<ArrowRightIcon />}>
                Open Builder
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_e, newValue) => setTabValue(newValue)}>
            <Tab label="Transfer Statistics" />
            <Tab label="Hospital Activity" />
            <Tab label="Trends" />
          </Tabs>
        </Box>

        {/* Transfer Statistics Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Transfer Status Distribution
                  </Typography>
                  {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={generateStatusData()}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }: { name: string; percent?: number }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {generateStatusData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} transfers`, 'Count']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Transfer Priority Distribution
                  </Typography>
                  {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={generatePriorityData()}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }: { name: string; percent?: number }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {generatePriorityData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} transfers`, 'Count']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Transfer Summary
                  </Typography>
                  {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: 'primary.light' }}>
                          <Typography variant="subtitle2" color="primary.dark">
                            Total Transfers
                          </Typography>
                          <Typography variant="h4" color="primary.dark">
                            {getFilteredTickets().length}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
                          <Typography variant="subtitle2" color="success.dark">
                            Completed
                          </Typography>
                          <Typography variant="h4" color="success.dark">
                            {getFilteredTickets().filter((t: any) => t.status === 'completed').length}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: 'warning.light' }}>
                          <Typography variant="subtitle2" color="warning.dark">
                            In Progress
                          </Typography>
                          <Typography variant="h4" color="warning.dark">
                            {getFilteredTickets().filter((t: any) =>
                              ['pending', 'confirmed', 'in_transit'].includes(t.status)
                            ).length}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: 'error.light' }}>
                          <Typography variant="subtitle2" color="error.dark">
                            High Priority
                          </Typography>
                          <Typography variant="h4" color="error.dark">
                            {getFilteredTickets().filter((t: any) => t.priority === 'high').length}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Hospital Activity Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Hospital Transfer Activity
                  </Typography>
                  {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={getMostActiveHospitals()}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sending" name="Sending" fill="#1D4ED8" />
                        <Bar dataKey="receiving" name="Receiving" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resource Availability by Hospital
                  </Typography>
                  {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={generateHospitalData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="icuAvailable" name="ICU Beds Available" fill="#1D4ED8" />
                        <Bar dataKey="standardAvailable" name="Standard Beds Available" fill="#10B981" />
                        <Bar dataKey="ventilatorsAvailable" name="Ventilators Available" fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Trends Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Daily Transfer Activity
                  </Typography>
                  {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={generateDailyData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="created" name="New Transfers" fill="#1D4ED8" />
                        <Bar dataKey="completed" name="Completed Transfers" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Transfer Efficiency
                  </Typography>
                  {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Average Time to Confirmation
                          </Typography>
                          <Typography variant="h4">3.2 hours</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Average Transfer Completion Time
                          </Typography>
                          <Typography variant="h4">8.5 hours</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Transfer Success Rate
                          </Typography>
                          <Typography variant="h4">92%</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
}
