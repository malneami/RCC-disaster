import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useSnackbar } from 'notistack';
import {
  Download,
  Visibility,
  Add,
  PictureAsPdf,
  TableChart,
} from '@mui/icons-material';
import { mcpAuditService, ReportFilters, AuditReport, getDimensionLabel } from '../../services/mcpAuditService';
import { format } from 'date-fns';

const AuditReportsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AuditReport | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Generate audit form
  const [generateForm, setGenerateForm] = useState({
    dimensions: ['COMPLETENESS', 'ACCURACY', 'CONSISTENCY', 'TIMELINESS', 'COMPLIANCE', 'INTEGRITY'],
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    submitToMcp: true,
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await mcpAuditService.listReports({
        ...filters,
        page: page + 1,
        pageSize,
      });
      setReports(data.reports);
      setTotal(data.total);
    } catch (error: any) {
      console.error('Failed to fetch reports:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to load reports', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, pageSize, filters]);

  const handleViewReport = async (id: string) => {
    try {
      const report = await mcpAuditService.getReport(id);
      setSelectedReport(report);
      setViewModalOpen(true);
    } catch (error: any) {
      enqueueSnackbar('Failed to load report details', { variant: 'error' });
    }
  };

  const handleDownload = async (id: string, format: 'pdf' | 'excel', reportNumber: string) => {
    try {
      setDownloading(id);
      const blob = await mcpAuditService.downloadReport(id, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-report-${reportNumber}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      link.click();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Report downloaded successfully', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar('Failed to download report', { variant: 'error' });
    } finally {
      setDownloading(null);
    }
  };

  const handleGenerateAudit = async () => {
    try {
      setLoading(true);
      const result = await mcpAuditService.triggerAudit(generateForm);
      enqueueSnackbar(
        `Audit completed! Overall score: ${result.overallScore}%`,
        { variant: 'success' }
      );
      setGenerateModalOpen(false);
      fetchReports();
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to generate audit', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4CAF50';
    if (score >= 75) return '#FF9800';
    return '#F44336';
  };

  return (
    <>
      <Helmet>
        <title>Audit Reports - RCC</title>
      </Helmet>

      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight={600}>
            Audit Reports
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setGenerateModalOpen(true)}
          >
            Generate New Audit
          </Button>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Start Date"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 180 }}
              />
              <TextField
                label="End Date"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 180 }}
              />
              <TextField
                label="Report Type"
                select
                value={filters.reportType || 'ALL'}
                onChange={(e) => setFilters({ ...filters, reportType: e.target.value === 'ALL' ? undefined : e.target.value })}
                size="small"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="ALL">All Types</MenuItem>
                <MenuItem value="DAILY">Daily</MenuItem>
                <MenuItem value="WEEKLY">Weekly</MenuItem>
                <MenuItem value="ON_DEMAND">On-Demand</MenuItem>
              </TextField>
            </Box>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report Number</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Date Range</TableCell>
                  <TableCell>Overall Score</TableCell>
                  <TableCell>Generated By</TableCell>
                  <TableCell>Generated At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No reports found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {report.reportNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={report.reportType} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(report.startDate), 'MMM dd, yyyy')} -{' '}
                          {format(new Date(report.endDate), 'MMM dd, yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${report.overallScore.toFixed(1)}%`}
                          size="small"
                          sx={{
                            bgcolor: getScoreColor(report.overallScore) + '20',
                            color: getScoreColor(report.overallScore),
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {report.generatedBy.firstName} {report.generatedBy.lastName}
                      </TableCell>
                      <TableCell>
                        {format(new Date(report.generatedAt), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleViewReport(report.id)}
                          title="View Details"
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(report.id, 'pdf', report.reportNumber)}
                          disabled={downloading === report.id}
                          title="Download PDF"
                        >
                          <PictureAsPdf fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(report.id, 'excel', report.reportNumber)}
                          disabled={downloading === report.id}
                          title="Download Excel"
                        >
                          <TableChart fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50, 100]}
          />
        </Card>
      </Box>

      {/* View Report Modal */}
      <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Report Details</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Report Number
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedReport.reportNumber}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                Overall Score
              </Typography>
              <Chip
                label={`${selectedReport.overallScore.toFixed(1)}%`}
                sx={{
                  bgcolor: getScoreColor(selectedReport.overallScore) + '20',
                  color: getScoreColor(selectedReport.overallScore),
                  fontWeight: 600,
                  mt: 0.5,
                }}
              />

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                Dimension Scores
              </Typography>
              <Box sx={{ mt: 1 }}>
                {Object.entries(selectedReport.dimensionScores).map(([dim, score]) => (
                  <Box key={dim} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{getDimensionLabel(dim)}</Typography>
                    <Chip
                      label={`${(score as number).toFixed(1)}%`}
                      size="small"
                      sx={{
                        bgcolor: getScoreColor(score as number) + '20',
                        color: getScoreColor(score as number),
                      }}
                    />
                  </Box>
                ))}
              </Box>

              {selectedReport.mcpReportUrl && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                    MCP Analysis
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    href={selectedReport.mcpReportUrl}
                    target="_blank"
                    sx={{ mt: 0.5 }}
                  >
                    View MCP Report
                  </Button>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Generate Audit Modal */}
      <Dialog open={generateModalOpen} onClose={() => setGenerateModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate New Audit</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Dimensions</InputLabel>
              <Select
                multiple
                value={generateForm.dimensions}
                onChange={(e) => setGenerateForm({ ...generateForm, dimensions: e.target.value as string[] })}
                input={<OutlinedInput label="Dimensions" />}
                renderValue={(selected) => selected.map(getDimensionLabel).join(', ')}
              >
                {['COMPLETENESS', 'ACCURACY', 'CONSISTENCY', 'TIMELINESS', 'COMPLIANCE', 'INTEGRITY'].map((dim) => (
                  <MenuItem key={dim} value={dim}>
                    <Checkbox checked={generateForm.dimensions.indexOf(dim) > -1} />
                    <ListItemText primary={getDimensionLabel(dim)} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={generateForm.startDate}
              onChange={(e) => setGenerateForm({ ...generateForm, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={generateForm.endDate}
              onChange={(e) => setGenerateForm({ ...generateForm, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  checked={generateForm.submitToMcp}
                  onChange={(e) => setGenerateForm({ ...generateForm, submitToMcp: e.target.checked })}
                />
                <Typography variant="body2">Submit to MCP Server for Analysis</Typography>
              </Box>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleGenerateAudit}
            disabled={loading || generateForm.dimensions.length === 0}
          >
            Generate Audit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AuditReportsPage;
