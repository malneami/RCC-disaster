import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TablePagination,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faPlus,
} from '@fortawesome/free-solid-svg-icons';

import { useEMSDrivers } from '../hooks/useEMSDrivers';
import { hospitalService } from '../../../services/hospitalService';
import DriverForm from './DriverForm';
import DriverTable from './DriverTable';
import GenericPageHeader from '../../../components/Common/GenericPageHeader';
import EmptyState from '../../../components/Common/EmptyState';

const DriverManagement: React.FC = () => {
  const { 
    drivers,
    total,
    page,
    pageSize,
    setPage,
    setPageSize,
    isLoading, 
    error, 
    createDriver, 
    updateDriver, 
    deleteDriver 
  } = useEMSDrivers();
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    hospitalId: '',
  });

  // Fetch hospitals dynamically
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setHospitalsLoading(true);
        const hospitalsData = await hospitalService.getAllHospitals();
        setHospitals(hospitalsData);
      } catch (error) {
        console.error('Error fetching hospitals:', error);
      } finally {
        setHospitalsLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  const handleOpenDialog = (driver?: any) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData({
        firstName: driver.firstName || '',
        lastName: driver.lastName || '',
        phoneNumber: driver.phoneNumber || '',
        status: driver.status || 'ACTIVE',
        hospitalId: driver.hospitalId || '',
      });
    } else {
      setEditingDriver(null);
      setFormData({
        firstName: '',
        lastName: '',
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
    total: total || drivers?.length || 0,
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
          loading={isSubmitting || hospitalsLoading}
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
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <TablePagination
              component="div"
              count={total}
              page={(page - 1)}
              onPageChange={(_e, newPage) => setPage(newPage + 1)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Box>
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
        loading={isSubmitting || hospitalsLoading}
      />
    </Box>
  );
};

export default DriverManagement;

