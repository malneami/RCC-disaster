import React, { useState } from "react";
import { 
  Box, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from "@mui/material";
import { 
  ArrowDropDown, 
  KeyboardArrowUp, 
  KeyboardArrowDown, 
  LocalHospital, 
  GpsFixed, 
  CheckCircle, 
  Warning,
  Cancel,
  FlashOn,
  AccessTime,
  Storage,
  BarChart
} from "@mui/icons-material";

type HospitalPerformanceData = {
  hospitalId: string;
  hospitalName: string;
  totalCases: number;
  doorToEcgCompliance: number;
  doorToEcgValid: number;
  doorToEcgCompliant: number;
  doorToNeedleCompliance: number;
  doorToNeedleValid: number;
  doorToNeedleCompliant: number;
  doorToBalloonCompliance: number;
  doorToBalloonValid: number;
  doorToBalloonCompliant: number;
  activationDoorOutCompliance: number;
  activationDoorOutValid: number;
  activationDoorOutCompliant: number;
  doorInDoorOutCompliance: number;
  doorInDoorOutValid: number;
  doorInDoorOutCompliant: number;
  dataQualityScore: number;
  dataCompletenessScore: number;
};

type SortColumn = 
  | 'hospitalName' 
  | 'totalCases'
  | 'doorToEcgCompliance' 
  | 'doorToNeedleCompliance' 
  | 'doorToBalloonCompliance'
  | 'activationDoorOutCompliance'
  | 'doorInDoorOutCompliance'
  | 'dataQualityScore'
  | 'dataCompletenessScore';

type SortDirection = 'asc' | 'desc';

interface HospitalPerformanceHeatmapProps {
  data?: HospitalPerformanceData[];
  loading?: boolean;
  error?: string;
  language?: 'en' | 'ar';
}

const HospitalPerformanceHeatmap: React.FC<HospitalPerformanceHeatmapProps> = ({
  data = [],
  loading = false,
  error,
  language = 'en'
}) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>('hospitalName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc'); // Default to desc for performance metrics
    }
  };

  const getComplianceColor = (percentage: number): string => {
    if (percentage === 0) return '#666666'; // Gray for 0%
    if (percentage >= 80) return '#4caf50'; // Green
    if (percentage >= 65) return '#ff9800'; // Yellow
    return '#f44336'; // Red
  };

  const getComplianceIcon = (percentage: number) => {
    if (percentage === 0) return null; // No icon for 0%
    if (percentage >= 80) return <CheckCircle sx={{ fontSize: 16, color: 'white' }} />;
    if (percentage >= 65) return <Warning sx={{ fontSize: 16, color: 'white' }} />;
    return <Cancel sx={{ fontSize: 16, color: 'white' }} />;
  };

  const getComplianceStatus = (percentage: number): string => {
    if (percentage === 0) return language === 'ar' ? 'لا توجد بيانات' : 'No Data';
    if (percentage >= 80) return language === 'ar' ? 'ممتاز' : 'Excellent';
    if (percentage >= 65) return language === 'ar' ? 'مقبول' : 'Acceptable';
    return language === 'ar' ? 'يحتاج تحسين' : 'Needs Improvement';
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowDropDown sx={{ fontSize: 16, color: '#666' }} />;
    return sortDirection === 'asc' ? 
      <KeyboardArrowUp sx={{ fontSize: 16, color: '#2196f3' }} /> : 
      <KeyboardArrowDown sx={{ fontSize: 16, color: '#2196f3' }} />;
  };

  const sortData = (data: HospitalPerformanceData[]) => {
    return [...data].sort((a, b) => {
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];
      
      // Handle string sorting for hospital names
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? 
          aValue.localeCompare(bValue) : 
          bValue.localeCompare(aValue);
      }
      
      // Handle numeric sorting
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  };

  const columns = [
    { 
      key: 'doorToEcgCompliance', 
      label: language === 'ar' ? 'الباب إلى رسم القلب' : 'Door-to-ECG', 
      target: '≤10min', 
      icon: <FlashOn sx={{ fontSize: 16 }} />
    },
    { 
      key: 'doorToNeedleCompliance', 
      label: language === 'ar' ? 'الباب إلى الإبرة' : 'Door-to-Needle', 
      target: '≤30min', 
      icon: <FlashOn sx={{ fontSize: 16 }} />
    },
    { 
      key: 'doorToBalloonCompliance', 
      label: language === 'ar' ? 'الباب إلى البالون' : 'Door-to-Balloon', 
      target: '≤120min', 
      icon: <GpsFixed sx={{ fontSize: 16 }} />
    },
    { 
      key: 'activationDoorOutCompliance', 
      label: language === 'ar' ? 'التفعيل إلى خروج الباب' : 'Activation-to-Door-Out', 
      target: '≤15min', 
      icon: <AccessTime sx={{ fontSize: 16 }} />
    },
    { 
      key: 'doorInDoorOutCompliance', 
      label: language === 'ar' ? 'دخول الباب إلى خروج الباب' : 'Door-In-Door-Out', 
      target: '≤30min', 
      icon: <AccessTime sx={{ fontSize: 16 }} />
    },
    { 
      key: 'dataQualityScore', 
      label: language === 'ar' ? 'جودة البيانات' : 'Data Quality', 
      target: 'Score', 
      icon: <Storage sx={{ fontSize: 16 }} />
    },
    { 
      key: 'dataCompletenessScore', 
      label: language === 'ar' ? 'اكتمال البيانات' : 'Data Completeness', 
      target: 'Score', 
      icon: <BarChart sx={{ fontSize: 16 }} />
    }
  ];

  if (loading) {
    return (
      <Paper sx={{ 
        p: 3, 
        backgroundColor: '#1a1a1a', 
        border: '1px solid #333333',
        color: '#ffffff'
      }}>
        <Box display="flex" alignItems="center" mb={2}>
          <LocalHospital sx={{ mr: 1, color: '#9c27b0' }} />
          <Typography variant="h6" sx={{ color: '#ffffff' }}>
            {language === 'ar' ? 'مصفوفة أداء المستشفيات STEMI' : 'Hospital-Wise STEMI Performance Matrix'}
          </Typography>
        </Box>
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress sx={{ color: '#9c27b0' }} />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ 
        p: 3, 
        backgroundColor: '#1a1a1a', 
        border: '1px solid #333333',
        color: '#ffffff'
      }}>
        <Box display="flex" alignItems="center" mb={2}>
          <LocalHospital sx={{ mr: 1, color: '#9c27b0' }} />
          <Typography variant="h6" sx={{ color: '#ffffff' }}>
            {language === 'ar' ? 'مصفوفة أداء المستشفيات STEMI' : 'Hospital-Wise STEMI Performance Matrix'}
          </Typography>
        </Box>
        <Alert severity="error" sx={{ backgroundColor: '#2d1b1b', color: '#ffffff' }}>
          {error}
        </Alert>
      </Paper>
    );
  }

  const sortedHospitals = sortData(data);

  return (
    <Paper sx={{ 
      p: 3, 
      backgroundColor: '#1a1a1a', 
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      color: '#ffffff'
    }}>
      {/* Compact sub-header with hospital count */}
      <Box display="flex" alignItems="center" justifyContent="flex-end" mb={2}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          {language === 'ar' ? `${data.length} مستشفى` : `${data.length} hospitals`}
        </Typography>
      </Box>

      <TableContainer sx={{ backgroundColor: '#1a1a1a' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#2a2a2a' }}>
              <TableCell sx={{ 
                backgroundColor: '#2a2a2a', 
                color: '#ffffff',
                borderBottom: '1px solid #444444'
              }}>
                <IconButton
                  onClick={() => handleSort('hospitalName')}
                  sx={{ color: '#ffffff', '&:hover': { backgroundColor: '#333333' } }}
                >
                  {language === 'ar' ? 'المستشفى' : 'Hospital'}
                  {getSortIcon('hospitalName')}
                </IconButton>
              </TableCell>
              <TableCell sx={{ 
                backgroundColor: '#2a2a2a', 
                color: '#ffffff',
                borderBottom: '1px solid #444444',
                textAlign: 'center'
              }}>
                <IconButton
                  onClick={() => handleSort('totalCases')}
                  sx={{ color: '#ffffff', '&:hover': { backgroundColor: '#333333' } }}
                >
                  {language === 'ar' ? 'الحالات' : 'Cases'}
                  {getSortIcon('totalCases')}
                </IconButton>
              </TableCell>
              {columns.map((column) => (
                <TableCell key={column.key} sx={{ 
                  backgroundColor: '#2a2a2a', 
                  color: '#ffffff',
                  borderBottom: '1px solid #444444',
                  textAlign: 'center'
                }}>
                  <IconButton
                    onClick={() => handleSort(column.key as SortColumn)}
                    sx={{ color: '#ffffff', '&:hover': { backgroundColor: '#333333' } }}
                  >
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <Box display="flex" alignItems="center" mb={0.5}>
                        {column.icon}
                        <Typography variant="caption" sx={{ ml: 0.5, fontSize: '0.7rem' }}>
                          {column.label}
                        </Typography>
                        {getSortIcon(column.key as SortColumn)}
                      </Box>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#666' }}>
                        {column.target}
                      </Typography>
                    </Box>
                  </IconButton>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedHospitals.map((hospital) => (
              <TableRow 
                key={hospital.hospitalId}
                sx={{ 
                  '&:hover': { backgroundColor: '#2a2a2a' },
                  borderBottom: '1px solid #333333'
                }}
              >
                <TableCell sx={{ color: '#ffffff', borderBottom: '1px solid #333333' }}>
                  <Box display="flex" alignItems="center">
                    <LocalHospital sx={{ mr: 1, fontSize: 16, color: '#666' }} />
                    <Typography variant="body2" sx={{ color: '#ffffff' }}>
                      {hospital.hospitalName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ 
                  color: '#ffffff', 
                  borderBottom: '1px solid #333333',
                  textAlign: 'center'
                }}>
                  <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 'medium' }}>
                    {hospital.totalCases}
                  </Typography>
                </TableCell>
                {columns.map((column) => {
                  const value = hospital[column.key as keyof typeof hospital] as number;
                  const isComplianceColumn = column.key.includes('Compliance');
                  const isQualityColumn = column.key === 'dataQualityScore' || column.key === 'dataCompletenessScore';
                  
                  let validCount = 0;
                  let compliantCount = 0;
                  
                  if (isComplianceColumn) {
                    const validField = `${column.key.replace('Compliance', 'Valid')}` as keyof typeof hospital;
                    const compliantField = `${column.key.replace('Compliance', 'Compliant')}` as keyof typeof hospital;
                    validCount = hospital[validField] as number || 0;
                    compliantCount = hospital[compliantField] as number || 0;
                  } else if (isQualityColumn) {
                    // For quality/completeness columns, use total cases
                    validCount = hospital.totalCases || 0;
                    compliantCount = validCount; // These are scores, not compliance counts
                  }
                  
                  return (
                    <TableCell key={column.key} sx={{ 
                      borderBottom: '1px solid #333333',
                      textAlign: 'center',
                      padding: 1
                    }}>
                      <Tooltip
                        title={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              {hospital.hospitalName} - {column.label}
                            </Typography>
                            {isQualityColumn ? (
                              <>
                                <Typography variant="body2">
                                  {language === 'ar' ? 'النتيجة:' : 'Score:'} {value}%
                                </Typography>
                                <Typography variant="body2">
                                  {language === 'ar' ? 'إجمالي الحالات:' : 'Total Cases:'} {validCount}
                                </Typography>
                              </>
                            ) : (
                              <>
                                <Typography variant="body2">
                                  {language === 'ar' ? 'الامتثال:' : 'Compliance:'} {compliantCount}/{validCount} {language === 'ar' ? 'حالة' : 'cases'} {value === 0 ? '(—)' : `(${value}%)`}
                                </Typography>
                                <Typography variant="body2">
                                  {language === 'ar' ? 'الحالة:' : 'Status:'} {getComplianceStatus(value)}
                                </Typography>
                              </>
                            )}
                            <Typography variant="caption" sx={{ color: '#999' }}>
                              {language === 'ar' ? 'الهدف:' : 'Target:'} {column.target}
                            </Typography>
                          </Box>
                        }
                        arrow
                      >
                        <Box
                          sx={{
                            backgroundColor: getComplianceColor(value),
                            borderRadius: 1,
                            p: 1,
                            minWidth: 60,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': {
                              transform: 'scale(1.05)'
                            }
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={0.5}>
                            {getComplianceIcon(value)}
                            <Typography variant="body2" sx={{ 
                              color: 'white', 
                              fontWeight: 'bold',
                              fontSize: '0.8rem'
                            }}>
                              {value === 0 ? '—' : `${value}%`}
                            </Typography>
                          </Box>
                        </Box>
                      </Tooltip>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Legend */}
      <Box mt={3} display="flex" flexWrap="wrap" gap={2} justifyContent="center">
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: '#4caf50',
              borderRadius: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CheckCircle sx={{ fontSize: 12, color: 'white' }} />
          </Box>
          <Typography variant="caption" sx={{ color: '#ffffff' }}>
            ≥80% - {language === 'ar' ? 'ممتاز' : 'Excellent'}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: '#ff9800',
              borderRadius: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Warning sx={{ fontSize: 12, color: 'white' }} />
          </Box>
          <Typography variant="caption" sx={{ color: '#ffffff' }}>
            65-79% - {language === 'ar' ? 'مقبول' : 'Acceptable'}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: '#f44336',
              borderRadius: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Cancel sx={{ fontSize: 12, color: 'white' }} />
          </Box>
          <Typography variant="caption" sx={{ color: '#ffffff' }}>
            &lt;65% - {language === 'ar' ? 'يحتاج تحسين' : 'Needs Improvement'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default HospitalPerformanceHeatmap;
