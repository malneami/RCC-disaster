import React from 'react';
import {
  TableHead,
  TableRow,
  TableCell,
  Typography,
} from '@mui/material';

const StrokeCasesTableHeader: React.FC = () => {
  return (
    <TableHead>
      <TableRow>
        <TableCell>
          <Typography variant="subtitle2" fontWeight="bold">
            Patient
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="subtitle2" fontWeight="bold">
            Type
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="subtitle2" fontWeight="bold">
            Severity
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="subtitle2" fontWeight="bold">
            Status
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="subtitle2" fontWeight="bold">
            Hospital
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="subtitle2" fontWeight="bold">
            Created
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="subtitle2" fontWeight="bold">
            NIHSS
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="subtitle2" fontWeight="bold">
            Door-to-Needle
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="subtitle2" fontWeight="bold">
            Outcome Form
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="subtitle2" fontWeight="bold">
            Actions
          </Typography>
        </TableCell>
      </TableRow>
    </TableHead>
  );
};

export default StrokeCasesTableHeader;
