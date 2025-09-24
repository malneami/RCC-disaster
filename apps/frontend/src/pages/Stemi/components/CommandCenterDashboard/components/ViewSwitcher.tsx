import React from 'react';
import {
  ToggleButtonGroup,
  ToggleButton,
  Box,
  Typography,
} from '@mui/material';
import {
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  DonutLarge as DonutChartIcon,
} from '@mui/icons-material';

export type ChartType = 'pie' | 'donut' | 'bar' | 'line';

interface ViewSwitcherProps {
  chartType: ChartType;
  onChartTypeChange: (chartType: ChartType) => void;
  language: 'en' | 'ar';
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  chartType,
  onChartTypeChange,
  language,
}) => {
  const handleChartTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newChartType: ChartType | null,
  ) => {
    if (newChartType !== null) {
      onChartTypeChange(newChartType);
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={2}>
      <Typography variant="body2" color="text.secondary">
        {language === 'ar' ? 'نوع الرسم البياني:' : 'Chart Type:'}
      </Typography>
      <ToggleButtonGroup
        value={chartType}
        exclusive
        onChange={handleChartTypeChange}
        aria-label="chart type"
        size="small"
      >
        <ToggleButton value="pie" aria-label="pie chart">
          <PieChartIcon fontSize="small" />
          <Typography variant="caption" sx={{ ml: 0.5 }}>
            {language === 'ar' ? 'دائري' : 'Pie'}
          </Typography>
        </ToggleButton>
        <ToggleButton value="donut" aria-label="donut chart">
          <DonutChartIcon fontSize="small" />
          <Typography variant="caption" sx={{ ml: 0.5 }}>
            {language === 'ar' ? 'دونات' : 'Donut'}
          </Typography>
        </ToggleButton>
        <ToggleButton value="bar" aria-label="bar chart">
          <BarChartIcon fontSize="small" />
          <Typography variant="caption" sx={{ ml: 0.5 }}>
            {language === 'ar' ? 'عمودي' : 'Bar'}
          </Typography>
        </ToggleButton>
        <ToggleButton value="line" aria-label="line chart">
          <LineChartIcon fontSize="small" />
          <Typography variant="caption" sx={{ ml: 0.5 }}>
            {language === 'ar' ? 'خطي' : 'Line'}
          </Typography>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default ViewSwitcher;
