import React from 'react';
import { AccessTime, Error } from '@mui/icons-material';
import KPICard from './KPICard';
import { KPIMetric } from '../../../types/dataQuality';

interface TimelinessKPIProps {
  metric: KPIMetric;
  onViewDetails?: () => void;
}

const TimelinessKPI: React.FC<TimelinessKPIProps> = ({ metric, onViewDetails }) => {
  const icon = metric.status === 'PASS' ? <AccessTime /> : <Error />;

  return (
    <KPICard
      metric={metric}
      title="Data Timeliness"
      titleAr="الالتزام بتسليم البيانات"
      description="Tracks submission deadlines and date format compliance"
      icon={icon}
      onClick={onViewDetails}
    />
  );
};

export default TimelinessKPI;


