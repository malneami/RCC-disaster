import React, { useState } from 'react';
import {
    Drawer,
    Box,
    Tabs,
    Tab,
} from '@mui/material';
import { Hospital } from '../../../services/hospitalService';
import { DetailDrawerHeader } from './drawer/DetailDrawerHeader';
import { DetailDrawerFooter } from './drawer/DetailDrawerFooter';
import { TabPanel } from './drawer/DrawerComponents';
import { CapacityTab } from './drawer/CapacityTab';
import { ServicesTab } from './drawer/ServicesTab';
import { ContactTab } from './drawer/ContactTab';

interface HospitalDetailDrawerProps {
    hospital: Hospital | null;
    open: boolean;
    onClose: () => void;
    onUpdateCapacity: (hospital: Hospital) => void;
    onViewDashboard: (hospitalId: string) => void;
}

const HospitalDetailDrawer: React.FC<HospitalDetailDrawerProps> = ({
    hospital,
    open,
    onClose,
    onUpdateCapacity,
    onViewDashboard,
}) => {
    const [tabValue, setTabValue] = useState(0);

    if (!hospital) return null;

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
            <DetailDrawerHeader hospital={hospital} onClose={onClose} />

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
                <CapacityTab hospital={hospital} />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <ServicesTab hospital={hospital} />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <ContactTab hospital={hospital} />
            </TabPanel>

            <DetailDrawerFooter
                hospital={hospital}
                onUpdateCapacity={onUpdateCapacity}
                onViewDashboard={onViewDashboard}
            />
        </Drawer>
    );
};

export default HospitalDetailDrawer;
