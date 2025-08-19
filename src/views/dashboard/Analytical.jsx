import React from 'react';
import { Grid, Box } from '@mui/material';
import
WelcomeCard
  from '../../components/dashboards/analytical/WelcomeCard';
import BlogCard from '../../components/dashboards/analytical/BlogCard'
import Earnings from '../../components/dashboards/analytical/Earnings'
import MonthlySales from '../../components/dashboards/analytical/MonthlySales'
import SalesOverview from '../../components/dashboards/analytical/SalesOverview'
import TotalSales from '../../components/dashboards/analytical/TotalSales'
import ProductPerformance from '../../components/dashboards/analytical/ProductPerformance'
import WeeklyStats from '../../components/dashboards/analytical/WeeklyStats'
import DailyActivities from '../../components/dashboards/analytical/DailyActivities'
import Welcome from "../../layouts/full/shared/welcome/Welcome";
import PageContainer from '../../components/container/PageContainer';

export default function Dashboard() {
  return (
    (<PageContainer title="Analytical Dashboard" description="this is Dashboard">
      <Box mt={3}>
        <Grid container spacing={3}>
          {/* ------------------------- row 1 ------------------------- */}
          <Grid
            size={{
              xs: 12,
              lg: 6
            }}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <WelcomeCard />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  lg: 6,
                  sm: 6
                }}>
                <Earnings />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  lg: 6,
                  sm: 6
                }}>
                <MonthlySales />
              </Grid>
            </Grid>
          </Grid>
          <Grid
            size={{
              xs: 12,
              lg: 6
            }}>
            <SalesOverview />
          </Grid>
          {/* ------------------------- row 2 ------------------------- */}
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
            <ProductPerformance />
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
            <DailyActivities />
          </Grid>
        </Grid>
        <Welcome />
      </Box>
    </PageContainer>)
  );
}
