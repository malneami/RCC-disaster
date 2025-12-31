/**
 * Hospital Dashboard Design Tokens
 * Sky Blue Theme with Vibrant Accents
 */

// ============================================
// SKY BLUE PALETTE (Unified Card Theme)
// ============================================
export const skyBlue = {
    50: '#F0F9FF',   // Card background - very light sky blue
    100: '#E0F2FE',  // Hover states
    200: '#BAE6FD',  // Light accents
    300: '#7DD3FC',  // Medium accents
    400: '#38BDF8',  // Highlights
    500: '#0EA5E9',  // Primary
    600: '#0284C7',  // Bold numbers & text - PRIMARY ACCENT
    700: '#0369A1',  // Icons & dark accents
    800: '#075985',  // Deep accents
    900: '#0C4A6E',  // Darkest
};

// ============================================
// STATUS COLORS (Vibrant & Zesty)
// ============================================
export const statusColors = {
    // Critical/Error states
    critical: {
        light: '#FEE2E2',
        main: '#DC2626',
        dark: '#B91C1C',
        text: '#DC2626',
    },
    // Warning/Pending states
    pending: {
        light: '#FEF3C7',
        main: '#F59E0B',
        dark: '#D97706',
        text: '#D97706',
    },
    // Success/Completed states
    success: {
        light: '#D1FAE5',
        main: '#10B981',
        dark: '#059669',
        text: '#059669',
    },
    // Info/Default states
    info: {
        light: '#E0F2FE',
        main: '#0EA5E9',
        dark: '#0284C7',
        text: '#0284C7',
    },
};

// ============================================
// TYPOGRAPHY
// ============================================
export const typography = {
    fontFamily: "'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

    // Headings
    h1: {
        fontSize: '2rem',
        fontWeight: 700,
        color: '#0F172A',
        lineHeight: 1.2,
    },
    h2: {
        fontSize: '1.5rem',
        fontWeight: 600,
        color: '#0F172A',
        lineHeight: 1.3,
    },
    h3: {
        fontSize: '1.25rem',
        fontWeight: 600,
        color: '#0F172A',
        lineHeight: 1.4,
    },
    // Large numbers in cards
    statNumber: {
        fontSize: '2.5rem',
        fontWeight: 700,
        color: skyBlue[600],
        lineHeight: 1,
    },
    // Labels
    label: {
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#64748B',
        lineHeight: 1.5,
    },
    // Body text
    body: {
        fontSize: '0.875rem',
        fontWeight: 400,
        color: '#475569',
        lineHeight: 1.6,
    },
    // Secondary text
    secondary: {
        fontSize: '0.75rem',
        fontWeight: 400,
        color: '#94A3B8',
        lineHeight: 1.5,
    },
};

// ============================================
// SHADOWS (Soft Elevation)
// ============================================
export const shadows = {
    card: '0 2px 8px rgba(2, 132, 199, 0.08)',
    cardHover: '0 8px 24px rgba(2, 132, 199, 0.12)',
    elevated: '0 4px 12px rgba(0, 0, 0, 0.05)',
    tabActive: '0 2px 8px rgba(0, 0, 0, 0.1)',
    button: '0 2px 4px rgba(16, 185, 129, 0.2)',
};

// ============================================
// SPACING & SIZING
// ============================================
export const spacing = {
    cardPadding: '24px',
    sectionGap: '24px',
    contentPadding: '16px',
    borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
    },
};

// ============================================
// STATS CARD STYLES (Top 4 Cards)
// ============================================
export const statsCardStyles = {
    container: {
        backgroundColor: skyBlue[50],
        borderRadius: spacing.borderRadius.lg,
        boxShadow: shadows.card,
        padding: spacing.cardPadding,
        border: `1px solid ${skyBlue[100]}`,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
            boxShadow: shadows.cardHover,
            transform: 'translateY(-2px)',
        },
    },
    icon: {
        color: skyBlue[700],
        fontSize: '2rem',
    },
    count: {
        ...typography.statNumber,
    },
    label: {
        ...typography.label,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
    },
    sublabel: {
        ...typography.secondary,
    },
};

