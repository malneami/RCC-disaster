import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faPlus,
  faUser,
  faAmbulance,
} from '@fortawesome/free-solid-svg-icons';

import { useDriverSchedules } from '../hooks/useDriverSchedules';
import { useEMSDrivers } from '../hooks/useEMSDrivers';
import { useAmbulances } from '../hooks/useAmbulances';
import { DriverSchedule } from '../types/ems';
import ScheduleForm from './ScheduleForm';
import ScheduleTable from './ScheduleTable';
import GenericPageHeader from '../../../components/common/GenericPageHeader';
import EmptyState from '../../../components/common/EmptyState';

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

const SchedulingManagement: React.FC = () => {
  const {
    schedules,
    
    isLoading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    startBreak,
    endBreak,
  } = useDriverSchedules();

  const { drivers } = useEMSDrivers();
  const { ambulances } = useAmbulances();

  const [openDialog, setOpenDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DriverSchedule | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    driverId: '',
    ambulanceId: '',
    shiftStart: '',
    shiftEnd: '',
    date: '',
    shiftType: 'DAY',
    status: 'SCHEDULED',
    notes: '',
  });

  const handleOpenDialog = (schedule?: DriverSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        driverId: schedule.driverId,
        ambulanceId: schedule.ambulanceId,
        shiftStart: new Date(schedule.shiftStart).toISOString().slice(11, 16),
        shiftEnd: new Date(schedule.shiftEnd).toISOString().slice(11, 16),
        date: new Date(schedule.shiftStart).toISOString().slice(0, 10),
        shiftType: schedule.shiftType,
        status: schedule.status,
        notes: schedule.notes || '',
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        driverId: '',
        ambulanceId: '',
        shiftStart: '',
        shiftEnd: '',
        date: '',
        shiftType: 'DAY',
        status: 'SCHEDULED',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSchedule(null);
  };

  const handleSubmit = async () => {
    try {
      const scheduleData = {
        ...formData,
        shiftType: formData.shiftType as 'DAY' | 'NIGHT' | 'OVERTIME',
        status: formData.status as 'SCHEDULED' | 'ACTIVE' | 'ON_BREAK' | 'COMPLETED' | 'CANCELLED',
      };

      if (editingSchedule) {
        await updateSchedule({ id: editingSchedule.id, data: scheduleData });
      } else {
        await createSchedule(scheduleData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'default';
      case 'ACTIVE': return 'success';
      case 'ON_BREAK': return 'warning';
      case 'COMPLETED': return 'info';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getShiftTypeColor = (shiftType: string) => {
    switch (shiftType) {
      case 'DAY': return 'primary';
      case 'NIGHT': return 'secondary';
      case 'OVERTIME': return 'warning';
      default: return 'default';
    }
  };

  const canStartBreak = (schedule: DriverSchedule): boolean => {
    return schedule.status === 'ACTIVE' && !schedule.breakStart;
  };

  const canEndBreak = (schedule: DriverSchedule): boolean => {
    return schedule.status === 'ON_BREAK' && !!schedule.breakStart && !schedule.breakEnd;
  };

  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const activeSchedules = schedules?.filter(s => s.status === 'ACTIVE') || [];
  const scheduledSchedules = schedules?.filter(s => s.status === 'SCHEDULED') || [];
  const completedSchedules = schedules?.filter(s => s.status === 'COMPLETED') || [];

  if (isLoading) return <Box>Loading...</Box>;
  if (error) return <Box>Error: {(error as Error)?.message || 'An error occurred'}</Box>;

  // Show empty state if no schedules
  if (!schedules || schedules.length === 0) {
    return (
      <Box>
        <GenericPageHeader
          title="Driver Scheduling Management"
          subtitle="Manage driver shifts and schedules"
          actions={[
            {
              icon: <FontAwesomeIcon icon={faPlus} />,
              tooltip: "Create New Schedule",
              onClick: () => handleOpenDialog(),
              color: 'primary',
              isFab: false,
            }
          ]}
        />
        
        <EmptyState
          icon={<FontAwesomeIcon icon={faCalendarAlt} size="3x" />}
          title="No Driver Schedules"
          description="You haven't created any driver schedules yet. Create your first schedule to start managing driver shifts and ambulance assignments."
          actionLabel="Create First Schedule"
          onAction={() => handleOpenDialog()}
        />
        
        <ScheduleForm
          open={openDialog}
          editingSchedule={editingSchedule}
          formData={formData}
          onClose={handleCloseDialog}
          onSubmit={handleSubmit}
          onFormDataChange={handleFormDataChange}
          drivers={(drivers || []).filter(driver => driver.status === 'ACTIVE')}
          ambulances={ambulances || []}
        />
      </Box>
    );
  }

  return (
    <Box>
      <GenericPageHeader
        title="Driver Scheduling Management"
        subtitle="Manage driver shifts and schedules"
        actions={[
          {
            icon: <FontAwesomeIcon icon={faPlus} />,
            tooltip: "Create New Schedule",
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
              label={`Active (${activeSchedules.length})`} 
              icon={<FontAwesomeIcon icon={faUser} />}
            />
            <Tab 
              label={`Scheduled (${scheduledSchedules.length})`} 
              icon={<FontAwesomeIcon icon={faCalendarAlt} />}
            />
            <Tab 
              label={`Completed (${completedSchedules.length})`} 
              icon={<FontAwesomeIcon icon={faAmbulance} />}
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <ScheduleTable
              schedules={activeSchedules}
              onEdit={handleOpenDialog}
              onDelete={deleteSchedule}
              onStartBreak={startBreak}
              onEndBreak={endBreak}
              canStartBreak={canStartBreak}
              canEndBreak={canEndBreak}
              getStatusColor={getStatusColor}
              getShiftTypeColor={getShiftTypeColor}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <ScheduleTable
              schedules={scheduledSchedules}
              onEdit={handleOpenDialog}
              onDelete={deleteSchedule}
              onStartBreak={startBreak}
              onEndBreak={endBreak}
              canStartBreak={canStartBreak}
              canEndBreak={canEndBreak}
              getStatusColor={getStatusColor}
              getShiftTypeColor={getShiftTypeColor}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <ScheduleTable
              schedules={completedSchedules}
              onEdit={handleOpenDialog}
              onDelete={deleteSchedule}
              onStartBreak={startBreak}
              onEndBreak={endBreak}
              canStartBreak={canStartBreak}
              canEndBreak={canEndBreak}
              getStatusColor={getStatusColor}
              getShiftTypeColor={getShiftTypeColor}
            />
          </TabPanel>
        </CardContent>
      </Card>

      <ScheduleForm
        open={openDialog}
        editingSchedule={editingSchedule}
        formData={formData}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        onFormDataChange={handleFormDataChange}
        drivers={(drivers || []).filter(driver => driver.status === 'ACTIVE')}
        ambulances={ambulances}
      />
    </Box>
  );
};

export default SchedulingManagement;