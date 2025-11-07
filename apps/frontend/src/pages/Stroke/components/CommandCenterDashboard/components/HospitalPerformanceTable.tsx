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
  Person, 
  CheckCircle, 
  Warning,
  Cancel,
  AccessTime,
  Psychology,
  MedicalServices,
  Assessment
} from "@mui/icons-material";

export type HospitalPerformanceData = {
  hospitalName: string;
  status: 'ACTIVE' | 'INACTIVE';
  cases: number;
  physicianMin: number;
  ctMin: number;
  ctReportMin: number;
  orderMin: number;
  needleMin: number;
  mtMin: number;
  physicianPct: number;
  ctPct: number;
  ctReportPct: number;
  needlePct: number;
  mtPct: number;
  swallowingPct: number;
  strokeUnitPct: number;
  followUpPct: number;
};

type SortColumn = 
  | 'hospitalName' 
  | 'cases'
  | 'physicianPct' 
  | 'ctPct' 
  | 'ctReportPct' 
  | 'needlePct'
  | 'mtPct'
  | 'swallowingPct'
  | 'strokeUnitPct'
  | 'followUpPct';

type SortDirection = 'asc' | 'desc';

export interface HospitalPerformanceTableProps {
  data?: HospitalPerformanceData[];
  loading?: boolean;
  error?: string;
  language?: 'en' | 'ar';
}

const HospitalPerformanceTable: React.FC<HospitalPerformanceTableProps> = ({
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
    if (percentage >= 60) return '#ff9800'; // Yellow
    return '#f44336'; // Red
  };

  const getComplianceIcon = (percentage: number) => {
    if (percentage === 0) return null; // No icon for 0%
    if (percentage >= 80) return <CheckCircle sx={{ fontSize: 16, color: 'white' }} />;
    if (percentage >= 60) return <Warning sx={{ fontSize: 16, color: 'white' }} />;
    return <Cancel sx={{ fontSize: 16, color: 'white' }} />;
  };

  const getComplianceStatus = (percentage: number): string => {
    if (percentage === 0) return language === 'ar' ? 'لا توجد بيانات' : 'No Data';
    if (percentage >= 80) return language === 'ar' ? 'ممتاز' : 'Excellent';
    if (percentage >= 60) return language === 'ar' ? 'مقبول' : 'Acceptable';
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
      key: 'physicianPct', 
      label: language === 'ar' ? 'الباب إلى الطبيب' : 'Door-to-Physician', 
      target: '≤15min', 
      icon: <Person sx={{ fontSize: 16 }} />
    },
    { 
      key: 'ctPct', 
      label: language === 'ar' ? 'الباب إلى الأشعة' : 'Door-to-CT', 
      target: '≤25min', 
      icon: <Assessment sx={{ fontSize: 16 }} />
    },
    { 
      key: 'ctReportPct', 
      label: language === 'ar' ? 'الباب إلى التقرير' : 'Door-to-CT-Report', 
      target: '≤45min', 
      icon: <Assessment sx={{ fontSize: 16 }} />
    },
    { 
      key: 'needlePct', 
      label: language === 'ar' ? 'الباب إلى الإبرة' : 'Door-to-Needle', 
      target: '≤60min', 
      icon: <MedicalServices sx={{ fontSize: 16 }} />
    },
    { 
      key: 'mtPct', 
      label: language === 'ar' ? 'الباب إلى الخثرة' : 'Door-to-Thrombectomy', 
      target: '≤120min', 
      icon: <MedicalServices sx={{ fontSize: 16 }} />
    },
    { 
      key: 'swallowingPct', 
      label: language === 'ar' ? 'فحص البلع' : 'Swallowing Screening', 
      target: '≥85%', 
      icon: <Psychology sx={{ fontSize: 16 }} />
    },
    { 
      key: 'strokeUnitPct', 
      label: language === 'ar' ? 'قسم السكتة' : 'Stroke Unit Admission', 
      target: '≥80%', 
      icon: <LocalHospital sx={{ fontSize: 16 }} />
    },
    { 
      key: 'followUpPct', 
      label: language === 'ar' ? 'المتابعة' : 'Follow-Up', 
      target: '≥80%', 
      icon: <AccessTime sx={{ fontSize: 16 }} />
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
          <LocalHospital sx={{ mr: 1, color: '#2196f3' }} />
          <Typography variant="h6" sx={{ color: '#ffffff' }}>
            {language === 'ar' ? 'مصفوفة أداء المستشفيات للسكتة الدماغية' : 'Hospital-Wise Stroke Performance Matrix'}
          </Typography>
        </Box>
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress sx={{ color: '#2196f3' }} />
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
          <LocalHospital sx={{ mr: 1, color: '#2196f3' }} />
          <Typography variant="h6" sx={{ color: '#ffffff' }}>
            {language === 'ar' ? 'مصفوفة أداء المستشفيات للسكتة الدماغية' : 'Hospital-Wise Stroke Performance Matrix'}
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
      border: '1px solid #333333',
      color: '#ffffff'
    }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <LocalHospital sx={{ mr: 1, color: '#2196f3' }} />
          <Typography variant="h6" sx={{ color: '#ffffff' }}>
            {language === 'ar' ? 'مصفوفة أداء المستشفيات للسكتة الدماغية' : 'Hospital-Wise Stroke Performance Matrix'}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#666' }}>
          {language === 'ar' ? `إجمالي المستشفيات: ${data.length}` : `Total Hospitals: ${data.length}`}
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
                  onClick={() => handleSort('cases')}
                  sx={{ color: '#ffffff', '&:hover': { backgroundColor: '#333333' } }}
                >
                  {language === 'ar' ? 'الحالات' : 'Cases'}
                  {getSortIcon('cases')}
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
            {sortedHospitals.map((hospital, index) => (
              <TableRow 
                key={index}
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
                    {hospital.cases}
                  </Typography>
                </TableCell>
                {columns.map((column) => {
                  const value = hospital[column.key as keyof typeof hospital] as number;
                  
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
                            <Typography variant="body2">
                              {language === 'ar' ? 'الأداء:' : 'Performance:'} {value === 0 ? '—' : `${value}%`}
                            </Typography>
                            <Typography variant="body2">
                              {language === 'ar' ? 'الحالة:' : 'Status:'} {getComplianceStatus(value)}
                            </Typography>
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
            60-79% - {language === 'ar' ? 'مقبول' : 'Acceptable'}
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
            &lt;60% - {language === 'ar' ? 'يحتاج تحسين' : 'Needs Improvement'}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: '#666666',
              borderRadius: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="body2" sx={{ color: 'white', fontSize: '0.8rem' }}>
              —
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#ffffff' }}>
            {language === 'ar' ? 'لا توجد بيانات' : 'No Data'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default HospitalPerformanceTable;
