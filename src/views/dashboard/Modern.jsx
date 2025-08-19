import React from 'react';
import { Grid, Box } from '@mui/material';
import
WelcomeCard
  from '../../components/dashboards/modern/WelcomeCard';
import SalesOverview from '../../components/dashboards/modern/SalesOverview'
import DailyActivities from '../../components/dashboards/modern/DailyActivities'
import Purchases from '../../components/dashboards/modern/Purchases'
import TotalEarnings from '../../components/dashboards/modern/TotalEarnings'
import RevenueUpdates from '../../components/dashboards/modern/RevenueUpdates'
import MonthlyEarnings from '../../components/dashboards/modern/MonthlyEarnings'
import Customers from '../../components/dashboards/modern/Customers'
import TotalSales from '../../components/dashboards/modern/TotalSales'
import ProductsPerformance from '../../components/dashboards/modern/ProductsPerformance'
import MedicalproBranding from '../../components/dashboards/ecommerce/MedicalproBranding'
import WeeklyStats from '../../components/dashboards/analytical/WeeklyStats'
import BlogCard from '../../components/dashboards/analytical/BlogCard'

import PageContainer from '../../components/container/PageContainer';

const Dashboard3 = () => (
  // 2

  (<PageContainer title="Modern Dashboard" description="this is Modern Dashboard">
    <Box mt={3}>
      <Grid container spacing={3}>
        {/* ------------------------- row 1 ------------------------- */}
        <Grid
          size={{
            xs: 12,
            lg: 5
          }}>
          <WelcomeCard />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            lg: 3
          }}>
          <Purchases />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            lg: 4
          }}>
          <TotalEarnings />
        </Grid>
        <Grid
          size={{
            xs: 12,
            lg: 8
          }}>
          <RevenueUpdates />
        </Grid>

        <Grid
          size={{
            xs: 12,
            lg: 4
          }}>
          <Grid container spacing={3}>
            <Grid size={12}>
              <MonthlyEarnings />
            </Grid>
            <Grid size={12}>
              <Customers />
            </Grid>
          </Grid>
        </Grid>
        <Grid
          size={{
            xs: 12,
            lg: 4
          }}>
          <TotalSales />
        </Grid>
        <Grid
          size={{
            xs: 12,
            lg: 8
          }}>
          <ProductsPerformance />
        </Grid>
        <Grid
          size={{
            xs: 12,
            lg: 6
          }}>
          <DailyActivities />
        </Grid>

        <Grid
          size={{
            xs: 12,
            lg: 6
          }}>
          <SalesOverview />
        </Grid>

        {/* ------------------------- row 3 ------------------------- */}
        <Grid
          size={{
            xs: 12,
            lg: 4
          }}>
          <BlogCard />
        </Grid>
        <Grid
          size={{
            xs: 12,
            lg: 4
          }}>
          <WeeklyStats />
        </Grid>
        <Grid
          size={{
            xs: 12,
            lg: 4
          }}>
          <MedicalproBranding />
        </Grid>

      </Grid>
    </Box>
  </PageContainer>)
);
export default Dashboard3;
