import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface DonutChartCardProps {
  title: string;
  data: Array<{ name: string; value: number }>;
  colors: string[];
  centerValue?: string | number;
  centerLabel?: string;
}

const DonutChartCard: React.FC<DonutChartCardProps> = ({
  title,
  data,
  colors,
  centerValue,
  centerLabel,
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      return (
        <Box
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '12px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
            {data.name}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            {data.value} ({percentage}%)
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(110, 198, 255, 0.25)',
        transition: 'all 0.3s ease',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(110, 198, 255, 0.2), 0 4px 8px rgba(0, 0, 0, 0.06)',
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: '#1a237e',
          mb: 2,
          fontSize: '1.125rem',
        }}
      >
        {title}
      </Typography>
      <Box sx={{ flex: 1, position: 'relative', minHeight: '260px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {(centerValue !== undefined || centerLabel) && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            {centerValue !== undefined && (
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#1a237e',
                  fontSize: '2rem',
                  lineHeight: 1.2,
                }}
              >
                {centerValue}
              </Typography>
            )}
            {centerLabel && (
              <Typography
                variant="body2"
                sx={{
                  color: '#6ec6ff',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  mt: 0.5,
                }}
              >
                {centerLabel}
              </Typography>
            )}
          </Box>
        )}
      </Box>
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {data.map((item, index) => {
          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
          return (
            <Box
              key={item.name}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flex: '1 1 auto',
                minWidth: '120px',
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: colors[index % colors.length],
                  boxShadow: `0 2px 4px ${colors[index % colors.length]}40`,
                }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    color: '#666',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.name}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: '#1a1a1a',
                    fontSize: '0.8125rem',
                  }}
                >
                  {item.value} ({percentage}%)
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default DonutChartCard;

