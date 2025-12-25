import React from 'react';
import {
  TableHead,
  TableRow,
  TableCell,
  Typography,
} from '@mui/material';

const BedsTableHeader: React.FC = () => {
  return (
    <TableHead>
      <TableRow>
        <TableCell>
          <Typography variant="subtitle2" fontWeight="bold">
            Bed Number
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="subtitle2" fontWeight="bold">
            Status
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="subtitle2" fontWeight="bold">
            Unit
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="subtitle2" fontWeight="bold">
            Hospital
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="subtitle2" fontWeight="bold">
            Patient
          </Typography>
        </TableCell>
        <TableCell align="center">
          <Typography variant="subtitle2" fontWeight="bold">
            Operational
          </Typography>
        </TableCell>
      </TableRow>
    </TableHead>
  );
};

export default BedsTableHeader;

