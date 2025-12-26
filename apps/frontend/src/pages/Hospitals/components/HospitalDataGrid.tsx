import React, { useMemo, useState } from 'react';
import {
    Box,
    IconButton,
    Tooltip,
    Typography,
    alpha,
    InputBase,
    Paper,
    InputAdornment,
    Fade,
    Grow,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Badge,
    Avatar,
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Edit as EditIcon,
    LocalHospital as HospitalIcon,
    Favorite as StemiIcon,
    Psychology as StrokeIcon,
    LocalFireDepartment as TraumaIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    FilterList as FilterIcon,
    CheckCircle as ActiveIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    MoreVert as MoreIcon,
    KeyboardArrowDown as ArrowDownIcon,
    Hotel as BedIcon,
    TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { Hospital } from '../../../services/hospitalService';

interface HospitalDataGridProps {
    hospitals: Hospital[];
    onRowClick?: (hospital: Hospital) => void;
    onUpdateCapacity: (hospital: Hospital) => void;
    onViewDashboard: (hospitalId: string) => void;
}

// Circular capacity indicator
const CapacityRing: React.FC<{ available: number; total: number; size?: number }> = ({
    available,
    total,
    size = 56
}) => {
    const percentage = total > 0 ? Math.round((available / total) * 100) : 0;
    const circumference = 2 * Math.PI * 22;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const getColor = () => {
        if (percentage <= 15) return '#ef4444';
        if (percentage <= 35) return '#f59e0b';
        return '#10b981';
    };

    return (
        <Box sx={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} viewBox="0 0 56 56">
                {/* Background circle */}
                <circle
                    cx="28"
                    cy="28"
                    r="22"
                    fill="none"
                    stroke="rgba(0,0,0,0.06)"
                    strokeWidth="6"
                />
                {/* Progress circle */}
                <circle
                    cx="28"
                    cy="28"
                    r="22"
                    fill="none"
                    stroke={getColor()}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{
                        transition: 'stroke-dashoffset 0.8s ease-out',
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%',
                    }}
                />
            </svg>
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        color: getColor(),
                        lineHeight: 1,
                    }}
                >
                    {percentage}%
                </Typography>
            </Box>
        </Box>
    );
};

// Status badge component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const getConfig = () => {
        const statusLower = status?.toLowerCase() || '';
        if (statusLower === 'active' || statusLower === 'operational') {
            return { icon: ActiveIcon, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'نشط' };
        }
        if (statusLower === 'maintenance') {
            return { icon: WarningIcon, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'صيانة' };
        }
        return { icon: ErrorIcon, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'متوقف' };
    };

    const config = getConfig();
    const Icon = config.icon;

    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.5,
                py: 0.5,
                borderRadius: '20px',
                backgroundColor: config.bg,
            }}
        >
            <Icon sx={{ fontSize: 14, color: config.color }} />
            <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: config.color, fontSize: '0.7rem' }}
            >
                {config.label}
            </Typography>
        </Box>
    );
};

// Service tag component
const ServiceTag: React.FC<{ icon: React.ElementType; label: string; color: string }> = ({
    icon: Icon,
    label,
    color
}) => (
    <Tooltip title={label} arrow placement="top">
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: '6px',
                backgroundColor: alpha(color, 0.1),
                transition: 'all 0.2s ease',
                cursor: 'default',
                '&:hover': {
                    backgroundColor: alpha(color, 0.2),
                    transform: 'scale(1.05)',
                },
            }}
        >
            <Icon sx={{ fontSize: 12, color }} />
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color }}>{label}</Typography>
        </Box>
    </Tooltip>
);

