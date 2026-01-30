import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Typography,
    Box,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface DeleteConfirmationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    itemName: string;
    itemType?: string;
    loading?: boolean;
    warningMessage?: string;
    consequences?: string[];
    customMessage?: React.ReactNode;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
    open,
    onClose,
    onConfirm,
    title,
    itemName,
    itemType = 'item',
    loading = false,
    warningMessage,
    consequences = [],
    customMessage,
}) => {
    const defaultConsequences = [
        `Delete the ${itemType} permanently`,
        'This action cannot be undone',
    ];

    const displayConsequences = consequences.length > 0 ? consequences : defaultConsequences;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle id="delete-dialog-title">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="error" />
                    {title}
                </Box>
            </DialogTitle>

            <DialogContent>
                <DialogContentText id="delete-dialog-description" component="div">
                    {customMessage ? (
                        customMessage
                    ) : (
                        <>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Are you sure you want to delete {itemType} "{itemName}"?
                            </Typography>

                            {warningMessage && (
                                <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
                                    {warningMessage}
                                </Typography>
                            )}

                            <Typography variant="body2" sx={{ mb: 1 }}>
                                This action will:
                            </Typography>

                            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                                {displayConsequences.map((consequence, index) => (
                                    <Typography key={index} component="li" variant="body2">
                                        {consequence}
                                    </Typography>
                                ))}
                            </Box>
                        </>
                    )}
                </DialogContentText>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    color="error"
                    variant="contained"
                    disabled={loading}
                >
                    {loading ? 'Deleting...' : 'Delete'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteConfirmationDialog;