import React from 'react';
import { Box, Typography } from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface InsuranceCoverageChartProps {
    withInsurance: number;
    withoutInsurance: number;
}

const InsuranceCoverageChart: React.FC<InsuranceCoverageChartProps> = ({
    withInsurance,
    withoutInsurance,
}) => {
    const data = [
        { name: 'With Insurance', value: withInsurance, color: '#8dd88f' },
        { name: 'Without Insurance', value: withoutInsurance, color: '#ff9a9a' },
    ];

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
                Insurance Coverage
            </Typography>
            <Box sx={{ flex: 1, minHeight: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <defs>
                            <linearGradient id="insuranceWithGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#8dd88f" stopOpacity={1} />
                                <stop offset="100%" stopColor="#b8e6b9" stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="insuranceWithoutGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#ff9a9a" stopOpacity={1} />
                                <stop offset="100%" stopColor="#ffb3b3" stopOpacity={1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" />
                        <XAxis type="number" stroke="#666" fontSize={12} tickLine={false} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            stroke="#666"
                            fontSize={12}
                            tickLine={false}
                            width={120}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            }}
                        />
                        <Bar
                            dataKey="value"
                            radius={[0, 8, 8, 0]}
                            animationDuration={800}
                            shape={(props: any) => {
                                const { payload, x, y, width, height } = props;
                                const fillColor =
                                    payload.name === 'With Insurance'
                                        ? 'url(#insuranceWithGradient)'
                                        : 'url(#insuranceWithoutGradient)';
                                return (
                                    <rect
                                        x={x}
                                        y={y}
                                        width={width}
                                        height={height}
                                        fill={fillColor}
                                        rx={8}
                                        ry={8}
                                    />
                                );
                            }}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
};

export default InsuranceCoverageChart;
