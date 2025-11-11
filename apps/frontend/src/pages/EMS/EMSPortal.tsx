import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faAmbulance, 
  faMapMarkedAlt, 
  faCalendarAlt,
  faChartLine,
  faCog,
  faUser
} from '@fortawesome/free-solid-svg-icons';

import GenericTabs, { TabConfig } from '../../components/Common/GenericTabs';
import AmbulanceManagement from './components/AmbulanceManagement';
import AssignmentManagement from './components/AssignmentManagement';
import PerformanceAnalytics from './components/PerformanceAnalytics';
import SchedulingManagement from './components/SchedulingManagement';
import DriverManagement from './components/DriverManagement';
import { LiveAmbulanceMap } from '../../components/LiveTracking';

const EMSPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const tabs: TabConfig[] = [
    {
      label: 'Active Transports',
      icon: <FontAwesomeIcon icon={faAmbulance} />,
      content: <AssignmentManagement />
    },
    {
      label: 'Live Tracking',
      icon: <FontAwesomeIcon icon={faMapMarkedAlt} />,
      content: (
        <Box>
          <LiveAmbulanceMap
            height="calc(100vh - 250px)"
            autoRefresh={true}
            refreshInterval={120000}
            useGPSAPI={true}
            showLegend={true}
            showControls={true}
            showFilters={true}
          />
        </Box>
      )
    },
    {
      label: 'Ambulance Fleet',
      icon: <FontAwesomeIcon icon={faCog} />,
      content: <AmbulanceManagement />
    },
    {
      label: 'Driver Management',
      icon: <FontAwesomeIcon icon={faUser} />,
      content: <DriverManagement />
    },
    {
      label: 'Driver Schedules',
      icon: <FontAwesomeIcon icon={faCalendarAlt} />,
      content: <SchedulingManagement />
    },
    {
      label: 'Performance',
      icon: <FontAwesomeIcon icon={faChartLine} />,
      content: <PerformanceAnalytics />
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FontAwesomeIcon icon={faAmbulance} color="#1976d2" />
          EMS Transport Portal
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Emergency Medical Services Management & Real-time Tracking
        </Typography>
      </Box>

      <GenericTabs
        tabs={tabs}
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile={true}
        sx={{ minHeight: '600px' }}
      />
    </Box>
  );
};

export default EMSPortal;
