import React from 'react';
import { Box, Typography } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faUserMd, faTruck, faCheckCircle, faAmbulance, faHeartbeat, faTasks, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { useEMSDashboard } from '../../EMS/hooks/useEMSDashboard';

// Clean Arctic Glassmorphic Palette
const COLORS = {
    actionable: '#FF9F1C',   // Actionable Orange
    success: '#2EC4B6',      // Success Green
    critical: '#011627',     // Critical Blue
    violet: '#8B5CF6',       // Neutral Violet
    primary: '#2563EB',      // Blue (legacy)
    info: '#0891B2',         // Cyan (legacy)
    pink: '#DB2777',         // Pink (legacy)
    indigo: '#4F46E5',       // Indigo (legacy)
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
    isHero?: boolean;
}

const pulseAnimation = {
    '@keyframes pulse-glow': {
        '0%, 100%': { opacity: 1, transform: 'scale(1)' },
        '50%': { opacity: 0.95, transform: 'scale(1.02)' },
    },
};

const pingAnimation = {
    '@keyframes ping': {
        '75%, 100%': {
            transform: 'scale(2)',
            opacity: 0,
        },
    },
};

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, isHero }) => {
    const shouldPulse = isHero && value > 0;

    // Determine gradient based on title/type
    let gradient = 'linear-gradient(to bottom right, #3B82F6, #6366F1)'; // Default blue

    if (title === 'Pending Requests') {
        gradient = 'linear-gradient(to bottom right, #F59E0B, #EF4444)'; // Amber to Red
    } else if (title === 'Assigned') {
        gradient = 'linear-gradient(to bottom right, #3B82F6, #6366F1)'; // Blue to Indigo
    } else if (title === 'In Transport') {
        gradient = 'linear-gradient(to bottom right, #8B5CF6, #D946EF)'; // Purple to Fuchsia
    } else if (title === 'Completed Today') {
        gradient = 'linear-gradient(to bottom right, #10B981, #14B8A6)'; // Emerald to Teal
    } else if (title === 'Available') {
        gradient = 'linear-gradient(to bottom right, #10B981, #14B8A6)'; // Emerald to Teal
    } else if (title === 'Total Ambulances' || title === 'Total Completed') {
        gradient = 'linear-gradient(to bottom right, #1E293B, #0F172A)'; // Dark slate
    } else if (title === 'Active Units') {
        gradient = 'linear-gradient(to bottom right, #8B5CF6, #D946EF)'; // Purple to Fuchsia
    }

    // Determine if this should use horizontal layout (fleet cards)
    const isFleetCard = ['Total Ambulances', 'Active Units', 'Available', 'Total Completed'].includes(title);
    const useHorizontalLayout = !isHero && isFleetCard;

    return (
        <Box
            sx={{
                background: gradient,
                borderRadius: isHero ? 4 : 3,
                p: isHero ? 4 : 2,
                height: '100%',
                boxShadow: isHero ? '0 8px 32px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.15)',
                transition: 'all 0.3s ease',
                animation: shouldPulse ? 'pulse-glow 2s ease-in-out infinite' : 'none',
                ...pulseAnimation,
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: isHero ? '0 12px 48px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.25)'
                },
            }}
        >
            {useHorizontalLayout ? (
                // Horizontal layout for fleet cards
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontSize: '1.2rem',
                        flexShrink: 0
                    }}>
                        {icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{
                            fontSize: '2rem',
                            fontWeight: 800,
                            lineHeight: 1,
                            color: '#FFFFFF',
                            fontFamily: 'Inter, sans-serif',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                            mb: 0.5
                        }}>
                            {value}
                        </Typography>
                        <Typography sx={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontFamily: 'Inter, sans-serif',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }}>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography sx={{
                                fontSize: '0.65rem',
                                fontWeight: 500,
                                color: 'rgba(255, 255, 255, 0.75)',
                                mt: 0.25,
                                fontFamily: 'Inter, sans-serif',
                                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                </Box>
            ) : (
                // Vertical layout for hero and priority cards
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: isHero ? 2.5 : 1 }}>
                        <Box>
                            <Typography sx={{
                                fontSize: isHero ? '0.9rem' : '0.75rem',
                                fontWeight: 600,
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontFamily: 'Inter, sans-serif',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}>
                                {title}
                            </Typography>
                            {subtitle && (
                                <Typography sx={{
                                    fontSize: isHero ? '0.8rem' : '0.7rem',
                                    fontWeight: 500,
                                    color: 'rgba(255, 255, 255, 0.75)',
                                    mt: 0.5,
                                    fontFamily: 'Inter, sans-serif',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                }}>
                                    {subtitle}
                                </Typography>
                            )}
                        </Box>
                        <Box sx={{
                            width: isHero ? 52 : 40,
                            height: isHero ? 52 : 40,
                            borderRadius: '50%',
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            fontSize: isHero ? '1.5rem' : '1rem',
                            position: 'relative'
                        }}>
                            {shouldPulse ? (
                                <>
                                    <Box sx={{
                                        position: 'absolute',
                                        animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
                                        ...pingAnimation
                                    }}>
                                        {icon}
                                    </Box>
                                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                                        {icon}
                                    </Box>
                                </>
                            ) : icon}
                        </Box>
                    </Box>
                    <Typography sx={{
                        fontSize: isHero ? '3.5rem' : '1.75rem',
                        fontWeight: 800,
                        lineHeight: 1,
                        color: '#FFFFFF',
                        fontFamily: 'Inter, sans-serif',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                    }}>
                        {value}
                    </Typography>
                </>
            )}
        </Box>
    );
};

