/**
 * Unified KPI Styles
 * Shared design tokens and MUI sx styles for the premium KPI dashboard
 */

// Color Palette - Deep blues to teals
export const kpiColors = {
    // Primary gradient colors
    gradientStart: '#0f4c75',
    gradientEnd: '#3282b8',

    // Accent/success colors
    accent: '#0d9488',
    accentLight: '#14b8a6',

    // Text colors
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',

    // Background colors
    pageBg: '#f8fafc',
    cardBg: '#ffffff',
    borderColor: '#e2e8f0',

    // Status colors
    statusExcellent: '#10b981',
    statusGood: '#0d9488',
    statusFair: '#f59e0b',
    statusPoor: '#ef4444',
} as const;

// Gradient definitions
export const kpiGradients = {
    primary: `linear-gradient(135deg, ${kpiColors.gradientStart} 0%, ${kpiColors.gradientEnd} 100%)`,
    primarySubtle: `linear-gradient(135deg, rgba(15,76,117,0.03) 0%, rgba(50,130,184,0.08) 100%)`,
    progress: `linear-gradient(90deg, ${kpiColors.accent} 0%, ${kpiColors.accentLight} 100%)`,
    header: `linear-gradient(135deg, ${kpiColors.gradientStart} 0%, ${kpiColors.gradientEnd} 100%)`,
} as const;

// Shared card styles
export const cardStyles = {
    primary: {
        background: kpiGradients.primary,
        borderRadius: 4,
        boxShadow: '0 10px 40px rgba(15, 76, 117, 0.25)',
        transition: 'all 0.3s ease',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 15px 50px rgba(15, 76, 117, 0.35)',
        },
    },
    secondary: {
        background: kpiColors.cardBg,
        borderRadius: 3,
        border: `1px solid ${kpiColors.borderColor}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
        },
    },
    page: {
        minHeight: '100vh',
        background: kpiColors.pageBg,
        p: 3,
    },
} as const;

// Progress bar styles
export const progressBarStyles = {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    '& .MuiLinearProgress-bar': {
        borderRadius: 3,
        background: kpiGradients.progress,
    },
};

// Status helper functions
export const getStatusColor = (status: 'excellent' | 'good' | 'fair' | 'poor' | string): string => {
    switch (status) {
        case 'excellent': return kpiColors.statusExcellent;
        case 'good': return kpiColors.statusGood;
        case 'fair': return kpiColors.statusFair;
        case 'poor': return kpiColors.statusPoor;
        default: return kpiColors.textSecondary;
    }
};

export const getPercentageStatus = (percentage: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'fair';
    return 'poor';
};
