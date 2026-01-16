import React, { useState , useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  Box,
  IconButton,
  alpha,
} from '@mui/material';
import { useQuery } from 'react-query';
import { Close, Edit, Delete, Security, Description, MedicalServices, Science, History, Person, CalendarToday, AttachFile, Healing, LocalPharmacy } from '@mui/icons-material';
import { format } from 'date-fns';
import { MedicalRecord, medicalRecordService } from '../../../../services/medicalRecordService';
import { useAuth } from '../../../../contexts/AuthContext';
import GenericTabs from '../../../../components/Common/GenericTabs';
import MedicalRecordAccessLogsTab from './MedicalRecordAccessLogsTab';
import MedicalRecordAttachmentViewer from '../../../../components/MedicalRecords/MedicalRecordAttachmentViewer';
import {
  getRecordTypeColor,
  getRecordTypeIcon,
  getRecordTypeLabel,
} from '../../utils/medicalRecordTypeUtils';
import { DetailField, SectionCard } from './MedicalRecordDetailsDialogComponents';

interface MedicalRecordDetailsDialogProps {
  open: boolean;
  medicalRecord: MedicalRecord | null;
  onClose: () => void;
  onEdit?: (medicalRecord: MedicalRecord) => void;
  onDelete?: (medicalRecord: MedicalRecord) => void;
}

