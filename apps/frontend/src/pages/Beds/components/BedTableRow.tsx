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
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { BedListItem, BedStatus } from '../services/bedService';
import { BedStatusChip } from './BedStatusChip';

interface BedTableRowProps {
  bed: BedListItem;
  onBedClick?: (bed: BedListItem) => void;
  onChangeStatus?: (bed: BedListItem, newStatus: BedStatus) => void;
  onViewDetails?: (bed: BedListItem) => void;
  onEditBed?: (bed: BedListItem) => void;
  onViewHistory?: (bed: BedListItem) => void;
  onDeleteBed?: (bed: BedListItem) => void;
  isAdmin?: boolean;
  isHospitalUser?: boolean;
}

const BedTableRow: React.FC<BedTableRowProps> = ({ 
  bed, 
  onBedClick,
  onViewDetails,
  onEditBed,
  onViewHistory,
  onDeleteBed,
  isAdmin = false,
  isHospitalUser = false,
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

  const handleDeleteBed = () => {
    if (onDeleteBed) {
      onDeleteBed(bed);
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
              {isHospitalUser && (
                <MenuItem onClick={handleDeleteBed} sx={{ color: 'error.main' }}>
                  <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                  Delete Bed
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
            {bed.unitName}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {bed.hospital?.name || '-'}
          </Typography>
        </TableCell>
        <TableCell>
          {bed.currentPatientName ? (
            <Typography variant="body2" fontWeight={500}>
              {bed.currentPatientName}
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
