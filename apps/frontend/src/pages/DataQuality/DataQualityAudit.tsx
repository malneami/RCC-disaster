import React, { useState } from 'react';
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
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Search as SearchIcon,
  PlayArrow as PlayIcon,
  Warning as AlertTriangleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as XCircleIcon,
  Storage as DatabaseIcon,
  FindInPage as FileSearchIcon,
  TrendingUp as TrendingUpIcon,
  People as UsersIcon,
  AccessTime as ClockIcon,
  Security as ShieldIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

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

interface QueryResult {
  queryId: number;
  queryType: string;
  explanation: string;
  results: any[];
  executionTime: number;
  totalRecords: number;
}

interface AuditResult {
  recordType: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  overallScore: string;
  metrics: any;
  insights: string;
  categorizedIssues: {
    critical: any[];
    high: any[];
    medium: any[];
    low: any[];
    summary: string;
  };
  sampleResults: any[];
}

interface QualityMetric {
  id: number;
  metricDate: string;
  dataSource: string;
  validityScore: string;
  timestampAccuracyScore: string;
  completenessScore: string;
  changeRateScore: string;
  accuracyScore: string;
  duplicationScore: string;
  overallScore: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
}

// Static mock data
const mockMetricsData = {
  overallScore: '88.5',
  summary: {
    totalRecords: 1250,
    validRecords: 1106,
    invalidRecords: 144,
  },
  metrics: [
    {
      id: 1,
      metricDate: new Date().toISOString(),
      dataSource: 'stemi_patients',
      validityScore: '96.0',
      timestampAccuracyScore: '95.0',
      completenessScore: '92.0',
      changeRateScore: '88.0',
      accuracyScore: '94.4',
      duplicationScore: '97.6',
      overallScore: '93.8',
      totalRecords: 400,
      validRecords: 375,
      invalidRecords: 25,
    },
  ],
};

