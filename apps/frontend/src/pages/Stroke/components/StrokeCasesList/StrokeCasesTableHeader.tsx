import React from 'react';
import {
  TableHead,
  TableRow,
  TableCell,
  Typography,
  Tooltip,
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
        <TableCell align="center">
          <Tooltip title="Door to Physician ≤15min">
            <Typography variant="caption" fontWeight="bold">
              Door to Physician
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell align="center">
          <Tooltip title="Registration to CT ≤20min">
            <Typography variant="caption" fontWeight="bold">
              Door to CT
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell align="center">
          <Tooltip title="Door to CT Report">
            <Typography variant="caption" fontWeight="bold">
              Door to CT Report
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell align="center">
          <Tooltip title="Door to Thrombolysis Order">
            <Typography variant="caption" fontWeight="bold">
              Door to Thrombolysis Order
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell align="center">
          <Tooltip title="Registration to IV Thrombolysis ≤60min">
            <Typography variant="caption" fontWeight="bold">
              Door to Needle
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell align="center">
          <Tooltip title="Registration to Mechanical Thrombectomy Puncture ≤120min">
            <Typography variant="caption" fontWeight="bold">
              Door to Thrombectomy
            </Typography>
          </Tooltip>
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
