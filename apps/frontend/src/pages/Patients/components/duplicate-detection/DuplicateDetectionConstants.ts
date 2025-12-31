
// Color scheme matching Statistics design
export const GRADIENT_COLORS = {
  high: 'linear-gradient(135deg, #ff9a9a 0%, #ffb3b3 100%)', // Soft red for high confidence
  medium: 'linear-gradient(135deg, #ffd54f 0%, #ffe082 100%)', // Soft yellow for medium confidence
  low: 'linear-gradient(135deg, #a5d8ff 0%, #c5e3ff 100%)', // Soft blue for low confidence
  primary: 'linear-gradient(135deg, #6ec6ff 0%, #a5d8ff 100%)', // Primary blue
  success: 'linear-gradient(135deg, #8dd88f 0%, #b8e6b9 100%)', // Success green
};

export const getConfidenceGradient = (confidence: number) => {
  if (confidence > 0.9) return GRADIENT_COLORS.high;
  if (confidence > 0.8) return GRADIENT_COLORS.medium;
  return GRADIENT_COLORS.low;
};

export const getConfidenceColor = (confidence: number) => {
  if (confidence > 0.9) return '#ff9a9a';
  if (confidence > 0.8) return '#ffd54f';
  return '#a5d8ff';
};
