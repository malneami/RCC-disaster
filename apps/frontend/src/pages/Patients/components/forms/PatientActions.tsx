import { HeaderAction } from '../../../../components/Common/GenericPageHeader';
import { Add } from '@mui/icons-material';

interface UsePatientActionsProps {
  onAddPatient: () => void;
}

export const usePatientActions = ({ onAddPatient }: UsePatientActionsProps): HeaderAction[] => {
  return [
    {
      icon: <Add />,
      tooltip: 'Add New Patient',
      onClick: onAddPatient,
      color: 'primary',
      isFab: true,
      fabColor: 'primary',
      fabSize: 'medium',
    },
  ];
};
