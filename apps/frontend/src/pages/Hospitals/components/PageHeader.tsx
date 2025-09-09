import React from 'react';
import {
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import GenericPageHeader, { HeaderAction } from '../../../components/Common/GenericPageHeader';

interface PageHeaderProps {
  title: string;
  filterCount: number;
  alertCount: number;
  onFilterClick: () => void;
  onAlertClick: () => void;
  onRefresh: () => void;
  onAddClick: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  filterCount,
  alertCount,
  onFilterClick,
  onAlertClick,
  onRefresh,
  onAddClick,
}) => {
  const actions: HeaderAction[] = [
    {
      icon: <FilterIcon />,
      tooltip: 'Filter Hospitals',
      onClick: onFilterClick,
      color: 'primary',
      badgeContent: filterCount,
      badgeColor: 'primary',
    },
    {
      icon: <NotificationsIcon />,
      tooltip: 'View Alerts',
      onClick: onAlertClick,
      color: 'warning',
      badgeContent: alertCount,
      badgeColor: 'error',
    },
    {
      icon: <RefreshIcon />,
      tooltip: 'Refresh',
      onClick: onRefresh,
    },
    {
      icon: <AddIcon />,
      tooltip: 'Add Hospital',
      onClick: onAddClick,
      isFab: true,
      fabColor: 'primary',
      fabSize: 'small',
    },
  ];

  return (
    <GenericPageHeader
      title={title}
      actions={actions}
    />
  );
};

export default PageHeader;
