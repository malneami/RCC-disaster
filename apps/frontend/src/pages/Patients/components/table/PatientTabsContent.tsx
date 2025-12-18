import { Patient } from '../../../../services/patientService';
import DataTable from '../../../../components/Common/DataTable';
import Pagination from '../../../../components/Common/Pagination';
import PatientStatistics from '../PatientStatistics';
import DuplicateDetection from '../DuplicateDetection';
import PatientAccessLogsTab from '../PatientAccessLogsTab';
import { usePatientTableColumns } from './PatientTableColumns';
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
  const patientColumns = usePatientTableColumns({
    onViewPatient,
    onEditPatient,
    onExportPatient,
  });

  // Check if user has admin or RCC role
  const canViewAccessLogs = user?.role === 'ADMIN' || user?.role === 'RCC';

  const tabs = [
    {
      label: 'Patients',
      content: (
        <>
          <DataTable
            data={patients}
            columns={patientColumns}
            loading={loading}
            emptyMessage="No patients found"
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
      content: <PatientStatistics />,
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
