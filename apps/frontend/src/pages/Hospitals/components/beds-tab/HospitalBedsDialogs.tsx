import React from 'react';
import EditBedDialog from '../../../Beds/components/EditBedDialog';
import ViewBedDialog from '../../../Beds/components/ViewBedDialog';
import BedHistoryDialog from '../../../Beds/components/BedHistoryDialog';
import AddBedDialog from '../../../Beds/components/AddBedDialog';
import DeleteBedDialog from '../../../Beds/components/DeleteBedDialog';

interface HospitalBedsDialogsProps {
    hospitalId: string;
    canManageBeds: boolean;
    selectedBedId: string | null;
    setSelectedBedId: (id: string | null) => void;
    editDialogOpen: boolean;
    setEditDialogOpen: (open: boolean) => void;
    viewDialogOpen: boolean;
    setViewDialogOpen: (open: boolean) => void;
    historyDialogOpen: boolean;
    setHistoryDialogOpen: (open: boolean) => void;
    addBedDialogOpen: boolean;
    setAddBedDialogOpen: (open: boolean) => void;
    deleteDialogOpen: boolean;
    setDeleteDialogOpen: (open: boolean) => void;
    deleteError: string | null;
    setDeleteError: (error: string | null) => void;
    deleteBedLoading: boolean;
    onConfirmDelete: () => void;
    onUpdateBed: () => void;
}

export const HospitalBedsDialogs: React.FC<HospitalBedsDialogsProps> = ({
    hospitalId,
    canManageBeds,
    selectedBedId,
    setSelectedBedId,
    editDialogOpen,
    setEditDialogOpen,
    viewDialogOpen,
    setViewDialogOpen,
    historyDialogOpen,
    setHistoryDialogOpen,
    addBedDialogOpen,
    setAddBedDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    deleteError,
    setDeleteError,
    deleteBedLoading,
    onConfirmDelete,
    onUpdateBed,
}) => {
    return (
        <>
            <EditBedDialog
                open={editDialogOpen}
                onClose={() => {
                    setEditDialogOpen(false);
                    setSelectedBedId(null);
                }}
                bedId={selectedBedId}
                onUpdate={onUpdateBed}
            />

            <ViewBedDialog
                open={viewDialogOpen}
                onClose={() => {
                    setViewDialogOpen(false);
                    setSelectedBedId(null);
                }}
                bedId={selectedBedId}
            />

            <BedHistoryDialog
                open={historyDialogOpen}
                onClose={() => {
                    setHistoryDialogOpen(false);
                    setSelectedBedId(null);
                }}
                bedId={selectedBedId}
            />

            {canManageBeds && (
                <>
                    <AddBedDialog
                        open={addBedDialogOpen}
                        onClose={() => setAddBedDialogOpen(false)}
                        hospitalId={hospitalId}
                    />

                    <DeleteBedDialog
                        open={deleteDialogOpen}
                        onClose={() => {
                            setDeleteDialogOpen(false);
                            setSelectedBedId(null);
                            setDeleteError(null);
                        }}
                        onConfirm={onConfirmDelete}
                        bedId={selectedBedId}
                        loading={deleteBedLoading}
                        error={deleteError}
                    />
                </>
            )}
        </>
    );
};
