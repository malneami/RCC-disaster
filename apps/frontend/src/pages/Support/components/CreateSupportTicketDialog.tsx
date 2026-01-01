import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { supportService, SupportTicketCategory } from '../../../services/supportService';
import { FileUploader } from './FileUploader';

interface CreateSupportTicketDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateSupportTicketDialog: React.FC<CreateSupportTicketDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SupportTicketCategory>('BUG');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ticket = await supportService.createTicket({
        description: description.trim(),
        category,
      });

      if (files.length > 0) {
        await Promise.all(
          files.map((file) => supportService.uploadAttachment(ticket.id, file))
        );
      }

      setDescription('');
      setCategory('BUG');
      setFiles([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setDescription('');
      setCategory('BUG');
      setFiles([]);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Support Ticket</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Description"
            multiline
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your issue in detail..."
            fullWidth
            required
            error={!!error && !description.trim()}
            helperText={error && !description.trim() ? error : ''}
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Attachments (Optional)
            </Typography>
            <FileUploader
              onFilesSelected={setFiles}
              maxSize={10 * 1024 * 1024} // 10MB
              maxFiles={5}
            />
          </Box>

          {error && description.trim() && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Creating...' : 'Create Ticket'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

