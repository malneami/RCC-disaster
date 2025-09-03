import { Patient } from '../../../services/patientService';
import DataTable from '../../../../components/common/DataTable';
import Pagination from '../../../../components/common/Pagination';
import PatientStatistics from '../PatientStatistics';
import DuplicateDetection from '../DuplicateDetection';
import { usePatientTableColumns } from './PatientTableColumns';

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
  const patientColumns = usePatientTableColumns({
    onViewPatient,
    onEditPatient,
    onExportPatient,
  });

  return [
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
    {
      label: 'Access Logs',
      content: <div>Access Logs - Coming Soon</div>,
    },
  ];
};
