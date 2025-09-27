import React from 'react';
import { Box, Skeleton, Card, CardContent } from '@mui/material';

interface SkeletonLoaderProps {
  variant?: 'notification' | 'summary' | 'list' | 'card';
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  variant = 'card', 
  count = 1
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'notification':
        return (
          <Box sx={{ mb: 2 }}>
            <Card sx={{ borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  {/* Icon skeleton */}
                  <Skeleton variant="circular" width={24} height={24} />
                  
                  {/* Content skeleton */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Skeleton variant="text" width="60%" height={20} />
                      <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 1 }} />
                    </Box>
                    <Skeleton variant="text" width="90%" height={16} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="70%" height={16} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="30%" height={12} />
                  </Box>
                  
                  {/* Actions skeleton */}
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="circular" width={32} height={32} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      case 'summary':
        return (
          <Card sx={{ 
            height: '100%',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Skeleton variant="circular" width={48} height={48} />
                <Skeleton variant="text" width={60} height={40} />
              </Box>
              <Skeleton variant="text" width="70%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="90%" height={16} />
            </CardContent>
          </Card>
        );

      case 'list':
        return (
          <Box sx={{ p: 0 }}>
            {Array.from({ length: count }).map((_, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Box sx={{ 
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  p: { xs: 2, sm: 2.5, md: 3 },
                  backgroundColor: '#ffffff'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Skeleton variant="text" width="50%" height={18} />
                        <Skeleton variant="rectangular" width={50} height={18} sx={{ borderRadius: 1 }} />
                      </Box>
                      <Skeleton variant="text" width="80%" height={14} sx={{ mb: 0.5 }} />
                      <Skeleton variant="text" width="60%" height={14} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="25%" height={12} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Skeleton variant="circular" width={32} height={32} />
                      <Skeleton variant="circular" width={32} height={32} />
                    </Box>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        );

      case 'card':
      default:
        return (
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="90%" height={16} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="70%" height={16} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="50%" height={16} />
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index}>
          {renderSkeleton()}
        </Box>
      ))}
    </Box>
  );
};

export default SkeletonLoader;
