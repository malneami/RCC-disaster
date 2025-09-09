import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faPlus,
} from '@fortawesome/free-solid-svg-icons';

import { useEMSDrivers } from '../hooks/useEMSDrivers';
import DriverForm from './DriverForm';
import DriverTable from './DriverTable';
import GenericPageHeader from '../../../components/Common/GenericPageHeader';
import EmptyState from '../../../components/Common/EmptyState';

const DriverManagement: React.FC = () => {
  const { 
    drivers, 
    isLoading, 
    error, 
    createDriver, 
    updateDriver, 
    deleteDriver 
  } = useEMSDrivers();
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    hospitalId: '',
  });

  // Mock hospitals data - in real app, this would come from a hook
  const hospitals = [
    { id: '1', name: 'King Fahd Hospital' },
    { id: '2', name: 'Jazan General Hospital' },
    { id: '3', name: 'Al-Hada Hospital' },
    { id: '4', name: 'Prince Mohammed Hospital' },
  ];

  const handleOpenDialog = (driver?: any) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData({
        firstName: driver.firstName || '',
        lastName: driver.lastName || '',
        email: driver.email || '',
        phoneNumber: driver.phoneNumber || '',
        status: driver.status || 'ACTIVE',
        hospitalId: driver.hospitalId || '',
      });
    } else {
      setEditingDriver(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        status: 'ACTIVE',
        hospitalId: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDriver(null);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (editingDriver) {
        await updateDriver({ id: editingDriver.id, data: formData });
      } else {
        await createDriver(formData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving driver:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'error';
      default: return 'default';
    }
  };

  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate statistics
  const stats = {
    total: drivers?.length || 0,
    active: drivers?.filter(d => d.status === 'ACTIVE').length || 0,
    inactive: drivers?.filter(d => d.status === 'INACTIVE').length || 0,
  };

  if (isLoading) return <Box>Loading...</Box>;
  if (error) return <Box>Error: {(error as Error)?.message || 'An error occurred'}</Box>;

  // Show empty state if no drivers
  if (!drivers || drivers.length === 0) {
    return (
      <Box>
        <GenericPageHeader
          title="Driver Management"
          subtitle="Manage EMS drivers and their information"
          actions={[
            {
              icon: <FontAwesomeIcon icon={faPlus} />,
              tooltip: "Add New Driver",
              onClick: () => handleOpenDialog(),
              color: 'primary',
              isFab: false,
            }
          ]}
        />
        
        <EmptyState
          icon={<FontAwesomeIcon icon={faUser} size="3x" />}
          title="No Drivers Found"
          description="You haven't added any EMS drivers yet. Add your first driver to start managing your EMS team."
          actionLabel="Add First Driver"
          onAction={() => handleOpenDialog()}
        />
        
        <DriverForm
          open={openDialog}
          editingDriver={editingDriver}
          formData={formData}
          onClose={handleCloseDialog}
          onSubmit={handleSubmit}
          onFormDataChange={handleFormDataChange}
          hospitals={hospitals}
          loading={isSubmitting}
        />
      </Box>
    );
  }

  return (
    <Box>
      <GenericPageHeader
        title="Driver Management"
        subtitle="Manage EMS drivers and their information"
        actions={[
          {
            icon: <FontAwesomeIcon icon={faPlus} />,
            tooltip: "Add New Driver",
            onClick: () => handleOpenDialog(),
            color: 'primary',
            isFab: false,
          }
        ]}
      />

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Drivers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {stats.active}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Drivers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {stats.inactive}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inactive Drivers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Driver Table */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <DriverTable
            drivers={drivers}
            onEdit={handleOpenDialog}
            onDelete={deleteDriver}
            getStatusColor={getStatusColor}
          />
        </CardContent>
      </Card>

      <DriverForm
        open={openDialog}
        editingDriver={editingDriver}
        formData={formData}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        onFormDataChange={handleFormDataChange}
        hospitals={hospitals}
        loading={isSubmitting}
      />
    </Box>
  );
};

export default DriverManagement;