export default function DataQualityAudit() {
  const [query, setQuery] = useState('');
  const [selectedDataSource, setSelectedDataSource] = useState('all');
  const [selectedRecordType, setSelectedRecordType] = useState('stemi_patients');
  const [auditResults, setAuditResults] = useState<AuditResult | null>(null);
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Using static data for now
  const metricsData = mockMetricsData;
  const aiStatus = { available: false };

  const handleNaturalLanguageQuery = () => {
    if (!query.trim()) return;
    setIsProcessing(true);
    setQueryResults(null);
    // Simulate query processing
    setTimeout(() => {
      setQueryResults({
        queryId: 1,
        queryType: 'SELECT',
        explanation: 'This is a sample query result. AI-powered queries require OpenAI API access.',
        results: [],
        executionTime: 150,
        totalRecords: 0,
      });
      setIsProcessing(false);
    }, 1000);
  };

  const handleRunAudit = () => {
    // Simulate audit processing
    setAuditResults({
      recordType: selectedRecordType,
      totalRecords: 100,
      validRecords: 85,
      invalidRecords: 15,
      overallScore: '85.0',
      metrics: {},
      insights: 'Sample audit insights. AI-powered insights require OpenAI API access.',
      categorizedIssues: {
        critical: [],
        high: [],
        medium: [],
        low: [],
        summary: 'Sample audit summary',
      },
      sampleResults: [],
    });
  };

  const exampleQueries = [
    'List STEMI patients with Door-Out time > 180 minutes',
    'Show all transfers in the last 30 days with missing timestamps',
    'Calculate percentage of valid vs invalid records by pathway',
    'Find patients with negative time differences',
    'Show compliance rate for Door-to-ECG KPI by hospital',
  ];

  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getLatestMetricWithScores = (metrics: any[]) => {
    if (!metrics || metrics.length === 0) return null;
    const metricWithScores = metrics.find((m) => m.validityScore !== null && m.validityScore !== undefined);
    return metricWithScores || metrics[metrics.length - 1];
  };

  const latestMetric = getLatestMetricWithScores(metricsData?.metrics || []);

  const pillarScores = latestMetric
    ? [
        { pillar: 'Validity', score: parseFloat(latestMetric.validityScore || '75') },
        { pillar: 'Timestamp', score: parseFloat(latestMetric.timestampAccuracyScore || '95') },
        { pillar: 'Completeness', score: parseFloat(latestMetric.completenessScore || '82') },
        { pillar: 'Change Rate', score: parseFloat(latestMetric.changeRateScore || '88') },
        { pillar: 'Accuracy', score: parseFloat(latestMetric.accuracyScore || '91') },
        { pillar: 'Duplication', score: parseFloat(latestMetric.duplicationScore || '86') },
      ]
    : [];

  const pieData = metricsData?.summary
    ? [
        { name: 'Valid Records', value: metricsData.summary.validRecords, color: '#00C49F' },
        { name: 'Invalid Records', value: metricsData.summary.invalidRecords, color: '#FF8042' },
      ]
    : [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Data Quality Audit Tool
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive healthcare data analysis with MoC Data Quality Standards
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip icon={<ShieldIcon />} label="MoC Standards" variant="outlined" />
          <Chip icon={<DatabaseIcon />} label="Real-time Analysis" color="secondary" />
          {aiStatus?.available && (
            <Chip icon={<CheckCircleIcon />} label="AI Powered" color="success" />
          )}
        </Box>
      </Box>

      {/* Overall Quality Score */}
      {metricsData && (
        <Card sx={{ mb: 3, background: 'linear-gradient(to right, #e3f2fd, #e8eaf6)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6">Overall Data Quality Score</Typography>
                <Typography variant="body2" color="text.secondary">
                  Based on 6 MoC Data Quality Pillars
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant="h3"
                  color={getScoreColor(parseFloat(metricsData.overallScore))}
                  gutterBottom
                >
                  {metricsData.overallScore}%
                </Typography>
                <Chip
                  label={
                    parseFloat(metricsData.overallScore) >= 90
                      ? 'Excellent'
                      : parseFloat(metricsData.overallScore) >= 70
                        ? 'Good'
                        : 'Needs Improvement'
                  }
                  color={getScoreColor(parseFloat(metricsData.overallScore))}
                />
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={parseFloat(metricsData.overallScore)}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_e, newValue) => setTabValue(newValue)}>
            <Tab icon={<SearchIcon />} iconPosition="start" label="Natural Language Query" />
            <Tab icon={<FileSearchIcon />} iconPosition="start" label="Run Audit" />
            <Tab icon={<TrendingUpIcon />} iconPosition="start" label="Quality Dashboard" />
            <Tab icon={<UsersIcon />} iconPosition="start" label="AI Insights" />
          </Tabs>
        </Box>

        {/* Natural Language Query Tab */}
        <TabPanel value={tabValue} index={0}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon />
                Ask Questions About Your Data
              </Typography>
              <Box sx={{ mt: 3, mb: 2 }}>
                <TextField
                  label="Your Question"
                  placeholder="e.g., Show me all STEMI patients with door-out time greater than 180 minutes..."
                  fullWidth
                  multiline
                  rows={4}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </Box>
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={isProcessing ? <CircularProgress size={20} /> : <PlayIcon />}
                  onClick={handleNaturalLanguageQuery}
                  disabled={!query.trim() || isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Run Query'}
                </Button>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Example Queries
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {exampleQueries.map((example, index) => (
                    <Button
                      key={index}
                      variant="outlined"
                      size="small"
                      onClick={() => setQuery(example)}
                    >
                      {example}
                    </Button>
                  ))}
                </Box>
              </Box>

              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Natural Language Query Temporarily Unavailable
                </Typography>
                <Typography variant="body2">
                  The AI-powered query feature requires an OpenAI API key with sufficient quota. Please
                  use the Quality Dashboard tab to view current metrics or contact your administrator to
                  enable AI features.
                </Typography>
              </Alert>
            </CardContent>
          </Card>

          {/* Query Results */}
          {queryResults && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Query Results</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={queryResults.queryType} variant="outlined" />
                    <Chip label={`${queryResults.executionTime}ms`} color="secondary" />
                  </Box>
                </Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  {queryResults.explanation}
                </Alert>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Found {queryResults.totalRecords} records
                </Typography>
                {queryResults.results.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {Object.keys(queryResults.results[0]).map((key) => (
                            <TableCell key={key}>{key}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {queryResults.results.slice(0, 10).map((row, index) => (
                          <TableRow key={index}>
                            {Object.values(row).map((value: any, cellIndex) => (
                              <TableCell key={cellIndex}>{value !== null ? String(value) : 'N/A'}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {queryResults.results.length > 10 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Showing first 10 of {queryResults.totalRecords} results
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </TabPanel>

        {/* Run Audit Tab */}
        <TabPanel value={tabValue} index={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileSearchIcon />
                Comprehensive Data Audit
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', mt: 3 }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Data Source</InputLabel>
                  <Select
                    value={selectedRecordType}
                    onChange={(e) => setSelectedRecordType(e.target.value)}
                    label="Data Source"
                  >
                    <MenuItem value="stemi_patients">STEMI Patients</MenuItem>
                    <MenuItem value="stroke_patients">Stroke Patients</MenuItem>
                    <MenuItem value="trauma_patients">Trauma Patients</MenuItem>
                    <MenuItem value="tickets">Transfer Tickets</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  startIcon={<PlayIcon />}
                  onClick={handleRunAudit}
                >
                  Run Audit
                </Button>
              </Box>

              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  AI-Powered Audit Temporarily Unavailable
                </Typography>
                <Typography variant="body2">
                  Advanced audit features require OpenAI API access. Please use the Quality Dashboard tab
                  to view current metrics and trends.
                </Typography>
              </Alert>
            </CardContent>
          </Card>

          {/* Audit Results */}
          {auditResults && (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Audit Summary
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, bgcolor: 'primary.light', textAlign: 'center' }}>
                          <Typography variant="h4" color="primary.dark">
                            {auditResults.totalRecords}
                          </Typography>
                          <Typography variant="body2" color="primary.dark">
                            Total Records
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, bgcolor: 'success.light', textAlign: 'center' }}>
                          <Typography variant="h4" color="success.dark">
                            {auditResults.validRecords}
                          </Typography>
                          <Typography variant="body2" color="success.dark">
                            Valid Records
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                      <Typography
                        variant="h4"
                        color={getScoreColor(parseFloat(auditResults.overallScore))}
                      >
                        {auditResults.overallScore}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Overall Quality Score
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Issue Categorization
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <XCircleIcon color="error" />
                          <Typography variant="body2">Critical Issues</Typography>
                        </Box>
                        <Chip label={auditResults.categorizedIssues.critical.length} color="error" />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AlertTriangleIcon color="warning" />
                          <Typography variant="body2">High Priority</Typography>
                        </Box>
                        <Chip label={auditResults.categorizedIssues.high.length} color="warning" />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ClockIcon color="info" />
                          <Typography variant="body2">Medium Priority</Typography>
                        </Box>
                        <Chip label={auditResults.categorizedIssues.medium.length} />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircleIcon color="success" />
                          <Typography variant="body2">Low Priority</Typography>
                        </Box>
                        <Chip label={auditResults.categorizedIssues.low.length} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Quality Dashboard Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Quality Metrics Dashboard</Typography>
                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel>Data Source</InputLabel>
                      <Select
                        value={selectedDataSource}
                        onChange={(e) => setSelectedDataSource(e.target.value)}
                        label="Data Source"
                      >
                        <MenuItem value="all">All Data Sources</MenuItem>
                        <MenuItem value="stemi_patients">STEMI Patients</MenuItem>
                        <MenuItem value="stroke_patients">Stroke Patients</MenuItem>
                        <MenuItem value="trauma_patients">Trauma Patients</MenuItem>
                        <MenuItem value="tickets">Transfer Tickets</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  {metricsData && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Displaying metrics for {metricsData.metrics?.length || 0} data sources • Total records:{' '}
                      {metricsData.summary?.totalRecords || 0}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {metricsData && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Current Data Quality Metrics
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {metricsData.metrics?.map((metric: QualityMetric) => (
                        <Grid item xs={12} sm={6} md={3} key={metric.id}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                              {metric.dataSource.replace('_', ' ')}
                            </Typography>
                            <Typography variant="h5" color="primary" sx={{ mt: 1 }}>
                              {metric.overallScore}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {metric.validRecords}/{metric.totalRecords} valid
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    MoC Data Quality Pillars
                  </Typography>
                  {pillarScores.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={pillarScores}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="pillar" angle={-45} textAnchor="end" height={100} />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="score" fill="#0088FE" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Record Validity Distribution
                  </Typography>
                  {pieData.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {pillarScores.length > 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Quality Profile Analysis
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <RadarChart data={pillarScores}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="pillar" />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar
                          name="Quality Score"
                          dataKey="score"
                          stroke="#0088FE"
                          fill="#0088FE"
                          fillOpacity={0.3}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* AI Insights Tab */}
        <TabPanel value={tabValue} index={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <UsersIcon />
                AI-Powered Insights
              </Typography>
              {auditResults?.insights ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {auditResults.insights}
                  </Typography>
                </Box>
              ) : (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    AI Insights Temporarily Unavailable
                  </Typography>
                  <Typography variant="body2">
                    AI-powered insights require OpenAI API access. However, you can still view comprehensive
                    data quality metrics in the Dashboard tab, including:
                  </Typography>
                  <Box component="ul" sx={{ mt: 1, pl: 3 }}>
                    <li>Real-time quality scores for all data sources</li>
                    <li>Six-pillar MoC compliance analysis</li>
                    <li>Record validity distributions</li>
                    <li>Quality trend analysis</li>
                  </Box>
                </Alert>
              )}
            </CardContent>
          </Card>

          {auditResults?.categorizedIssues && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Issue Analysis Summary
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Summary
                  </Typography>
                  <Typography variant="body2">{auditResults.categorizedIssues.summary}</Typography>
                </Alert>
                {auditResults.categorizedIssues.critical.length > 0 && (
                  <Alert severity="error">
                    <Typography variant="subtitle2" gutterBottom>
                      Critical Issues ({auditResults.categorizedIssues.critical.length})
                    </Typography>
                    <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                      {auditResults.categorizedIssues.critical.slice(0, 5).map((issue: any, index: number) => (
                        <li key={index}>
                          <Typography variant="body2">
                            Record {issue.recordId}:{' '}
                            {Array.isArray(issue.issues) ? issue.issues.join(', ') : issue.issues}
                          </Typography>
                        </li>
                      ))}
                    </Box>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </TabPanel>
      </Card>
    </Box>
  );
}
