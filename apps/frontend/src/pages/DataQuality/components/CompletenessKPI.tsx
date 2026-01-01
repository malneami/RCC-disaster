import React from 'react';
import { Assignment, Error } from '@mui/icons-material';
import KPICard from './KPICard';
import { KPIMetric } from '../../../types/dataQuality';

interface CompletenessKPIProps {
  metric: KPIMetric;
  onViewDetails?: () => void;
}

const CompletenessKPI: React.FC<CompletenessKPIProps> = ({ metric, onViewDetails }) => {
  const icon = metric.status === 'PASS' ? <Assignment /> : <Error />;

  return (
    <KPICard
      metric={metric}
      title="Data Completeness"
      titleAr="إكمال البيانات"
      description="Checks for missing patient ID/national ID fields"
      icon={icon}
      onClick={onViewDetails}
    />
  );
};

export default CompletenessKPI;


