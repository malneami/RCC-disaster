import React from 'react';
import {
    Box,
    Typography,
    Grid,
    TextField,
    Button,
    Card,
    CardContent,
    IconButton,
    Tooltip,
    Menu,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Stack,
    Chip,
    ListItemText,
} from '@mui/material';
import {
    FilterList as FilterIcon,
    Sort as SortIcon,
    Refresh as RefreshIcon,
    ViewList as ListIcon,
    ViewModule as GridIcon,
} from '@mui/icons-material';
import { TicketFilterOptions, TicketSortOption } from '../../types/tickets';

interface TicketFiltersProps {
    filters: TicketFilterOptions;
    sortBy: TicketSortOption;
    viewMode: 'grid' | 'list';
    onFilterChange: (key: keyof TicketFilterOptions, value: any) => void;
    onClearFilters: () => void;
    onSortChange: (sort: TicketSortOption) => void;
    onViewModeChange: (mode: 'grid' | 'list') => void;
    onRefresh?: () => void;
    statusOptions: string[];
    priorityOptions: string[];
    pathwayOptions: string[];
    filterMenuAnchor: HTMLElement | null;
    sortMenuAnchor: HTMLElement | null;
    onFilterMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
    onFilterMenuClose: () => void;
    onSortMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
    onSortMenuClose: () => void;
}

export const TicketFilters: React.FC<TicketFiltersProps> = ({
    filters,
    sortBy,
    viewMode,
    onFilterChange,
    onClearFilters,
    onSortChange,
    onViewModeChange,
    onRefresh,
    statusOptions,
    priorityOptions,
    pathwayOptions,
    filterMenuAnchor,
    sortMenuAnchor,
    onFilterMenuOpen,
    onFilterMenuClose,
    onSortMenuOpen,
    onSortMenuClose,
}) => {

    const getSortLabel = (sortOption: TicketSortOption) => {
        switch (sortOption) {
            case 'createdAt_desc': return 'Newest First';
            case 'createdAt_asc': return 'Oldest First';
            case 'priority_desc': return 'Priority (High to Low)';
            case 'priority_asc': return 'Priority (Low to High)';
            case 'status_asc': return 'Status (A-Z)';
            case 'status_desc': return 'Status (Z-A)';
            default: return 'Sort';
        }
    };

    return (
        <>
            <Card sx={{ mb: 3 }}>
                <CardContent sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        {/* Search */}
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search tickets..."
                                value={filters.search || ''}
                                onChange={(e) => onFilterChange('search', e.target.value)}
                            />
                        </Grid>

                        {/* Filter Button */}
                        <Grid item xs={6} sm={3} md={2}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<FilterIcon />}
                                onClick={onFilterMenuOpen}
                                size="small"
                            >
                                Filters
                            </Button>
                        </Grid>

                        {/* Sort Button */}
                        <Grid item xs={6} sm={3} md={2}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<SortIcon />}
                                onClick={onSortMenuOpen}
                                size="small"
                            >
                                {getSortLabel(sortBy)}
                            </Button>
                        </Grid>

                        {/* View Mode Toggle */}
                        <Grid item xs={12} sm={6} md={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Tooltip title="Grid View">
                                    <IconButton
                                        size="small"
                                        color={viewMode === 'grid' ? 'primary' : 'default'}
                                        onClick={() => onViewModeChange('grid')}
                                    >
                                        <GridIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="List View">
                                    <IconButton
                                        size="small"
                                        color={viewMode === 'list' ? 'primary' : 'default'}
                                        onClick={() => onViewModeChange('list')}
                                    >
                                        <ListIcon />
                                    </IconButton>
                                </Tooltip>
                                {onRefresh && (
                                    <Tooltip title="Refresh">
                                        <IconButton size="small" onClick={onRefresh}>
                                            <RefreshIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Active Filters */}
                    {(filters.status?.length || filters.priority?.length || filters.type?.length || filters.pathway?.length) && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Active Filters:
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                {filters.status?.map(status => (
                                    <Chip
                                        key={status}
                                        label={`Status: ${status}`}
                                        size="small"
                                        onDelete={() => onFilterChange('status', filters.status?.filter(s => s !== status))}
                                    />
                                ))}
                                {filters.priority?.map(priority => (
                                    <Chip
                                        key={priority}
                                        label={`Priority: ${priority}`}
                                        size="small"
                                        onDelete={() => onFilterChange('priority', filters.priority?.filter(p => p !== priority))}
                                    />
                                ))}
                                {filters.type?.map(type => (
                                    <Chip
                                        key={type}
                                        label={`Type: ${type}`}
                                        size="small"
                                        onDelete={() => onFilterChange('type', filters.type?.filter(t => t !== type))}
                                    />
                                ))}
                                {filters.pathway?.map(pathway => (
                                    <Chip
                                        key={pathway}
                                        label={`Pathway: ${pathway}`}
                                        size="small"
                                        onDelete={() => onFilterChange('pathway', filters.pathway?.filter(p => p !== pathway))}
                                    />
                                ))}
                                <Button size="small" onClick={onClearFilters}>
                                    Clear All
                                </Button>
                            </Stack>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Filter Menu */}
            <Menu
                anchorEl={filterMenuAnchor}
                open={Boolean(filterMenuAnchor)}
                onClose={onFilterMenuClose}
            >
                <Box sx={{ p: 2, minWidth: 200 }}>
                    <Typography variant="subtitle2" gutterBottom>Status</Typography>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            multiple
                            value={filters.status || []}
                            onChange={(e) => onFilterChange('status', e.target.value)}
                            label="Status"
                        >
                            {statusOptions.map(status => (
                                <MenuItem key={status} value={status}>{status}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Typography variant="subtitle2" gutterBottom>Priority</Typography>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Priority</InputLabel>
                        <Select
                            multiple
                            value={filters.priority || []}
                            onChange={(e) => onFilterChange('priority', e.target.value)}
                            label="Priority"
                        >
                            {priorityOptions.map(priority => (
                                <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Typography variant="subtitle2" gutterBottom>Type</Typography>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Type</InputLabel>
                        <Select
                            multiple
                            value={filters.type || []}
                            onChange={(e) => onFilterChange('type', e.target.value)}
                            label="Type"
                        >
                            <MenuItem value="TRANSFER">Transfer</MenuItem>
                            <MenuItem value="HOSPITAL">Hospital</MenuItem>
                        </Select>
                    </FormControl>

                    {pathwayOptions.length > 0 && (
                        <>
                            <Typography variant="subtitle2" gutterBottom>Pathway</Typography>
                            <FormControl fullWidth size="small">
                                <InputLabel>Pathway</InputLabel>
                                <Select
                                    multiple
                                    value={filters.pathway || []}
                                    onChange={(e) => onFilterChange('pathway', e.target.value)}
                                    label="Pathway"
                                >
                                    {pathwayOptions.map(pathway => (
                                        <MenuItem key={pathway} value={pathway}>{pathway}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </>
                    )}
                </Box>
            </Menu>

            {/* Sort Menu */}
            <Menu
                anchorEl={sortMenuAnchor}
                open={Boolean(sortMenuAnchor)}
                onClose={onSortMenuClose}
            >
                {[
                    'createdAt_desc',
                    'createdAt_asc',
                    'priority_desc',
                    'priority_asc',
                    'status_asc',
                    'status_desc',
                ].map(sortOption => (
                    <MenuItem
                        key={sortOption}
                        onClick={() => {
                            onSortChange(sortOption as TicketSortOption);
                            onSortMenuClose();
                        }}
                    >
                        <ListItemText>{getSortLabel(sortOption as TicketSortOption)}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};
