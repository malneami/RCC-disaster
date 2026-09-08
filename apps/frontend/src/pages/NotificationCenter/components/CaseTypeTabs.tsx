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
  faArrowDown,
  faTruck,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../contexts/AuthContext';

export type CaseTypeFilter = 'ALL' | 'STEMI' | 'STROKE' | 'TRAUMA' | 'INCOMING_CRITICAL' | 'DISASTER';

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
  const { user } = useAuth();
  const isRCC = user?.role === 'RCC' || user?.role === 'ADMIN';
  const canViewDisasters = ['ADMIN', 'RCC', 'EMS'].includes(user?.role || '');

  const caseTypes: Array<{
    value: CaseTypeFilter;
    label: string;
    icon: any;
    color: string;
    visible: boolean;
  }> = [
    {
      value: 'ALL',
      label: 'All',
      icon: faList,
      color: '#6366f1',
      visible: true,
    },
    {
      value: 'STEMI',
      label: 'STEMI',
      icon: faHeartbeat,
      color: '#ef4444',
      visible: true,
    },
    {
      value: 'STROKE',
      label: 'Stroke',
      icon: faBrain,
      color: '#06b6d4',
      visible: true,
    },
    {
      value: 'TRAUMA',
      label: 'Trauma',
      icon: faExclamationTriangle,
      color: '#f59e0b',
      visible: true,
    },
    {
      value: 'INCOMING_CRITICAL',
      label: 'Incoming Critical (24h)',
      icon: faArrowDown,
      color: '#dc2626',
      visible: isRCC,
    },
    {
      value: 'DISASTER',
      label: 'Disaster',
      icon: faTruck,
      color: '#b91c1c',
      visible: canViewDisasters,
    },
  ];

  // Filter visible tabs
  const visibleCaseTypes = caseTypes.filter(ct => ct.visible);

  const getTabIndex = (caseType: CaseTypeFilter) => {
    return visibleCaseTypes.findIndex((c) => c.value === caseType);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    const selectedCaseType = visibleCaseTypes[newValue].value;
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
        {visibleCaseTypes.map((caseType) => {
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