// Hospital card row
const HospitalRow: React.FC<{
    hospital: Hospital;
    index: number;
    onRowClick?: (hospital: Hospital) => void;
    onUpdateCapacity: (hospital: Hospital) => void;
    onViewDashboard: (hospitalId: string) => void;
}> = ({ hospital, index, onRowClick, onUpdateCapacity, onViewDashboard }) => {
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
                {/* Hospital Avatar */}
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

                {/* Hospital Info */}
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
                        {/* Cluster */}
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

                        {/* Services */}
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

                {/* Bed Stats */}
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
                    {/* ICU Beds */}
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

                    {/* Total Available */}
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

                    {/* Total Beds */}
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

                {/* Capacity Ring */}
                <CapacityRing available={availableBeds} total={totalBeds} />

                {/* Actions */}
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

const HospitalDataGrid: React.FC<HospitalDataGridProps> = ({
    hospitals,
    onRowClick,
    onUpdateCapacity,
    onViewDashboard,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Filter hospitals
    const filteredHospitals = useMemo(() => {
        let result = hospitals;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(h =>
                h.name?.toLowerCase().includes(query) ||
                h.cluster?.toLowerCase().includes(query)
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter(h => h.status?.toLowerCase() === statusFilter);
        }

        return result;
    }, [hospitals, searchQuery, statusFilter]);

    // Stats
    const stats = useMemo(() => {
        const total = hospitals.length;
        const active = hospitals.filter(h => h.status?.toLowerCase() === 'active' || h.status?.toLowerCase() === 'operational').length;
        const totalBeds = hospitals.reduce((sum, h) => sum + h.icuBeds + h.picuBeds + h.maleBeds + h.femaleBeds + h.pediatricBeds + h.standardBeds + (h.nicuBeds || 0), 0);
        const availableBeds = hospitals.reduce((sum, h) => sum + h.icuBedsAvailable + h.picuBedsAvailable + h.maleBedsAvailable + h.femaleBedsAvailable + h.pediatricBedsAvailable + h.standardBedsAvailable + (h.nicuBedsAvailable || 0), 0);
        return { total, active, totalBeds, availableBeds };
    }, [hospitals]);

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header Bar */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 3,
                    flexWrap: 'wrap',
                    gap: 2,
                }}
            >
                {/* Search */}
                <Paper
                    elevation={0}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flex: 1,
                        maxWidth: 500,
                        px: 2.5,
                        py: 1.25,
                        borderRadius: '14px',
                        backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.95),
                        border: '2px solid',
                        borderColor: isSearchFocused ? 'primary.main' : 'divider',
                        boxShadow: isSearchFocused
                            ? '0 0 0 4px rgba(59, 130, 246, 0.1)'
                            : 'none',
                        transition: 'all 0.3s ease',
                    }}
                >
                    <SearchIcon
                        sx={{
                            color: isSearchFocused ? 'primary.main' : 'text.disabled',
                            mr: 1.5,
                            transition: 'color 0.3s ease',
                        }}
                    />
                    <InputBase
                        placeholder="ابحث عن مستشفى بالاسم أو المنطقة..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        sx={{
                            flex: 1,
                            fontSize: '0.95rem',
                            fontWeight: 500,
                            '& input::placeholder': {
                                color: 'text.disabled',
                                opacity: 1,
                            },
                        }}
                        endAdornment={
                            searchQuery && (
                                <Fade in>
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => setSearchQuery('')}
                                            sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                                        >
                                            <ClearIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </InputAdornment>
                                </Fade>
                            )
                        }
                    />
                </Paper>

                {/* Filter Button */}
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Badge
                        badgeContent={statusFilter !== 'all' ? 1 : 0}
                        color="primary"
                        sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem' } }}
                    >
                        <Paper
                            elevation={0}
                            onClick={(e) => setFilterAnchor(e.currentTarget)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 2,
                                py: 1.25,
                                borderRadius: '12px',
                                border: '1px solid',
                                borderColor: 'divider',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    backgroundColor: alpha('#3b82f6', 0.04),
                                },
                            }}
                        >
                            <FilterIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                تصفية
                            </Typography>
                            <ArrowDownIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                        </Paper>
                    </Badge>

                    <Menu
                        anchorEl={filterAnchor}
                        open={Boolean(filterAnchor)}
                        onClose={() => setFilterAnchor(null)}
                        PaperProps={{
                            sx: { borderRadius: '12px', minWidth: 160, mt: 1 },
                        }}
                    >
                        <MenuItem
                            selected={statusFilter === 'all'}
                            onClick={() => { setStatusFilter('all'); setFilterAnchor(null); }}
                        >
                            الكل
                        </MenuItem>
                        <MenuItem
                            selected={statusFilter === 'active' || statusFilter === 'operational'}
                            onClick={() => { setStatusFilter('active'); setFilterAnchor(null); }}
                        >
                            <ActiveIcon sx={{ fontSize: 16, color: '#10b981', mr: 1 }} /> نشط
                        </MenuItem>
                        <MenuItem
                            selected={statusFilter === 'maintenance'}
                            onClick={() => { setStatusFilter('maintenance'); setFilterAnchor(null); }}
                        >
                            <WarningIcon sx={{ fontSize: 16, color: '#f59e0b', mr: 1 }} /> صيانة
                        </MenuItem>
                        <MenuItem
                            selected={statusFilter === 'inactive'}
                            onClick={() => { setStatusFilter('inactive'); setFilterAnchor(null); }}
                        >
                            <ErrorIcon sx={{ fontSize: 16, color: '#ef4444', mr: 1 }} /> متوقف
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>

            {/* Quick Stats */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                {[
                    { label: 'المستشفيات', value: stats.total, icon: HospitalIcon, color: '#667eea' },
                    { label: 'نشط', value: stats.active, icon: ActiveIcon, color: '#10b981' },
                    { label: 'إجمالي الأسرّة', value: stats.totalBeds, icon: BedIcon, color: '#3b82f6' },
                    { label: 'أسرّة متاحة', value: stats.availableBeds, icon: TrendingIcon, color: '#f59e0b' },
                ].map((stat, i) => (
                    <Paper
                        key={i}
                        elevation={0}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 2.5,
                            py: 1.5,
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: 'divider',
                            minWidth: 140,
                        }}
                    >
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: '10px',
                                backgroundColor: alpha(stat.color, 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <stat.icon sx={{ fontSize: 18, color: stat.color }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                {stat.value}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                {stat.label}
                            </Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* Results Count */}
            {searchQuery && (
                <Fade in>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        تم العثور على <strong>{filteredHospitals.length}</strong> نتيجة
                    </Typography>
                </Fade>
            )}

            {/* Hospital List */}
            <Box
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    pr: 1,
                    '&::-webkit-scrollbar': { width: 6 },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: alpha('#000', 0.1),
                        borderRadius: 3,
                        '&:hover': { backgroundColor: alpha('#000', 0.2) },
                    },
                }}
            >
                {filteredHospitals.length === 0 ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 6,
                            textAlign: 'center',
                            borderRadius: '16px',
                            border: '2px dashed',
                            borderColor: 'divider',
                        }}
                    >
                        <HospitalIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                            لا توجد نتائج
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                            جرب البحث بكلمات مختلفة
                        </Typography>
                    </Paper>
                ) : (
                    filteredHospitals.map((hospital, index) => (
                        <HospitalRow
                            key={hospital.id}
                            hospital={hospital}
                            index={index}
                            onRowClick={onRowClick}
                            onUpdateCapacity={onUpdateCapacity}
                            onViewDashboard={onViewDashboard}
                        />
                    ))
                )}
            </Box>
        </Box>
    );
};

export default HospitalDataGrid;
