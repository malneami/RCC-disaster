// Shared utility to get consistent avatar colors for patients
// Uses patient ID to ensure the same patient always gets the same color

export const AVATAR_COLORS = [
  { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: '#b3e5fc' },
  { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', border: '#c8e6c9' },
  { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', border: '#f8bbd0' },
  { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', border: '#b2dfdb' },
  { bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', border: '#ffe0b2' },
  { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: '#ce93d8' },
];

/**
 * Get avatar color for a patient based on their ID
 * This ensures the same patient always gets the same color
 */
export const getPatientAvatarColor = (patientId: string): typeof AVATAR_COLORS[0] => {
  // Convert patient ID to a number for consistent hashing
  let hash = 0;
  for (let i = 0; i < patientId.length; i++) {
    const char = patientId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