const EMSOverviewSection: React.FC = () => {
    const { data: dashboardData, isLoading } = useEMSDashboard();

    if (isLoading) return <Box sx={{ textAlign: 'center', py: 4 }}><Typography color="text.secondary">Loading...</Typography></Box>;

    const s = dashboardData?.summary || ({} as any);

    const heroCard = { title: 'Pending Requests', value: s.pendingTickets || 0, subtitle: 'Waiting for Assignment', icon: <FontAwesomeIcon icon={faClock} />, color: COLORS.actionable, isHero: true };

    const priorityCards = [
        { title: 'Assigned', value: s.assignedAssignments || 0, subtitle: 'En Route to Patient', icon: <FontAwesomeIcon icon={faUserMd} />, color: COLORS.primary },
        { title: 'In Transport', value: s.inTransportAssignments || 0, subtitle: 'Patient On Board', icon: <FontAwesomeIcon icon={faTruck} />, color: COLORS.violet },
        { title: 'Completed Today', value: s.todayCompletedAssignments || 0, subtitle: 'Arrivals Today', icon: <FontAwesomeIcon icon={faCheckCircle} />, color: COLORS.success },
    ];

    const fleetCards = [
        { title: 'Total Ambulances', value: s.totalAmbulances || 0, subtitle: 'Fleet Size', icon: <FontAwesomeIcon icon={faAmbulance} />, color: COLORS.info },
        { title: 'Active Units', value: s.activeAmbulances || 0, subtitle: 'In Service', icon: <FontAwesomeIcon icon={faHeartbeat} />, color: COLORS.pink },
        { title: 'Available', value: s.availableAmbulances || 0, subtitle: 'Ready', icon: <FontAwesomeIcon icon={faClock} />, color: COLORS.success },
        { title: 'Total Completed', value: s.totalCompletedAssignments || s.totalAssignments || 0, subtitle: 'All Time', icon: <FontAwesomeIcon icon={faTasks} />, color: COLORS.indigo },
    ];

    return (
        <Box sx={{
            bgcolor: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${COLORS.slate[200]}`,
            borderRadius: 4,
            p: 3,
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, flexShrink: 0 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: `${COLORS.success}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.success }}>
                    <FontAwesomeIcon icon={faChartLine} />
                </Box>
                <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: COLORS.slate[900], fontFamily: 'Inter, sans-serif' }}>Operations Overview</Typography>
            </Box>

            {/* Bento Grid Layout */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gridTemplateRows: { xs: 'auto', md: 'repeat(2, 1fr)' },
                gap: 2.5,
                gridTemplateAreas: {
                    xs: `"hero" "card1" "card2" "card3" "card4" "card5" "card6" "card7"`,
                    sm: `"hero hero" "card1 card2" "card3 card4" "card5 card6" "card7 card7"`,
                    md: `"hero hero card1 card2" "hero hero card3 card4" "card5 card6 card7 card7"`
                },
                flex: 1,
                alignContent: 'start'
            }}>
                {/* Hero Card - Pending Requests */}
                <Box sx={{ gridArea: 'hero' }}>
                    <KPICard {...heroCard} />
                </Box>

                {/* Priority Cards */}
                <Box sx={{ gridArea: 'card1' }}>
                    <KPICard {...priorityCards[0]} />
                </Box>
                <Box sx={{ gridArea: 'card2' }}>
                    <KPICard {...priorityCards[1]} />
                </Box>
                <Box sx={{ gridArea: 'card3' }}>
                    <KPICard {...priorityCards[2]} />
                </Box>

                {/* Fleet Cards */}
                <Box sx={{ gridArea: 'card4' }}>
                    <KPICard {...fleetCards[0]} />
                </Box>
                <Box sx={{ gridArea: 'card5' }}>
                    <KPICard {...fleetCards[1]} />
                </Box>
                <Box sx={{ gridArea: 'card6' }}>
                    <KPICard {...fleetCards[2]} />
                </Box>
                <Box sx={{ gridArea: 'card7' }}>
                    <KPICard {...fleetCards[3]} />
                </Box>
            </Box>
        </Box>
    );
};

export default EMSOverviewSection;