// ============================================
// TAB SYSTEM STYLES (Segmented Control)
// ============================================
export const tabStyles = {
    container: {
        backgroundColor: '#F8FAFC',
        padding: '8px',
        borderRadius: spacing.borderRadius.lg,
        border: '1px solid #E2E8F0',
    },
    tab: {
        fontWeight: 500,
        fontSize: '0.875rem',
        textTransform: 'none' as const,
        minHeight: '44px',
        padding: '8px 20px',
        borderRadius: spacing.borderRadius.md,
        color: '#64748B',
        transition: 'all 0.2s ease-in-out',
    },
    tabActive: {
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        fontWeight: 700,
        boxShadow: shadows.tabActive,
    },
    indicator: {
        display: 'none',
    },
};

// ============================================
// CONTENT CARD STYLES
// ============================================
export const contentCardStyles = {
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: spacing.borderRadius.lg,
        boxShadow: shadows.elevated,
        padding: spacing.cardPadding,
        border: '1px solid rgba(0, 0, 0, 0.04)',
    },
    header: {
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #F1F5F9',
    },
    title: {
        ...typography.h3,
    },
};

// ============================================
// TABLE STYLES (Beds Table)
// ============================================
export const tableStyles = {
    container: {
        borderRadius: spacing.borderRadius.lg,
        overflow: 'hidden',
        boxShadow: shadows.elevated,
    },
    row: {
        '&:nth-of-type(odd)': {
            backgroundColor: '#F8FAFC',
        },
        '&:nth-of-type(even)': {
            backgroundColor: '#FFFFFF',
        },
        '&:hover': {
            backgroundColor: skyBlue[100],
        },
        transition: 'background-color 0.15s ease-in-out',
    },
    headerCell: {
        fontWeight: 600,
        color: '#0F172A',
        backgroundColor: '#F1F5F9',
        borderBottom: `2px solid ${skyBlue[200]}`,
    },
};

// ============================================
// BUTTON STYLES
// ============================================
export const buttonStyles = {
    primary: {
        backgroundColor: statusColors.success.main,
        color: '#FFFFFF',
        fontWeight: 600,
        padding: '10px 24px',
        borderRadius: spacing.borderRadius.md,
        boxShadow: shadows.button,
        textTransform: 'none' as const,
        '&:hover': {
            backgroundColor: statusColors.success.dark,
            boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)',
        },
    },
    secondary: {
        backgroundColor: skyBlue[600],
        color: '#FFFFFF',
        fontWeight: 600,
        padding: '10px 24px',
        borderRadius: spacing.borderRadius.md,
        textTransform: 'none' as const,
        '&:hover': {
            backgroundColor: skyBlue[700],
        },
    },
    outlined: {
        borderColor: skyBlue[600],
        color: skyBlue[600],
        fontWeight: 500,
        borderRadius: spacing.borderRadius.md,
        textTransform: 'none' as const,
        '&:hover': {
            backgroundColor: skyBlue[50],
            borderColor: skyBlue[700],
        },
    },
};

// ============================================
// STATUS BADGE STYLES (Pill Badges)
// ============================================
export const statusBadgeStyles = {
    occupied: {
        backgroundColor: statusColors.critical.light,
        color: statusColors.critical.text,
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '16px',
        fontSize: '0.75rem',
    },
    available: {
        backgroundColor: statusColors.success.light,
        color: statusColors.success.text,
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '16px',
        fontSize: '0.75rem',
    },
    reserved: {
        backgroundColor: statusColors.pending.light,
        color: statusColors.pending.text,
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '16px',
        fontSize: '0.75rem',
    },
    maintenance: {
        backgroundColor: '#F1F5F9',
        color: '#64748B',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '16px',
        fontSize: '0.75rem',
    },
};

// ============================================
// CRITICAL CASE CARD STYLES
// ============================================
export const criticalCaseCardStyles = {
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: spacing.borderRadius.lg,
        boxShadow: shadows.elevated,
        border: '1px solid rgba(0, 0, 0, 0.04)',
        padding: '20px',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
            boxShadow: shadows.cardHover,
            transform: 'translateY(-1px)',
        },
    },
    critical: {
        border: `2px solid ${statusColors.critical.main}`,
        backgroundColor: statusColors.critical.light,
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
    },
    pathwayIcon: {
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stemi: {
        backgroundColor: '#FEE2E2',
        color: '#DC2626',
    },
    stroke: {
        backgroundColor: '#F3E8FF',
        color: '#9333EA',
    },
};

export default {
    skyBlue,
    statusColors,
    typography,
    shadows,
    spacing,
    statsCardStyles,
    tabStyles,
    contentCardStyles,
    tableStyles,
    buttonStyles,
    statusBadgeStyles,
    criticalCaseCardStyles,
};
