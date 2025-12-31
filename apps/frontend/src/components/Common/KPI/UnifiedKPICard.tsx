import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    LinearProgress,
    Chip,
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    CheckCircle,
    Warning,
} from '@mui/icons-material';
import {
    PortalType,
    getTheme,
    getCardStyles,
    getGradients,
    progressBarStyles,
    getStatusColor,
} from './kpiStyles';

export interface UnifiedKPICardProps {
    variant: 'primary' | 'secondary' | 'compact';
    title: string;
    value: string | number;
    subtitle?: string;
    target?: string;
    percentage?: number;
    status?: 'excellent' | 'good' | 'fair' | 'poor';
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendLabel?: string;
    casesInfo?: string;
    portalType?: PortalType;
}

const UnifiedKPICard: React.FC<UnifiedKPICardProps> = ({
    variant,
    title,
    value,
    subtitle,
    target,
    percentage,
    status,
    icon,
    trend,
    trendLabel,
    casesInfo,
    portalType = 'default',
}) => {
    const theme = getTheme(portalType);
    const styles = getCardStyles(theme);

    const renderTrendIcon = () => {
        if (!trend) return null;
        if (trend === 'up') return <TrendingUp sx={{ fontSize: 18, color: theme.statusExcellent }} />;
        if (trend === 'down') return <TrendingDown sx={{ fontSize: 18, color: theme.statusPoor }} />;
        return null;
    };

    const renderStatusIcon = () => {
        if (!status) return null;
        const color = getStatusColor(status);
        if (status === 'excellent' || status === 'good') {
            return <CheckCircle sx={{ color, fontSize: 20 }} />;
        }
        return <Warning sx={{ color, fontSize: 20 }} />;
    };

    // Primary variant - Large gradient card
    if (variant === 'primary') {
        return (
            <Card sx={styles.primary}>
                <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'rgba(255,255,255,0.8)',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontSize: '0.75rem',
                            }}
                        >
                            {title}
                        </Typography>
                        {icon && (
                            <Box sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                {icon}
                            </Box>
                        )}
                    </Box>

                    <Typography
                        variant="h3"
                        sx={{
                            color: '#ffffff',
                            fontWeight: 700,
                            mb: 1,
                            lineHeight: 1,
                        }}
                    >
                        {value}
                    </Typography>

                    {subtitle && (
                        <Typography
                            variant="body2"
                            sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}
                        >
                            {subtitle}
                        </Typography>
                    )}

                    {trend && trendLabel && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                            {renderTrendIcon()}
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                {trendLabel}
                            </Typography>
                        </Box>
                    )}

                    {percentage !== undefined && (
                        <Box sx={{ mt: 2 }}>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(percentage, 100)}
                                sx={{
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    '& .MuiLinearProgress-bar': {
                                        borderRadius: 2,
                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                    },
                                }}
                            />
                        </Box>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Secondary variant - White card with progress bar
    if (variant === 'secondary') {
        const statusColor = status ? getStatusColor(status) : theme.accent;

        return (
            <Card sx={styles.secondary}>
                <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            {icon && (
                                <Box
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 2,
                                        background: `${statusColor}15`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: statusColor,
                                    }}
                                >
                                    {icon}
                                </Box>
                            )}
                            <Box>
                                <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: 600, color: theme.textPrimary }}
                                >
                                    {title}
                                </Typography>
                                {target && (
                                    <Typography variant="caption" sx={{ color: theme.textSecondary }}>
                                        Target: {target}
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        <Box textAlign="right">
                            <Typography
                                variant="h4"
                                sx={{ fontWeight: 700, color: statusColor }}
                            >
                                {value}
                            </Typography>
                            {status && (
                                <Chip
                                    label={status === 'excellent' || status === 'good' ? 'Met' : 'Not Met'}
                                    size="small"
                                    sx={{
                                        mt: 0.5,
                                        height: 22,
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        backgroundColor: `${statusColor}15`,
                                        color: statusColor,
                                    }}
                                />
                            )}
                        </Box>
                    </Box>

                    {percentage !== undefined && (
                        <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                {casesInfo && (
                                    <Typography variant="caption" sx={{ color: theme.textSecondary }}>
                                        {casesInfo}
                                    </Typography>
                                )}
                                <Typography variant="caption" sx={{ color: theme.textSecondary, fontWeight: 500 }}>
                                    {percentage.toFixed(1)}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(percentage, 100)}
                                sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: '#e2e8f0',
                                    '& .MuiLinearProgress-bar': {
                                        borderRadius: 3,
                                        background: `linear-gradient(90deg, ${statusColor} 0%, ${statusColor}CC 100%)`,
                                    },
                                }}
                            />
                        </Box>
                    )}

                    {subtitle && !percentage && (
                        <Typography variant="body2" sx={{ color: theme.textSecondary, mt: 1 }}>
                            {subtitle}
                        </Typography>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Compact variant - Minimal card
    return (
        <Card sx={styles.secondary}>
            <CardContent sx={{ p: 2.5 }}>
                <Typography
                    variant="caption"
                    sx={{
                        color: theme.textSecondary,
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}
                >
                    {title}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: theme.textPrimary }}
                    >
                        {value}
                    </Typography>
                    {renderStatusIcon()}
                </Box>
                {subtitle && (
                    <Typography variant="caption" sx={{ color: theme.textMuted }}>
                        {subtitle}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default UnifiedKPICard;
