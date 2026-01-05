import React from 'react';
import {
  Warning,
  Error,
  Info,
  CheckCircle,
  Schedule,
  Assignment,
  DirectionsTransit,
  Cancel,
} from '@mui/icons-material';

export type TicketPriority = 'EMERGENCY' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TicketStatus = 'PENDING' | 'ASSIGNED' | 'IN_TRANSPORT' | 'COMPLETED' | 'CANCELLED';

export const getTicketPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'EMERGENCY':
    case 'CRITICAL':
      return '#ef5350';
    case 'HIGH':
      return '#ff9800';
    case 'MEDIUM':
      return '#42a5f5';
    case 'LOW':
      return '#66bb6a';
    default:
      return '#42a5f5';
  }
};

export const getTicketStatusColor = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return '#9e9e9e';
    case 'ASSIGNED':
      return '#42a5f5';
    case 'IN_TRANSPORT':
      return '#ff9800';
    case 'COMPLETED':
      return '#66bb6a';
    case 'CANCELLED':
      return '#ef5350';
    default:
      return '#9e9e9e';
  }
};

export const getTicketPriorityGradient = (priority: string): string => {
  const color = getTicketPriorityColor(priority);
  return `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`;
};

export const getTicketStatusGradient = (status: string): string => {
  const color = getTicketStatusColor(status);
  return `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`;
};

export const getTicketPriorityIcon = (priority: string): React.ReactElement => {
  switch (priority) {
    case 'EMERGENCY':
    case 'CRITICAL':
      return <Error sx={{ fontSize: '20px' }} />;
    case 'HIGH':
      return <Warning sx={{ fontSize: '20px' }} />;
    case 'MEDIUM':
      return <Info sx={{ fontSize: '20px' }} />;
    case 'LOW':
      return <CheckCircle sx={{ fontSize: '20px' }} />;
    default:
      return <Info sx={{ fontSize: '20px' }} />;
  }
};

export const getTicketStatusIcon = (status: string): React.ReactElement => {
  switch (status) {
    case 'PENDING':
      return <Schedule sx={{ fontSize: '20px' }} />;
    case 'ASSIGNED':
      return <Assignment sx={{ fontSize: '20px' }} />;
    case 'IN_TRANSPORT':
      return <DirectionsTransit sx={{ fontSize: '20px' }} />;
    case 'COMPLETED':
      return <CheckCircle sx={{ fontSize: '20px' }} />;
    case 'CANCELLED':
      return <Cancel sx={{ fontSize: '20px' }} />;
    default:
      return <Schedule sx={{ fontSize: '20px' }} />;
  }
};

export const getTicketPriorityLabel = (priority: string): string => {
  switch (priority) {
    case 'EMERGENCY':
      return 'Emergency';
    case 'CRITICAL':
      return 'Critical';
    case 'HIGH':
      return 'High';
    case 'MEDIUM':
      return 'Medium';
    case 'LOW':
      return 'Low';
    default:
      return priority;
  }
};

export const getTicketStatusLabel = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'ASSIGNED':
      return 'Assigned';
    case 'IN_TRANSPORT':
      return 'In Transport';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
};

