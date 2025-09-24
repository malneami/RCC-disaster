import React from 'react';
import { Card, CardContent } from '@mui/material';
import PieChartComponent from './charts/PieChartComponent';
import DonutChartComponent from './charts/DonutChartComponent';
import BarChartComponent from './charts/BarChartComponent';
import LineChartComponent from './charts/LineChartComponent';
import { ChartType } from './ViewSwitcher';

interface FlexibleChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  title: string;
  chartType: ChartType;
  colors?: string[];
  showTarget?: boolean;
}

const FlexibleChart: React.FC<FlexibleChartProps> = ({
  data,
  title,
  chartType,
  colors,
  showTarget = false,
}) => {
  const renderChart = () => {
    switch (chartType) {
      case 'pie':
        return (
          <PieChartComponent
            data={data}
            title={title}
            colors={colors}
          />
        );
      case 'donut':
        return (
          <DonutChartComponent
            data={data}
            title={title}
            colors={colors}
            innerRadius={60}
            outerRadius={100}
          />
        );
      case 'bar':
        return (
          <BarChartComponent
            data={data}
            title={title}
            colors={colors}
          />
        );
      case 'line':
        return (
          <LineChartComponent
            data={data.map(item => ({
              name: item.name,
              value: item.value,
              target: showTarget ? 90 : undefined,
            }))}
            title={title}
            showTarget={showTarget}
          />
        );
      default:
        return (
          <PieChartComponent
            data={data}
            title={title}
            colors={colors}
          />
        );
    }
  };

  return (
    <Card>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default FlexibleChart;
