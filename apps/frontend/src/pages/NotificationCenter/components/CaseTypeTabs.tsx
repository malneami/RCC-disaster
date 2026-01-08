import React from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  alpha,
  useTheme,
  Chip,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeartbeat,
  faBrain,
  faExclamationTriangle,
  faList,
} from '@fortawesome/free-solid-svg-icons';

export type CaseTypeFilter = 'ALL' | 'STEMI' | 'STROKE' | 'TRAUMA';

interface CaseTypeTabsProps {
  activeCaseType: CaseTypeFilter;
  onCaseTypeChange: (caseType: CaseTypeFilter) => void;
  caseTypeCounts?: Record<CaseTypeFilter, number>;
}

const CaseTypeTabs: React.FC<CaseTypeTabsProps> = ({
  activeCaseType,
  onCaseTypeChange,
  caseTypeCounts = {},
}) => {
  const theme = useTheme();

  const caseTypes: Array<{
    value: CaseTypeFilter;
    label: string;
    icon: any;
    color: string;
  }> = [
    {
      value: 'ALL',
      label: 'All',
      icon: faList,
      color: '#6366f1',
    },
    {
      value: 'STEMI',
      label: 'STEMI',
      icon: faHeartbeat,
      color: '#ef4444',
    },
    {
      value: 'STROKE',
      label: 'Stroke',
      icon: faBrain,
      color: '#06b6d4',
    },
    {
      value: 'TRAUMA',
      label: 'Trauma',
      icon: faExclamationTriangle,
      color: '#f59e0b',
    },
  ];

  const getTabIndex = (caseType: CaseTypeFilter) => {
    return caseTypes.findIndex((c) => c.value === caseType);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    const selectedCaseType = caseTypes[newValue].value;
    onCaseTypeChange(selectedCaseType);
  };

  const activeIndex = getTabIndex(activeCaseType);

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        mb: 3,
        overflowX: 'auto',
        '& .MuiTabs-scrollButtons': {
          display: { xs: 'block', sm: 'none' },
        },
      }}
    >
      <Tabs
        value={activeIndex >= 0 ? activeIndex : 0}
        onChange={handleTabChange}
        aria-label="case type tabs"
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
          '& .MuiTab-root': {
            minWidth: { xs: 'auto', sm: '140px' },
            fontSize: { xs: '0.875rem', sm: '0.9rem' },
            px: { xs: 1.5, sm: 2.5 },
            py: 1.5,
            textTransform: 'none',
            fontWeight: 500,
            '&.Mui-selected': {
              fontWeight: 600,
            },
          },
        }}
      >
        {caseTypes.map((caseType) => {
          const count = caseTypeCounts[caseType.value] || 0;
          const isActive = activeCaseType === caseType.value;

          return (
            <Tab
              key={caseType.value}
              label={
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <FontAwesomeIcon
                    icon={caseType.icon}
                    style={{
                      fontSize: '1rem',
                      color: isActive ? caseType.color : theme.palette.text.secondary,
                    }}
                  />
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 'inherit',
                      color: isActive ? caseType.color : 'inherit',
                      fontWeight: 'inherit',
                    }}
                  >
                    {caseType.label}
                  </Typography>
                  {count > 0 && (
                    <Chip
                      label={count}
                      size="small"
                      sx={{
                        backgroundColor: isActive ? caseType.color : alpha(theme.palette.text.secondary, 0.1),
                        color: isActive ? '#ffffff' : theme.palette.text.secondary,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        minWidth: 24,
                        height: 20,
                        '& .MuiChip-label': {
                          px: 0.75,
                        },
                      }}
                    />
                  )}
                </Box>
              }
              sx={{
                '&.Mui-selected': {
                  color: caseType.color,
                },
              }}
            />
          );
        })}
      </Tabs>
    </Box>
  );
};

export default CaseTypeTabs;

