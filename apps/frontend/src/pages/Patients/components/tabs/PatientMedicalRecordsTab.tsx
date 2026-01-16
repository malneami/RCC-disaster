import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  alpha,
} from '@mui/material';
import {
  Add,
  MedicalServices,
  Inbox,
} from '@mui/icons-material';
import { useMutation } from 'react-query';
import { MedicalRecord, medicalRecordService } from '../../../../services/medicalRecordService';
import {
  MedicalRecordFormDialog,
  MedicalRecordDetailsDialog,
} from '../dialogs';
import MedicalRecordCard from './MedicalRecordCard';

interface PatientMedicalRecordsTabProps {
  medicalRecords: MedicalRecord[];
  patientId: string;
  onMedicalRecordCreated?: (medicalRecord: MedicalRecord) => void;
  onMedicalRecordUpdated?: (medicalRecord: MedicalRecord) => void;
  onMedicalRecordDeleted?: (medicalRecordId: string) => void;
}

const PatientMedicalRecordsTab: React.FC<PatientMedicalRecordsTabProps> = ({ 
  medicalRecords, 
  patientId,
  onMedicalRecordCreated,
  onMedicalRecordUpdated,
  onMedicalRecordDeleted
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  const { mutateAsync: deleteRecord, isLoading: isDeleting } = useMutation(
    (id: string) => medicalRecordService.deleteMedicalRecord(id),
    {
      onSuccess: (_, id) => {
        onMedicalRecordDeleted?.(id);
        handleDeleteDialogClose();
      },
      onError: (error) => {
        console.error('Error deleting medical record:', error);
      }
    }
  );

  const handleAddRecord = () => {
    setShowAddDialog(true);
  };

  const handleViewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowDetailsDialog(true);
  };

  const handleEditRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowAddDialog(true);
  };

  const handleDeleteRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowDeleteDialog(true);
  };

  const handleAddDialogClose = () => {
    setShowAddDialog(false);
    setSelectedRecord(null);
  };

  const handleDetailsDialogClose = () => {
    setShowDetailsDialog(false);
    setSelectedRecord(null);
  };

  const handleDeleteDialogClose = () => {
    setShowDeleteDialog(false);
    setSelectedRecord(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRecord) return;
    await deleteRecord(selectedRecord.id);
  };

  const handleMedicalRecordCreated = (medicalRecord: MedicalRecord) => {
    onMedicalRecordCreated?.(medicalRecord);
    handleAddDialogClose();
  };

  const handleMedicalRecordUpdated = (medicalRecord: MedicalRecord) => {
    onMedicalRecordUpdated?.(medicalRecord);
    handleAddDialogClose();
  };

  const cardColor = '#42a5f5';

  return (
    <Box>
      {/* Header Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(cardColor, 0.1)} 0%, ${alpha(cardColor, 0.05)} 100%)`,
          borderRadius: '16px',
          border: `1px solid ${alpha(cardColor, 0.2)}`,
          padding: '18px 24px',
          marginBottom: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${cardColor} 0%, ${alpha(cardColor, 0.8)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 2px 8px ${alpha(cardColor, 0.3)}`,
            }}
          >
            <MedicalServices sx={{ color: '#ffffff', fontSize: '24px' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.1rem' }}>
              Medical Records
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 0.25 }}>
              {medicalRecords?.length || 0} record{medicalRecords?.length !== 1 ? 's' : ''} found
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddRecord}
          sx={{
            background: `linear-gradient(135deg, ${cardColor} 0%, ${alpha(cardColor, 0.8)} 100%)`,
            boxShadow: `0 2px 8px ${alpha(cardColor, 0.3)}`,
            '&:hover': {
              background: `linear-gradient(135deg, ${alpha(cardColor, 0.9)} 0%, ${alpha(cardColor, 0.7)} 100%)`,
              boxShadow: `0 4px 12px ${alpha(cardColor, 0.4)}`,
            },
          }}
        >
          Add Record
        </Button>
      </Box>

      {/* Records List */}
      {medicalRecords && medicalRecords.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {medicalRecords.map((record: MedicalRecord) => (
            <MedicalRecordCard
              key={record.id}
              record={record}
              onView={handleViewRecord}
              onEdit={handleEditRecord}
              onDelete={handleDeleteRecord}
            />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            background: '#ffffff',
            borderRadius: '16px',
            border: `1px solid ${alpha(cardColor, 0.2)}`,
            padding: '60px 24px',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${alpha(cardColor, 0.1)} 0%, ${alpha(cardColor, 0.05)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Inbox sx={{ color: cardColor, fontSize: '40px' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
            No Medical Records
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Start by adding a new medical record for this patient
          </Typography>
        </Box>
      )}

      {/* Medical Record Form Dialog */}
      <MedicalRecordFormDialog
        open={showAddDialog}
        patientId={patientId}
        medicalRecord={selectedRecord}
        onClose={handleAddDialogClose}
        onMedicalRecordCreated={handleMedicalRecordCreated}
        onMedicalRecordUpdated={handleMedicalRecordUpdated}
      />

      {/* Medical Record Details Dialog */}
      <MedicalRecordDetailsDialog
        open={showDetailsDialog}
        medicalRecord={selectedRecord}
        onClose={handleDetailsDialogClose}
        onEdit={handleEditRecord}
        onDelete={handleDeleteRecord}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Medical Record</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the medical record "{selectedRecord?.title}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientMedicalRecordsTab;
