import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Alert,
    Box,
    Switch,
    Grid,
    Divider,
    Paper,
    CircularProgress,
} from '@mui/material';
import {
    LocalShipping as AmbulanceIcon,
    History as HistoryIcon,
    CheckCircle as CheckIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { emsService } from '../services/emsService';
import { AmbulanceRecommendation, AmbulanceZoneLog } from '../types/recommendations';
import { EMSAssignment } from '../types/ems';
import { ticketService } from '../../../services/ticketService';
import ZoneActivityLogItem from './ZoneActivityLogItem';
import CompletedTripsList from './CompletedTripsList';
import ManualSelectionSection from './ManualSelectionSection';

interface EnhancedCrewAssignmentModalProps {
    open: boolean;
    onClose: () => void;
    assignment: EMSAssignment | null;
    ticketId: string;
    onSuccess?: () => void;
}

const CrewAssignmentModal: React.FC<EnhancedCrewAssignmentModalProps> = ({
    open,
    onClose,
    assignment,
    ticketId,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const [recommendations, setRecommendations] = useState<AmbulanceRecommendation[]>([]);
    const [ticket, setTicket] = useState<any>(null);
    const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string | null>(null);
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
    const [allDrivers, setAllDrivers] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Retroactive Assignment State
    const [isRetroactive, setIsRetroactive] = useState(false);
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
    const [derivedStatus, setDerivedStatus] = useState<'ASSIGNED' | 'EMS_ARRIVAL' | 'DEPARTED' | 'ARRIVED'>('ASSIGNED');
    const [selectedSequence, setSelectedSequence] = useState<any>(null); // Store full sequence for timestamp extraction

    useEffect(() => {
        if (open && ticketId) {
            fetchData();
            // Reset state
            setIsRetroactive(false);
            setSelectedLogId(null);
            setDerivedStatus('ASSIGNED');
            setSelectedAmbulanceId(assignment?.ambulanceId || null);
            setSelectedDriverId(assignment?.driverId || null);
        }
    }, [open, ticketId, assignment]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [recs, ticketData, driversData] = await Promise.all([
                emsService.getRecommendedAmbulances(ticketId),
                ticketService.getTicket(ticketId),
                emsService.getEMSDrivers({ pageSize: 100 })
            ]);
            setRecommendations(recs);
            setTicket(ticketData);
            // Ensure drivers data is set even if empty
            setAllDrivers(driversData?.data || []);
        } catch (err) {
            setError('Failed to load data');
            console.error('Error fetching crew assignment data:', err);
            // Try to still fetch drivers separately if other calls fail
            try {
                const driversData = await emsService.getEMSDrivers({ pageSize: 100 });
                setAllDrivers(driversData?.data || []);
            } catch (driverErr) {
                console.error('Error fetching drivers:', driverErr);
                setAllDrivers([]);
            }
        } finally {
            setLoading(false);
        }
    };

    // Get selected ambulance object
    const selectedAmbulanceRec = useMemo(() =>
        recommendations.find(r => r.ambulance.id === selectedAmbulanceId),
        [recommendations, selectedAmbulanceId]);

    const handleLogSelection = (log: AmbulanceZoneLog, ambulanceId: string, isDestination: boolean) => {
        if (!isRetroactive) return;

        setSelectedAmbulanceId(ambulanceId);
        setSelectedLogId(log.id);

        if (isDestination) {
            setDerivedStatus('ARRIVED');
        } else {
            if (log.exitTime) {
                // Completed visit -> DEPARTED
                setDerivedStatus('DEPARTED');
            } else {
                // Active visit -> EMS_ARRIVAL
                setDerivedStatus('EMS_ARRIVAL');
            }
        }
    };

    const handleSubmit = async () => {
        if (!selectedAmbulanceId) {
            setError('Please select an ambulance');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            // Find the selected log from ANY recommendation
            let selectedLog: AmbulanceZoneLog | undefined;
            if (selectedLogId) {
                for (const rec of recommendations) {
                    const log = rec.zoneLogs.find(l => l.id === selectedLogId);
                    if (log) {
                        selectedLog = log;
                        break;
                    }
                }
            }

            // Infer status from timestamps if not explicitly set
            let inferredStatus = isRetroactive ? derivedStatus : 'EMS_CONTACT';
            
            // If timestamps are being set, ensure status matches
            if (isRetroactive && selectedLog) {
                if (derivedStatus === 'ARRIVED' && selectedSequence) {
                    inferredStatus = 'ARRIVED';
                } else if (derivedStatus === 'DEPARTED') {
                    inferredStatus = 'DEPARTED';
                } else if (derivedStatus === 'EMS_ARRIVAL') {
                    inferredStatus = 'EMS_ARRIVAL';
                }
            }
            
            const payload: any = {
                ticketId,
                ambulanceId: selectedAmbulanceId,
                driverId: selectedDriverId || undefined,
                assignedAt: new Date().toISOString(),
                status: inferredStatus,
            };

            // Add retroactive times if applicable
            if (isRetroactive && selectedLog) {
                if (derivedStatus === 'EMS_ARRIVAL') {
                    payload.emsContactTime = selectedLog.entryTime;
                    payload.actualArrivalTime = selectedLog.entryTime;
                } else if (derivedStatus === 'DEPARTED') {
                    payload.emsContactTime = selectedLog.entryTime;
                    payload.actualArrivalTime = selectedLog.entryTime;
                    if (selectedLog.exitTime) {
                        payload.journeyStartTime = selectedLog.exitTime;
                    }
                } else if (derivedStatus === 'ARRIVED') {
                    // Completed trip: populate all timestamps from sequence
                    if (selectedSequence) {
                        // EMS Arrival = Origin Entry
                        payload.emsContactTime = ticket.emsContactTime || selectedSequence.originLog.entryTime;
                        payload.actualArrivalTime = selectedSequence.originLog.entryTime;

                        // Departed = Origin Exit (if available) or Destination Entry
                        const departedTime = selectedSequence.originLog.exitTime || selectedSequence.destLog.entryTime;
                        payload.journeyStartTime = departedTime;

                        // Arrived = Destination Entry
                        payload.journeyEndTime = selectedSequence.destLog.entryTime;
                    } else if (selectedLog) {
                        // Fallback if no sequence selected
                        payload.journeyEndTime = selectedLog.entryTime;
                    }
                }
            }

            if (assignment) {
                await emsService.updateEMSAssignment(assignment.id, payload);
            } else {
                await emsService.createEMSAssignment(payload);
            }

            onSuccess?.();
            onClose();
        } catch (err: any) {
            // Show detailed error message if available
            const errorMessage = err.response?.data?.message || err.message || 'Failed to assign ambulance';
            setError(errorMessage);
            console.error('Error assigning crew:', err);
        } finally {
            setSubmitting(false);
        }
    };

    // Filter logs for Origin and Destination
    const originLogs = useMemo(() => {
        if (!ticket || !recommendations) return [];

        const contactTime = assignment?.emsContactTime || ticket.emsContactTime;

        return recommendations.flatMap(rec =>
            rec.zoneLogs
                .filter(log => {
                    if (log.hospitalId !== ticket.originHospital?.id) return false;
                    // Filter by EMS contact time if available
                    if (contactTime) {
                        return new Date(log.entryTime) >= new Date(contactTime);
                    }
                    return true;
                })
                .map(log => ({ log, ambulance: rec.ambulance }))
        ).sort((a, b) => new Date(b.log.entryTime).getTime() - new Date(a.log.entryTime).getTime());
    }, [recommendations, ticket, assignment]);

    const destLogs = useMemo(() => {
        if (!ticket || !recommendations) return [];

        const contactTime = assignment?.emsContactTime || ticket.emsContactTime;

        return recommendations.flatMap(rec =>
            rec.zoneLogs
                .filter(log => {
                    if (log.hospitalId !== ticket.destinationHospital?.id) return false;
                    // Filter by EMS contact time if available
                    if (contactTime) {
                        return new Date(log.entryTime) >= new Date(contactTime);
                    }
                    return true;
                })
                .map(log => ({ log, ambulance: rec.ambulance }))
        ).sort((a, b) => new Date(b.log.entryTime).getTime() - new Date(a.log.entryTime).getTime());
    }, [recommendations, ticket, assignment]);

    // Detect sequences: ambulances that went Origin → Destination
    const sequences = useMemo(() => {
        if (!ticket || !recommendations) return [];

        const sequencesByAmbulance = new Map<string, {
            ambulance: any;
            originLog: any;
            destLog: any;
            score: number;
        }>();

        // Define the time window based on EMS contact time
        let windowStart: number;
        let windowEnd: number;

        const contactTimeStr = assignment?.emsContactTime || ticket.emsContactTime;

        if (contactTimeStr) {
            const contactTime = new Date(contactTimeStr).getTime();
            const now = Date.now();

            // Always show last 24 hours of trips, extending to contact time if needed
            windowStart = Math.min(now - (24 * 60 * 60 * 1000), contactTime - (24 * 60 * 60 * 1000));
            windowEnd = Math.max(now, contactTime + (24 * 60 * 60 * 1000));
        } else {
            // Fallback: last 7 days
            windowEnd = Date.now();
            windowStart = windowEnd - (7 * 24 * 60 * 60 * 1000);
        }

        for (const rec of recommendations) {
            const originEntries = rec.zoneLogs.filter(log => log.hospitalId === ticket.originHospital?.id);
            const destEntries = rec.zoneLogs.filter(log => log.hospitalId === ticket.destinationHospital?.id);

            let bestSequence: any = null;
            let bestScore = -1;

            // Find the BEST sequence for this ambulance (most recent destination arrival)
            for (const destLog of destEntries) {
                const destTime = new Date(destLog.entryTime).getTime();

                // Filter: Only show sequences where destination is within the time window
                if (destTime < windowStart || destTime > windowEnd) {
                    continue;
                }

                // Find the most recent origin entry BEFORE this destination
                const validOriginLogs = originEntries.filter(
                    originLog => new Date(originLog.entryTime).getTime() < destTime
                );

                if (validOriginLogs.length > 0) {
                    // Take the closest origin entry before this destination
                    const originLog = validOriginLogs.reduce((latest, current) =>
                        new Date(current.entryTime).getTime() > new Date(latest.entryTime).getTime() ? current : latest
                    );

                    // Calculate "freshness" score - newer sequences rank higher
                    const ageInDays = (Date.now() - destTime) / (1000 * 60 * 60 * 24);
                    const score = Math.max(0, 100 - ageInDays * 10);

                    if (score > bestScore) {
                        bestScore = score;
                        bestSequence = {
                            ambulance: rec.ambulance,
                            originLog,
                            destLog,
                            score,
                        };
                    }
                }
            }

            // Only add if we found a valid sequence for this ambulance
            if (bestSequence) {
                sequencesByAmbulance.set(rec.ambulance.id, bestSequence);
            }
        }

        // Convert map to array and sort by score (freshest first)
        return Array.from(sequencesByAmbulance.values()).sort((a, b) => b.score - a.score);
    }, [recommendations, ticket, assignment]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AmbulanceIcon color="primary" />
                    <Typography variant="h6">
                        {assignment ? 'Reassign Crew' : 'Assign Ambulance & Driver'}
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    Select crew or use zone evidence for retroactive assignment.
                </Typography>
            </DialogTitle>

            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    <ManualSelectionSection
                        recommendations={recommendations}
                        selectedAmbulanceRec={selectedAmbulanceRec}
                        onAmbulanceChange={(newValue) => {
                            setSelectedAmbulanceId(newValue?.ambulance.id || null);
                            setSelectedLogId(null);
                        }}
                        loading={loading}
                        allDrivers={allDrivers}
                        selectedDriverId={selectedDriverId}
                        onDriverChange={(newValue) => setSelectedDriverId(newValue?.id || null)}
                    />

                    <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                    </Grid>

                    {/* Retroactive Toggle */}
                    <Grid item xs={12}>
                        <Box sx={{ p: 2, backgroundColor: 'background.default', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="subtitle2">Retroactive Assignment</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Enable to click zone logs below for auto-assignment.
                                </Typography>
                            </Box>
                            <Switch
                                checked={isRetroactive}
                                onChange={(e) => {
                                    setIsRetroactive(e.target.checked);
                                    if (!e.target.checked) {
                                        setSelectedLogId(null);
                                        setDerivedStatus('ASSIGNED');
                                    }
                                }}
                            />
                        </Box>
                    </Grid>

                    {/* Split View Zone Evidence */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <HistoryIcon fontSize="small" />
                            Recent Zone Activity
                        </Typography>

                        {(assignment?.emsContactTime || ticket?.emsContactTime) && (
                            <Paper
                                elevation={0}
                                sx={{
                                    mb: 3,
                                    p: 2,
                                    bgcolor: 'info.lighter',
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'info.light',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2
                                }}
                            >
                                <Box sx={{
                                    bgcolor: 'info.main',
                                    borderRadius: '50%',
                                    width: 32,
                                    height: 32,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <InfoIcon fontSize="small" />
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                                        Reference Time
                                    </Typography>
                                    <Typography variant="body2" color="text.primary">
                                        Showing activity after EMS Contact: <strong>{new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Riyadh' }).format(new Date(assignment?.emsContactTime || ticket.emsContactTime))}</strong>
                                    </Typography>
                                </Box>
                            </Paper>
                        )}

                        <CompletedTripsList
                            sequences={sequences}
                            isRetroactive={isRetroactive}
                            selectedLogId={selectedLogId}
                            onSelectSequence={(seq) => {
                                setSelectedAmbulanceId(seq.ambulance.id);
                                setSelectedLogId(seq.destLog.id);
                                setSelectedSequence(seq);
                                setDerivedStatus('ARRIVED');
                            }}
                        />

                        <Grid container spacing={2}>
                            {/* Origin Column */}
                            <Grid item xs={12} md={6}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        height: '100%',
                                        bgcolor: 'grey.50',
                                        borderRadius: 3,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Box sx={{ p: 2, bgcolor: 'primary.50', borderBottom: '1px solid', borderColor: 'primary.100' }}>
                                        <Typography variant="subtitle2" color="primary.main" fontWeight="bold">
                                            Origin: {ticket?.originHospital?.name || 'Loading...'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                                        {originLogs.length > 0 ? (
                                            originLogs.map(({ log, ambulance }) => (
                                                <ZoneActivityLogItem
                                                    key={log.id}
                                                    log={log}
                                                    ambulance={ambulance}
                                                    isDestination={false}
                                                    isSelected={selectedLogId === log.id}
                                                    isRetroactive={isRetroactive}
                                                    onSelect={handleLogSelection}
                                                />
                                            ))
                                        ) : (
                                            <Box sx={{ py: 4, textAlign: 'center', opacity: 0.6 }}>
                                                <HistoryIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    No activity found after EMS Contact.
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* Destination Column */}
                            <Grid item xs={12} md={6}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        height: '100%',
                                        bgcolor: 'grey.50',
                                        borderRadius: 3,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Box sx={{ p: 2, bgcolor: 'success.50', borderBottom: '1px solid', borderColor: 'success.100' }}>
                                        <Typography variant="subtitle2" color="success.dark" fontWeight="bold">
                                            Destination: {ticket?.destinationHospital?.name || 'Loading...'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                                        {destLogs.length > 0 ? (
                                            destLogs.map(({ log, ambulance }) => (
                                                <ZoneActivityLogItem
                                                    key={log.id}
                                                    log={log}
                                                    ambulance={ambulance}
                                                    isDestination={true}
                                                    isSelected={selectedLogId === log.id}
                                                    isRetroactive={isRetroactive}
                                                    onSelect={handleLogSelection}
                                                />
                                            ))
                                        ) : (
                                            <Box sx={{ py: 4, textAlign: 'center', opacity: 0.6 }}>
                                                <HistoryIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    No activity found after EMS Contact.
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={submitting}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={!selectedAmbulanceId || submitting || (isRetroactive && !selectedLogId)}
                    startIcon={submitting ? <CircularProgress size={20} /> : <CheckIcon />}
                >
                    {submitting ? 'Assigning...' : isRetroactive ? `Assign & Set ${derivedStatus.replace('_', ' ')}` : 'Assign Crew'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CrewAssignmentModal;
