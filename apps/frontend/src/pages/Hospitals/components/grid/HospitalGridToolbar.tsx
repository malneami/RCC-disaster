import React, { useState } from 'react';
import {
    Box,
    Paper,
    InputBase,
    InputAdornment,
    IconButton,
    Fade,
    Badge,
    Menu,
    MenuItem,
    Typography,
    alpha,
} from '@mui/material';
import {
    Search as SearchIcon,
    Clear as ClearIcon,
    FilterList as FilterIcon,
    KeyboardArrowDown as ArrowDownIcon,
    CheckCircle as ActiveIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
} from '@mui/icons-material';

interface HospitalGridToolbarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (status: string) => void;
}

export const HospitalGridToolbar: React.FC<HospitalGridToolbarProps> = ({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
}) => {
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);

    return (
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
                    onChange={(e) => onSearchChange(e.target.value)}
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
                                        onClick={() => onSearchChange('')}
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
                        onClick={() => { onStatusFilterChange('all'); setFilterAnchor(null); }}
                    >
                        الكل
                    </MenuItem>
                    <MenuItem
                        selected={statusFilter === 'active' || statusFilter === 'operational'}
                        onClick={() => { onStatusFilterChange('active'); setFilterAnchor(null); }}
                    >
                        <ActiveIcon sx={{ fontSize: 16, color: '#10b981', mr: 1 }} /> نشط
                    </MenuItem>
                    <MenuItem
                        selected={statusFilter === 'maintenance'}
                        onClick={() => { onStatusFilterChange('maintenance'); setFilterAnchor(null); }}
                    >
                        <WarningIcon sx={{ fontSize: 16, color: '#f59e0b', mr: 1 }} /> صيانة
                    </MenuItem>
                    <MenuItem
                        selected={statusFilter === 'inactive'}
                        onClick={() => { onStatusFilterChange('inactive'); setFilterAnchor(null); }}
                    >
                        <ErrorIcon sx={{ fontSize: 16, color: '#ef4444', mr: 1 }} /> متوقف
                    </MenuItem>
                </Menu>
            </Box>
        </Box>
    );
};
