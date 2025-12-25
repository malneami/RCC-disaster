import React, { useState } from 'react';
import {
  TableRow,
  TableCell,
  Chip,
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { Bed, BedStatus } from '../services/bedService';
import { BedStatusChip } from './BedStatusChip';

interface BedTableRowProps {
  bed: Bed;
  onBedClick?: (bed: Bed) => void;
  onChangeStatus?: (bed: Bed, newStatus: BedStatus) => void;
  onViewDetails?: (bed: Bed) => void;
  onEditBed?: (bed: Bed) => void;
  onViewHistory?: (bed: Bed) => void;
  isAdmin?: boolean;
}

const BedTableRow: React.FC<BedTableRowProps> = ({ 
  bed, 
  onBedClick,
  onViewDetails,
  onEditBed,
  onViewHistory,
  isAdmin = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(bed);
    }
    handleMenuClose();
  };

  const handleEditBed = () => {
    if (onEditBed) {
      onEditBed(bed);
    }
    handleMenuClose();
  };

  const handleViewHistory = () => {
    if (onViewHistory) {
      onViewHistory(bed);
    }
    handleMenuClose();
  };

  return (
    <>
      <TableRow
        hover
        sx={{ cursor: onBedClick ? 'pointer' : 'default' }}
        onClick={() => onBedClick?.(bed)}
      >
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <Typography 
                variant="body2" 
                fontWeight={600}
                sx={{ color: '#1976d2' }}
              >
                {bed.bedNumber}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ ml: 1 }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleViewDetails}>
                <ViewIcon fontSize="small" sx={{ mr: 1 }} />
                View Bed
              </MenuItem>
              <MenuItem onClick={handleViewHistory}>
                <HistoryIcon fontSize="small" sx={{ mr: 1 }} />
                History
              </MenuItem>
              {!isAdmin && (
                <MenuItem onClick={handleEditBed}>
                  <EditIcon fontSize="small" sx={{ mr: 1 }} />
                  Edit Bed
                </MenuItem>
              )}
            </Menu>
          </Box>
        </TableCell>
        <TableCell>
          <BedStatusChip status={bed.status} />
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {bed.unit.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {bed.unit.bedType.replace(/_/g, ' ')}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {bed.hospital.name}
          </Typography>
        </TableCell>
        <TableCell>
          {bed.currentPatient ? (
            <Typography variant="body2" fontWeight={500}>
              {bed.currentPatient.name}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          )}
        </TableCell>
        <TableCell align="center">
          {bed.isOperational ? (
            <Chip label="Yes" color="success" size="small" />
          ) : (
            <Chip label="No" color="error" size="small" />
          )}
        </TableCell>
      </TableRow>
    </>
  );
};

export default BedTableRow;
