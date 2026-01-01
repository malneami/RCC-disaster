import React from 'react';
import { TrendingUp, Error } from '@mui/icons-material';
import KPICard from './KPICard';
import { KPIMetric } from '../../../types/dataQuality';

interface CoverageKPIProps {
  metric: KPIMetric;
  onViewDetails?: () => void;
}

const CoverageKPI: React.FC<CoverageKPIProps> = ({ metric, onViewDetails }) => {
  const icon = metric.status === 'PASS' ? <TrendingUp /> : <Error />;

  return (
    <KPICard
      metric={metric}
      title="Coverage"
      titleAr="التغطية"
      description="Expected vs submitted entries and change rate analysis"
      icon={icon}
      onClick={onViewDetails}
    />
  );
};

export default CoverageKPI;


