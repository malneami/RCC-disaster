import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { CaseDistribution } from './utils';

interface CaseDistributionChartProps {
  data: CaseDistribution[];
}

const CaseDistributionChart: React.FC<CaseDistributionChartProps> = ({
  data,
}) => {
  const totalCases = data.reduce((sum, item) => sum + item.count, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CaseDistribution;
      return (
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 2,
            p: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>
            {data.name}
          </Typography>
          <Typography variant="body2" sx={{ color: data.color }}>
            Count: {data.count}
          </Typography>
          <Typography variant="body2" sx={{ color: data.color }}>
            Percentage: {data.percentage}%
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if percentage is >= 5%
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  // Always show all case types to maintain chart structure
  // When no data, show equal segments (25% each) with dimmed appearance
  const displayData = totalCases === 0
    ? data.map(item => ({ ...item, value: 1, percentage: 25 }))
    : data.filter((item) => item.count > 0);

  return (
    <Box>
      <Box 
        sx={{ 
          height: 400, 
          width: '100%', 
          position: 'relative',
          '& svg': {
            outline: 'none',
            '& *': {
              outline: 'none',
            },
            '& path': {
              outline: 'none',
              '&:focus': {
                outline: 'none',
              },
            },
          },
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={totalCases === 0 ? false : renderCustomLabel}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {displayData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  opacity={totalCases === 0 ? 0.18 : 1}
                  stroke={totalCases === 0 ? 'rgba(255, 255, 255, 0.12)' : 'none'}
                  strokeWidth={totalCases === 0 ? 1.5 : 0}
                  strokeDasharray={totalCases === 0 ? '5 5' : '0'}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ color: '#ffffff' }}
              formatter={(value) => {
                const item = data.find((d) => d.name === value);
                return `${value}: ${item?.count || 0} (${item?.percentage || 0}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Minimal empty state */}
        {totalCases === 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                fontSize: '2.5rem',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.4)',
                lineHeight: 1,
                mb: 2,
                textAlign: 'center',
              }}
            >
              0
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#9e9e9e',
                fontSize: '0.75rem',
                textAlign: 'center',
              }}
            >
              No cases recorded
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CaseDistributionChart;