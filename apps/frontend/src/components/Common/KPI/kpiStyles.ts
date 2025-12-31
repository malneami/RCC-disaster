/**
 * Unified KPI Styles
 * Shared design tokens and MUI sx styles for the premium KPI dashboard
 */

export type PortalType = 'stemi' | 'stroke' | 'trauma' | 'default';

interface ThemeColors {
    primary: string;
    gradientStart: string;
    gradientEnd: string;
    accent: string;
    accentLight: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    pageBg: string;
    cardBg: string;
    borderColor: string;
    statusExcellent: string;
    statusGood: string;
    statusFair: string;
    statusPoor: string;
}

const baseColors = {
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    pageBg: '#f8fafc',
    cardBg: '#ffffff',
    borderColor: '#cbd5e1',
    statusExcellent: '#059669',
    statusGood: '#0d9488',
    statusFair: '#d97706',
    statusPoor: '#dc2626',
};

export const kpiThemes: Record<PortalType, ThemeColors> = {
    stemi: {
        ...baseColors,
        primary: '#d32f2f',
        gradientStart: '#c62828', // Darker Red
        gradientEnd: '#ef5350',   // Lighter Red
        accent: '#b71c1c',
        accentLight: '#ffcdd2',
    },
    stroke: {
        ...baseColors,
        primary: '#5e35b1',
        gradientStart: '#4527a0', // Darker Purple
        gradientEnd: '#7e57c2',   // Lighter Purple
        accent: '#311b92',
        accentLight: '#d1c4e9',
    },
    trauma: {
        ...baseColors,
        primary: '#ed6c02',
        gradientStart: '#e65100', // Darker Orange
        gradientEnd: '#ff9800',   // Lighter Orange
        accent: '#bf360c',
        accentLight: '#ffe0b2',
    },
    default: {
        ...baseColors,
        primary: '#0f4c75',
        gradientStart: '#0f4c75',
        gradientEnd: '#3282b8',
        accent: '#0f766e',
        accentLight: '#115e59',
    },
};

// Legacy support for existing components not yet using themes
export const kpiColors = kpiThemes.default;

export const getTheme = (type: PortalType = 'default') => kpiThemes[type];

// Gradient definitions helper
export const getGradients = (theme: ThemeColors) => ({
    primary: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
    primarySubtle: `linear-gradient(135deg, ${theme.gradientStart}08 0%, ${theme.gradientEnd}14 100%)`, // approx opacity
    progress: `linear-gradient(90deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
    header: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
});

// Legacy gradients
export const kpiGradients = getGradients(kpiColors);

// Shared card styles with theme support
export const getCardStyles = (theme: ThemeColors) => ({
    primary: {
        background: `linear-gradient(135deg, ${theme.gradientStart} 0%, ${theme.gradientEnd} 100%)`,
        borderRadius: 2,
        boxShadow: `0 4px 20px ${theme.gradientStart}33`, // 20% opacity approx
        transition: 'all 0.3s ease',
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 30px ${theme.gradientStart}4d`, // 30% opacity approx
        },
    },
    secondary: {
        background: theme.cardBg,
        borderRadius: 2,
        border: `1px solid ${theme.borderColor}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        transition: 'all 0.3s ease',
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
    },
    page: {
        minHeight: '100vh',
        background: theme.pageBg,
        p: 3,
    },
});

// Legacy card styles
export const cardStyles = getCardStyles(kpiColors);

// Progress bar styles
export const progressBarStyles = {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    '& .MuiLinearProgress-bar': {
        borderRadius: 3,
        // Gradient needs to be applied dynamically or use theme
    },
};

// Status helper functions
export const getStatusColor = (status: 'excellent' | 'good' | 'fair' | 'poor' | string): string => {
    switch (status) {
        case 'excellent': return baseColors.statusExcellent;
        case 'good': return baseColors.statusGood;
        case 'fair': return baseColors.statusFair;
        case 'poor': return baseColors.statusPoor;
        default: return baseColors.textSecondary;
    }
};

export const getPercentageStatus = (percentage: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'fair';
    return 'poor';
};
