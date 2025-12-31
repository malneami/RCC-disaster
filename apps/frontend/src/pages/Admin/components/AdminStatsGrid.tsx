import React from 'react';
import { Box, Card, Typography, Grid, alpha } from '@mui/material';
import {
    PeopleAlt as PeopleIcon,
    HowToReg as RequestsIcon,
    AdminPanelSettings as AdminIcon,
    FiberManualRecord as StatusIcon
} from '@mui/icons-material';

interface StatItemProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: string;
    subtitle?: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, icon, color, trend, subtitle }) => {

    return (
        <Card sx={{
            p: 2.5,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${alpha(color, 0.05)} 0%, ${alpha(color, 0.1)} 100%)`,
            border: `1px solid ${alpha(color, 0.1)}`,
            borderRadius: 4,
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 24px -10px ${alpha(color, 0.2)}`,
                borderColor: alpha(color, 0.2),
            },
            '&::after': {
                content: '""',
                position: 'absolute',
                top: -24,
                right: -24,
                width: 120,
                height: 120,
                background: `radial-gradient(circle, ${alpha(color, 0.15)} 0%, transparent 70%)`,
                borderRadius: '50%',
                zIndex: 0
            }
        }}>
            <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, letterSpacing: '0.02em' }}>
                        {label}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                        {value}
                    </Typography>
                    {subtitle && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <StatusIcon sx={{ fontSize: 8, mr: 0.5, color: color }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                {subtitle}
                            </Typography>
                        </Box>
                    )}
                </Box>
                <Box sx={{
                    p: 1.5,
                    borderRadius: 3,
                    backgroundColor: alpha(color, 0.1),
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px -2px ${alpha(color, 0.1)}`
                }}>
                    {icon}
                </Box>
            </Box>
            {trend && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                    <Typography
                        variant="caption"
                        sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            bgcolor: alpha(color, 0.1),
                            color: color,
                            fontWeight: 700,
                            fontSize: '0.7rem'
                        }}
                    >
                        {trend}
                    </Typography>
                </Box>
            )}
        </Card>
    );
};

interface AdminStatsGridProps {
    stats: {
        totalUsers: number;
        pendingRequests: number;
        activeAdmins: number;
        onlineNow?: number;
    };
}

const AdminStatsGrid: React.FC<AdminStatsGridProps> = ({ stats }) => {
    return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
                <StatItem
                    label="TOTAL USERS"
                    value={stats.totalUsers}
                    icon={<PeopleIcon />}
                    color="#2563eb"
                    subtitle="System-wide registered accounts"
                    trend="+12% from last month"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <StatItem
                    label="PENDING REQUESTS"
                    value={stats.pendingRequests}
                    icon={<RequestsIcon />}
                    color="#f59e0b"
                    subtitle="Waiting for review"
                    trend={stats.pendingRequests > 0 ? "Action required" : "All caught up"}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <StatItem
                    label="ACTIVE ADMINS"
                    value={stats.activeAdmins}
                    icon={<AdminIcon />}
                    color="#10b981"
                    subtitle="Privileged administrators"
                    trend="Secure audit active"
                />
            </Grid>
        </Grid>
    );
};

export default AdminStatsGrid;
