import React from 'react';
import { PrecisionManufacturing, Error } from '@mui/icons-material';
import KPICard from './KPICard';
import { KPIMetric } from '../../../types/dataQuality';

interface PrecisionKPIProps {
  metric: KPIMetric;
  onViewDetails?: () => void;
}

const PrecisionKPI: React.FC<PrecisionKPIProps> = ({ metric, onViewDetails }) => {
  const icon = metric.status === 'PASS' ? <PrecisionManufacturing /> : <Error />;

  return (
    <KPICard
      metric={metric}
      title="Data Precision"
      titleAr="دقة البيانات"
      description="Validates timing anomalies and logical data relationships"
      icon={icon}
      onClick={onViewDetails}
    />
  );
};

export default PrecisionKPI;


