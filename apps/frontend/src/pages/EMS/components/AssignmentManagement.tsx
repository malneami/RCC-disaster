import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus,
  faClock,
  faCheck,
  faMapMarkerAlt,
  faAmbulance,
  faHandPaper
} from '@fortawesome/free-solid-svg-icons';

import { useEMSAssignments } from '../hooks/useEMSAssignments';
import { useAmbulances } from '../hooks/useAmbulances';
import { useEMSDrivers } from '../hooks/useEMSDrivers';
import { EMSAssignment } from '../types/ems';
import AssignmentForm from './AssignmentForm';
import AssignmentGrid from './AssignmentGrid';
import GenericPageHeader from '../../../components/Common/GenericPageHeader';
import EmptyState from '../../../components/Common/EmptyState';
import { ticketService } from '../../../services/ticketService';
import { emsTicketSyncService } from '../../../services/emsTicketSyncService';
import { useState, useEffect } from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const AssignmentManagement: React.FC = () => {
  const {
    assignments,
    isLoading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    startAssignment,
    markArrived,
    loadPatient,
    completeAssignment,
  } = useEMSAssignments();

  const { ambulances } = useAmbulances();
  const { drivers } = useEMSDrivers();
  
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load tickets data
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        // Load tickets
        const ticketsResponse = await ticketService.getTickets(1, 100, { status: 'PENDING' });
        setTickets(ticketsResponse.data);
      } catch (error) {
        console.error('Error loading tickets:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<EMSAssignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    ticketId: '',
    ambulanceId: '',
    driverId: '',
    assignedAt: new Date().toISOString().slice(0, 16),
    status: 'EMS_CONTACT',
    estimatedArrivalTime: '',
    journeyStartTime: '',
    actualArrivalTime: '',
    journeyEndTime: '',
    notes: '',
  });

  const handleOpenDialog = (assignment?: EMSAssignment) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setFormData({
        ticketId: assignment.ticketId,
        ambulanceId: assignment.ambulanceId,
        driverId: assignment.driverId,
        assignedAt: assignment.assignedAt ? assignment.assignedAt.toString() : '',
        status: assignment.status,
        estimatedArrivalTime: assignment.estimatedArrivalTime ? assignment.estimatedArrivalTime.toString() : '',
        journeyStartTime: assignment.journeyStartTime ? assignment.journeyStartTime.toString() : '',
        actualArrivalTime: assignment.actualArrivalTime ? assignment.actualArrivalTime.toString() : '',
        journeyEndTime: assignment.journeyEndTime ? assignment.journeyEndTime.toString() : '',
        notes: assignment.notes || '',
      });
    } else {
      setEditingAssignment(null);
      setFormData({
        ticketId: '',
        ambulanceId: '',
        driverId: '',
        assignedAt: new Date().toISOString().slice(0, 16),
        status: 'EMS_CONTACT',
        estimatedArrivalTime: '',
        journeyStartTime: '',
        actualArrivalTime: '',
        journeyEndTime: '',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAssignment(null);
  };

  const handleAssignAmbulance = (assignment: EMSAssignment) => {
    setEditingAssignment(assignment);
    setFormData({
      ticketId: assignment.ticketId || '',
      ambulanceId: assignment.ambulanceId || '',
      driverId: assignment.driverId || '',
      assignedAt: assignment.assignedAt ? assignment.assignedAt.toString() : new Date().toISOString(),
      status: assignment.status,
      estimatedArrivalTime: assignment.estimatedArrivalTime ? assignment.estimatedArrivalTime.toString() : '',
      journeyStartTime: assignment.journeyStartTime ? assignment.journeyStartTime.toString() : '',
      actualArrivalTime: assignment.actualArrivalTime ? assignment.actualArrivalTime.toString() : '',
      journeyEndTime: assignment.journeyEndTime ? assignment.journeyEndTime.toString() : '',
      notes: assignment.notes || '',
    });
    setOpenDialog(true);
  };


  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const assignmentData = {
        ...formData,
        assignedAt: new Date(formData.assignedAt).toISOString(),
        estimatedArrivalTime: formData.estimatedArrivalTime && formData.estimatedArrivalTime.trim() !== ''
          ? new Date(formData.estimatedArrivalTime).toISOString()
          : undefined,
        journeyStartTime: formData.journeyStartTime && formData.journeyStartTime.trim() !== ''
          ? new Date(formData.journeyStartTime).toISOString()
          : undefined,
        actualArrivalTime: formData.actualArrivalTime && formData.actualArrivalTime.trim() !== ''
          ? new Date(formData.actualArrivalTime).toISOString()
          : undefined,
        journeyEndTime: formData.journeyEndTime && formData.journeyEndTime.trim() !== ''
          ? new Date(formData.journeyEndTime).toISOString()
          : undefined,
        priority: 'MEDIUM' as const,
        status: formData.status as 'EMS_CONTACT' | 'EMS_ARRIVAL' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED',
      };

      if (editingAssignment) {
        await updateAssignment({ id: editingAssignment.id, data: assignmentData });
        
        // Sync ticket status when EMS assignment status changes
        if (formData.ticketId && formData.status) {
          try {
            await emsTicketSyncService.syncTicketStatusFromEMS(
              formData.ticketId,
              formData.status as any,
              `EMS assignment status updated to ${formData.status}`
            );
          } catch (syncError) {
            console.error('Error syncing ticket status:', syncError);
            // Don't fail the entire operation if sync fails
          }
        }
      } else {
        await createAssignment(assignmentData);
        
        // Sync ticket status for new assignment
        if (formData.ticketId && formData.status) {
          try {
            await emsTicketSyncService.syncTicketStatusFromEMS(
              formData.ticketId,
              formData.status as any,
              `New EMS assignment created with status ${formData.status}`
            );
          } catch (syncError) {
            console.error('Error syncing ticket status:', syncError);
            // Don't fail the entire operation if sync fails
          }
        }
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving assignment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EMS_CONTACT': return 'default';
      case 'EMS_ARRIVAL': return 'primary';
      case 'DEPARTED': return 'info';
      case 'ARRIVED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Wrapper functions to match AssignmentGrid interface
  const handleStartAssignment = async (id: string): Promise<void> => {
    await startAssignment(id);
  };

  const handleMarkArrived = async (id: string): Promise<void> => {
    await markArrived(id);
  };

  const handleCompleteAssignment = async (id: string): Promise<void> => {
    await completeAssignment(id);
  };

  const assignedAssignments = assignments?.filter(a => a.status === 'EMS_CONTACT') || [];
  const activeAssignments = assignments?.filter(a => ['EMS_ARRIVAL', 'DEPARTED'].includes(a.status)) || [];
  const completedAssignments = assignments?.filter(a => a.status === 'ARRIVED') || [];

  if (isLoading || loadingData) return <Box>Loading...</Box>;
  if (error) return <Box>Error: {(error as Error)?.message || 'An error occurred'}</Box>;

  // Show empty state if no assignments
  if (!assignments || assignments.length === 0) {
    return (
      <Box>
        <GenericPageHeader
          title="EMS Assignment Management"
          subtitle="Manage ambulance assignments and dispatch"
          actions={[
            {
              icon: <FontAwesomeIcon icon={faHandPaper} />,
              tooltip: "Manual Assignment",
              onClick: () => handleOpenDialog(),
              color: 'secondary',
              isFab: false,
            },
            {
              icon: <FontAwesomeIcon icon={faPlus} />,
              tooltip: "Create New Assignment",
              onClick: () => handleOpenDialog(),
              color: 'primary',
              isFab: false,
            }
          ]}
        />
        
        <EmptyState
          icon={<FontAwesomeIcon icon={faAmbulance} size="3x" />}
          title="No EMS Assignments Yet"
          description="You haven't created any EMS assignments yet. Manually assign ambulances to tickets or let the system auto-assign based on transport mode."
          actionLabel="Manual Assignment"
          onAction={() => handleOpenDialog()}
        />
        
        <AssignmentForm
          open={openDialog}
          editingAssignment={editingAssignment}
          formData={formData}
          onClose={handleCloseDialog}
          onSubmit={handleSubmit}
          onFormDataChange={handleFormDataChange}
          tickets={[]}
          ambulances={[]}
          drivers={[]}
          loading={isSubmitting}
        />
      </Box>
    );
  }

  return (
    <Box>
      <GenericPageHeader
        title="EMS Assignment Management"
        subtitle="Manage ambulance assignments and dispatch"
        actions={[
          {
            icon: <FontAwesomeIcon icon={faPlus} />,
            tooltip: "Create New Assignment",
            onClick: () => handleOpenDialog(),
            color: 'primary',
            isFab: false,
          }
        ]}
      />
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab 
              label={`Contacted (${assignedAssignments.length})`} 
              icon={<FontAwesomeIcon icon={faClock} />}
            />
            <Tab 
              label={`En Route (${activeAssignments.length})`} 
              icon={<FontAwesomeIcon icon={faMapMarkerAlt} />}
            />
            <Tab 
              label={`Arrived (${completedAssignments.length})`} 
              icon={<FontAwesomeIcon icon={faCheck} />}
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <AssignmentGrid
              assignments={assignedAssignments}
              onEdit={handleOpenDialog}
              onDelete={deleteAssignment}
              onStartAssignment={handleStartAssignment}
              onMarkArrived={handleMarkArrived}
              onLoadPatient={loadPatient}
              onCompleteAssignment={handleCompleteAssignment}
              onAssignAmbulance={handleAssignAmbulance}
              getStatusColor={getStatusColor}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <AssignmentGrid
              assignments={activeAssignments}
              onEdit={handleOpenDialog}
              onDelete={deleteAssignment}
              onStartAssignment={handleStartAssignment}
              onMarkArrived={handleMarkArrived}
              onLoadPatient={loadPatient}
              onCompleteAssignment={handleCompleteAssignment}
              onAssignAmbulance={handleAssignAmbulance}
              getStatusColor={getStatusColor}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <AssignmentGrid
              assignments={completedAssignments}
              onEdit={handleOpenDialog}
              onDelete={deleteAssignment}
              onStartAssignment={handleStartAssignment}
              onMarkArrived={handleMarkArrived}
              onLoadPatient={loadPatient}
              onCompleteAssignment={handleCompleteAssignment}
              onAssignAmbulance={handleAssignAmbulance}
              getStatusColor={getStatusColor}
            />
          </TabPanel>
        </CardContent>
      </Card>

      <AssignmentForm
        open={openDialog}
        editingAssignment={editingAssignment}
        formData={formData}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        onFormDataChange={handleFormDataChange}
        tickets={tickets}
        ambulances={ambulances}
        drivers={drivers}
        loading={isSubmitting}
      />
    </Box>
  );
};

export default AssignmentManagement;