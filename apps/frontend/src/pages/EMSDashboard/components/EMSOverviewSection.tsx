import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faUserMd, faTruck, faCheckCircle, faAmbulance, faHeartbeat, faTasks, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { useEMSDashboard } from '../../EMS/hooks/useEMSDashboard';

// Vibrant Solid Colors
const COLORS = {
    skyBlue: '#0EA5E9',
    emerald: '#10B981',
    amber: '#F59E0B',
    rose: '#F43F5E',
    violet: '#8B5CF6',
    cyan: '#06B6D4',
    pink: '#EC4899',
    indigo: '#6366F1',
};

// KPI Card - Vibrant Solid Color
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
            borderRadius: 4,
            p: 3,
            height: '100%',
            color: '#fff',
            boxShadow: `0 8px 24px ${color}50`,
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'translateY(-4px) scale(1.02)', boxShadow: `0 12px 32px ${color}60` },
        }}
    >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.9 }}>{title}</Typography>
            <Box sx={{ width: 40, height: 40, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                {icon}
            </Box>
        </Box>
        <Typography sx={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1 }}>{value}</Typography>
        {subtitle && <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.8, mt: 0.5 }}>{subtitle}</Typography>}
    </Box>
);

const EMSOverviewSection: React.FC = () => {
    const { data: dashboardData, isLoading } = useEMSDashboard();

    if (isLoading) return <Box sx={{ textAlign: 'center', py: 4 }}><Typography color="text.secondary">Loading...</Typography></Box>;

    const s = dashboardData?.summary || {};

    // Cards with vibrant solid colors
    const cards = [
        { title: 'Pending Requests', value: s.pendingTickets || 0, subtitle: 'Waiting for Assignment', icon: <FontAwesomeIcon icon={faClock} />, color: COLORS.amber },
        { title: 'Assigned', value: s.assignedAssignments || 0, subtitle: 'En Route to Patient', icon: <FontAwesomeIcon icon={faUserMd} />, color: COLORS.skyBlue },
        { title: 'In Transport', value: s.inTransportAssignments || 0, subtitle: 'Patient On Board', icon: <FontAwesomeIcon icon={faTruck} />, color: COLORS.violet },
        { title: 'Completed Today', value: s.todayCompletedAssignments || 0, subtitle: 'Arrivals Today', icon: <FontAwesomeIcon icon={faCheckCircle} />, color: COLORS.emerald },
        { title: 'Total Ambulances', value: s.totalAmbulances || 0, subtitle: 'Fleet Size', icon: <FontAwesomeIcon icon={faAmbulance} />, color: COLORS.cyan },
        { title: 'Active Units', value: s.activeAmbulances || 0, subtitle: 'In Service', icon: <FontAwesomeIcon icon={faHeartbeat} />, color: COLORS.pink },
        { title: 'Available', value: s.availableAmbulances || 0, subtitle: 'Ready', icon: <FontAwesomeIcon icon={faClock} />, color: COLORS.emerald },
        { title: 'Total Completed', value: s.totalCompletedAssignments || s.totalAssignments || 0, subtitle: 'All Time', icon: <FontAwesomeIcon icon={faTasks} />, color: COLORS.indigo },
    ];

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: COLORS.emerald, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: `0 6px 20px ${COLORS.emerald}40` }}>
                    <FontAwesomeIcon icon={faChartLine} />
                </Box>
                <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>Operations Overview</Typography>
            </Box>

            {/* Cards Grid */}
            <Grid container spacing={3}>
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
