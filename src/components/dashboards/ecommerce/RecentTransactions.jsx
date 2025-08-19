import React from 'react';
import { Typography, Box, Fab, Button, Divider, Stack } from '@mui/material';
import {
  IconCheck,
  IconCreditCard,
  IconCurrencyDollar,
  IconShield,
} from "@tabler/icons-react";
import DashboardCard from '../../shared/DashboardCard';

const transactions = [
  {
    btnbg: 'secondary.light',
    btntext: 'secondary.main',
    icon: <IconCurrencyDollar width={20} height={20} />,
    title: 'PayPal Transfer',
    subtitle: 'Money Added',
    type: 'profit',
    profit: '+$350',
  },
  {
    btnbg: 'success.light',
    btntext: 'success.main',
    icon: <IconShield width={20} height={20} />,
    title: 'Wallet',
    subtitle: 'Bill payment',
    type: 'loss',
    profit: '-$560',
  },
  {
    btnbg: 'error.light',
    btntext: 'error.main',
    icon: <IconCreditCard width={20} height={20} />,
    title: 'Credit Card',
    subtitle: 'Money reversed',
    type: 'profit',
    profit: '+$350',
  },
  {
    btnbg: 'warning.light',
    btntext: 'warning.main',
    icon: <IconCheck width={20} height={20} />,
    title: 'Bank Transfer',
    subtitle: 'Money Added',
    type: 'profit',
    profit: '+$350',
  },
  {
    btnbg: 'primary.light',
    btntext: 'primary.main',
    icon: <IconCurrencyDollar width={20} height={20} />,
    title: 'Refund',
    subtitle: 'Payment Sent',
    type: 'loss',
    profit: '-$50',
  },
];

const RecentTransactions = () => (
  <DashboardCard title="Recent Transactions" subtitle="List of payments">
    <Box mb={3}
    >
      {transactions.map((transaction) => (
        <Stack direction='row' alignItems='center' mt={2} pt={1}
          key={transaction.title}>
          <Fab
            sx={{
              backgroundColor: transaction.btnbg,
              color: transaction.btntext,
              boxShadow: 'none',
              height: '45px',
              width: '45px',
              borderRadius: '10px',
              "&:hover": {
                backgroundColor: transaction.btnbg,
              }
            }}
            aria-label="transactions"
          >
            {transaction.icon}
          </Fab>
          <Box ml={2}>
            <Typography variant="h5">{transaction.title}</Typography>
            <Typography color="textSecondary" variant="h6" fontWeight="400">
              {transaction.subtitle}
            </Typography>
          </Box>
          <Box ml='auto'>
            <Typography
              color={transaction.type === 'profit' ? 'success.main' : 'error.main'}
              variant="h6"
            >
              {transaction.profit}
            </Typography>
          </Box>
        </Stack>
      ))}
    </Box>
    <Divider />
    <Stack direction='row' alignItems='center' mt={3} justifyContent='space-between'>
      <Button variant="contained" color="secondary">
        Add
      </Button>
      <Typography color="textSecondary" variant="h6" fontWeight="400">
        36 Recent Transactions
      </Typography>
    </Stack>
  </DashboardCard>
);

export default RecentTransactions;
