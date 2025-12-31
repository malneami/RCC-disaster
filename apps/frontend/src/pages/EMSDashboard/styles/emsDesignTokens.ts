/**
 * Premium EMS Dashboard Design System
 * High-end gradients, glassmorphism, and vibrant color palette
 */

// Gradient Color Palette - Vibrant but Professional
export const EMS_GRADIENTS = {
    // Primary Blue Gradient
    blue: {
        light: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        soft: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
        vibrant: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    },
    // Emerald Green Gradient
    emerald: {
        light: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        soft: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
        vibrant: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    },
    // Warm Amber/Orange Gradient
    amber: {
        light: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        soft: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
        vibrant: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
    },
    // Soft Crimson/Rose Gradient
    rose: {
        light: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
        soft: 'linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%)',
        vibrant: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
    },
    // Purple/Violet Gradient
    violet: {
        light: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
        soft: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
        vibrant: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    },
    // Cyan/Teal Gradient
    cyan: {
        light: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
        soft: 'linear-gradient(135deg, #CFFAFE 0%, #A5F3FC 100%)',
        vibrant: 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)',
    },
    // Navy/Slate Background
    navy: {
        light: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        soft: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
    },
};

// Glassmorphism styles
export const glassEffect = {
    light: {
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
    },
    dark: {
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    },
};

// Shadow System
export const colors = {
    primary: '#4F46E5',
    secondary: '#10B981',
    navy: {
        50: '#F8FAFC',
        100: '#F1F5F9',
        200: '#E2E8F0',
        300: '#CBD5E1',
        400: '#94A3B8',
        500: '#64748B',
        600: '#475569',
        700: '#334155',
        800: '#1E293B',
        900: '#0F172A',
    },
    slate: {
        50: '#F8FAFC',
        100: '#F1F5F9',
        200: '#E2E8F0',
        300: '#CBD5E1',
        400: '#94A3B8',
        500: '#64748B',
        600: '#475569',
    },
    status: {
        success: '#10B981',
        successLight: '#D1FAE5',
        warning: '#F59E0B',
        warningLight: '#FEF3C7',
        error: '#EF4444',
        errorLight: '#FEE2E2',
        info: '#3B82F6',
        infoLight: '#DBEAFE',
    },
    background: {
        main: '#F3F4F6',
        card: '#FFFFFF',
    }
};

export const shadows = {
    soft: '0 4px 20px rgba(0, 0, 0, 0.08)',
    medium: '0 8px 32px rgba(0, 0, 0, 0.12)',
    elevated: '0 10px 40px rgba(0, 0, 0, 0.15)',
    colored: (color: string) => `0 8px 32px ${color}40`,
    glow: (color: string) => `0 0 40px ${color}30`,
};

export const radius = {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    full: 9999,
};

export const typography = {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    size: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
    },
    weight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
    },
};

export const spacing = {
    card: 24,
    section: 32,
    grid: 20,
};

export const EMS_TOKENS = {
    colors,
    shadows,
    radius,
    typography,
    spacing,
};

export const cardStyles = {
    base: {
        backgroundColor: colors.background.card,
        borderRadius: radius.md,
        boxShadow: shadows.soft,
    },
    hover: {
        transform: 'translateY(-4px)',
        boxShadow: shadows.medium,
        transition: 'all 0.3s ease',
    },
};

export default {
    EMS_GRADIENTS,
    EMS_TOKENS,
    cardStyles,
    glassEffect,
    shadows,
    radius,
    typography,
    spacing,
};
