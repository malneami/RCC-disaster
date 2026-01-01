import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Description as FileTextIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Warning as AlertTriangleIcon,
  BarChart as BarChartIcon,
  Psychology as BrainIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useAuditKPIs } from './hooks/useAuditKPIs';
import { hospitalService } from '../../services/hospitalService';
import { AuditKPIFilters, RecordType, KPIType, FailedRecord } from '../../types/dataQuality';
import AccuracyKPI from './components/AccuracyKPI';
import TimelinessKPI from './components/TimelinessKPI';
import CompletenessKPI from './components/CompletenessKPI';
import CoverageKPI from './components/CoverageKPI';
import PrecisionKPI from './components/PrecisionKPI';
import DuplicationKPI from './components/DuplicationKPI';
import FailedRecordsList from './components/FailedRecordsList';
import Chatbot from './components/Chatbot';
import { dataQualityService } from '../../services/dataQualityService';

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


interface FilterState {
  startDate: string;
  endDate: string;
  patientId: string;
  hospitalId: string;
  recordType: RecordType;
}


const DataQualityAuditDashboard: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    patientId: '',
    hospitalId: 'all',
    recordType: RecordType.ALL,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedKPI, setSelectedKPI] = useState<KPIType | null>(null);
  const [failedRecordsPage, setFailedRecordsPage] = useState(1);
  const [failedRecordsPageSize, setFailedRecordsPageSize] = useState(50);
  const [hospitals, setHospitals] = useState<Array<{ id: string; name: string }>>([]);

  // Convert filters to API format
  const apiFilters: AuditKPIFilters = useMemo(() => ({
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    patientId: filters.patientId || undefined,
    hospitalId: filters.hospitalId !== 'all' ? filters.hospitalId : undefined,
    recordType: filters.recordType,
  }), [filters]);

  // Load audit KPIs
  const { data: auditData, loading: statsLoading, error: statsError } = useAuditKPIs(apiFilters);

  // Load hospitals
  React.useEffect(() => {
    const loadHospitals = async () => {
      try {
        const hospitalsList = await hospitalService.getAllHospitals();
        setHospitals(hospitalsList.map(h => ({ id: h.id, name: h.name })));
      } catch (error) {
        console.error('Error loading hospitals:', error);
      }
    };
    loadHospitals();
  }, []);

  // Load failed records when KPI is selected
  const [failedRecords, setFailedRecords] = useState<any>(null);
  const [failedLoading, setFailedLoading] = React.useState(false);
  React.useEffect(() => {
    if (selectedKPI) {
      const loadFailedRecords = async () => {
        setFailedLoading(true);
        try {
          const result = await dataQualityService.getFailedRecords(selectedKPI, {
            ...apiFilters,
            page: failedRecordsPage,
            pageSize: failedRecordsPageSize,
          });
          setFailedRecords(result);
        } catch (error) {
          console.error('Error loading failed records:', error);
        } finally {
          setFailedLoading(false);
        }
      };
      loadFailedRecords();
    }
  }, [selectedKPI, apiFilters, failedRecordsPage, failedRecordsPageSize]);

  // Filter failed records by search term
  const filteredFailedRecords = useMemo(() => {
    if (!failedRecords?.records || !searchTerm) return failedRecords?.records || [];

    return failedRecords.records.filter(
      (record: FailedRecord) =>
        record.recordId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.hospitalName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [failedRecords?.records, searchTerm]);

  const handleFilterChange = (key: keyof FilterState, value: string | RecordType) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      patientId: '',
      hospitalId: 'all',
      recordType: RecordType.ALL,
    });
    setSearchTerm('');
    setSelectedKPI(null);
  };

  const getPassRateColor = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage >= 95) return 'success';
    if (percentage >= 80) return 'warning';
    return 'error';
  };

  const handleKPIClick = (kpiType: KPIType) => {
    setSelectedKPI(kpiType);
    setTabValue(0); // Switch to failed records tab
  };

  if (statsLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (statsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            Data Quality Audit Error
          </Typography>
          <Typography>Error loading audit data: {String(statsError)}</Typography>
        </Alert>
      </Box>
    );
  }

  if (!auditData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          <Typography variant="h6" gutterBottom>
            Data Quality Audit Initializing
          </Typography>
          <Typography>Please wait while we initialize the audit system...</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Data Quality Audit Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            وزارة الصحة - لوحة تحكم مراجعة جودة البيانات
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ministry of Health (MoC) Compliant Five-Pillar Data Quality Assessment
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Chip icon={<CheckCircleIcon />} label="MoC Standards Aligned" color="success" size="small" />
            <Chip icon={<AlertTriangleIcon />} label="95% Excellence Target" color="info" size="small" />
            <Chip icon={<FileTextIcon />} label="Arabic Documentation" color="secondary" size="small" />
          </Box>
        </Box>
        <Button onClick={clearFilters} variant="outlined" startIcon={<FilterIcon />}>
          Clear Filters
        </Button>
      </Box>

      {/* MoC Quality Standards Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(to right, #e3f2fd, #e8f5e9)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <BarChartIcon color="primary" />
            <Typography variant="h6">
              Ministry of Health Data Quality Monitoring Standards
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              معايير وزارة الصحة لمراقبة جودة البيانات
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, bgcolor: 'success.light', textAlign: 'center' }}>
                <Typography variant="h6" color="success.dark" fontWeight="bold">
                  ممتاز
                </Typography>
                <Typography variant="body2" color="success.dark">
                  Excellent
                </Typography>
                <Typography variant="caption" color="success.dark">
                  ≥95%
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, bgcolor: 'warning.light', textAlign: 'center' }}>
                <Typography variant="h6" color="warning.dark" fontWeight="bold">
                  جيد
                </Typography>
                <Typography variant="body2" color="warning.dark">
                  Good
                </Typography>
                <Typography variant="caption" color="warning.dark">
                  90-94%
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, bgcolor: 'info.light', textAlign: 'center' }}>
                <Typography variant="h6" color="info.dark" fontWeight="bold">
                  مقبول
                </Typography>
                <Typography variant="body2" color="info.dark">
                  Acceptable
                </Typography>
                <Typography variant="caption" color="info.dark">
                  80-89%
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, bgcolor: 'error.light', textAlign: 'center' }}>
                <Typography variant="h6" color="error.dark" fontWeight="bold">
                  غير مقبول
                </Typography>
                <Typography variant="body2" color="error.dark">
                  Unacceptable
                </Typography>
                <Typography variant="caption" color="error.dark">
                  &lt;80%
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterIcon />
            <Typography variant="h6">Filter Controls</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                label="End Date"
                type="date"
                fullWidth
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                label="Patient ID"
                fullWidth
                placeholder="Enter patient ID"
                value={filters.patientId}
                onChange={(e) => handleFilterChange('patientId', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth>
                <InputLabel>Hospital</InputLabel>
                <Select
                  value={filters.hospitalId}
                  onChange={(e) => handleFilterChange('hospitalId', e.target.value)}
                  label="Hospital"
                >
                  <MenuItem value="all">All Hospitals</MenuItem>
                  {hospitals.map((hospital) => (
                    <MenuItem key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth>
                <InputLabel>Record Type</InputLabel>
                <Select
                  value={filters.recordType}
                  onChange={(e) => handleFilterChange('recordType', e.target.value as RecordType)}
                  label="Record Type"
                >
                  <MenuItem value={RecordType.ALL}>All Types</MenuItem>
                  <MenuItem value={RecordType.TICKET}>Ticket</MenuItem>
                  <MenuItem value={RecordType.STEMI}>STEMI</MenuItem>
                  <MenuItem value={RecordType.STROKE}>Stroke</MenuItem>
                  <MenuItem value={RecordType.TRAUMA}>Trauma</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Overall Statistics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Overall Data Quality Performance
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Total Records Audited: {auditData.totalRecords}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h2"
                color={getPassRateColor(auditData.overallScore)}
                fontWeight="bold"
              >
                {auditData.overallScore.toFixed(1)}%
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                Overall Quality Score
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {auditData.summary.validRecords} of {auditData.summary.totalRecords} records passed
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Six Data Quality KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {auditData.kpis.map((kpi) => {
          const getKPIComponent = () => {
            switch (kpi.kpiType) {
              case KPIType.ACCURACY:
                return <AccuracyKPI metric={kpi} onViewDetails={() => handleKPIClick(kpi.kpiType)} />;
              case KPIType.TIMELINESS:
                return <TimelinessKPI metric={kpi} onViewDetails={() => handleKPIClick(kpi.kpiType)} />;
              case KPIType.COMPLETENESS:
                return <CompletenessKPI metric={kpi} onViewDetails={() => handleKPIClick(kpi.kpiType)} />;
              case KPIType.COVERAGE:
                return <CoverageKPI metric={kpi} onViewDetails={() => handleKPIClick(kpi.kpiType)} />;
              case KPIType.PRECISION:
                return <PrecisionKPI metric={kpi} onViewDetails={() => handleKPIClick(kpi.kpiType)} />;
              case KPIType.DUPLICATION:
                return <DuplicationKPI metric={kpi} onViewDetails={() => handleKPIClick(kpi.kpiType)} />;
              default:
                return null;
            }
          };

          return (
            <Grid item xs={12} sm={6} md={4} key={kpi.kpiType}>
              {getKPIComponent()}
            </Grid>
          );
        })}
      </Grid>


      {/* Tabs for Failed Records and Analytics */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_e, newValue) => setTabValue(newValue)}>
            <Tab label="Failed Records" />
            <Tab icon={<ChatIcon />} iconPosition="start" label="Data Chatbot" />
            <Tab icon={<BrainIcon />} iconPosition="start" label="AI Prediction Analytics" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h6">Failed Records Analysis</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedKPI
                    ? `Records that failed ${selectedKPI} KPI validation`
                    : 'Select a KPI card above to view failed records'}
                </Typography>
              </Box>
              {selectedKPI && (
                <Button onClick={() => setSelectedKPI(null)} variant="outlined" size="small">
                  Clear Selection
                </Button>
              )}
            </Box>
            {selectedKPI ? (
              <>
                <TextField
                  fullWidth
                  placeholder="Search by record ID, patient ID, or hospital..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                {failedLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : filteredFailedRecords?.length === 0 ? (
                  <Alert severity="info">
                    {searchTerm
                      ? 'No failed records match your search criteria'
                      : 'No failed records found for this KPI'}
                  </Alert>
                ) : (
                  <FailedRecordsList
                    records={filteredFailedRecords}
                    total={failedRecords?.total || 0}
                    page={failedRecordsPage - 1}
                    pageSize={failedRecordsPageSize}
                    onPageChange={(newPage) => setFailedRecordsPage(newPage + 1)}
                    onPageSizeChange={(newPageSize) => {
                      setFailedRecordsPageSize(newPageSize);
                      setFailedRecordsPage(1);
                    }}
                    loading={failedLoading}
                  />
                )}
              </>
            ) : (
              <Alert severity="info">
                <Typography variant="body1">
                  Click on any KPI card above to view detailed failed records for that specific KPI.
                </Typography>
              </Alert>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Chatbot />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Alert severity="info">
            <Typography variant="h6" gutterBottom>
              AI Prediction Analytics
            </Typography>
            <Typography>
              This feature will be available once the PredictionAnalytics component is integrated.
            </Typography>
          </Alert>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default DataQualityAuditDashboard;
