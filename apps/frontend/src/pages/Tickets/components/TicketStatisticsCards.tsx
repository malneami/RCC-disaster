import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import {
  Schedule as PendingIcon,
  Assignment as AssignedIcon,
  DirectionsCar as TransportIcon,
  CheckCircle as CompletedIcon,
  Cancel as CancelledIcon,
  LocalHospital as TotalIcon,
} from '@mui/icons-material';
import { TicketStatistics } from '../../../services/ticketService';

interface TicketStatisticsCardsProps {
  statistics: TicketStatistics;
}

const TicketStatisticsCards: React.FC<TicketStatisticsCardsProps> = ({ statistics }) => {
  const cards = [
    {
      title: 'Total Tickets',
      value: statistics.total,
      icon: <TotalIcon />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
    },
    {
      title: 'Pending',
      value: statistics.pending,
      icon: <PendingIcon />,
      color: '#ed6c02',
      bgColor: '#fff4e5',
    },
    {
      title: 'Assigned',
      value: statistics.assigned,
      icon: <AssignedIcon />,
      color: '#0288d1',
      bgColor: '#e1f5fe',
    },
    {
      title: 'In Transport',
      value: statistics.inTransport,
      icon: <TransportIcon />,
      color: '#7b1fa2',
      bgColor: '#f3e5f5',
    },
    {
      title: 'Completed',
      value: statistics.completed,
      icon: <CompletedIcon />,
      color: '#2e7d32',
      bgColor: '#e8f5e8',
    },
    {
      title: 'Cancelled',
      value: statistics.cancelled,
      icon: <CancelledIcon />,
      color: '#d32f2f',
      bgColor: '#ffebee',
    },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card) => (
        <Grid item xs={12} sm={6} md={4} lg={2} key={card.title}>
          <Card
            sx={{
              height: '100%',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    backgroundColor: card.bgColor,
                    color: card.color,
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {card.icon}
                </Box>
                <Typography
                  variant="h4"
                  component="div"
                  sx={{
                    fontWeight: 'bold',
                    color: card.color,
                  }}
                >
                  {card.value}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {card.title}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default TicketStatisticsCards;
