import React from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
} from '@mui/material';
import { CreatePatientData } from '../../../../services/patientService';

interface ReviewStepProps {
  formData: CreatePatientData;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ formData }) => {

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Patient Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please review all the information before creating the patient record.
      </Typography>

      <Grid container spacing={3}>
        {/* Personal Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Name</Typography>
                <Typography variant="body1">
                  {formData.firstName} {formData.middleName} {formData.lastName}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Age</Typography>
                <Typography variant="body1">{formData.age ? `${formData.age} years` : 'N/A'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Gender</Typography>
                <Typography variant="body1">{formData.gender}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Marital Status</Typography>
                <Typography variant="body1">{formData.maritalStatus}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">National ID</Typography>
                <Typography variant="body1">{formData.nationalId || 'Not provided'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">MRN</Typography>
                <Typography variant="body1">{formData.mrn || 'Not provided'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{formData.phoneNumber || 'Not provided'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{formData.email || 'Not provided'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Address</Typography>
                <Typography variant="body1">
                  {formData.address ? `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}` : 'Not provided'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Country</Typography>
                <Typography variant="body1">{formData.country}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Emergency Contact */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emergency Contact
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Name</Typography>
                <Typography variant="body1">{formData.emergencyContact || 'Not provided'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{formData.emergencyPhone || 'Not provided'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{formData.emergencyEmail || 'Not provided'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Relationship</Typography>
                <Typography variant="body1">{formData.emergencyRelationship || 'Not provided'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Medical Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Medical Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Blood Type</Typography>
                <Typography variant="body1">{formData.bloodType || 'Not provided'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">RH Factor</Typography>
                <Typography variant="body1">{formData.rhFactor || 'Not provided'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Weight</Typography>
                <Typography variant="body1">{formData.weight ? `${formData.weight} kg` : 'Not provided'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Height</Typography>
                <Typography variant="body1">{formData.height ? `${formData.height} cm` : 'Not provided'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Insurance & Privacy */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Insurance & Privacy
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Insurance Provider</Typography>
                    <Typography variant="body1">{formData.insuranceProvider || 'Not provided'}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Policy Number</Typography>
                    <Typography variant="body1">{formData.insuranceNumber || 'Not provided'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Privacy Level</Typography>
                    <Chip 
                      label={formData.privacyLevel} 
                      color={formData.privacyLevel === 'CONFIDENTIAL' ? 'error' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Consent Given</Typography>
                    <Typography variant="body1">
                      {formData.consentGiven ? 'Yes' : 'No'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      
      <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
        <Typography variant="body2" color="success.contrastText">
          <strong>Ready to Create:</strong> All required information has been provided. 
          Click "Complete" to create the patient record.
        </Typography>
      </Box>
    </Box>
  );
};

export default ReviewStep;
