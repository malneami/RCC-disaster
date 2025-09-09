import React from 'react';
import { Box, Button, Typography } from '@mui/material';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageInfo?: boolean;
  pageInfoFormat?: string;
  sx?: any;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showPageInfo = true,
  pageInfoFormat = "Page {current} of {total}",
  sx = {},
}) => {
  const formatPageInfo = () => {
    return pageInfoFormat
      .replace('{current}', currentPage.toString())
      .replace('{total}', totalPages.toString());
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, ...sx }}>
      <Button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </Button>
      
      {showPageInfo && (
        <Typography variant="body2" sx={{ mx: 2, alignSelf: 'center' }}>
          {formatPageInfo()}
        </Typography>
      )}
      
      <Button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </Button>
    </Box>
  );
};

export default Pagination;
