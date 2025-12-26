import React, { useState } from 'react';
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Button,
    Chip,
    LinearProgress,
    alpha,
    useTheme,
    Tabs,
    Tab,
} from '@mui/material';
import {
    Close as CloseIcon,
    Edit as EditIcon,
    Dashboard as DashboardIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    LocationOn as LocationIcon,
    Favorite as StemiIcon,
    Psychology as StrokeIcon,
    LocalFireDepartment as TraumaIcon,
    MedicalServices as ThrombolysisIcon,
    Healing as ThrombectomyIcon,
    LocalHospital as StrokeUnitIcon,
} from '@mui/icons-material';
import { Hospital } from '../../../services/hospitalService';

interface HospitalDetailDrawerProps {
    hospital: Hospital | null;
    open: boolean;
    onClose: () => void;
    onUpdateCapacity: (hospital: Hospital) => void;
    onViewDashboard: (hospitalId: string) => void;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
    <Box role="tabpanel" hidden={value !== index} sx={{ flex: 1, overflow: 'auto' }}>
        {value === index && children}
    </Box>
);

// Compact Bed Row Component
const BedRow: React.FC<{
    label: string;
    available: number;
    total: number;
    color: string;
}> = ({ label, available, total, color }) => {
    const percentage = total > 0 ? Math.round((available / total) * 100) : 0;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 1,
                '&:not(:last-child)': {
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                },
            }}
        >
            <Typography sx={{ flex: 1, fontSize: '0.85rem', fontWeight: 500 }}>
                {label}
            </Typography>
            <Box sx={{ width: 80, textAlign: 'right' }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    <span style={{ color }}>{available}</span>
                    <span style={{ color: '#94a3b8' }}> / {total}</span>
                </Typography>
            </Box>
            <Box sx={{ width: 80 }}>
                <Box
                    sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(color, 0.15),
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            height: '100%',
                            width: `${percentage}%`,
                            borderRadius: 3,
                            backgroundColor: color,
                            transition: 'width 0.3s ease',
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
};

// Service Badge Component
const ServiceBadge: React.FC<{
    active: boolean;
    label: string;
    icon: React.ReactNode;
    color: string;
}> = ({ active, label, icon, color }) => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                borderRadius: 1.5,
                backgroundColor: active ? alpha(color, 0.1) : alpha(theme.palette.grey[500], 0.05),
                border: `1px solid ${active ? alpha(color, 0.25) : 'transparent'}`,
                opacity: active ? 1 : 0.4,
                transition: 'all 0.2s ease',
            }}
        >
            <Box sx={{ color: active ? color : theme.palette.grey[400], display: 'flex' }}>
                {icon}
            </Box>
            <Typography
                sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: active ? 'text.primary' : 'text.disabled',
                }}
            >
                {label}
            </Typography>
        </Box>
    );
};

