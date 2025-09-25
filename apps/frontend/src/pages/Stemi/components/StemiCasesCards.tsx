import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Divider,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { StemiCase } from '../services/stemiService';
import UnifiedCaseCard, { 
  UnifiedCaseCardProps, 
  PatientInfo, 
  TimeMetric, 
  PerformanceIndicator, 
  CaseAction 
} from '../../../components/Common/UnifiedCaseCard';
import CaseNoteModal from '../../../pages/NotificationCenter/components/CaseNoteModal';
import { notificationService } from '../../../services/notificationService';

interface StemiCasesCardsProps {
  cases: StemiCase[];
  loading: boolean;
  onEditCase: (case_: StemiCase) => void;
  onViewCase: (case_: StemiCase) => void;
  onDeleteCase: (id: string) => void;
}

const StemiCasesCards: React.FC<StemiCasesCardsProps> = ({
  cases,
  loading,
  onEditCase,
  onViewCase,
  onDeleteCase,
}) => {
  const [showCaseNoteModal, setShowCaseNoteModal] = useState(false);
  const [selectedCaseForNote, setSelectedCaseForNote] = useState<StemiCase | null>(null);

  const handleAddCaseNote = (stemiCase: StemiCase) => {
    setSelectedCaseForNote(stemiCase);
    setShowCaseNoteModal(true);
  };

  const handleCaseNoteSubmit = async (data: any) => {
    try {
      await notificationService.createCaseNote(data);
      setShowCaseNoteModal(false);
      setSelectedCaseForNote(null);
    } catch (error) {
      console.error('Error creating case note:', error);
    }
  };

  const handleCaseNoteClose = () => {
    setShowCaseNoteModal(false);
    setSelectedCaseForNote(null);
  };
  const transformStemiCase = (stemiCase: StemiCase): UnifiedCaseCardProps => {
    const patient: PatientInfo = {
      name: `${stemiCase.patient?.firstName || ''} ${stemiCase.patient?.lastName || ''}`.trim(),
      age: stemiCase.patient?.age || 0,
      gender: stemiCase.patient?.gender || 'MALE',
      id: stemiCase.id,
      nationalId: stemiCase.patient?.nationalId,
      mrn: stemiCase.patient?.nationalId,
      admissionDate: stemiCase.createdAt,
      modeOfArrival: stemiCase.modeOfArrival,
    };

    // Calculate targets met
    const targetsMet = calculateTargetsMet(stemiCase);
    const overallScore = calculateOverallScore(stemiCase);
    
    // Performance indicators
    const performanceIndicators: PerformanceIndicator[] = [
      {
        label: stemiCase.currentStatus.replace(/_/g, ' '),
        met: stemiCase.currentStatus !== 'SUSPECTED',
        color: getStatusColor(stemiCase.currentStatus),
      },
      {
        label: stemiCase.ecgResult || 'Pending',
        met: stemiCase.ecgResult !== 'PENDING',
        color: getEcgResultColor(stemiCase.ecgResult),
      },
    ];

    // Time metrics
    const timeMetrics: TimeMetric[] = [
      {
        label: 'Door to ECG',
        value: stemiCase.doorToEcgMinutes || 'N/A',
        target: '≤10min',
        unit: 'min',
        met: !stemiCase.doorToEcgMinutes || stemiCase.doorToEcgMinutes <= 10,
        percentage: stemiCase.doorToEcgMinutes ? (stemiCase.doorToEcgMinutes / 10) * 100 : undefined,
      },
      {
        label: 'Door In-Door Out',
        value: stemiCase.doorInDoorOutMinutes || 'N/A',
        target: '≤30min',
        unit: 'min',
        met: !stemiCase.doorInDoorOutMinutes || stemiCase.doorInDoorOutMinutes <= 30,
        percentage: stemiCase.doorInDoorOutMinutes ? (stemiCase.doorInDoorOutMinutes / 30) * 100 : undefined,
      },
      ...(stemiCase.caseType === 'TRANSFER' && stemiCase.rccActivationToDoorOutMinutes !== null && stemiCase.rccActivationToDoorOutMinutes !== undefined ? [{
        label: 'RCC Activation',
        value: stemiCase.rccActivationToDoorOutMinutes,
        target: '≤15min',
        unit: 'min',
        met: stemiCase.rccActivationToDoorOutMinutes <= 15,
        percentage: (stemiCase.rccActivationToDoorOutMinutes / 15) * 100,
      }] : []),
      // Door to Balloon - only for PCI-eligible cases
      ...(stemiCase.eligibleForPrimaryPci ? [{
        label: 'Door to Balloon',
        value: stemiCase.doorToBalloonMinutes || 'N/A',
        target: stemiCase.caseType === 'TRANSFER' ? '≤120min' : '≤90min',
        unit: 'min',
        met: !stemiCase.doorToBalloonMinutes || stemiCase.doorToBalloonMinutes <= (stemiCase.caseType === 'TRANSFER' ? 120 : 90),
        percentage: stemiCase.doorToBalloonMinutes ? (stemiCase.doorToBalloonMinutes / (stemiCase.caseType === 'TRANSFER' ? 120 : 90)) * 100 : undefined,
      }] : []),
      // Door to Needle - only for thrombolytic cases
      ...(stemiCase.thrombolyticGiven ? [{
        label: 'Door to Needle',
        value: stemiCase.doorToNeedleMinutes || 'N/A',
        target: '≤30min',
        unit: 'min',
        met: !stemiCase.doorToNeedleMinutes || stemiCase.doorToNeedleMinutes <= 30,
        percentage: stemiCase.doorToNeedleMinutes ? (stemiCase.doorToNeedleMinutes / 30) * 100 : undefined,
      }] : []),
    ];

    // Data completeness - use backend percentage if available
    const dataCompleteness = stemiCase.outcomePercentageCompleteness !== undefined 
      ? {
          percentage: stemiCase.outcomePercentageCompleteness,
          completed: Math.round((stemiCase.outcomePercentageCompleteness / 100) * 20), // Assuming 20 total fields
          total: 20,
        }
      : calculateDataCompleteness(stemiCase);

    // Case details
    const caseDetails = {
      'ID/Iqamah': stemiCase.patient?.nationalId || 'N/A',
      'Mode of Arrival': stemiCase.modeOfArrival || 'N/A',
    };

    // Actions
    const actions: CaseAction[] = [
      {
        label: 'View Details',
        icon: <ViewIcon />,
        onClick: () => onViewCase(stemiCase),
        color: 'primary',
        variant: 'outlined',
      },
      {
        label: 'Add Case Note',
        icon: <CommentIcon />,
        onClick: () => handleAddCaseNote(stemiCase),
        color: 'primary',
        variant: 'outlined',
      },
      {
        label: 'Edit Case',
        icon: <EditIcon />,
        onClick: () => onEditCase(stemiCase),
        color: 'secondary',
        variant: 'outlined',
      },
      {
        label: 'Delete Case',
        icon: <DeleteIcon />,
        onClick: () => onDeleteCase(stemiCase.id),
        color: 'error',
        variant: 'outlined',
      },
    ];

    // Expandable content
    const expandableContent = (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Critical Timestamps
        </Typography>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Triage Time: {stemiCase.triageTime || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              First ECG Time: {stemiCase.firstEcgTime || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Door to ECG Time: {stemiCase.doorToEcgMinutes || 'N/A'} min
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Door Out Time: {stemiCase.doorOutTime || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Cath Lab Prep Time: {stemiCase.cathLabActivationTime || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              PCI Procedure Start: {stemiCase.pciProcedureStartTime || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Device Activation Time: {stemiCase.cathLabActivationTime || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Legacy Balloon Time: {stemiCase.balloonInflationTime || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Cath Lab Activation: {stemiCase.cathLabActivationTime || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Cath Lab Arrival: {stemiCase.cathLabArrivalTime || 'N/A'}
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" gutterBottom>
          Treatment Information
        </Typography>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Thrombolytic Given: {stemiCase.thrombolyticGiven ? 'Yes' : 'No'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              PCI Eligible: {stemiCase.eligibleForPrimaryPci ? 'Yes' : 'No'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              PCI Location: {stemiCase.pciLocation || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Primary PCI Success: {stemiCase.successful ? 'Yes' : 'No'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Thrombolysis Success: {stemiCase.thrombolyticGiven ? 'Yes' : 'No'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Outcome: {stemiCase.currentStatus.replace(/_/g, ' ')}
            </Typography>
          </Grid>
        </Grid>
        
      </Box>
    );

    return {
      patient,
      caseId: stemiCase.id,
      caseType: 'stemi' as const,
      status: stemiCase.currentStatus,
      targetsMet,
      overallScore,
      performanceIndicators,
      timeMetrics,
      dataCompleteness,
      caseDetails,
      actions,
      expandableContent,
    };
  };

  const calculateTargetsMet = (stemiCase: StemiCase): string => {
    let met = 0;
    let total = 0;

    // Door to ECG (≤10min)
    total++;
    if (stemiCase.doorToEcgMinutes && stemiCase.doorToEcgMinutes <= 10) {
      met++;
    }

    // Door In-Door Out (≤30min) - only for transfer cases
    if (stemiCase.caseType === 'TRANSFER') {
      total++;
      if (stemiCase.doorInDoorOutMinutes && stemiCase.doorInDoorOutMinutes <= 30) {
        met++;
      }
    }

    // Door to Balloon - only for PCI-eligible cases
    if (stemiCase.eligibleForPrimaryPci) {
      total++;
      const doorToBalloonTarget = stemiCase.caseType === 'TRANSFER' ? 120 : 90;
      if (stemiCase.doorToBalloonMinutes && stemiCase.doorToBalloonMinutes <= doorToBalloonTarget) {
        met++;
      }
    }

    // Door to Needle (≤30min) - only for thrombolytic cases
    if (stemiCase.thrombolyticGiven) {
      total++;
      if (stemiCase.doorToNeedleMinutes && stemiCase.doorToNeedleMinutes <= 30) {
        met++;
      }
    }

    return `${met}/${total}`;
  };

  const calculateOverallScore = (stemiCase: StemiCase): string => {
    const targetsMet = calculateTargetsMet(stemiCase);
    const met = parseInt(targetsMet.split('/')[0]);
    const total = parseInt(targetsMet.split('/')[1]);
    return `${Math.round((met / total) * 100)}%`;
  };

  const calculateDataCompleteness = (stemiCase: StemiCase) => {
    const fields = [
      'currentStatus',
      'modeOfArrival',
      'ecgResult',
      'selectedTreatment',
      'doorToEcgMinutes',
      'doorInDoorOutMinutes',
      'doorToBalloonMinutes',
      'triageTime',
      'firstEcgTime',
      'doorOutTime',
      'cathLabActivationTime',
      'cathLabArrivalTime',
      'pciProcedureStartTime',
      'balloonInflationTime',
      'thrombolyticGiven',
      'eligibleForPrimaryPci',
    ];

    const completed = fields.filter(field => {
      const value = (stemiCase as any)[field];
      return value !== null && value !== undefined && value !== '';
    }).length;

    return {
      percentage: Math.round((completed / fields.length) * 100),
      completed,
      total: fields.length,
    };
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'BALLOON_INFLATED':
      case 'CCU_ADMITTED':
      case 'DISCHARGED':
        return 'success';
      case 'RCC_ACTIVATED':
      case 'IN_TRANSIT':
      case 'PCI_READY':
        return 'info';
      case 'SUSPECTED':
      case 'ECG_PENDING':
        return 'warning';
      case 'EXPIRED':
        return 'error';
      default:
        return 'info';
    }
  };

  const getEcgResultColor = (result: string | undefined): 'success' | 'warning' | 'error' | 'info' => {
    if (!result) return 'info';
    switch (result) {
      case 'NORMAL':
        return 'success';
      case 'STEMI_ANTERIOR':
      case 'STEMI_INFERIOR':
      case 'STEMI_LATERAL':
      case 'STEMI_POSTERIOR':
        return 'error';
      case 'NSTEMI_CHANGES':
      case 'UNSTABLE_PATTERN':
        return 'warning';
      case 'PENDING':
        return 'info';
      default:
        return 'info';
    }
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <Typography>Loading STEMI cases...</Typography>
      </Box>
    );
  }

  if (cases.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No STEMI cases found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create your first STEMI case to get started
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Use the "Create Case" button above to add new STEMI cases
        </Typography>
      </Box>
    );
  }

  // Sort cases by newest first (createdAt descending)
  const sortedCases = [...cases].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Descending order (newest first)
  });

  return (
    <Box>
      <Grid container spacing={2}>
        {sortedCases.map((stemiCase) => {
          const transformedCase = transformStemiCase(stemiCase);
          return (
            <Grid item xs={12} md={6} lg={4} key={transformedCase.caseId}>
              <UnifiedCaseCard {...transformedCase} />
            </Grid>
          );
        })}
      </Grid>

      {/* Case Note Modal */}
      {selectedCaseForNote && (
        <CaseNoteModal
          open={showCaseNoteModal}
          onClose={handleCaseNoteClose}
          onSubmit={handleCaseNoteSubmit}
          patientName={`${selectedCaseForNote.patient?.firstName || ''} ${selectedCaseForNote.patient?.lastName || ''}`.trim()}
          caseType="STEMI"
          caseId={selectedCaseForNote.id}
          patientId={selectedCaseForNote.patientId}
          ticketId={selectedCaseForNote.ticketId}
        />
      )}
    </Box>
  );
};

export default StemiCasesCards;