import React from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';

export interface TabConfig {
  label: string;
  content: React.ReactNode;
  icon?: React.ReactElement;
  disabled?: boolean;
}

export interface GenericTabsProps {
  tabs: TabConfig[];
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
  variant?: 'standard' | 'fullWidth' | 'scrollable';
  scrollButtons?: 'auto' | true | false;
  allowScrollButtonsMobile?: boolean;
  sx?: any;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`generic-tabpanel-${index}`}
      aria-labelledby={`generic-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const GenericTabs: React.FC<GenericTabsProps> = ({
  tabs,
  value,
  onChange,
  variant = 'standard',
  scrollButtons = 'auto',
  allowScrollButtonsMobile = false,
  sx = {},
}) => {
  return (
    <Paper sx={{ width: '100%', ...sx }}>
      <Tabs 
        value={value} 
        onChange={onChange} 
        variant={variant}
        scrollButtons={scrollButtons}
        allowScrollButtonsMobile={allowScrollButtonsMobile}
        aria-label="generic tabs"
      >
        {tabs.map((tab, index) => (
          <Tab 
            key={index}
            label={tab.label}
            icon={tab.icon}
            disabled={tab.disabled}
            iconPosition="start"
          />
        ))}
      </Tabs>

      {tabs.map((tab, index) => (
        <TabPanel key={index} value={value} index={index}>
          {tab.content}
        </TabPanel>
      ))}
    </Paper>
  );
};

export default GenericTabs;
