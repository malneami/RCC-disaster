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
export const shadows = {
    soft: '0 4px 20px rgba(0, 0, 0, 0.08)',
    medium: '0 8px 32px rgba(0, 0, 0, 0.12)',
    colored: (color: string) => `0 8px 32px ${color}40`,
    glow: (color: string) => `0 0 40px ${color}30`,
};

// Border Radius
export const radius = {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    full: 9999,
};

// Typography
export const typography = {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    heading: {
        fontSize: '2.5rem',
        fontWeight: 800,
        letterSpacing: '-0.02em',
    },
    metric: {
        fontSize: '2.25rem',
        fontWeight: 700,
        letterSpacing: '-0.01em',
    },
    label: {
        fontSize: '0.875rem',
        fontWeight: 600,
        letterSpacing: '0.01em',
    },
    caption: {
        fontSize: '0.75rem',
        fontWeight: 500,
        letterSpacing: '0.02em',
    },
};

// Spacing
export const spacing = {
    card: 24,
    section: 32,
    grid: 20,
};

export default {
    EMS_GRADIENTS,
    glassEffect,
    shadows,
    radius,
    typography,
    spacing,
};
