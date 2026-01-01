import React from 'react';
import { Box, Button } from '@mui/material';
import { Bed as BedIcon, Add as AddIcon } from '@mui/icons-material';

interface HospitalBedsHeaderProps {
    lastUpdated: Date;
    canManageBeds: boolean;
    onAddBed: () => void;
}

export const HospitalBedsHeader: React.FC<HospitalBedsHeaderProps> = ({
    lastUpdated,
    canManageBeds,
    onAddBed,
}) => {
    return (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                        <BedIcon color="primary" />
                        <Box>
                            <Box component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </Box>
                        </Box>
                    </Box>
                </Box>
                {canManageBeds && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={onAddBed}
                        sx={{
                            backgroundColor: '#10B981',
                            color: '#FFFFFF',
                            fontWeight: 600,
                            padding: '10px 24px',
                            borderRadius: '12px',
                            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                            textTransform: 'none',
                            '&:hover': {
                                backgroundColor: '#059669',
                                boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)',
                            },
                        }}
                    >
                        Add Bed
                    </Button>
                )}
            </Box>
        </Box>
    );
};
