import React from 'react';
import { ContentCopy, Error } from '@mui/icons-material';
import KPICard from './KPICard';
import { KPIMetric } from '../../../types/dataQuality';

interface DuplicationKPIProps {
  metric: KPIMetric;
  onViewDetails?: () => void;
}

const DuplicationKPI: React.FC<DuplicationKPIProps> = ({ metric, onViewDetails }) => {
  const icon = metric.status === 'PASS' ? <ContentCopy /> : <Error />;

  return (
    <KPICard
      metric={metric}
      title="Data Duplication"
      titleAr="تكرار البيانات"
      description="Detects duplicate patient records for same visit"
      icon={icon}
      onClick={onViewDetails}
    />
  );
};

export default DuplicationKPI;


