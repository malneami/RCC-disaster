import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import AssignmentCard from './AssignmentCard';
import { EMSAssignment } from '../types/ems';

// Mock data for demonstration
const mockAssignments: EMSAssignment[] = [
  {
    id: '1',
    ticketId: 'ticket-1',
    ambulanceId: 'ambulance-1',
    driverId: 'driver-1',
    priority: 'HIGH',
    status: 'EMS_CONTACT',
    assignedAt: new Date('2024-02-15T08:30:00Z'),
    emsContactTime: new Date('2024-02-15T09:00:00Z'),
    notes: 'Patient requires immediate transport for STEMI treatment. Priority case with critical time window.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: 'user-1',
    ticket: {
      id: 'ticket-1',
      ticketNumber: 'T-99052',
      priority: 'CRITICAL',
      status: 'PENDING',
      patient: {
        id: 'patient-1',
        firstName: 'Robin',
        lastName: 'Wiggins',
      },
      originHospital: {
        id: 'hospital-1',
        name: 'Samtah General Hospital',
      },
      destinationHospital: {
        id: 'hospital-2',
        name: 'Jazan Specialized Hospital',
      },
    },
    ambulance: {
      id: 'ambulance-1',
      callSign: 'Alpha-1',
      plateNumber: 'ب د س 4900',
      type: 'CRITICAL_CARE',
      status: 'AVAILABLE',
    },
    driver: {
      id: 'driver-1',
      firstName: 'Ahmed',
      lastName: 'Al-Rashid',
      phoneNumber: '+966501234567',
    },
  },
  {
    id: '2',
    ticketId: 'ticket-2',
    ambulanceId: 'ambulance-2',
    driverId: 'driver-2',
    priority: 'MEDIUM',
    status: 'ARRIVED',
    assignedAt: new Date('2024-02-15T07:15:00Z'),
    journeyStartTime: new Date('2024-02-15T07:30:00Z'),
    actualArrivalTime: new Date('2024-02-15T08:00:00Z'),
    emsContactTime: new Date('2024-02-15T08:15:00Z'),
    notes: 'Routine transfer for follow-up appointment. Patient is stable.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: 'user-1',
    ticket: {
      id: 'ticket-2',
      ticketNumber: 'T-99053',
      priority: 'MEDIUM',
      status: 'IN_TRANSPORT',
      patient: {
        id: 'patient-2',
        firstName: 'Sarah',
        lastName: 'Johnson',
      },
      originHospital: {
        id: 'hospital-3',
        name: 'King Fahd Hospital',
      },
      destinationHospital: {
        id: 'hospital-4',
        name: 'Specialty Hospital',
      },
    },
    ambulance: {
      id: 'ambulance-2',
      callSign: 'Bravo-2',
      plateNumber: 'ح ص ل 4691',
      type: 'BASIC',
      status: 'IN_USE',
    },
    driver: {
      id: 'driver-2',
      firstName: 'Fatima',
      lastName: 'Al-Zahra',
      phoneNumber: '+966501234568',
    },
  },
  {
    id: '3',
    ticketId: 'ticket-3',
    ambulanceId: 'ambulance-3',
    driverId: 'driver-3',
    priority: 'HIGH',
    status: 'EMS_ARRIVAL',
    assignedAt: new Date('2024-02-15T06:00:00Z'),
    journeyStartTime: new Date('2024-02-15T06:15:00Z'),
    actualArrivalTime: new Date('2024-02-15T06:45:00Z'),
    journeyEndTime: new Date('2024-02-15T07:30:00Z'),
    notes: 'Emergency stroke case successfully transported. Patient received timely treatment.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: 'user-1',
    ticket: {
      id: 'ticket-3',
      ticketNumber: 'T-99051',
      priority: 'CRITICAL',
      status: 'ARRIVED',
      patient: {
        id: 'patient-3',
        firstName: 'Mohammed',
        lastName: 'Al-Sayed',
      },
      originHospital: {
        id: 'hospital-5',
        name: 'Abu Arish Hospital',
      },
      destinationHospital: {
        id: 'hospital-6',
        name: 'Jazan Hospital',
      },
    },
    ambulance: {
      id: 'ambulance-3',
      callSign: 'Charlie-3',
      plateNumber: 'ب ح ر 7382',
      type: 'ADVANCED',
      status: 'AVAILABLE',
    },
    driver: {
      id: 'driver-3',
      firstName: 'Mohammed',
      lastName: 'Al-Sabah',
      phoneNumber: '+966501234569',
    },
  },
  {
    id: '4',
    ticketId: 'ticket-4',
    ambulanceId: 'ambulance-4',
    driverId: 'driver-4',
    priority: 'HIGH',
    status: 'ARRIVED',
    assignedAt: new Date('2024-02-15T05:45:00Z'),
    journeyStartTime: new Date('2024-02-15T06:00:00Z'),
    actualArrivalTime: new Date('2024-02-15T06:30:00Z'),
    emsContactTime: new Date('2024-02-15T06:45:00Z'),
    notes: 'Emergency trauma case. Patient requires immediate surgical intervention.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: 'user-1',
    ticket: {
      id: 'ticket-4',
      ticketNumber: 'T-99054',
      priority: 'CRITICAL',
      status: 'IN_TRANSPORT',
      patient: {
        id: 'patient-4',
        firstName: 'Ahmed',
        lastName: 'Al-Mansouri',
      },
      originHospital: {
        id: 'hospital-7',
        name: 'Al-Mawsim Hospital',
      },
      destinationHospital: {
        id: 'hospital-8',
        name: 'Trauma Center',
      },
    },
    ambulance: {
      id: 'ambulance-4',
      callSign: 'Delta-4',
      plateNumber: 'ب ط ك 7901',
      type: 'CRITICAL_CARE',
      status: 'IN_USE',
    },
    driver: {
      id: 'driver-4',
      firstName: 'Sara',
      lastName: 'Al-Mansouri',
      phoneNumber: '+966501234570',
    },
  },
];

const AssignmentCardDemo: React.FC = () => {
  const handleEdit = (assignment: EMSAssignment) => {
    console.log('Edit assignment:', assignment);
  };

  const handleDelete = async (id: string) => {
    console.log('Delete assignment:', id);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Assignment deleted successfully');
  };

  const handleStartAssignment = async (id: string) => {
    console.log('Start assignment:', id);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Assignment started successfully');
  };

  const handleMarkArrived = async (id: string) => {
    console.log('Mark arrived assignment:', id);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Assignment marked as arrived successfully');
  };

  const handleCompleteAssignment = async (id: string) => {
    console.log('Complete assignment:', id);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Assignment completed successfully');
  };


  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: 'center', fontWeight: 600 }}>
        EMS Assignment Management - Modern Card Design
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
        Modern rectangular cards with visual timelines, replacing traditional tables for better user experience
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {mockAssignments.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStartAssignment={handleStartAssignment}
            onMarkArrived={handleMarkArrived}
            onCompleteAssignment={handleCompleteAssignment}
          />
        ))}
      </Box>
    </Container>
  );
};

export default AssignmentCardDemo;
