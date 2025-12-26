import React from 'react';
import { Box, Paper, Typography, useTheme, alpha } from '@mui/material';
import {
    LocalHospital as HospitalIcon,
    Warning as WarningIcon,
    Error as CriticalIcon,
    CheckCircle as HealthyIcon,
    Hotel as BedIcon,
    MedicalServices as ServicesIcon,
} from '@mui/icons-material';
import { Hospital, CapacityAlert } from '../../../services/hospitalService';

interface CommandHubLayoutProps {
    hospitals: Hospital[];
    alerts: CapacityAlert[];
}

interface KPITileProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: 'primary' | 'error' | 'warning' | 'success' | 'info';
    size?: 'small' | 'large';
}

const KPITile: React.FC<KPITileProps> = ({ title, value, subtitle, icon, color, size = 'small' }) => {
    const theme = useTheme();
    const colorMap = {
        primary: theme.palette.primary.main,
        error: theme.palette.error.main,
        warning: theme.palette.warning.main,
        success: theme.palette.success.main,
        info: theme.palette.info.main,
    };

    const bgColorMap = {
        primary: alpha(theme.palette.primary.main, 0.08),
        error: alpha(theme.palette.error.main, 0.08),
        warning: alpha(theme.palette.warning.main, 0.08),
        success: alpha(theme.palette.success.main, 0.08),
        info: alpha(theme.palette.info.main, 0.08),
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: size === 'large' ? 3 : 2,
                height: '100%',
                background: `linear-gradient(135deg, ${bgColorMap[color]} 0%, ${theme.palette.background.paper} 100%)`,
                border: `1px solid ${alpha(colorMap[color], 0.2)}`,
                borderRadius: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${alpha(colorMap[color], 0.15)}`,
                    borderColor: alpha(colorMap[color], 0.4),
                },
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography
                    variant="body2"
                    sx={{
                        color: 'text.secondary',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontSize: '0.75rem',
                    }}
                >
                    {title}
                </Typography>
                <Box
                    sx={{
                        p: 1,
                        borderRadius: 2,
                        backgroundColor: alpha(colorMap[color], 0.12),
                        color: colorMap[color],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {icon}
                </Box>
            </Box>

            <Box mt={size === 'large' ? 2 : 1}>
                <Typography
                    variant={size === 'large' ? 'h3' : 'h4'}
                    sx={{
                        fontWeight: 700,
                        color: colorMap[color],
                        lineHeight: 1,
                    }}
                >
                    {value}
                </Typography>
                {subtitle && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'text.secondary',
                            display: 'block',
                            mt: 0.5,
                        }}
                    >
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};

const CommandHubLayout: React.FC<CommandHubLayoutProps> = ({ hospitals, alerts: _alerts }) => {
    // Calculate statistics
    const getAvailabilityPercentage = (hospital: Hospital) => {
        const totalBeds = hospital.icuBeds + hospital.picuBeds + hospital.maleBeds +
            hospital.femaleBeds + hospital.pediatricBeds + hospital.standardBeds +
            (hospital.nicuBeds || 0);
        const availableBeds = hospital.icuBedsAvailable + hospital.picuBedsAvailable +
            hospital.maleBedsAvailable + hospital.femaleBedsAvailable +
            hospital.pediatricBedsAvailable + hospital.standardBedsAvailable +
            (hospital.nicuBedsAvailable || 0);
        return totalBeds > 0 ? Math.round((availableBeds / totalBeds) * 100) : 0;
    };

    const totalHospitals = hospitals.length;
    const criticalCount = hospitals.filter(h => getAvailabilityPercentage(h) <= 10).length;
    const warningCount = hospitals.filter(h => {
        const avail = getAvailabilityPercentage(h);
        return avail > 10 && avail <= 25;
    }).length;
    const healthyCount = hospitals.filter(h => getAvailabilityPercentage(h) > 25).length;

    const totalBeds = hospitals.reduce((sum, h) =>
        sum + h.icuBeds + h.picuBeds + h.maleBeds + h.femaleBeds + h.pediatricBeds + h.standardBeds + (h.nicuBeds || 0), 0
    );
    const availableBeds = hospitals.reduce((sum, h) =>
        sum + h.icuBedsAvailable + h.picuBedsAvailable + h.maleBedsAvailable + h.femaleBedsAvailable +
        h.pediatricBedsAvailable + h.standardBedsAvailable + (h.nicuBedsAvailable || 0), 0
    );
    const overallAvailability = totalBeds > 0 ? Math.round((availableBeds / totalBeds) * 100) : 0;

    const servicesCount = {
        stemi: hospitals.filter(h => h.hasStemiService).length,
        stroke: hospitals.filter(h => h.hasStrokeService).length,
        trauma: hospitals.filter(h => h.hasTraumaService).length,
    };

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(4, 1fr)',
                    lg: '2fr 1fr 1fr 2fr',
                },
                gap: 2,
                mb: 3,
            }}
        >
            {/* Network Health - Large Tile */}
            <Box sx={{ gridColumn: { xs: '1', sm: '1 / 3', md: '1', lg: '1' } }}>
                <KPITile
                    title="Network Health"
                    value={totalHospitals}
                    subtitle={`${overallAvailability}% overall availability`}
                    icon={<HospitalIcon />}
                    color="primary"
                    size="large"
                />
            </Box>

            {/* Critical Alerts */}
            <KPITile
                title="Critical"
                value={criticalCount}
                subtitle="≤10% capacity"
                icon={<CriticalIcon />}
                color="error"
            />

            {/* Warning Status */}
            <KPITile
                title="Warning"
                value={warningCount}
                subtitle="10-25% capacity"
                icon={<WarningIcon />}
                color="warning"
            />

            {/* Quick Stats - Large Tile */}
            <Box sx={{ gridColumn: { xs: '1', sm: '1 / 3', md: '4', lg: '4' } }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        height: '100%',
                        background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${theme.palette.background.paper} 100%)`,
                        border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                        borderRadius: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'text.secondary',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontSize: '0.75rem',
                            mb: 1,
                        }}
                    >
                        Quick Stats
                    </Typography>

                    <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <BedIcon sx={{ color: 'info.main', fontSize: 20 }} />
                            <Box>
                                <Typography variant="h6" fontWeight={700} color="info.main">
                                    {availableBeds}/{totalBeds}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Available Beds
                                </Typography>
                            </Box>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1}>
                            <HealthyIcon sx={{ color: 'success.main', fontSize: 20 }} />
                            <Box>
                                <Typography variant="h6" fontWeight={700} color="success.main">
                                    {healthyCount}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Healthy
                                </Typography>
                            </Box>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1}>
                            <ServicesIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    STEMI: {servicesCount.stemi} | Stroke: {servicesCount.stroke} | Trauma: {servicesCount.trauma}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default CommandHubLayout;
