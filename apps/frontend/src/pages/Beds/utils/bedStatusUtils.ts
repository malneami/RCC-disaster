import { BedStatus } from '../services/bedService';

export const getBedStatusColor = (status: BedStatus): string => {
  switch (status) {
    case 'OCCUPIED':
      return '#f44336'; // red
    case 'VACANT':
      return '#4caf50'; // green
    case 'CLEANING':
      return '#ff9800'; // yellow
    case 'BLOCKED':
      return '#9e9e9e'; // gray
    case 'RESERVED':
      return '#2196f3'; // blue
    default:
      return '#9e9e9e'; // gray as default
  }
};

export const getBedStatusLabel = (status: BedStatus): string => {
  switch (status) {
    case 'OCCUPIED':
      return 'Occupied';
    case 'VACANT':
      return 'Vacant';
    case 'CLEANING':
      return 'Cleaning';
    case 'BLOCKED':
      return 'Blocked';
    case 'RESERVED':
      return 'Reserved';
    default:
      return status;
  }
};

export const getBedStatusChipColor = (status: BedStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'OCCUPIED':
      return 'error';
    case 'VACANT':
      return 'success';
    case 'CLEANING':
      return 'warning';
    case 'BLOCKED':
      return 'default';
    case 'RESERVED':
      return 'info';
    default:
      return 'default';
  }
};

