import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
  Badge,
  Tooltip,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faClock,
  faCheck,
  faMapMarkerAlt,
  faAmbulance,
  faSearch,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';

import { useEMSAssignments } from '../hooks/useEMSAssignments';
import { useAmbulances } from '../hooks/useAmbulances';
import { useEMSDrivers } from '../hooks/useEMSDrivers';
import { EMSAssignment, AssignmentFilter } from '../types/ems';
import AssignmentForm from './AssignmentForm';
import AssignmentFilters from './AssignmentFilters';
import AssignmentGrid from './AssignmentGrid';
import GenericPageHeader from '../../../components/Common/GenericPageHeader';
import EmptyState from '../../../components/Common/EmptyState';
import { ticketService } from '../../../services/ticketService';
import { hospitalService } from '../../../services/hospitalService';
import { emsTicketSyncService } from '../../../services/emsTicketSyncService';

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
  const [filters, setFilters] = useState<AssignmentFilter>({});
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search query to prevent jarring UI reloads
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<EMSAssignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    ticketId: '',
    ambulanceId: '',
    driverId: '',
    assignedAt: new Date().toISOString().slice(0, 16),
    status: 'EMS_CONTACT',
    emsContactTime: '',
    journeyStartTime: '',
    actualArrivalTime: '',
    journeyEndTime: '',
    notes: '',
    originHospitalId: '',
    destinationHospitalId: '',
  });

  const {
    assignments,
    isLoading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    startAssignment,
    markArrived,
    markDeparted,
    loadPatient,
    completeAssignment,
  } = useEMSAssignments({ ...filters, search: debouncedSearchQuery });

  const { ambulances } = useAmbulances({ limit: 1000 });
  const { drivers } = useEMSDrivers({ pageSize: 1000 });

  const [tickets, setTickets] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load tickets and hospitals data
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        // Load tickets
        const ticketsResponse = await ticketService.getTickets(1, 100, { status: 'PENDING' });
        setTickets(ticketsResponse.data);

        // Load hospitals
        const hospitalsResponse = await hospitalService.getAllHospitals();
        setHospitals(hospitalsResponse.map(h => ({ id: h.id, name: h.name })));
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };
  const activeFiltersCount = Object.keys(filters).length;

  const handleOpenDialog = (assignment?: EMSAssignment) => {
    if (assignment) {
      setEditingAssignment(assignment);
      // Helper to convert date to ISO string for datetime-local inputs
      const toISOString = (date: Date | string | null | undefined): string => {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        return isNaN(d.getTime()) ? '' : d.toISOString();
      };

      setFormData({
        ticketId: assignment.ticketId,
        ambulanceId: assignment.ambulanceId || '',
        driverId: assignment.driverId || '',
        assignedAt: toISOString(assignment.assignedAt),
        status: assignment.status,
        emsContactTime: toISOString(assignment.emsContactTime),
        journeyStartTime: toISOString(assignment.journeyStartTime),
        actualArrivalTime: toISOString(assignment.actualArrivalTime),
        journeyEndTime: toISOString(assignment.journeyEndTime),
        notes: assignment.notes || '',
        originHospitalId: assignment.ticket?.originHospital?.id || '',
        destinationHospitalId: assignment.ticket?.destinationHospital?.id || '',
      });
    } else {
      setEditingAssignment(null);
      setFormData({
        ticketId: '',
        ambulanceId: '',
        driverId: '',
        assignedAt: new Date().toISOString().slice(0, 16),
        status: 'EMS_CONTACT',
        emsContactTime: '',
        journeyStartTime: '',
        actualArrivalTime: '',
        journeyEndTime: '',
        notes: '',
        originHospitalId: '',
        destinationHospitalId: '',
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
      emsContactTime: assignment.emsContactTime ? assignment.emsContactTime.toString() : '',
      journeyStartTime: assignment.journeyStartTime ? assignment.journeyStartTime.toString() : '',
      actualArrivalTime: assignment.actualArrivalTime ? assignment.actualArrivalTime.toString() : '',
      journeyEndTime: assignment.journeyEndTime ? assignment.journeyEndTime.toString() : '',
      notes: assignment.notes || '',
      originHospitalId: assignment.ticket?.originHospital?.id || '',
      destinationHospitalId: assignment.ticket?.destinationHospital?.id || '',
    });
    setOpenDialog(true);
  };


  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (editingAssignment) {
        // For updates: only send fields allowed by UpdateEmsAssignmentDto
        const updateData = {
          ambulanceId: formData.ambulanceId && formData.ambulanceId.trim() !== ''
            ? formData.ambulanceId
            : undefined,
          driverId: formData.driverId && formData.driverId.trim() !== ''
            ? formData.driverId
            : undefined,
          assignedAt: formData.assignedAt && formData.assignedAt.trim() !== ''
            ? new Date(formData.assignedAt).toISOString()
            : undefined,
          status: formData.status as 'EMS_CONTACT' | 'EMS_ARRIVAL' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED',
          emsContactTime: formData.emsContactTime && formData.emsContactTime.trim() !== ''
            ? new Date(formData.emsContactTime).toISOString()
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
          notes: formData.notes,
          // Include hospital IDs if they were changed
          ...(formData.originHospitalId && formData.originHospitalId.trim() !== '' && {
            originHospitalId: formData.originHospitalId,
          }),
          ...(formData.destinationHospitalId && formData.destinationHospitalId.trim() !== '' && {
            destinationHospitalId: formData.destinationHospitalId,
          }),
        };

        await updateAssignment({ id: editingAssignment.id, data: updateData });

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
        // For creation: include all fields explicitly to ensure empty strings are converted to undefined
        const createData = {
          ticketId: formData.ticketId,
          ambulanceId: formData.ambulanceId && formData.ambulanceId.trim() !== ''
            ? formData.ambulanceId
            : undefined,
          driverId: formData.driverId && formData.driverId.trim() !== ''
            ? formData.driverId
            : undefined,
          originHospitalId: formData.originHospitalId && formData.originHospitalId.trim() !== ''
            ? formData.originHospitalId
            : undefined,
          destinationHospitalId: formData.destinationHospitalId && formData.destinationHospitalId.trim() !== ''
            ? formData.destinationHospitalId
            : undefined,
          assignedAt: new Date(formData.assignedAt).toISOString(),
          emsContactTime: formData.emsContactTime && formData.emsContactTime.trim() !== ''
            ? new Date(formData.emsContactTime).toISOString()
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
          notes: formData.notes,
          // Cast strict types or ensure interface matches DTO
          status: formData.status as any,
        } as any;

        await createAssignment(createData);

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

  const handleMarkDeparted = async (id: string): Promise<void> => {
    await markDeparted(id);
  };

  const handleCompleteAssignment = async (id: string): Promise<void> => {
    await completeAssignment(id);
  };

  // Helper function to infer status from timestamps if status field is missing/invalid
  const getInferredStatus = (assignment: EMSAssignment): string => {
    if (assignment.status && ['EMS_CONTACT', 'EMS_ARRIVAL', 'DEPARTED', 'ARRIVED', 'CANCELLED'].includes(assignment.status)) {
      return assignment.status;
    }
    // Infer from timestamps
    if (assignment.journeyEndTime) return 'ARRIVED';
    if (assignment.journeyStartTime) return 'DEPARTED';
    if (assignment.actualArrivalTime) return 'EMS_ARRIVAL';
    if (assignment.emsContactTime) return 'EMS_CONTACT';
    return assignment.status || 'UNKNOWN';
  };


  const assignedAssignments = (assignments || [])
    .filter(a => getInferredStatus(a) === 'EMS_CONTACT');

  const activeAssignments = (assignments || [])
    .filter(a => ['EMS_ARRIVAL', 'DEPARTED'].includes(getInferredStatus(a)));

  const completedAssignments = (assignments || [])
    .filter(a => getInferredStatus(a) === 'ARRIVED');

  // Filter tickets to exclude those with active EMS assignments
  const activeAssignmentTicketIds = new Set(
    (assignments || [])
      .filter(a => ['EMS_CONTACT', 'EMS_ARRIVAL', 'DEPARTED'].includes(getInferredStatus(a)))
      .map(a => a.ticketId)
  );
  const availableTickets = tickets.filter(t =>
    !activeAssignmentTicketIds.has(t.id) &&
    (!t.emsAssignmentStatus || ['CANCELLED', 'ARRIVED'].includes(t.emsAssignmentStatus))
  );

  if (isLoading || loadingData) return <Box>Loading...</Box>;
  if (error) return <Box>Error: {(error as Error)?.message || 'An error occurred'}</Box>;

  // Determine if we are in a "no results" state due to filtering
  const hasActiveFilters = searchQuery || Object.keys(filters).length > 0;

  const renderTabContent = (list: EMSAssignment[], tabIndex: number) => {
    if (list.length > 0) {
      return (
        <AssignmentGrid
          assignments={list}
          onEdit={handleOpenDialog}
          onDelete={deleteAssignment}
          onStartAssignment={handleStartAssignment}
          onMarkArrived={handleMarkArrived}
          onMarkDeparted={handleMarkDeparted}
          onLoadPatient={loadPatient}
          onCompleteAssignment={handleCompleteAssignment}
          onAssignAmbulance={handleAssignAmbulance}
          getStatusColor={getStatusColor}
        />
      );
    }

    // Empty state handling
    if (hasActiveFilters) {
      return (
        <EmptyState
          icon={<FontAwesomeIcon icon={faSearch} size="3x" />}
          title="No assignments found"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      );
    }

    // Generic empty state for the tab
    return (
      <EmptyState
        icon={<FontAwesomeIcon icon={faAmbulance} size="3x" />}
        title="No Assignments"
        description={tabIndex === 0
          ? "No assignments currently in EMS Contact phase."
          : tabIndex === 1
            ? "No assignments currently En Route."
            : "No completed assignments found."}
        actionLabel="Create Assignment"
        onAction={() => handleOpenDialog()}
      />
    );
  };

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
          {/* Search and Filters */}
          <Box sx={{
            mb: 2,
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap' // Allow wrapping on small screens
          }}>
            <TextField
              placeholder="Search by ticket, ambulance, or driver..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: { xs: '100%', md: 300 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FontAwesomeIcon icon={faSearch} />
                  </InputAdornment>
                ),
              }}
            />
            <Tooltip title="Filters">
              <IconButton
                onClick={handleToggleFilters}
                color={activeFiltersCount > 0 ? 'primary' : 'default'}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1
                }}
              >
                <Badge badgeContent={activeFiltersCount} color="error">
                  <FontAwesomeIcon icon={faFilter} />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>

          <AssignmentFilters
            open={showFilters}
            onClose={() => setShowFilters(false)}
            filters={filters}
            onChange={setFilters}
            ambulances={ambulances}
            drivers={drivers}
          />
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
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
            {renderTabContent(assignedAssignments, 0)}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {renderTabContent(activeAssignments, 1)}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {renderTabContent(completedAssignments, 2)}
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
        tickets={availableTickets}
        ambulances={ambulances}
        drivers={drivers}
        hospitals={hospitals}
        loading={isSubmitting}
        loadingData={loadingData}
      />
    </Box >
  );
};

export default AssignmentManagement;