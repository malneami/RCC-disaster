import { useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { Hotel as HotelIcon } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { StrokeCase } from '../../../../services/strokeService';
import { bedService } from '../../../../pages/Beds/services/bedService';

interface BedAssignmentCardProps {
  strokeCase: StrokeCase;
}

export interface BedAssignmentCardRef {
  refetchBedHistory: () => void;
}

const BedAssignmentCard = forwardRef<BedAssignmentCardRef, BedAssignmentCardProps>(({
  strokeCase,
}, ref) => {
  const assignedBed = strokeCase.assignedBed || null;

  const { data: bedHistory, refetch: refetchBedHistory } = useQuery(
    ['bedHistory', assignedBed?.id, strokeCase?.id],
    () => assignedBed ? bedService.getBedStatusHistory(assignedBed.id) : Promise.resolve([]),
    {
      enabled: !!assignedBed?.id,
      staleTime: 0,
      cacheTime: 0,
    }
  );

  // Expose refetch function to parent component
  useImperativeHandle(ref, () => ({
    refetchBedHistory: () => {
      if (assignedBed?.id) {
        refetchBedHistory();
      }
    },
  }));

  // Refetch bed history when case or bed assignment changes
  useEffect(() => {
    if (assignedBed?.id) {
      refetchBedHistory();
    }
  }, [strokeCase?.id, assignedBed?.id, refetchBedHistory]);

  const bedAssignmentHistory = bedHistory?.find(
    (entry) => entry.caseId === strokeCase?.id && entry.caseType === 'STROKE'
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
          <HotelIcon color="primary" />
          Bed Assignment
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {assignedBed ? (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell><strong>Bed Number</strong></TableCell>
                  <TableCell>{assignedBed.bedNumber}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Unit</strong></TableCell>
                  <TableCell>{assignedBed.unit?.name || 'N/A'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Hospital</strong></TableCell>
                  <TableCell>{assignedBed.hospital?.name || 'N/A'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Bed ID</strong></TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {assignedBed.id}
                    </Typography>
                  </TableCell>
                </TableRow>
                {bedAssignmentHistory?.changedAt && (
                  <TableRow>
                    <TableCell><strong>Arrival Date/Time</strong></TableCell>
                    <TableCell>
                      {new Date(bedAssignmentHistory.changedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell>
                    <Chip
                      label={assignedBed.status}
                      color={assignedBed.status === 'OCCUPIED' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No bed assigned to this stroke case
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

BedAssignmentCard.displayName = 'BedAssignmentCard';

export default BedAssignmentCard;

