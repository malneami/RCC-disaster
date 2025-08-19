import React from 'react';
import { Menu, MenuItem, IconButton, Typography, Box, Tooltip } from '@mui/material';
import { IconDots } from "@tabler/icons-react";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import DashboardCard from '../../shared/DashboardCard';

const options = ['Action', 'Another Action', 'Something else here'];

const activities = [
  {
    time: '09.50 am',
    color: 'primary.main',
    text: 'Payment received from John Doe of $385.90',
  },
  {
    time: '09.46 am',
    color: 'secondary.main',
    text: 'Project Meeting',
  },
  {
    time: '09.47 am',
    color: 'warning.main',
    text: 'New sale recorded #ML-3467',
  },
  {
    time: '09.48 am',
    color: 'error.main',
    text: 'Payment was made of $64.95 to Michael Anderson',
  },
  {
    time: '09.49 am',
    color: 'success.main',
    text: 'New payment receipt created for Alphanso Golvo',
  },
];

const DailyActivities = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    (<DashboardCard
      title="Daily Activities"
      subtitle="Overview of Years"
      action={
        <Box>
          <Tooltip title="Action">
            <IconButton
              aria-expanded={open ? 'true' : undefined}
              aria-haspopup="true"
              onClick={handleClick}
              size="large"
              aria-label="action"
            >
              <IconDots width="20" height="20" />
            </IconButton>
          </Tooltip>
          <Menu
            id="long-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            slotProps={{
              list: {
                'aria-labelledby': 'long-button',
              }
            }}
          >
            {options.map((option) => (
              <MenuItem key={option} selected={option === 'Pyxis'} onClick={handleClose}>
                {option}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      }
    >
      <Timeline
        sx={{
          p: 0,
          mb: 0,
          mt: 0,
        }}
      >
        {activities.map((activity) => (
          <TimelineItem
            key={activity.time}
            sx={{
              minHeight: '57px',
            }}
          >
            <TimelineOppositeContent
              sx={{
                flex: '0',
              }}
            >
              <Typography variant="subtitle2" fontWeight="500" whiteSpace='nowrap'>
                {activity.time}
              </Typography>
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot
                variant="outlined"
                sx={{
                  borderColor: activity.color,
                }}
              />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent color="text.secondary" variant="h6">
              {activity.text}
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </DashboardCard>)
  );
};

export default DailyActivities;
