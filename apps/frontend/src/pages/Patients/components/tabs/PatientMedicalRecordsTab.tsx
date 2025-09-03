import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  Edit,
  Visibility,
  Add,
  Delete,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { MedicalRecord, medicalRecordService } from '../../../../services/medicalRecordService';
import {
  MedicalRecordFormDialog,
  MedicalRecordDetailsDialog,
} from '../dialogs';

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
  const [isDeleting, setIsDeleting] = useState(false);

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

    try {
      setIsDeleting(true);
      await medicalRecordService.deleteMedicalRecord(selectedRecord.id);
      onMedicalRecordDeleted?.(selectedRecord.id);
      handleDeleteDialogClose();
    } catch (error) {
      console.error('Error deleting medical record:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMedicalRecordCreated = (medicalRecord: MedicalRecord) => {
    onMedicalRecordCreated?.(medicalRecord);
    handleAddDialogClose();
  };

  const handleMedicalRecordUpdated = (medicalRecord: MedicalRecord) => {
    onMedicalRecordUpdated?.(medicalRecord);
    handleAddDialogClose();
  };

  return (
    <Card>
      <CardHeader 
        title="Medical Records" 
        action={
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={handleAddRecord}
          >
            Add Record
          </Button>
        }
      />
      <CardContent>
        {medicalRecords && medicalRecords.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {medicalRecords.map((record: MedicalRecord) => (
                  <TableRow key={record.id}>
                    <TableCell>{format(new Date(record.recordDate), 'PP')}</TableCell>
                    <TableCell>
                      <Chip label={record.recordType} size="small" />
                    </TableCell>
                    <TableCell>{record.title}</TableCell>
                    <TableCell>
                      {record.createdBy?.firstName} {record.createdBy?.lastName}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small"
                          onClick={() => handleViewRecord(record)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Record">
                        <IconButton 
                          size="small"
                          onClick={() => handleEditRecord(record)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Record">
                        <IconButton 
                          size="small"
                          color="error"
                          onClick={() => handleDeleteRecord(record)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No medical records found
          </Typography>
        )}
      </CardContent>

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
    </Card>
  );
};

export default PatientMedicalRecordsTab;
