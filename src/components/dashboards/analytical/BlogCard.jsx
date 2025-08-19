import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Stack,
} from '@mui/material';

import background2x from '../../../assets/images/backgrounds/blog-bg-2x.jpg';
import { IconClock, IconMessageCircle } from '@tabler/icons-react'
import img1 from '../../../assets/images/users/1.jpg';
import img2 from '../../../assets/images/users/2.jpg';
import img3 from '../../../assets/images/users/3.jpg';

const BlogCard = () => (
  <Card
    sx={{
      p: 0,
    }}
  >
    <img srcSet={`${background2x} 1x, ${background2x} 2x`} alt="img" height="220" width="100%" />
    <CardContent>
      <Stack direction='row' gap={1}>
        <Typography color="textSecondary" display="flex" alignItems="center">
          <IconClock width="20" height="20" />
        </Typography>
        <Typography
          color="textSecondary"
          variant="subtitle2">
          22 March, 2025
        </Typography>
      </Stack>
      <Typography
        variant="h4" mt={3}>
        Super awesome, React 19 is coming soon!
      </Typography>
      <Stack direction='row' gap={1} mt={2} pb={3}>
        <Chip
          label="Medium"
          size="small"
          sx={{
            backgroundColor: (theme) => theme.palette.primary.main,
            color: '#fff',
            pl: '3px',
            pr: '3px',
            borderRadius: '6px',
          }}
        />
        <Chip
          label="Low"
          size="small"
          sx={{
            backgroundColor: (theme) => theme.palette.error.main,
            color: '#fff',
            pl: '3px',
            pr: '3px',
            borderRadius: '6px',
          }}
        />
      </Stack>

      <Divider />
      <Stack direction='row' justifyContent='space-between' mt={3}>
        <Stack direction='row' spacing={1}>
          <Tooltip title="John Deo" placement="top">
            <Avatar src={img1} width="35" />
          </Tooltip>
          <Tooltip title="Micheal Doe" placement="top">
            <Avatar
              src={img2}
              width="35"
            />
          </Tooltip>
          <Tooltip title="John Peter" placement="top">
            <Avatar src={img3} width="35" />
          </Tooltip>
        </Stack>

        <Tooltip title="Add Comment" placement="top">
          <IconButton>
            <IconMessageCircle width="20" height="20" />
          </IconButton>
        </Tooltip>
      </Stack>
    </CardContent>
  </Card>
);

export default BlogCard;
