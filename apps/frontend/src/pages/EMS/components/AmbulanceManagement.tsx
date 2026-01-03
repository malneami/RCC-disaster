import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TablePagination,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAmbulance,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';

import { useAmbulances } from '../hooks/useAmbulances';
import { useEMSDrivers } from '../hooks/useEMSDrivers';
import { Ambulance } from '../types/ems';
import AmbulanceForm from './AmbulanceForm';
import AmbulanceTable from './AmbulanceTable';
import GenericPageHeader from '../../../components/Common/GenericPageHeader';
import EmptyState from '../../../components/Common/EmptyState';

const AmbulanceManagement: React.FC = () => {
  const {
    ambulances,
    total,
    page,
    limit,
    setPage,
    setLimit,
    setFilter,
    isLoading,
    createAmbulance,
    updateAmbulance,
    deleteAmbulance
  } = useAmbulances();
  const { drivers } = useEMSDrivers();
  const { enqueueSnackbar } = useSnackbar();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAmbulance, setEditingAmbulance] = useState<Ambulance | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    vehicleImei: '',
    callSign: '',
    plateNumber: '',
    type: 'BASIC',
    status: 'AVAILABLE',
    manufacturer: '',
    model: '',
    year: new Date().getFullYear(),
    baseStation: '',
    driverId: '',
    equipmentStatus: 'OPERATIONAL',
    isActive: true,
  });

  // Filter to only show active drivers
  const activeDrivers = (drivers || []).filter(driver => driver.status === 'ACTIVE');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1); // Reset to first page on search
    setFilter(prev => ({ ...prev, search: value }));
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage + 1); // Material UI is 0-indexed, backend is 1-indexed
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(1);
  };

  const handleOpenDialog = (ambulance?: Ambulance) => {
    if (ambulance) {
      setEditingAmbulance(ambulance);
      setFormData({
        vehicleImei: ambulance.vehicleImei,
        callSign: ambulance.callSign,
        plateNumber: ambulance.plateNumber,
        type: ambulance.type,
        status: ambulance.status,
        manufacturer: (ambulance as any).manufacturer || '',
        model: (ambulance as any).model || '',
        year: (ambulance as any).year || new Date().getFullYear(),
        baseStation: (ambulance as any).baseStation || '',
        driverId: ambulance.driverId || '',
        equipmentStatus: (ambulance as any).equipmentStatus || 'OPERATIONAL',
        isActive: ambulance.isActive,
      });
    } else {
      setEditingAmbulance(null);
      setFormData({
        vehicleImei: '',
        callSign: '',
        plateNumber: '',
        type: 'BASIC',
        status: 'AVAILABLE',
        manufacturer: '',
        model: '',
        year: new Date().getFullYear(),
        baseStation: '',
        driverId: '',
        equipmentStatus: 'OPERATIONAL',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAmbulance(null);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields validation
    if (!formData.vehicleImei.trim()) {
      errors.vehicleImei = 'Vehicle IMEI is required';
    } else if (!/^\d{15}$/.test(formData.vehicleImei.trim())) {
      errors.vehicleImei = 'IMEI must be exactly 15 digits';
    }

    if (!formData.callSign.trim()) {
      errors.callSign = 'Call Sign is required';
    }

    if (!formData.plateNumber.trim()) {
      errors.plateNumber = 'Plate Number is required';
    }

    if (!formData.model.trim()) {
      errors.model = 'Model is required';
    }

    if (!formData.baseStation.trim()) {
      errors.baseStation = 'Base Station is required';
    }

    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      errors.year = 'Year must be a valid year';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    // Validate form before submission
    if (!validateForm()) {
      enqueueSnackbar('Please fill in all required fields correctly', { variant: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      setFormErrors({});

      // Prepare data - convert empty driverId to undefined
      const submitData = {
        ...formData,
        driverId: formData.driverId && formData.driverId.trim() ? formData.driverId.trim() : undefined,
        vehicleImei: formData.vehicleImei.trim(),
        callSign: formData.callSign.trim(),
        plateNumber: formData.plateNumber.trim(),
        model: formData.model.trim(),
        baseStation: formData.baseStation.trim(),
        manufacturer: formData.manufacturer.trim() || undefined,
      };

      if (editingAmbulance) {
        await updateAmbulance({ id: editingAmbulance.id, data: submitData });
        enqueueSnackbar('Ambulance updated successfully', { variant: 'success' });
      } else {
        await createAmbulance(submitData);
        enqueueSnackbar('Ambulance added successfully', { variant: 'success' });
      }
      handleCloseDialog();
    } catch (error: any) {
      console.error('Error saving ambulance:', error);

      // Extract error message from API response
      let errorMessage = 'Failed to save ambulance. Please try again.';

      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'IN_USE': return 'warning';
      case 'MAINTENANCE': return 'error';
      case 'OUT_OF_SERVICE': return 'default';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BASIC': return 'primary';
      case 'ADVANCED': return 'secondary';
      case 'CRITICAL_CARE': return 'error';
      default: return 'default';
    }
  };

  const getEquipmentStatusColor = (status: string) => {
    switch (status) {
      case 'OPERATIONAL': return 'success';
      case 'MAINTENANCE_REQUIRED': return 'warning';
      case 'OUT_OF_SERVICE': return 'error';
      case 'REPLACED': return 'info';
      default: return 'default';
    }
  };

  const handleFormDataChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Calculate statistics with null safety
  const stats = {
    total: ambulances?.length || 0,
    available: ambulances?.filter(a => a.status === 'AVAILABLE').length || 0,
    inUse: ambulances?.filter(a => a.status === 'IN_USE').length || 0,
  };

  if (isLoading) return <Box>Loading...</Box>;

  // Show empty state if no ambulances
  if (!ambulances || ambulances.length === 0) {
    return (
      <Box>
        <GenericPageHeader
          title="Ambulance Fleet Management"
          subtitle="Manage ambulance fleet and track status"
          actions={[
            {
              icon: <FontAwesomeIcon icon={faPlus} />,
              tooltip: "Add New Ambulance",
              onClick: () => handleOpenDialog(),
              color: 'primary',
              isFab: false,
            }
          ]}
        />

        <EmptyState
          icon={<FontAwesomeIcon icon={faAmbulance} size="3x" />}
          title="No Ambulances in Fleet"
          description="You haven't added any ambulances to your fleet yet. Add your first ambulance to start tracking and managing your EMS operations."
          actionLabel="Add First Ambulance"
          onAction={() => handleOpenDialog()}
        />

        <AmbulanceForm
          open={openDialog}
          editingAmbulance={editingAmbulance}
          formData={formData}
          onClose={handleCloseDialog}
          onSubmit={handleSubmit}
          onFormDataChange={handleFormDataChange}
          drivers={activeDrivers}
          loading={isSubmitting}
          errors={formErrors}
        />
      </Box>
    );
  }

  return (
    <Box>
      <GenericPageHeader
        title="Ambulance Fleet Management"
        subtitle="Manage ambulance fleet and track status"
        actions={[
          {
            icon: <FontAwesomeIcon icon={faPlus} />,
            tooltip: "Add New Ambulance",
            onClick: () => handleOpenDialog(),
            color: 'primary',
            isFab: false,
          }
        ]}
      />

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Ambulances
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {stats.available}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {stats.inUse}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Use
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Box sx={{ mt: 3, mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by Call Sign, Plate Number, IMEI, or Driver Name..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          size="small"
        />
      </Box>

      {/* Ambulance Table */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <AmbulanceTable
            ambulances={ambulances}
            onEdit={handleOpenDialog}
            onDelete={deleteAmbulance}
            getStatusColor={getStatusColor}
            getTypeColor={getTypeColor}
            getEquipmentStatusColor={getEquipmentStatusColor}
          />
          <TablePagination
            component="div"
            count={total}
            page={page - 1} // Material UI is 0-indexed
            onPageChange={handleChangePage}
            rowsPerPage={limit}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </CardContent>
      </Card>

      <AmbulanceForm
        open={openDialog}
        editingAmbulance={editingAmbulance}
        formData={formData}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        onFormDataChange={handleFormDataChange}
        drivers={activeDrivers}
        loading={isSubmitting}
        errors={formErrors}
      />
    </Box>
  );
};

export default AmbulanceManagement;