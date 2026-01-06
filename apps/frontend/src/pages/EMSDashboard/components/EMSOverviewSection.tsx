import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faUserMd, faTruck, faCheckCircle, faAmbulance, faHeartbeat, faTasks, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { useEMSDashboard } from '../../EMS/hooks/useEMSDashboard';

// Professional muted color palette
const COLORS = {
    primary: '#2563EB',
    success: '#059669',
    warning: '#D97706',
    accent: '#7C3AED',
    info: '#0891B2',
    pink: '#DB2777',
    indigo: '#4F46E5',
    slate: {
        50: '#F8FAFC',
        100: '#F1F5F9',
        200: '#E2E8F0',
        500: '#64748B',
        700: '#334155',
        900: '#0F172A',
    },
};

interface KPICardProps {
    title: string;
    value: number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, color }) => (
    <Box
        sx={{
            bgcolor: color,
            borderRadius: 2,
            p: { xs: 1.5, md: 2.5 },
            height: '100%',
            color: '#fff',
            transition: 'transform 0.2s ease',
            '&:hover': { transform: 'translateY(-2px)' },
            '&:focus-within': {
                outline: '2px solid',
                outlineColor: 'rgba(255,255,255,0.5)',
                outlineOffset: 2,
            },
        }}
    >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: { xs: 1, md: 1.5 } }}>
            <Typography sx={{ 
                fontSize: { xs: '0.7rem', md: '0.75rem' }, 
                fontWeight: 600, 
                opacity: 0.9 
            }}>
                {title}
            </Typography>
            <Box sx={{ 
                width: { xs: 28, md: 32 }, 
                height: { xs: 28, md: 32 }, 
                borderRadius: 1.5, 
                bgcolor: 'rgba(255,255,255,0.2)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: { xs: '0.75rem', md: '0.85rem' },
                flexShrink: 0,
            }}>
                {icon}
            </Box>
        </Box>
        <Typography sx={{ 
            fontSize: { xs: '1.375rem', md: '1.75rem' }, 
            fontWeight: 700, 
            lineHeight: 1 
        }}>
            {value}
        </Typography>
        {subtitle && (
            <Typography sx={{ 
                fontSize: { xs: '0.65rem', md: '0.7rem' }, 
                fontWeight: 500, 
                opacity: 0.8, 
                mt: 0.5 
            }}>
                {subtitle}
            </Typography>
        )}
    </Box>
);

const EMSOverviewSection: React.FC = () => {
    const { data: dashboardData, isLoading } = useEMSDashboard();

    if (isLoading) return <Box sx={{ textAlign: 'center', py: 4 }}><Typography color="text.secondary">Loading...</Typography></Box>;

    const s = dashboardData?.summary || ({} as any);

    const cards = [
        { title: 'Pending Requests', value: s.pendingTickets || 0, subtitle: 'Waiting for Assignment', icon: <FontAwesomeIcon icon={faClock} />, color: COLORS.warning },
        { title: 'Assigned', value: s.assignedAssignments || 0, subtitle: 'En Route to Patient', icon: <FontAwesomeIcon icon={faUserMd} />, color: COLORS.primary },
        { title: 'In Transport', value: s.inTransportAssignments || 0, subtitle: 'Patient On Board', icon: <FontAwesomeIcon icon={faTruck} />, color: COLORS.accent },
        { title: 'Completed Today', value: s.todayCompletedAssignments || 0, subtitle: 'Arrivals Today', icon: <FontAwesomeIcon icon={faCheckCircle} />, color: COLORS.success },
        { title: 'Total Ambulances', value: s.totalAmbulances || 0, subtitle: 'Fleet Size', icon: <FontAwesomeIcon icon={faAmbulance} />, color: COLORS.info },
        { title: 'Active Units', value: s.activeAmbulances || 0, subtitle: 'In Service', icon: <FontAwesomeIcon icon={faHeartbeat} />, color: COLORS.pink },
        { title: 'Available', value: s.availableAmbulances || 0, subtitle: 'Ready', icon: <FontAwesomeIcon icon={faClock} />, color: COLORS.success },
        { title: 'Total Completed', value: s.totalCompletedAssignments || s.totalAssignments || 0, subtitle: 'All Time', icon: <FontAwesomeIcon icon={faTasks} />, color: COLORS.indigo },
    ];

    return (
        <Box sx={{ 
            bgcolor: '#fff', 
            border: `1px solid ${COLORS.slate[200]}`, 
            borderRadius: 2, 
            p: { xs: 2, md: 3 } 
        }}>
            {/* Header */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, md: 1.5 }, 
                mb: { xs: 2, md: 3 } 
            }}>
                <Box sx={{ 
                    width: { xs: 32, md: 36 }, 
                    height: { xs: 32, md: 36 }, 
                    borderRadius: 2, 
                    bgcolor: COLORS.success, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#fff' 
                }}>
                    <FontAwesomeIcon icon={faChartLine} />
                </Box>
                <Typography sx={{ 
                    fontSize: { xs: '1rem', md: '1.125rem' }, 
                    fontWeight: 700, 
                    color: COLORS.slate[900] 
                }}>
                    Operations Overview
                </Typography>
            </Box>

            {/* Cards Grid */}
            <Grid container spacing={{ xs: 1.5, md: 2 }}>
                {cards.map((card, i) => (
                    <Grid item xs={6} sm={6} md={3} key={i}>
                        <KPICard {...card} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default EMSOverviewSection;
