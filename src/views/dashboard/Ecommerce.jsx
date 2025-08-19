import React from 'react';
import { Grid, Box } from '@mui/material';
import PageContainer from '../../components/container/PageContainer';

import
EarningsShop
  from '../../components/dashboards/ecommerce/EarningsShop';
import TopCards from '../../components/dashboards/ecommerce/TopCards';
import ProductPerformance from '../../components/dashboards/ecommerce/ProductPerformance';
import WeeklyStats from '../../components/dashboards/ecommerce/WeeklyStats';
import RecentTransactions from '../../components/dashboards/ecommerce/RecentTransactions';
import Earnings from '../../components/dashboards/ecommerce/Earnings';
import YearlySales from '../../components/dashboards/ecommerce/YearlySales';
import ProductsTable from '../../components/dashboards/ecommerce/ProductsTable';
import MedicalproBranding from '../../components/dashboards/ecommerce/MedicalproBranding';
import BlogCard from '../../components/dashboards/ecommerce/BlogCard';



const Dashboard2 = () => (
  <PageContainer title="eCommerce Dashboard" description="this is Dashboard">
    <Box mt={3}>
      <Grid container spacing={3}>
        <Grid
          size={{
            xs: 12,
            lg: 4
          }}>
          <EarningsShop />
        </Grid>
        <Grid
          size={{
            xs: 12,
            lg: 8
          }}>
          <TopCards />
        </Grid>
        <Grid
          size={{
            xs: 12,
            lg: 8
          }}>
          <ProductPerformance />
        </Grid>
        <Grid
          size={{
            xs: 12,
            lg: 4
          }}>
          <Grid container spacing={3}>
            <Grid size={12}>
              <Earnings />
            </Grid>
            <Grid size={12}>
              <YearlySales />
            </Grid>
          </Grid>
        </Grid>
        <Grid
          size={{
            xs: 12,
            lg: 4
          }}>
          <RecentTransactions />
        </Grid>
        <Grid
          size={{
            xs: 12,
            lg: 8
          }}>
          <ProductsTable />
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
        <Grid
          size={{
            xs: 12,
            lg: 4
          }}>
          <BlogCard />
        </Grid>
      </Grid>
    </Box>
  </PageContainer>
);

export default Dashboard2;
