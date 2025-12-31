
export const getPrivacyLevelColor = (privacyLevel: string) => {
  switch (privacyLevel) {
    case 'CONFIDENTIAL':
      return { bg: '#ffebee', color: '#c62828', border: '#ef5350' };
    case 'RESTRICTED':
      return { bg: '#fff3e0', color: '#e65100', border: '#ff9800' };
    case 'PRIVATE':
      return { bg: '#e3f2fd', color: '#0277bd', border: '#03a9f4' };
    case 'INTERNAL':
      return { bg: '#e8f5e9', color: '#2e7d32', border: '#4caf50' };
    case 'PUBLIC':
      return { bg: '#f5f5f5', color: '#616161', border: '#9e9e9e' };
    default:
      return { bg: '#f5f5f5', color: '#616161', border: '#9e9e9e' };
  }
};

export const AVATAR_COLORS = [
  { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: '#b3e5fc' },
  { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', border: '#c8e6c9' },
  { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', border: '#f8bbd0' },
  { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', border: '#b2dfdb' },
  { bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', border: '#ffe0b2' },
  { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: '#ce93d8' },
];
