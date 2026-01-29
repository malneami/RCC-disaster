import React from 'react';
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
    Chip,
    Button,
    Collapse,
    Paper,
    alpha,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { User } from '../../../services/userManagementService';

interface RecordingsFiltersProps {
    searchFilter: string;
    setSearchFilter: (value: string) => void;
    statusFilter: string;
    setStatusFilter: (value: string) => void;
    callerFilter: string;
    setCallerFilter: (value: string) => void;
    calleeFilter: string;
    setCalleeFilter: (value: string) => void;
    users: User[];
}

export const RecordingsFilters: React.FC<RecordingsFiltersProps> = ({
    statusFilter,
    setStatusFilter,
    callerFilter,
    setCallerFilter,
    calleeFilter,
    setCalleeFilter,
    users,
}) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const hasActiveFilters = statusFilter || callerFilter || calleeFilter;

    const clearAllFilters = () => {
        setStatusFilter('');
        setCallerFilter('');
        setCalleeFilter('');
    };

    const getActiveFiltersCount = () => {
        let count = 0;
        if (statusFilter) count++;
        if (callerFilter) count++;
        if (calleeFilter) count++;
        return count;
    };

    return (
        <Box>
            {/* Filter Toggle Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: isExpanded ? 1.5 : 0 }}>
                <Button
                    variant={isExpanded ? "contained" : "outlined"}
                    startIcon={<FilterListIcon />}
                    endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    onClick={() => setIsExpanded(!isExpanded)}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 500,
                        borderColor: isExpanded ? '#1976D2' : '#E0E0E0',
                        color: isExpanded ? '#FFFFFF' : '#666666',
                        backgroundColor: isExpanded ? '#1976D2' : 'transparent',
                        '&:hover': {
                            borderColor: '#1976D2',
                            backgroundColor: isExpanded ? '#1565C0' : alpha('#1976D2', 0.08),
                        },
                        transition: 'all 0.2s ease',
                    }}
                >
                    Filters
                </Button>

                {hasActiveFilters && !isExpanded && (
                    <Chip
                        label={`${getActiveFiltersCount()} active`}
                        size="small"
                        onDelete={clearAllFilters}
                        sx={{
                            backgroundColor: alpha('#1976D2', 0.1),
                            color: '#1976D2',
                            border: `1px solid ${alpha('#1976D2', 0.3)}`,
                            fontWeight: 500,
                            '& .MuiChip-deleteIcon': {
                                color: '#1976D2',
                                '&:hover': {
                                    color: '#1565C0',
                                },
                            },
                        }}
                    />
                )}
            </Box>

            {/* Collapsible Filter Panel */}
            <Collapse in={isExpanded}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 2.5,
                        border: '1px solid #E0E0E0',
                        borderRadius: '8px',
                        backgroundColor: '#FAFAFA',
                    }}
                >
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                        <FormControl
                            size="small"
                            sx={{
                                minWidth: 200,
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: '#FFFFFF',
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#1976D2',
                                    },
                                },
                            }}
                        >
                            <InputLabel>Transcription Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Transcription Status"
                                onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>All Statuses</em>
                                </MenuItem>
                                <MenuItem value="PENDING">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            backgroundColor: '#1976D2'
                                        }} />
                                        Pending
                                    </Box>
                                </MenuItem>
                                <MenuItem value="RUNNING">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            backgroundColor: '#ED6C02'
                                        }} />
                                        Running
                                    </Box>
                                </MenuItem>
                                <MenuItem value="COMPLETED">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            backgroundColor: '#2E7D32'
                                        }} />
                                        Completed
                                    </Box>
                                </MenuItem>
                                <MenuItem value="FAILED">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            backgroundColor: '#D32F2F'
                                        }} />
                                        Failed
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl
                            size="small"
                            sx={{
                                minWidth: 220,
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: '#FFFFFF',
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#1976D2',
                                    },
                                },
                            }}
                        >
                            <InputLabel>Caller</InputLabel>
                            <Select
                                value={callerFilter}
                                label="Caller"
                                onChange={(e: SelectChangeEvent) => setCallerFilter(e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>All Callers</em>
                                </MenuItem>
                                {users.map(u => (
                                    <MenuItem key={u.id} value={u.id}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <Box sx={{ fontWeight: 500 }}>
                                                {u.firstName} {u.lastName}
                                            </Box>
                                            <Box sx={{ fontSize: '0.75rem', color: '#666666' }}>
                                                {u.role}
                                            </Box>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl
                            size="small"
                            sx={{
                                minWidth: 220,
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: '#FFFFFF',
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#1976D2',
                                    },
                                },
                            }}
                        >
                            <InputLabel>Callee</InputLabel>
                            <Select
                                value={calleeFilter}
                                label="Callee"
                                onChange={(e: SelectChangeEvent) => setCalleeFilter(e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>All Callees</em>
                                </MenuItem>
                                {users.map(u => (
                                    <MenuItem key={u.id} value={u.id}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <Box sx={{ fontWeight: 500 }}>
                                                {u.firstName} {u.lastName}
                                            </Box>
                                            <Box sx={{ fontSize: '0.75rem', color: '#666666' }}>
                                                {u.role}
                                            </Box>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box sx={{ flexGrow: 1 }} />

                        {hasActiveFilters && (
                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={clearAllFilters}
                                size="small"
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    borderColor: '#E0E0E0',
                                    color: '#666666',
                                    backgroundColor: '#FFFFFF',
                                    '&:hover': {
                                        borderColor: '#D32F2F',
                                        backgroundColor: alpha('#D32F2F', 0.08),
                                        color: '#D32F2F',
                                    },
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </Box>

                    {/* Active Filters Summary */}
                    {hasActiveFilters && (
                        <Box sx={{
                            mt: 2,
                            pt: 2,
                            borderTop: '1px solid #E0E0E0',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1,
                            alignItems: 'center',
                        }}>
                            <Box sx={{ fontSize: '0.875rem', color: '#666666', fontWeight: 500 }}>
                                Active Filters:
                            </Box>
                            {statusFilter && (
                                <Chip
                                    label={`Status: ${statusFilter}`}
                                    size="small"
                                    onDelete={() => setStatusFilter('')}
                                    sx={{
                                        backgroundColor: alpha('#1976D2', 0.1),
                                        color: '#1976D2',
                                        border: `1px solid ${alpha('#1976D2', 0.3)}`,
                                        '& .MuiChip-deleteIcon': {
                                            color: '#1976D2',
                                        },
                                    }}
                                />
                            )}
                            {callerFilter && (
                                <Chip
                                    label={`Caller: ${users.find(u => u.id === callerFilter)?.firstName} ${users.find(u => u.id === callerFilter)?.lastName}`}
                                    size="small"
                                    onDelete={() => setCallerFilter('')}
                                    sx={{
                                        backgroundColor: alpha('#2E7D32', 0.1),
                                        color: '#2E7D32',
                                        border: `1px solid ${alpha('#2E7D32', 0.3)}`,
                                        '& .MuiChip-deleteIcon': {
                                            color: '#2E7D32',
                                        },
                                    }}
                                />
                            )}
                            {calleeFilter && (
                                <Chip
                                    label={`Callee: ${users.find(u => u.id === calleeFilter)?.firstName} ${users.find(u => u.id === calleeFilter)?.lastName}`}
                                    size="small"
                                    onDelete={() => setCalleeFilter('')}
                                    sx={{
                                        backgroundColor: alpha('#ED6C02', 0.1),
                                        color: '#ED6C02',
                                        border: `1px solid ${alpha('#ED6C02', 0.3)}`,
                                        '& .MuiChip-deleteIcon': {
                                            color: '#ED6C02',
                                        },
                                    }}
                                />
                            )}
                        </Box>
                    )}
                </Paper>
            </Collapse>
        </Box>
    );
};
