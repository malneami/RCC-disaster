import React from 'react';
import {
    Grid,
    Card,
    CardContent,
    Box,
    Typography,
    CircularProgress,
    alpha,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faExclamationTriangle,
    faTicketAlt,
    faBed,
    faMedkit,
} from '@fortawesome/free-solid-svg-icons';
import {
    skyBlue,
    shadows,
    spacing,
} from '../styles/hospitalDashboardTokens';
import { Hospital, CriticalCase, HospitalTicket } from '../../../services/hospitalService';
import { getAvailabilityPercentage } from '../utils/hospitalUtils';

interface DashboardSummaryCardsProps {
    hospital: Hospital | null;
    loading: boolean;
    criticalCases: CriticalCase[];
    relatedTickets: HospitalTicket[];
    transferTickets: any[];
}

export const DashboardSummaryCards: React.FC<DashboardSummaryCardsProps> = ({
    hospital,
    loading,
    criticalCases,
    relatedTickets,
    transferTickets,
}) => {
    return (
        <Grid container spacing={3} mb={4}>
            {/* Critical Cases Card */}
            <Grid item xs={12} sm={6} md={3}>
                <Card
                    elevation={0}
                    sx={{
                        backgroundColor: skyBlue[50],
                        borderRadius: spacing.borderRadius.lg,
                        border: `1px solid ${skyBlue[100]}`,
                        boxShadow: shadows.card,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            boxShadow: shadows.cardHover,
                            transform: 'translateY(-2px)',
                        },
                    }}
                >
                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                            <Box
                                sx={{
                                    width: { xs: 40, md: 48 },
                                    height: { xs: 40, md: 48 },
                                    borderRadius: spacing.borderRadius.md,
                                    backgroundColor: alpha(skyBlue[600], 0.15),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: 20, color: skyBlue[700] }} />
                            </Box>
                        </Box>
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 700,
                                color: skyBlue[600],
                                fontSize: { xs: '2rem', md: '2.5rem' },
                                lineHeight: 1,
                                mb: 1,
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={28} sx={{ color: skyBlue[600] }} />
                            ) : (
                                (() => {
                                    const criticalCasesCount = criticalCases?.filter(c =>
                                        c.severity === 'CRITICAL' || c.severity === 'URGENT'
                                    ).length || 0;
                                    const stemiStrokeCount = transferTickets?.filter(t =>
                                        (t.pathway === 'STEMI' || t.pathway === 'STROKE') &&
                                        (t.status === 'PENDING' || t.status === 'ASSIGNED' || t.status === 'IN_TRANSPORT')
                                    ).length || 0;
                                    return criticalCasesCount + stemiStrokeCount;
                                })()
                            )}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: { xs: '0.75rem', md: '0.875rem' },
                                fontWeight: 500,
                                color: '#64748B',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            Critical Cases
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mt: 0.5 }}>
                            Active critical cases
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            {/* Open Tickets Card */}
            <Grid item xs={12} sm={6} md={3}>
                <Card
                    elevation={0}
                    sx={{
                        backgroundColor: skyBlue[50],
                        borderRadius: spacing.borderRadius.lg,
                        border: `1px solid ${skyBlue[100]}`,
                        boxShadow: shadows.card,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            boxShadow: shadows.cardHover,
                            transform: 'translateY(-2px)',
                        },
                    }}
                >
                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                            <Box
                                sx={{
                                    width: { xs: 40, md: 48 },
                                    height: { xs: 40, md: 48 },
                                    borderRadius: spacing.borderRadius.md,
                                    backgroundColor: alpha(skyBlue[600], 0.15),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <FontAwesomeIcon icon={faTicketAlt} style={{ fontSize: 20, color: skyBlue[700] }} />
                            </Box>
                        </Box>
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 700,
                                color: skyBlue[600],
                                fontSize: { xs: '2rem', md: '2.5rem' },
                                lineHeight: 1,
                                mb: 1,
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={28} sx={{ color: skyBlue[600] }} />
                            ) : (
                                (() => {
                                    const openHospitalTickets = relatedTickets?.filter(t =>
                                        t.status === 'OPEN' || t.status === 'IN_PROGRESS'
                                    ).length || 0;
                                    const openTransferTickets = transferTickets?.filter(t =>
                                        t.status === 'PENDING' || t.status === 'ASSIGNED' || t.status === 'IN_TRANSPORT'
                                    ).length || 0;
                                    return openHospitalTickets + openTransferTickets;
                                })()
                            )}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: { xs: '0.75rem', md: '0.875rem' },
                                fontWeight: 500,
                                color: '#64748B',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            Open Tickets
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mt: 0.5 }}>
                            Pending resolution
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            {/* Bed Availability Card */}
            <Grid item xs={12} sm={6} md={3}>
                <Card
                    elevation={0}
                    sx={{
                        backgroundColor: skyBlue[50],
                        borderRadius: spacing.borderRadius.lg,
                        border: `1px solid ${skyBlue[100]}`,
                        boxShadow: shadows.card,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            boxShadow: shadows.cardHover,
                            transform: 'translateY(-2px)',
                        },
                    }}
                >
                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                            <Box
                                sx={{
                                    width: { xs: 40, md: 48 },
                                    height: { xs: 40, md: 48 },
                                    borderRadius: spacing.borderRadius.md,
                                    backgroundColor: alpha(skyBlue[600], 0.15),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <FontAwesomeIcon icon={faBed} style={{ fontSize: 20, color: skyBlue[700] }} />
                            </Box>
                        </Box>
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 700,
                                color: skyBlue[600],
                                fontSize: { xs: '2rem', md: '2.5rem' },
                                lineHeight: 1,
                                mb: 1,
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={28} sx={{ color: skyBlue[600] }} />
                            ) : (
                                `${hospital ? getAvailabilityPercentage(hospital) : 0}%`
                            )}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: { xs: '0.75rem', md: '0.875rem' },
                                fontWeight: 500,
                                color: '#64748B',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            Bed Availability
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mt: 0.5 }}>
                            Current capacity
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            {/* Services Card */}
            <Grid item xs={12} sm={6} md={3}>
                <Card
                    elevation={0}
                    sx={{
                        backgroundColor: skyBlue[50],
                        borderRadius: spacing.borderRadius.lg,
                        border: `1px solid ${skyBlue[100]}`,
                        boxShadow: shadows.card,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            boxShadow: shadows.cardHover,
                            transform: 'translateY(-2px)',
                        },
                    }}
                >
                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                            <Box
                                sx={{
                                    width: { xs: 40, md: 48 },
                                    height: { xs: 40, md: 48 },
                                    borderRadius: spacing.borderRadius.md,
                                    backgroundColor: alpha(skyBlue[600], 0.15),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <FontAwesomeIcon icon={faMedkit} style={{ fontSize: 20, color: skyBlue[700] }} />
                            </Box>
                        </Box>
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 700,
                                color: skyBlue[600],
                                fontSize: { xs: '2rem', md: '2.5rem' },
                                lineHeight: 1,
                                mb: 1,
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={28} sx={{ color: skyBlue[600] }} />
                            ) : (
                                hospital ? [
                                    hospital.hasStemiService,
                                    hospital.hasStrokeService,
                                    hospital.hasTraumaService,
                                    hospital.hasThrombolysis,
                                    hospital.hasThrombectomy,
                                    hospital.hasStrokeUnit,
                                    hospital.hasCardiologyCenter,
                                ].filter(Boolean).length : 0
                            )}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: { xs: '0.75rem', md: '0.875rem' },
                                fontWeight: 500,
                                color: '#64748B',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            Services
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mt: 0.5 }}>
                            Specialized services
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};
