import React from 'react';
import { Menu, MenuItem, IconButton, Typography, Box, Tooltip } from '@mui/material';
import { IconDots } from "@tabler/icons-react";
import { Link } from 'react-router';
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
    time: '09:50 am',
    color: 'primary.main',
    isRecorded: false,
    text: 'Payment received from John Doe of $385.90',
  },
  {
    time: '09:46 am',
    color: 'secondary.main',
    isRecorded: true,
    text: 'New sale recorded',
  },
  {
    time: '08:47 am',
    color: 'success.main',
    isRecorded: false,
    text: 'Payment was made of $64.95 to Michael',
  },
  {
    time: '07:48 am',
    color: 'warning.main',
    isRecorded: true,
    text: 'New sale recorded',
  },
  {
    time: '06:49 am',
    color: 'error.main',
    isRecorded: true,
    text: 'New arrival recorded',
  },
  {
    time: '05:47 am',
    color: 'success.main',
    isRecorded: false,
    text: 'Payment Done',
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
        {activities.map((activity, index) => (
          <TimelineItem key={activity.time} sx={{
            minHeight: '65px'
          }}>
            <TimelineOppositeContent
              sx={{
                flex: '0',
              }}
            >
              <Typography variant="subtitle2" fontWeight="400" whiteSpace='nowrap'>
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
              {index !== activities.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              {activity.isRecorded ?
                <><Typography color="text.primary" variant="h6" fontWeight={600}> {activity.text} </Typography>
                  <Typography component={Link} variant="h6" color="primary.main" to='/'>#ML-3467</Typography>
                </> :
                <Typography color="text.secondary" variant="h6">{activity.text}</Typography>
              }
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </DashboardCard>)
  );
};

export default DailyActivities;
