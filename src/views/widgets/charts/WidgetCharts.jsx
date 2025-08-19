



import { useEffect, useState } from "react";

import { Grid } from '@mui/material';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import PageContainer from 'src/components/container/PageContainer';


import YearlyBreakup from "../../../components/widgets/charts/YearlyBreakup";
import Projects from "../../../components/widgets/charts/Projects";
import Customers from "../../../components/widgets/charts/Customers";
import SalesTwo from "../../../components/widgets/charts/SalesTwo";
import MonthlyEarnings from "../../../components/widgets/charts/MonthlyEarnings";
import SalesOverview from "../../../components/widgets/charts/SalesOverview";
import RevenueUpdates from "../../../components/widgets/charts/RevenueUpdates";
import YearlySales from "../../../components/widgets/charts/YearlySales";
import MostVisited from "../../../components/widgets/charts/MostVisited";
import PageImpressions from "../../../components/widgets/charts/PageImpressions";
import Followers from "../../../components/widgets/charts/Followers";
import Views from "../../../components/widgets/charts/Views";
import Earned from "../../../components/widgets/charts/Earned";
import CurrentValue from "../../../components/widgets/charts/CurrentValue";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Charts",
  },
];

const WidgetCharts = () => {
  const [isLoading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    (<PageContainer title="Charts" description="this is Charts">
      {/* breadcrumb */}
      <Breadcrumb title="Charts" items={BCrumb} />
      {/* end breadcrumb */}
      <Grid container spacing={3}>
        <Grid
          size={{
            xs: 12,
            sm: 3
          }}>
          <Followers />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 3
          }}>
          <Views />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 3
          }}>
          <Earned />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 3
          }}>
          <SalesTwo />
        </Grid>
        <Grid size={12}>
          <CurrentValue />
        </Grid>
        <Grid
          size={{
            xs: 12,
            lg: 4
          }}>
          <Grid container spacing={3}>
            <Grid size={12}>
              <YearlyBreakup />
            </Grid>
            <Grid size={12}>
              <MonthlyEarnings />
            </Grid>
            <Grid size={12}>
              <MostVisited />
            </Grid>
          </Grid>
        </Grid>
        <Grid
          size={{
            xs: 12,
            lg: 4
          }}>
          <Grid container spacing={3}>
            <Grid size={12}>
              <YearlySales />
            </Grid>
            <Grid size={12}>
              <PageImpressions />
            </Grid>
            <Grid
              size={{
                xs: 12,
                sm: 6
              }}>
              <Customers />
            </Grid>
            <Grid
              size={{
                xs: 12,
                sm: 6
              }}>
              <Projects />
            </Grid>
          </Grid>
        </Grid>
        <Grid
          size={{
            xs: 12,
            lg: 4
          }}>
          <Grid container spacing={3}>
            <Grid size={12}>
              <RevenueUpdates />
            </Grid>
            <Grid size={12}>
              <SalesOverview />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </PageContainer>)
  );
};

export default WidgetCharts;
