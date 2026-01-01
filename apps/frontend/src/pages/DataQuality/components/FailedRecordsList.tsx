import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  TablePagination,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { FailedRecord } from '../../../types/dataQuality';
import { RecordType } from '../../../types/dataQuality';

interface FailedRecordsListProps {
  records: FailedRecord[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  loading?: boolean;
}

const FailedRecordsList: React.FC<FailedRecordsListProps> = ({
  records,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading = false,
}) => {
  const navigate = useNavigate();

  const handleChangePage = (_event: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onPageSizeChange(parseInt(event.target.value, 10));
    onPageChange(0);
  };

  const handleRecordClick = (record: FailedRecord) => {
    switch (record.recordType) {
      case RecordType.TICKET:
        navigate(`/tickets/${record.recordId}`);
        break;
      case RecordType.STEMI:
        navigate('/portals/stemi');
        break;
      case RecordType.STROKE:
        navigate('/portals/stroke');
        break;
      case RecordType.TRAUMA:
        navigate('/portals/trauma');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading failed records...</Typography>
      </Box>
    );
  }

  if (records.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No failed records found</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Record ID</TableCell>
              <TableCell>Patient ID</TableCell>
              <TableCell>Record Type</TableCell>
              <TableCell>Hospital</TableCell>
              <TableCell>Failure Reasons</TableCell>
              <TableCell>Created At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => (
              <TableRow
                key={record.recordId}
                hover
                onClick={() => handleRecordClick(record)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <TableCell>{record.recordId}</TableCell>
                <TableCell>{record.patientId || 'N/A'}</TableCell>
                <TableCell>
                  <Chip label={record.recordType} size="small" />
                </TableCell>
                <TableCell>{record.hospitalName || record.hospitalId || 'N/A'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {record.failureReasons.map((reason, index) => (
                      <Chip key={index} label={reason} size="small" color="error" variant="outlined" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={pageSize}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </Box>
  );
};

export default FailedRecordsList;