const HospitalDetailDrawer: React.FC<HospitalDetailDrawerProps> = ({
    hospital,
    open,
    onClose,
    onUpdateCapacity,
    onViewDashboard,
}) => {
    const theme = useTheme();
    const [tabValue, setTabValue] = useState(0);

    if (!hospital) return null;

    const getStatusConfig = () => {
        const status = hospital.status?.toLowerCase() || '';
        if (status === 'active' || status === 'operational') {
            return { color: '#10b981', label: 'Active', bg: 'rgba(16, 185, 129, 0.1)' };
        }
        if (status === 'maintenance') {
            return { color: '#f59e0b', label: 'Maintenance', bg: 'rgba(245, 158, 11, 0.1)' };
        }
        return { color: '#ef4444', label: 'Inactive', bg: 'rgba(239, 68, 68, 0.1)' };
    };

    const statusConfig = getStatusConfig();

    // Calculate totals
    const totalBeds = hospital.icuBeds + hospital.picuBeds + hospital.maleBeds +
        hospital.femaleBeds + hospital.pediatricBeds + hospital.standardBeds +
        (hospital.nicuBeds || 0);
    const availableBeds = hospital.icuBedsAvailable + hospital.picuBedsAvailable +
        hospital.maleBedsAvailable + hospital.femaleBedsAvailable +
        hospital.pediatricBedsAvailable + hospital.standardBedsAvailable +
        (hospital.nicuBedsAvailable || 0);
    const overallPercentage = totalBeds > 0 ? Math.round((availableBeds / totalBeds) * 100) : 0;

    const getCapacityColor = () => {
        if (overallPercentage <= 15) return '#ef4444';
        if (overallPercentage <= 35) return '#f59e0b';
        return '#10b981';
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 480 },
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 2.5,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${theme.palette.background.paper} 100%)`,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                            {hospital.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 1,
                                    backgroundColor: statusConfig.bg,
                                }}
                            >
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: statusConfig.color }} />
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: statusConfig.color }}>
                                    {statusConfig.label}
                                </Typography>
                            </Box>
                            {hospital.cluster && (
                                <Chip label={hospital.cluster} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                            )}
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} size="small" sx={{ ml: 1 }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Overall Capacity Card */}
                <Box
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: alpha(getCapacityColor(), 0.08),
                        border: `1px solid ${alpha(getCapacityColor(), 0.2)}`,
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: 'text.secondary' }}>
                            Overall Availability
                        </Typography>
                        <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: getCapacityColor() }}>
                            {overallPercentage}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={overallPercentage}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: alpha(getCapacityColor(), 0.15),
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                backgroundColor: getCapacityColor(),
                            },
                        }}
                    />
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.75 }}>
                        {availableBeds} available of {totalBeds} total beds
                    </Typography>
                </Box>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, v) => setTabValue(v)}
                    sx={{
                        minHeight: 40,
                        '& .MuiTab-root': {
                            minHeight: 40,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                        },
                    }}
                >
                    <Tab label="Capacity" />
                    <Tab label="Services" />
                    <Tab label="Contact" />
                </Tabs>
            </Box>

            {/* Tab Content */}
            <TabPanel value={tabValue} index={0}>
                <Box sx={{ p: 2.5 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 1.5 }}>
                        Bed Capacity Breakdown
                    </Typography>
                    <Box sx={{ backgroundColor: '#f8fafc', borderRadius: 2, p: 2 }}>
                        <BedRow label="ICU Beds" available={hospital.icuBedsAvailable} total={hospital.icuBeds} color="#ef4444" />
                        <BedRow label="PICU Beds" available={hospital.picuBedsAvailable} total={hospital.picuBeds} color="#f59e0b" />
                        {hospital.nicuBeds > 0 && (
                            <BedRow label="NICU Beds" available={hospital.nicuBedsAvailable} total={hospital.nicuBeds} color="#3b82f6" />
                        )}
                        <BedRow label="Male Ward" available={hospital.maleBedsAvailable} total={hospital.maleBeds} color="#8b5cf6" />
                        <BedRow label="Female Ward" available={hospital.femaleBedsAvailable} total={hospital.femaleBeds} color="#ec4899" />
                        <BedRow label="Pediatric" available={hospital.pediatricBedsAvailable} total={hospital.pediatricBeds} color="#14b8a6" />
                        <BedRow label="Standard" available={hospital.standardBedsAvailable} total={hospital.standardBeds} color="#64748b" />
                    </Box>
                </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <Box sx={{ p: 2.5 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 1.5 }}>
                        Available Services
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                        <ServiceBadge active={hospital.hasStemiService} label="STEMI" icon={<StemiIcon sx={{ fontSize: 16 }} />} color="#ef4444" />
                        <ServiceBadge active={hospital.hasStrokeService} label="Stroke" icon={<StrokeIcon sx={{ fontSize: 16 }} />} color="#3b82f6" />
                        <ServiceBadge active={hospital.hasTraumaService} label="Trauma" icon={<TraumaIcon sx={{ fontSize: 16 }} />} color="#f59e0b" />
                        <ServiceBadge active={hospital.hasStrokeUnit} label="Stroke Unit" icon={<StrokeUnitIcon sx={{ fontSize: 16 }} />} color="#8b5cf6" />
                        <ServiceBadge active={hospital.hasThrombolysis} label="Thrombolysis" icon={<ThrombolysisIcon sx={{ fontSize: 16 }} />} color="#10b981" />
                        <ServiceBadge active={hospital.hasThrombectomy} label="Thrombectomy" icon={<ThrombectomyIcon sx={{ fontSize: 16 }} />} color="#ec4899" />
                    </Box>

                    {hospital.traumaLevel && (
                        <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#f8fafc', borderRadius: 1.5 }}>
                            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                Trauma Level: <strong>{hospital.traumaLevel}</strong>
                            </Typography>
                        </Box>
                    )}
                </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <Box sx={{ p: 2.5 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 1.5 }}>
                        Contact Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {hospital.address && (
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                <Box sx={{ p: 1, borderRadius: 1, backgroundColor: alpha('#3b82f6', 0.1) }}>
                                    <LocationIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.25 }}>
                                        Address
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.85rem' }}>
                                        {hospital.address}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {hospital.contactPhone && (
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                <Box sx={{ p: 1, borderRadius: 1, backgroundColor: alpha('#10b981', 0.1) }}>
                                    <PhoneIcon sx={{ fontSize: 18, color: '#10b981' }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.25 }}>
                                        Phone
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.85rem' }}>
                                        {hospital.contactPhone}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {hospital.contactEmail && (
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                <Box sx={{ p: 1, borderRadius: 1, backgroundColor: alpha('#8b5cf6', 0.1) }}>
                                    <EmailIcon sx={{ fontSize: 18, color: '#8b5cf6' }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.25 }}>
                                        Email
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.85rem' }}>
                                        {hospital.contactEmail}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {!hospital.address && !hospital.contactPhone && !hospital.contactEmail && (
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', fontStyle: 'italic' }}>
                                No contact information available
                            </Typography>
                        )}
                    </Box>
                </Box>
            </TabPanel>

            {/* Footer Actions */}
            <Box
                sx={{
                    p: 2,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    gap: 1.5,
                    mt: 'auto',
                }}
            >
                <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => onUpdateCapacity(hospital)}
                    fullWidth
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                    Update Capacity
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<DashboardIcon />}
                    onClick={() => onViewDashboard(hospital.id)}
                    fullWidth
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                    Dashboard
                </Button>
            </Box>
        </Drawer>
    );
};

export default HospitalDetailDrawer;
