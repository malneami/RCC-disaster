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
  faAmbulance, 
  faPlus
} from '@fortawesome/free-solid-svg-icons';

import { useAmbulances } from '../hooks/useAmbulances';
import { useEMSDrivers } from '../hooks/useEMSDrivers';
import { Ambulance } from '../types/ems';
import AmbulanceForm from './AmbulanceForm';
import AmbulanceTable from './AmbulanceTable';
import GenericPageHeader from '../../../components/Common/GenericPageHeader';
import EmptyState from '../../../components/Common/EmptyState';

const AmbulanceManagement: React.FC = () => {
  const { ambulances, isLoading, createAmbulance, updateAmbulance, deleteAmbulance } = useAmbulances();
  const { drivers } = useEMSDrivers();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAmbulance, setEditingAmbulance] = useState<Ambulance | null>(null);
  const [formData, setFormData] = useState({
    vehicleId: '',
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

  const handleOpenDialog = (ambulance?: Ambulance) => {
    if (ambulance) {
      setEditingAmbulance(ambulance);
      setFormData({
        vehicleId: ambulance.vehicleId,
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
        vehicleId: '',
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
  };

  const handleSubmit = async () => {
    try {
      if (editingAmbulance) {
        await updateAmbulance({ id: editingAmbulance.id, data: formData });
      } else {
        await createAmbulance(formData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving ambulance:', error);
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
                {stats.total}
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
        </CardContent>
      </Card>

      <AmbulanceForm
        open={openDialog}
        editingAmbulance={editingAmbulance}
        formData={formData}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        onFormDataChange={handleFormDataChange}
        drivers={drivers}
      />
    </Box>
  );
};

export default AmbulanceManagement;