const MedicalRecordDetailsDialog: React.FC<MedicalRecordDetailsDialogProps> = ({
  open,
  medicalRecord,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [recordData, setRecordData] = useState<MedicalRecord | null>(medicalRecord);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'RCC';

  const { data: fetchedRecord, isLoading } = useQuery(
    ['medicalRecord', medicalRecord?.id],
    () => medicalRecordService.getMedicalRecord(medicalRecord!.id),
    {
      enabled: !!medicalRecord?.id && open,
      onSuccess: (data) => setRecordData(data),
      onError: (err) => console.error('Failed to fetch medical record details:', err),
    }
  );

  useEffect(() => {
    if (fetchedRecord) {
      setRecordData(fetchedRecord);
    }
  }, [fetchedRecord]);

  const handleDeleteAttachmentCallback = (attachmentId: string) => {
    if (recordData) {
      setRecordData({
        ...recordData,
        attachments: recordData.attachments?.filter((a) => a.id !== attachmentId),
      });
    }
  };

  if (!medicalRecord || !recordData) return null;

  const currentRecord = recordData;

  const recordColor = getRecordTypeColor(currentRecord.recordType);
  const recordIcon = getRecordTypeIcon(currentRecord.recordType);
  const recordTypeLabel = getRecordTypeLabel(currentRecord.recordType);

  const formatField = (value: string | null | undefined) => {
    if (!value || value.trim() === '') return 'Not specified';
    return value;
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Define tabs configuration
  const tabsConfig = [
    {
      label: 'Details',
      content: (
        <Box sx={{ pt: 1 }}>
          <Box
            sx={{
              background: '#ffffff',
              borderRadius: '16px',
              border: `1px solid ${alpha(recordColor, 0.2)}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              padding: '20px 24px',
              marginBottom: 2.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: `linear-gradient(135deg, ${recordColor} 0%, ${alpha(recordColor, 0.8)} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 2px 8px ${alpha(recordColor, 0.3)}`,
                flexShrink: 0,
              }}
            >
              <Box sx={{ color: '#ffffff', fontSize: '28px' }}>{recordIcon}</Box>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 1.5, fontSize: '1.5rem' }}>
                {currentRecord.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={recordTypeLabel}
                  sx={{ backgroundColor: alpha(recordColor, 0.1), color: recordColor, fontWeight: 600, fontSize: '0.8rem', height: '28px' }}
                />
                <Chip
                  label={format(new Date(currentRecord.recordDate), 'PPP')}
                  sx={{ backgroundColor: alpha(recordColor, 0.05), color: 'text.secondary', fontWeight: 500, fontSize: '0.8rem', height: '28px', border: `1px solid ${alpha(recordColor, 0.2)}` }}
                  variant="outlined"
                />
              </Box>
            </Box>
          </Box>

          <SectionCard icon={<Description sx={{ color: '#ffffff', fontSize: '20px' }} />} title="Basic Information" color={recordColor}>
            <DetailField icon={<Description sx={{ color: recordColor, fontSize: '18px' }} />} label="Description" value={formatField(currentRecord.description)} color={recordColor} fullWidth />
            <DetailField icon={<Person sx={{ color: recordColor, fontSize: '18px' }} />} label="Created By" value={currentRecord.createdBy ? `${currentRecord.createdBy.firstName} ${currentRecord.createdBy.lastName}` : 'Unknown'} color={recordColor} />
            <DetailField icon={<CalendarToday sx={{ color: recordColor, fontSize: '18px' }} />} label="Record Date" value={format(new Date(currentRecord.recordDate), 'PPP')} color={recordColor} />
          </SectionCard>

          <SectionCard icon={<MedicalServices sx={{ color: '#ffffff', fontSize: '20px' }} />} title="Clinical Information" color={recordColor}>
            <DetailField icon={<Healing sx={{ color: recordColor, fontSize: '18px' }} />} label="Diagnosis" value={formatField(currentRecord.diagnosis)} color={recordColor} fullWidth />
            <DetailField icon={<MedicalServices sx={{ color: recordColor, fontSize: '18px' }} />} label="Treatment" value={formatField(currentRecord.treatment)} color={recordColor} fullWidth />
            <DetailField icon={<LocalPharmacy sx={{ color: recordColor, fontSize: '18px' }} />} label="Medications" value={formatField(currentRecord.medications)} color={recordColor} fullWidth />
          </SectionCard>

          <SectionCard icon={<Science sx={{ color: '#ffffff', fontSize: '20px' }} />} title="Test Results & Attachments" color={recordColor}>
            <DetailField icon={<Science sx={{ color: recordColor, fontSize: '18px' }} />} label="Test Results" value={formatField(currentRecord.testResults)} color={recordColor} fullWidth />
            <Box sx={{ width: '100%', mt: 1 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachFile sx={{ fontSize: '18px', color: recordColor }} /> Attachments
              </Typography>
              {isLoading ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', pl: 3.5 }}>Loading attachments...</Typography>
              ) : currentRecord.attachments && currentRecord.attachments.length > 0 ? (
                <MedicalRecordAttachmentViewer
                  attachments={currentRecord.attachments}
                  showDelete={true}
                  onDelete={handleDeleteAttachmentCallback}
                />
              ) : (
                <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic', pl: 3.5 }}>No attachments</Typography>
              )}
            </Box>
          </SectionCard>

          <SectionCard icon={<History sx={{ color: '#ffffff', fontSize: '20px' }} />} title="System Information" color={recordColor}>
            <DetailField icon={<CalendarToday sx={{ color: recordColor, fontSize: '18px' }} />} label="Created At" value={format(new Date(currentRecord.createdAt), 'PPpp')} color={recordColor} />
            <DetailField icon={<CalendarToday sx={{ color: recordColor, fontSize: '18px' }} />} label="Last Updated" value={format(new Date(currentRecord.updatedAt), 'PPpp')} color={recordColor} />
          </SectionCard>
        </Box>
      ),
      icon: <Edit />,
    },
    ...(isAdmin
      ? [
        {
          label: 'Access Logs',
          content: (
            <MedicalRecordAccessLogsTab
              entityId={currentRecord.id}
              fetchLogs={medicalRecordService.getAccessLogs.bind(medicalRecordService)}
              entityLabel={`Medical Record "${currentRecord.title}" Access Logs`}
            />
          ),
          icon: <Security />,
        },
      ]
      : []),
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
        },
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${alpha(recordColor, 0.1)} 0%, ${alpha(recordColor, 0.05)} 100%)`,
          borderBottom: `1px solid ${alpha(recordColor, 0.2)}`,
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
            Medical Record Details
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ minHeight: '400px' }}>
        <GenericTabs
          tabs={tabsConfig}
          value={tabValue}
          onChange={handleTabChange}
        />
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose}>
          Close
        </Button>
        {onEdit && (
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => onEdit(currentRecord)}
            sx={{
              background: `linear-gradient(135deg, ${recordColor} 0%, ${alpha(recordColor, 0.8)} 100%)`,
              boxShadow: `0 2px 8px ${alpha(recordColor, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(135deg, ${alpha(recordColor, 0.9)} 0%, ${alpha(recordColor, 0.7)} 100%)`,
                boxShadow: `0 4px 12px ${alpha(recordColor, 0.4)}`,
              },
            }}
          >
            Edit Record
          </Button>
        )}
        {onDelete && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => onDelete(currentRecord)}
          >
            Delete Record
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MedicalRecordDetailsDialog;
