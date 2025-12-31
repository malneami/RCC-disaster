import React from 'react';
import { Grid } from '@mui/material';
import {
    People as PeopleIcon,
    TrendingUp as TrendingUpIcon,
    LocalHospital as HospitalIcon,
    HealthAndSafety as InsuranceIcon,
} from '@mui/icons-material';
import StatisticCard from './StatisticCard';
import { GRADIENT_COLORS } from './StatisticsConstants';

interface StatisticsSummaryCardsProps {
    totalPatients: number;
    recentActivity: number;
    withInsurance: number;
    withoutInsurance: number;
    insurancePercentage: string;
}

const StatisticsSummaryCards: React.FC<StatisticsSummaryCardsProps> = ({
    totalPatients,
    recentActivity,
    withInsurance,
    withoutInsurance,
    insurancePercentage,
}) => {
    return (
        <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
                <StatisticCard
                    title="Total Patients"
                    value={totalPatients}
                    icon={<PeopleIcon sx={{ color: '#ffffff', fontSize: '28px' }} />}
                    gradient={GRADIENT_COLORS.blue}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatisticCard
                    title="Recent Activity"
                    value={recentActivity}
                    icon={<TrendingUpIcon sx={{ color: '#ffffff', fontSize: '28px' }} />}
                    gradient={GRADIENT_COLORS.green}
                    subtitle="Last 30 days"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatisticCard
                    title="With Insurance"
                    value={withInsurance}
                    icon={<InsuranceIcon sx={{ color: '#ffffff', fontSize: '28px' }} />}
                    gradient={GRADIENT_COLORS.teal}
                    subtitle={`${insurancePercentage}% coverage`}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatisticCard
                    title="Without Insurance"
                    value={withoutInsurance}
                    icon={<HospitalIcon sx={{ color: '#ffffff', fontSize: '28px' }} />}
                    gradient={GRADIENT_COLORS.navy}
                />
            </Grid>
        </Grid>
    );
};

export default StatisticsSummaryCards;
