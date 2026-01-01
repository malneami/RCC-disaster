import React from 'react';
import {
  Grid,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  LocalHospital as MedicalIcon,
  Phone as PhoneIcon,
  ContactEmergency as EmergencyIcon,
  HealthAndSafety as InsuranceIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { CreatePatientData } from '../../../../services/patientService';
import { formatAgeForDisplay } from '../../../../utils/ageCalculator';

interface ReviewStepProps {
  formData: CreatePatientData;
  isEditing?: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ formData, isEditing = false }) => {
  const getPrivacyLevelColor = (privacyLevel: string) => {
    switch (privacyLevel) {
      case 'CONFIDENTIAL':
        return { bg: 'linear-gradient(135deg, #ef5350 0%, #e57373 100%)', color: '#ffffff' };
      case 'RESTRICTED':
        return { bg: 'linear-gradient(135deg, #ffa726 0%, #ffb74d 100%)', color: '#ffffff' };
      case 'PRIVATE':
        return { bg: 'linear-gradient(135deg, #42a5f5 0%, #64b5f6 100%)', color: '#ffffff' };
      case 'INTERNAL':
        return { bg: 'linear-gradient(135deg, #66bb6a 0%, #81c784 100%)', color: '#ffffff' };
      case 'PUBLIC':
        return { bg: 'linear-gradient(135deg, #9e9e9e 0%, #bdbdbd 100%)', color: '#ffffff' };
      default:
        return { bg: 'linear-gradient(135deg, #9e9e9e 0%, #bdbdbd 100%)', color: '#ffffff' };
    }
  };

  const privacyColors = getPrivacyLevelColor(formData.privacyLevel || 'PRIVATE');

  const InfoCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    gradient: string;
    children: React.ReactNode;
  }> = ({ title, icon, gradient, children }) => (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid rgba(66, 165, 245, 0.25)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', fontSize: '1.125rem' }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ flex: 1 }}>{children}</Box>
    </Box>
  );

  const InfoRow: React.FC<{ label: string; value: string | React.ReactNode }> = ({ label, value }) => (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.875rem', fontWeight: 500 }}>
        {value || 'Not provided'}
      </Typography>
    </Box>
  );

  return (
    <Box>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(66, 165, 245, 0.25)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #66bb6a 0%, #81c784 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(102, 187, 106, 0.3)',
            }}
          >
            <CheckIcon sx={{ fontSize: '24px' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', fontSize: '1.25rem' }}>
              Review Patient Information
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem', mt: 0.25 }}>
              Please review all information before {isEditing ? 'updating' : 'creating'} the patient record
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <InfoCard
            title="Personal Information"
            icon={<PersonIcon sx={{ fontSize: '20px' }} />}
            gradient="linear-gradient(135deg, #42a5f5 0%, #64b5f6 100%)"
          >
            <InfoRow label="Name" value={`${formData.firstName || ''} ${formData.middleName || ''} ${formData.lastName || ''}`.trim()} />
            <InfoRow label="Age" value={formatAgeForDisplay(formData.age, formData.dateOfBirth, formData.ageMonths, formData.ageDays)} />
            <InfoRow label="Gender" value={formData.gender || ''} />
            <InfoRow label="Marital Status" value={formData.maritalStatus || ''} />
            <InfoRow label="National ID" value={formData.nationalId || ''} />
            <InfoRow label="MRN" value={formData.mrn || ''} />
          </InfoCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <InfoCard
            title="Medical Information"
            icon={<MedicalIcon sx={{ fontSize: '20px' }} />}
            gradient="linear-gradient(135deg, #ef5350 0%, #e57373 100%)"
          >
            <InfoRow label="Blood Type" value={formData.bloodType || ''} />
            <InfoRow label="RH Factor" value={formData.rhFactor || ''} />
            <InfoRow label="Weight" value={formData.weight ? `${formData.weight} kg` : ''} />
            <InfoRow label="Height" value={formData.height ? `${formData.height} cm` : ''} />
            {formData.allergies && <InfoRow label="Allergies" value={formData.allergies} />}
            {formData.medications && <InfoRow label="Medications" value={formData.medications} />}
          </InfoCard>
        </Grid>

        {isEditing && (
          <>
            <Grid item xs={12} md={6}>
              <InfoCard
                title="Contact Information"
                icon={<PhoneIcon sx={{ fontSize: '20px' }} />}
                gradient="linear-gradient(135deg, #42a5f5 0%, #64b5f6 100%)"
              >
                <InfoRow label="Phone" value={formData.phoneNumber || ''} />
                <InfoRow label="Email" value={formData.email || ''} />
                <InfoRow
                  label="Address"
                  value={
                    formData.address
                      ? `${formData.address}, ${formData.city || ''}, ${formData.state || ''} ${formData.zipCode || ''}`.trim()
                      : ''
                  }
                />
                <InfoRow label="Country" value={formData.country || ''} />
              </InfoCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <InfoCard
                title="Emergency Contact"
                icon={<EmergencyIcon sx={{ fontSize: '20px' }} />}
                gradient="linear-gradient(135deg, #ffa726 0%, #ffb74d 100%)"
              >
                <InfoRow label="Name" value={formData.emergencyContact || ''} />
                <InfoRow label="Phone" value={formData.emergencyPhone || ''} />
                <InfoRow label="Email" value={formData.emergencyEmail || ''} />
                <InfoRow label="Relationship" value={formData.emergencyRelationship || ''} />
              </InfoCard>
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <InfoCard
            title="Insurance & Privacy"
            icon={<InsuranceIcon sx={{ fontSize: '20px' }} />}
            gradient="linear-gradient(135deg, #66bb6a 0%, #81c784 100%)"
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <InfoRow label="Insurance Provider" value={formData.insuranceProvider || ''} />
                <InfoRow label="Policy Number" value={formData.insuranceNumber || ''} />
                <InfoRow label="Group Number" value={formData.insuranceGroup || ''} />
                <InfoRow label="Expiry Date" value={formData.insuranceExpiry || ''} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Privacy Level
                  </Typography>
                  <Chip
                    label={formData.privacyLevel || 'PRIVATE'}
                    size="small"
                    sx={{
                      background: privacyColors.bg,
                      color: privacyColors.color,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      height: '24px',
                    }}
                  />
                </Box>
                <InfoRow label="Consent Given" value={formData.consentGiven ? 'Yes' : 'No'} />
                {formData.dataRetentionPolicy && <InfoRow label="Data Retention" value={formData.dataRetentionPolicy} />}
              </Grid>
            </Grid>
          </InfoCard>
        </Grid>
      </Grid>

      <Box
        sx={{
          mt: 3,
          p: 2.5,
          background: 'linear-gradient(135deg, rgba(102, 187, 106, 0.08) 0%, rgba(129, 199, 132, 0.08) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(102, 187, 106, 0.25)',
          boxShadow: '0 2px 8px rgba(102, 187, 106, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <CheckIcon sx={{ color: '#66bb6a', fontSize: '24px' }} />
        <Typography variant="body2" sx={{ color: '#2e7d32', fontSize: '0.875rem', lineHeight: 1.6 }}>
          <strong>Ready to {isEditing ? 'Update' : 'Create'}:</strong> All required information has been provided. Click "Complete" to {isEditing ? 'update' : 'create'} the patient record.
        </Typography>
      </Box>
    </Box>
  );
};

export default ReviewStep;
