import React from 'react';
import { Avatar } from '@mui/material';
import { Patient } from '../../../../services/patientService';

interface PatientAvatarProps {
    patient: Patient;
    avatarColor: { bg: string; border: string };
}

const PatientAvatar: React.FC<PatientAvatarProps> = ({ patient, avatarColor }) => {
    return (
        <Avatar
            sx={{
                width: 60,
                height: 60,
                background: avatarColor.bg,
                fontSize: '1.375rem',
                fontWeight: 600,
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(79, 172, 254, 0.25)',
                border: `3px solid ${avatarColor.border}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 6px 16px rgba(79, 172, 254, 0.35)',
                },
            }}
        >
            {patient.firstName.charAt(0).toUpperCase()}
            {patient.lastName.charAt(0).toUpperCase()}
        </Avatar>
    );
};

export default PatientAvatar;
