import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Typography,
  Chip,
} from '@mui/material';
import { format } from 'date-fns';
import type { ObMaternalTransfer } from '../../../services/obMaternalTransferService';
import {
  OB_STATUS_OPTIONS,
  ACTIVATION_LEVEL_OPTIONS,
  EXPECTED_DELIVERY_MODE_OPTIONS,
  ACCEPTANCE_STATUS_OPTIONS,
  AMBULANCE_TYPE_OPTIONS,
  CONSCIOUSNESS_OPTIONS,
  BLEEDING_OPTIONS,
  FETAL_STATUS_OPTIONS,
} from '../constants/obMaternalConstants';

interface ViewObMaternalTransferDialogProps {
  open: boolean;
  transfer: ObMaternalTransfer;
  onClose: () => void;
  onRefresh: () => void;
  onEdit: () => void;
}

const ViewObMaternalTransferDialog: React.FC<ViewObMaternalTransferDialogProps> = ({
  open,
  transfer,
  onClose,
  onEdit,
}) => {
  const label = (v: string, opts: { value: string; label: string }[]) => opts.find((o) => o.value === v)?.label || v;
  const patientName = transfer.patient
    ? `${transfer.patient.firstName} ${transfer.patient.lastName}`.trim()
    : transfer.patientId;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>OB Maternal Transfer Details</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Created</Typography>
            <Typography variant="body1">{format(new Date(transfer.createdAt), 'dd/MM/yyyy HH:mm')}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Status</Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip size="small" label={label(transfer.status, OB_STATUS_OPTIONS)} />
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">Patient</Typography>
            <Typography variant="body1">{patientName}</Typography>
            {transfer.patient?.mrn && (
              <Typography variant="body2" color="text.secondary">MRN: {transfer.patient.mrn}</Typography>
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Ticket</Typography>
            <Typography variant="body1">{transfer.ticket?.ticketNumber || transfer.ticketId}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Gestational Age</Typography>
            <Typography variant="body1">{transfer.gestationalAgeWeeks} weeks</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Gravida / Para</Typography>
            <Typography variant="body1">{transfer.gravida ?? '-'} / {transfer.para ?? '-'}</Typography>
          </Grid>
          {transfer.pregnancyCaseId && (
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Pregnancy Case ID</Typography>
              <Typography variant="body1">{transfer.pregnancyCaseId}</Typography>
            </Grid>
          )}
          {(transfer.sbp != null || transfer.dbp != null || transfer.hr != null || transfer.rr != null || transfer.temp != null || transfer.spo2 != null) && (
            <>
              <Grid item xs={12}><Typography variant="subtitle2">Vitals</Typography></Grid>
              {transfer.sbp != null && <Grid item xs={12} sm={4}><Typography variant="caption" color="text.secondary">SBP</Typography><Typography variant="body2">{transfer.sbp} mmHg</Typography></Grid>}
              {transfer.dbp != null && <Grid item xs={12} sm={4}><Typography variant="caption" color="text.secondary">DBP</Typography><Typography variant="body2">{transfer.dbp} mmHg</Typography></Grid>}
              {transfer.hr != null && <Grid item xs={12} sm={4}><Typography variant="caption" color="text.secondary">HR</Typography><Typography variant="body2">{transfer.hr} bpm</Typography></Grid>}
              {transfer.rr != null && <Grid item xs={12} sm={4}><Typography variant="caption" color="text.secondary">RR</Typography><Typography variant="body2">{transfer.rr}/min</Typography></Grid>}
              {transfer.temp != null && <Grid item xs={12} sm={4}><Typography variant="caption" color="text.secondary">Temp</Typography><Typography variant="body2">{transfer.temp} °C</Typography></Grid>}
              {transfer.spo2 != null && <Grid item xs={12} sm={4}><Typography variant="caption" color="text.secondary">SpO2</Typography><Typography variant="body2">{transfer.spo2}%</Typography></Grid>}
            </>
          )}
          {(transfer.consciousness || transfer.bleeding != null || transfer.seizure != null || transfer.fetalStatus || transfer.fetalHeartRate != null) && (
            <>
              <Grid item xs={12}><Typography variant="subtitle2">Clinical</Typography></Grid>
              {transfer.consciousness && <Grid item xs={12} sm={4}><Typography variant="caption" color="text.secondary">Consciousness</Typography><Typography variant="body2">{label(transfer.consciousness, CONSCIOUSNESS_OPTIONS)}</Typography></Grid>}
              {transfer.bleeding && <Grid item xs={12} sm={4}><Typography variant="caption" color="text.secondary">Bleeding</Typography><Typography variant="body2">{label(transfer.bleeding, BLEEDING_OPTIONS)}</Typography></Grid>}
              {transfer.seizure != null && <Grid item xs={12} sm={4}><Typography variant="caption" color="text.secondary">Seizure</Typography><Typography variant="body2">{transfer.seizure ? 'Yes' : 'No'}</Typography></Grid>}
              {transfer.fetalStatus && <Grid item xs={12} sm={4}><Typography variant="caption" color="text.secondary">Fetal Status</Typography><Typography variant="body2">{label(transfer.fetalStatus, FETAL_STATUS_OPTIONS)}</Typography></Grid>}
              {transfer.fetalHeartRate != null && <Grid item xs={12} sm={4}><Typography variant="caption" color="text.secondary">Fetal HR</Typography><Typography variant="body2">{transfer.fetalHeartRate} bpm</Typography></Grid>}
            </>
          )}
          {(transfer.suspectedConditions && Array.isArray(transfer.suspectedConditions) && transfer.suspectedConditions.length > 0) && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">Suspected Conditions</Typography>
              <Typography variant="body2">{(transfer.suspectedConditions as string[]).join(', ')}</Typography>
            </Grid>
          )}
          {(transfer.hb != null || transfer.platelets != null || transfer.glucose != null || transfer.urineProtein) && (
            <>
              <Grid item xs={12}><Typography variant="subtitle2">Labs</Typography></Grid>
              {transfer.hb != null && <Grid item xs={12} sm={4}><Typography variant="caption" color="text.secondary">Hb</Typography><Typography variant="body2">{transfer.hb} g/dL</Typography></Grid>}
              {transfer.platelets != null && <Grid item xs={12} sm={4}><Typography variant="caption" color="text.secondary">Platelets</Typography><Typography variant="body2">{transfer.platelets}</Typography></Grid>}
              {transfer.glucose != null && <Grid item xs={12} sm={4}><Typography variant="caption" color="text.secondary">Glucose</Typography><Typography variant="body2">{transfer.glucose} mg/dL</Typography></Grid>}
              {transfer.urineProtein && <Grid item xs={12} sm={4}><Typography variant="caption" color="text.secondary">Urine Protein</Typography><Typography variant="body2">{transfer.urineProtein}</Typography></Grid>}
            </>
          )}
          {(transfer.stabilizationDone && Array.isArray(transfer.stabilizationDone) && transfer.stabilizationDone.length > 0) && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">Stabilization Done</Typography>
              <Typography variant="body2">{(transfer.stabilizationDone as string[]).join(', ')}</Typography>
            </Grid>
          )}
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">Referring Facility</Typography>
            <Typography variant="body1">{transfer.referringFacility?.name || transfer.referringFacilityId}</Typography>
            {(transfer.referringContactName || transfer.referringContactPhone) && (
              <Typography variant="body2" color="text.secondary">
                {transfer.referringContactName}
                {transfer.referringContactPhone && ` · ${transfer.referringContactPhone}`}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Activation Level</Typography>
            <Typography variant="body1">{label(transfer.activationLevel, ACTIVATION_LEVEL_OPTIONS)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Expected Delivery Mode</Typography>
            <Typography variant="body1">{label(transfer.expectedDeliveryMode, EXPECTED_DELIVERY_MODE_OPTIONS)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Destination Hospital</Typography>
            <Typography variant="body1">{transfer.destinationHospital?.name || '—'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Acceptance</Typography>
            <Typography variant="body1">{label(transfer.acceptanceStatus, ACCEPTANCE_STATUS_OPTIONS)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Ambulance Type</Typography>
            <Typography variant="body1">{label(transfer.ambulanceType, AMBULANCE_TYPE_OPTIONS)}</Typography>
          </Grid>
          {transfer.createdBy && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">Created by</Typography>
              <Typography variant="body2">{transfer.createdBy.firstName} {transfer.createdBy.lastName}</Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={onEdit}>
          Edit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewObMaternalTransferDialog;
