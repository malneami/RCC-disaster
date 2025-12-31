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

interface CaseTypeChartProps {
    data: { name: string; value: number }[];
}

const CaseTypeChart: React.FC<CaseTypeChartProps> = ({ data }) => {
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
                Patients by Case Type
            </Typography>
            <Box sx={{ flex: 1, minHeight: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <defs>
                            <linearGradient id="caseTypeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6dd5c4" stopOpacity={1} />
                                <stop offset="100%" stopColor="#9ee5d6" stopOpacity={1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" />
                        <XAxis
                            dataKey="name"
                            stroke="#666"
                            fontSize={12}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="#666"
                            fontSize={12}
                            tickLine={false}
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
                            radius={[8, 8, 0, 0]}
                            animationDuration={800}
                            fill="url(#caseTypeGradient)"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
};

export default CaseTypeChart;
