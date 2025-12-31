import { Patient } from '../../../../services/patientService';
import Pagination from '../../../../components/Common/Pagination';
import ModernPatientStatistics from '../statistics/ModernPatientStatistics';
import DuplicateDetection from '../DuplicateDetection';
import PatientAccessLogsTab from '../PatientAccessLogsTab';
import ModernPatientList from '../ModernPatientList';
import { useAuth } from '../../../../contexts/AuthContext';

interface PatientTabsContentProps {
  patients: Patient[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewPatient: (patient: Patient) => void;
  onEditPatient: (patient: Patient) => void;
  onExportPatient: (patient: Patient) => void;
}

export const usePatientTabsContent = ({
  patients,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onViewPatient,
  onEditPatient,
  onExportPatient,
}: PatientTabsContentProps) => {
  const { user } = useAuth();

  // Check if user has admin or RCC role
  const canViewAccessLogs = user?.role === 'ADMIN' || user?.role === 'RCC';

  const tabs = [
    {
      label: 'Patients',
      content: (
        <>
          <ModernPatientList
            patients={patients}
            loading={loading}
            emptyMessage="No patients found"
            onViewPatient={onViewPatient}
            onEditPatient={onEditPatient}
            onExportPatient={onExportPatient}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      ),
    },
    {
      label: 'Statistics',
      content: <ModernPatientStatistics />,
    },
    {
      label: 'Duplicates',
      content: <DuplicateDetection />,
    },
  ];

  // Only add Access Logs tab for ADMIN and RCC users
  if (canViewAccessLogs) {
    tabs.push({
      label: 'Access Logs',
      content: <PatientAccessLogsTab />,
    });
  }

  return tabs;
};
