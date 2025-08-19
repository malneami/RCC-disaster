import React from 'react';
import { Grid, Button, Box, Card, CardContent, Typography } from '@mui/material';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import { NavLink } from 'react-router';
import ThemeSelect from './ThemeSelect';
import PageContainer from 'src/components/container/PageContainer';
import { IconPlus } from '@tabler/icons-react';

import BlankCard from '../../components/shared/BlankCard';

const Dashboard1 = () => (


  <PageContainer title="Starter Page" description="this is Starter Page">
    {/* breadcrumb */}
    <Breadcrumb title="Starter Page" subtitle="Welcome Johnathan">
      <ThemeSelect />
      <Button
        to="/user-profile"
        component={NavLink}
        variant="contained"
        color="primary" startIcon={<IconPlus size='18' />}
      >
        Add New
      </Button>
    </Breadcrumb>
    {/* end breadcrumb */}
    <Grid container spacing={0}>
      {/* ------------------------- row 1 ------------------------- */}
      <Grid size={{ xs: 12, lg: 12 }}>
        <BlankCard>
          <CardContent>
            <Typography variant="h4">Starter Card</Typography>
            <Typography variant="body1">
              This impressive paella is a perfect party dish and a fun meal to cook together with
              your guests. Add 1 cup of frozen peas along with the mussels, if you like.
            </Typography>
          </CardContent>
        </BlankCard>
      </Grid>
    </Grid>
  </PageContainer>
);
export default Dashboard1;
