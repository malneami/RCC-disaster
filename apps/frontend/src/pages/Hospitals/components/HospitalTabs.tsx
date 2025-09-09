import React from 'react';
import { Box } from '@mui/material';
import { Hospital, CapacityAlert } from '../../../services/hospitalService';
import GenericTabs, { TabConfig } from '../../../components/Common/GenericTabs';
import HospitalCapacityChart from './HospitalCapacityChart';
import HospitalMap from './HospitalMap';
import AlertsTab from './AlertsTab';
import HospitalCard from './HospitalCard';

interface HospitalTabsProps {
  tabValue: number;
  hospitals: Hospital[];
  alerts: CapacityAlert[];
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  onUpdateCapacity: (hospital: Hospital) => void;
  onViewDashboard: (hospitalId: string) => void;
}

const HospitalTabs: React.FC<HospitalTabsProps> = ({
  tabValue,
  hospitals,
  alerts,
  onTabChange,
  onUpdateCapacity,
  onViewDashboard,
}) => {
  const tabs: TabConfig[] = [
    {
      label: 'Overview',
      content: (
        <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={3}>
          {hospitals.map((hospital) => (
            <HospitalCard
              key={hospital.id}
              hospital={hospital}
              onUpdateCapacity={onUpdateCapacity}
              onViewDashboard={onViewDashboard}
            />
          ))}
        </Box>
      ),
    },
    {
      label: 'Capacity Dashboard',
      content: <HospitalCapacityChart hospitals={hospitals} />,
    },
    {
      label: 'Map View',
      content: <HospitalMap hospitals={hospitals} />,
    },
    {
      label: 'Alerts',
      content: <AlertsTab alerts={alerts} />,
    },
  ];

  return (
    <GenericTabs
      tabs={tabs}
      value={tabValue}
      onChange={onTabChange}
    />
  );
};

export default HospitalTabs;
