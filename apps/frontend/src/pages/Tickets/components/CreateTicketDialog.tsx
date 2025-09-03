import React from 'react';
import { CreateTicketData } from '../../../services/ticketService';
import MultiStepTicketForm from './MultiStepTicketForm';

interface CreateTicketDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTicketData) => void;
}

const CreateTicketDialog: React.FC<CreateTicketDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  return (
    <MultiStepTicketForm
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
};

export default CreateTicketDialog;
