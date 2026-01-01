import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Avatar,
    IconButton,
    Tooltip,
    Grow,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    alpha,
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Edit as EditIcon,
    Favorite as StemiIcon,
    Psychology as StrokeIcon,
    LocalFireDepartment as TraumaIcon,
    MoreVert as MoreIcon,
    TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { Hospital } from '../../../../services/hospitalService';
import { CapacityRing, StatusBadge, ServiceTag } from './GridComponents';

interface HospitalRowProps {
    hospital: Hospital;
    index: number;
    onRowClick?: (hospital: Hospital) => void;
    onUpdateCapacity: (hospital: Hospital) => void;
    onViewDashboard: (hospitalId: string) => void;
}

export const HospitalRow: React.FC<HospitalRowProps> = ({
    hospital,
    index,
    onRowClick,
    onUpdateCapacity,
    onViewDashboard
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const totalBeds = hospital.icuBeds + hospital.picuBeds + hospital.maleBeds +
        hospital.femaleBeds + hospital.pediatricBeds + hospital.standardBeds +
        (hospital.nicuBeds || 0);
    const availableBeds = hospital.icuBedsAvailable + hospital.picuBedsAvailable +
        hospital.maleBedsAvailable + hospital.femaleBedsAvailable +
        hospital.pediatricBedsAvailable + hospital.standardBedsAvailable +
        (hospital.nicuBedsAvailable || 0);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <Grow in timeout={200 + index * 50}>
            <Paper
                elevation={0}
                onClick={() => onRowClick?.(hospital)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    mb: 1.5,
                    borderRadius: '16px',
                    backgroundColor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.12)',
                        transform: 'translateY(-2px)',
                    },
                }}
            >
                <Avatar
                    sx={{
                        width: 48,
                        height: 48,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        mr: 2,
                        fontSize: '1.2rem',
                        fontWeight: 700,
                    }}
                >
                    {hospital.name?.charAt(0) || 'H'}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 700,
                                color: 'text.primary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {hospital.name}
                        </Typography>
                        <StatusBadge status={hospital.status} />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'text.secondary',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                            }}
                        >
                            📍 {hospital.cluster || 'غير محدد'}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                            {hospital.hasStemiService && (
                                <ServiceTag icon={StemiIcon} label="STEMI" color="#ef4444" />
                            )}
                            {hospital.hasStrokeService && (
                                <ServiceTag icon={StrokeIcon} label="Stroke" color="#3b82f6" />
                            )}
                            {hospital.hasTraumaService && (
                                <ServiceTag icon={TraumaIcon} label="Trauma" color="#f59e0b" />
                            )}
                        </Box>
                    </Box>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        px: 3,
                        borderLeft: '1px solid',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        mx: 2,
                    }}
                >
                    <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                        <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', fontSize: '0.65rem', display: 'block', mb: 0.25 }}
                        >
                            ICU
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1 }}>
                            {hospital.icuBedsAvailable}
                            <Typography
                                component="span"
                                sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 500 }}
                            >
                                /{hospital.icuBeds}
                            </Typography>
                        </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                        <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', fontSize: '0.65rem', display: 'block', mb: 0.25 }}
                        >
                            المتاح
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981', lineHeight: 1 }}>
                            {availableBeds}
                        </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                        <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', fontSize: '0.65rem', display: 'block', mb: 0.25 }}
                        >
                            الإجمالي
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>
                            {totalBeds}
                        </Typography>
                    </Box>
                </Box>

                <CapacityRing available={availableBeds} total={totalBeds} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                    <Tooltip title="تحديث السعة" arrow>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpdateCapacity(hospital);
                            }}
                            sx={{
                                width: 38,
                                height: 38,
                                borderRadius: '12px',
                                backgroundColor: alpha('#3b82f6', 0.08),
                                color: '#3b82f6',
                                transition: 'all 0.25s ease',
                                '&:hover': {
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    transform: 'scale(1.1)',
                                },
                            }}
                        >
                            <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="لوحة المعلومات" arrow>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewDashboard(hospital.id);
                            }}
                            sx={{
                                width: 38,
                                height: 38,
                                borderRadius: '12px',
                                backgroundColor: alpha('#10b981', 0.08),
                                color: '#10b981',
                                transition: 'all 0.25s ease',
                                '&:hover': {
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    transform: 'scale(1.1)',
                                },
                            }}
                        >
                            <ViewIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>

                    <IconButton
                        size="small"
                        onClick={handleMenuOpen}
                        sx={{
                            width: 38,
                            height: 38,
                            borderRadius: '12px',
                            color: 'text.secondary',
                            '&:hover': { backgroundColor: alpha('#000', 0.04) },
                        }}
                    >
                        <MoreIcon sx={{ fontSize: 18 }} />
                    </IconButton>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        PaperProps={{
                            sx: {
                                borderRadius: '12px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                                minWidth: 180,
                            },
                        }}
                    >
                        <MenuItem onClick={() => { handleMenuClose(); onViewDashboard(hospital.id); }}>
                            <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
                            <ListItemText>عرض التفاصيل</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => { handleMenuClose(); onUpdateCapacity(hospital); }}>
                            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                            <ListItemText>تحديث السعة</ListItemText>
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleMenuClose}>
                            <ListItemIcon><TrendingIcon fontSize="small" /></ListItemIcon>
                            <ListItemText>الإحصائيات</ListItemText>
                        </MenuItem>
                    </Menu>
                </Box>
            </Paper>
        </Grow>
    );
};
