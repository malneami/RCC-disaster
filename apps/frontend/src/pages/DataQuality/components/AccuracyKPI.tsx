import React from 'react';
import { CheckCircle, Error } from '@mui/icons-material';
import KPICard from './KPICard';
import { KPIMetric } from '../../../types/dataQuality';

interface AccuracyKPIProps {
  metric: KPIMetric;
  onViewDetails?: () => void;
}

const AccuracyKPI: React.FC<AccuracyKPIProps> = ({ metric, onViewDetails }) => {
  const icon = metric.status === 'PASS' ? <CheckCircle /> : <Error />;

  return (
    <KPICard
      metric={metric}
      title="Data Accuracy"
      titleAr="صحة البيانات"
      description="Validates date of birth format and logical date ranges"
      icon={icon}
      onClick={onViewDetails}
    />
  );
};

export default AccuracyKPI;

