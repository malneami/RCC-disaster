import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Chip
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faAmbulance, faHospital, faClock } from '@fortawesome/free-solid-svg-icons';
import { emsService } from '../services/emsService';
import { EMSAssignment } from '../types/ems';

interface AmbulanceZoneEntriesModalProps {
    open: boolean;
    onClose: () => void;
    assignment: EMSAssignment;
}

const AmbulanceZoneEntriesModal: React.FC<AmbulanceZoneEntriesModalProps> = ({
    open,
    onClose,
    assignment
}) => {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && assignment) {
            fetchLogs();
        }
    }, [open, assignment]);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            // Determine filters based on assignment
            const hospitalIds: string[] = [];
            if (assignment.ticket?.originHospital?.id) {
                hospitalIds.push(assignment.ticket.originHospital.id);
            }
            if (assignment.ticket?.destinationHospital?.id) {
                hospitalIds.push(assignment.ticket.destinationHospital.id);
            }
            // Start looking from EMS Contact time (or a bit before)
            const startTime = assignment.emsContactTime
                ? new Date(new Date(assignment.emsContactTime).getTime() - 30 * 60 * 1000) // 30 mins before contact
                : new Date(new Date(assignment.createdAt).getTime() - 60 * 60 * 1000); // or 1 hour before creation

            // If assignment is complete, limit end time
            const endTime = assignment.journeyEndTime
                ? new Date(new Date(assignment.journeyEndTime).getTime() + 30 * 60 * 1000) // 30 mins after end
                : undefined;

            const data = await emsService.getZoneLogs({
                hospitalIds,
                ambulanceId: assignment.ambulanceId, // If ambulance is assigned, filter by it. If not, show all (to help selection)
                startTime,
                endTime
            });

            setLogs(data);
        } catch (err) {
            console.error('Failed to fetch zone logs:', err);
            setError('Failed to load zone entries. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (minutes: number) => {
        if (!minutes) return '-';
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m`;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FontAwesomeIcon icon={faHistory} />
                    <Typography variant="h6">Ambulance Zone Entries</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                    Showing zone entries for relevant hospitals around the assignment time
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : logs.length === 0 ? (
                    <Alert severity="info">No zone entries found for this time period.</Alert>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell>Ambulance</TableCell>
                                    <TableCell>Hospital</TableCell>
                                    <TableCell>Entry Time</TableCell>
                                    <TableCell>Duration</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <FontAwesomeIcon icon={faAmbulance} size="sm" color="#1976d2" />
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {log.ambulance?.callSign || 'Unknown'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {log.ambulance?.plateNumber}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <FontAwesomeIcon icon={faHospital} size="sm" color="#d32f2f" />
                                                <Typography variant="body2">
                                                    {log.hospital?.name || 'Unknown Hospital'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <FontAwesomeIcon icon={faClock} size="sm" color="text.secondary" />
                                                <Typography variant="body2">
                                                    {new Date(log.entryTime).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {log.durationMinutes ? (
                                                <Chip
                                                    label={formatDuration(log.durationMinutes)}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            ) : (
                                                <Chip label="Active" size="small" color="success" />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {log.exitTime ? (
                                                <Typography variant="caption" color="text.secondary">
                                                    Exited at {new Date(log.exitTime).toLocaleTimeString()}
                                                </Typography>
                                            ) : (
                                                <Typography variant="caption" color="success.main" fontWeight="bold">
                                                    Currently in Zone
                                                </Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
                <Button onClick={fetchLogs} variant="contained" disabled={loading}>
                    Refresh
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AmbulanceZoneEntriesModal;
