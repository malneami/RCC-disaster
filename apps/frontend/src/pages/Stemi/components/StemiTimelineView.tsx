import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
} from '@mui/material';
import {
  LocalHospital,
  MedicalServices,
  Build,
  CheckCircle,
  Warning,
  Assignment,
  EventAvailable,
  LocalShipping,
  Healing,
  MonitorHeart,
  DepartureBoard,
  CallMade,
  CheckCircleOutline,
  FileDownload,
  Image as ImageIcon,
} from '@mui/icons-material';
import * as ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';
import { StemiCase } from '../services/stemiService';
import { StemiDatetimeService } from '../services/stemiDatetimeService';
import { useAuth } from '../../../contexts/AuthContext';

interface StemiTimelineViewProps {
  stemiCase: StemiCase;
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  status: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  recorded: boolean;
  target?: string;
}

interface TimelinePhase {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  events: TimelineEvent[];
  completed: boolean;
}

const StemiTimelineView: React.FC<StemiTimelineViewProps> = ({ stemiCase }) => {
  const { user } = useAuth();
  const timelineRef = React.useRef<HTMLDivElement>(null);

  const createTimelinePhases = (): TimelinePhase[] => {
    const phases: TimelinePhase[] = [];

    // Emergency Department Phase
    const emergencyEvents: TimelineEvent[] = [
      {
        id: 'date-of-admission',
        timestamp: stemiCase.pathwayStarted || '',
        status: 'Date of Admission',
        description: 'Patient admission to emergency department',
        icon: <EventAvailable />,
        color: '#2196f3',
        recorded: !!stemiCase.pathwayStarted,
      },
      {
        id: 'triage-time',
        timestamp: stemiCase.triageTime || '',
        status: 'Triage Time',
        description: 'Patient triaged and assessed',
        icon: <MedicalServices />,
        color: '#9c27b0',
        recorded: !!stemiCase.triageTime,
      },
      {
        id: 'first-ecg-time',
        timestamp: stemiCase.firstEcgTime || '',
        status: 'First ECG Time',
        description: 'First ECG performed and interpreted',
        icon: <MonitorHeart />,
        color: '#4caf50',
        recorded: !!stemiCase.firstEcgTime,
        target: '10 min',
      },
      {
        id: 'ems-activation-time',
        timestamp: stemiCase.rccActivated ? (stemiCase.updatedAt || '') : '',
        status: 'EMS Activation Time',
        description: 'Emergency Medical Services activated',
        icon: <LocalShipping />,
        color: '#e91e63',
        recorded: !!stemiCase.rccActivated,
      },
    ];

    phases.push({
      id: 'emergency-department',
      title: 'Emergency Department Phase',
      description: 'Initial assessment and diagnosis',
      color: '#f44336',
      icon: <LocalHospital />,
      events: emergencyEvents,
      completed: emergencyEvents.some(e => e.recorded),
    });

    // Transfer Phase
    const transferEvents: TimelineEvent[] = [
      {
        id: 'patient-transfer',
        timestamp: stemiCase.doorOutTime || '',
        status: 'Patient Transfer',
        description: 'Patient transferred to PCI-capable facility',
        icon: <LocalShipping />,
        color: '#9c27b0',
        recorded: !!stemiCase.doorOutTime,
        target: '30 min',
      },
      {
        id: 'departed-time',
        timestamp: stemiCase.doorOutTime || '',
        status: 'Departed Time',
        description: 'Patient departed from origin hospital',
        icon: <DepartureBoard />,
        color: '#9c27b0',
        recorded: !!stemiCase.doorOutTime,
      },
      {
        id: 'arrival-time-receiving',
        timestamp: stemiCase.cathLabArrivalTime || '',
        status: 'Arrival Time to Receiving Hospital',
        description: 'Patient arrived at receiving hospital',
        icon: <LocalHospital />,
        color: '#9c27b0',
        recorded: !!stemiCase.cathLabArrivalTime,
      },
      {
        id: 'acceptance-confirmation',
        timestamp: stemiCase.cathLabArrivalTime || '',
        status: 'Acceptance Confirmation',
        description: 'Receiving hospital confirmed acceptance',
        icon: <CallMade />,
        color: '#9c27b0',
        recorded: !!stemiCase.cathLabArrivalTime,
        target: '10 min',
      },
    ];

    phases.push({
      id: 'transfer-phase',
      title: 'Transfer Phase',
      description: 'Transfer to PCI-capable facility',
      color: '#9c27b0',
      icon: <LocalShipping />,
      events: transferEvents,
      completed: transferEvents.some(e => e.recorded),
    });

    // PCI Procedure Phase
    const pciEvents: TimelineEvent[] = [
      {
        id: 'cath-lab-activation',
        timestamp: stemiCase.cathLabActivationTime || '',
        status: 'Cath Lab Activation Time',
        description: 'Catheterization laboratory activated',
        icon: <Build />,
        color: '#4caf50',
        recorded: !!stemiCase.cathLabActivationTime,
      },
      {
        id: 'cath-lab-arrival',
        timestamp: stemiCase.cathLabArrivalTime || '',
        status: 'Cath Lab Arrival Time',
        description: 'Patient arrived at catheterization laboratory',
        icon: <LocalHospital />,
        color: '#4caf50',
        recorded: !!stemiCase.cathLabArrivalTime,
      },
      {
        id: 'pci-procedure-start',
        timestamp: stemiCase.pciProcedureStartTime || '',
        status: 'PCI Procedure Start Time',
        description: 'PCI procedure initiated',
        icon: <MedicalServices />,
        color: '#4caf50',
        recorded: !!stemiCase.pciProcedureStartTime,
      },
      {
        id: 'pci-procedure-complete',
        timestamp: stemiCase.pciProcedureCompleteTime || '',
        status: 'PCI Procedure Complete Time',
        description: 'PCI procedure completed',
        icon: <CheckCircleOutline />,
        color: '#4caf50',
        recorded: !!stemiCase.pciProcedureCompleteTime,
      },
    ];

    phases.push({
      id: 'pci-procedure',
      title: 'PCI Procedure Phase',
      description: 'Catheterization lab and intervention',
      color: '#4caf50',
      icon: <MonitorHeart />,
      events: pciEvents,
      completed: pciEvents.some(e => e.recorded),
    });

    // Post-PCI Management Phase
    const postPciEvents: TimelineEvent[] = [
      {
        id: 'post-pci-complications',
        timestamp: stemiCase.outcomeFormCompletionDate || stemiCase.updatedAt || '',
        status: 'Post-PCI Complications',
        description: stemiCase.postPciComplications 
          ? `Complications: ${stemiCase.postPciComplications === 'YES' ? 'Yes' : 'No'}`
          : 'Recovery monitoring and complication assessment',
        icon: <Warning />,
        color: '#ff9800',
        recorded: !!stemiCase.postPciComplications,
      },
      {
        id: 'discharge-status',
        timestamp: stemiCase.dischargeDate || stemiCase.outcomeFormCompletionDate || '',
        status: 'Discharge Status',
        description: stemiCase.dischargeStatus || 'Discharge planning and status',
        icon: <CheckCircle />,
        color: '#ff9800',
        recorded: !!stemiCase.dischargeStatus,
      },
      {
        id: 'discharge-medications',
        timestamp: stemiCase.outcomeFormCompletionDate || stemiCase.updatedAt || '',
        status: 'Discharge Medications',
        description: stemiCase.dischargeMedications || 'Discharge medication planning',
        icon: <Healing />,
        color: '#ff9800',
        recorded: !!stemiCase.dischargeMedications,
      },
      {
        id: 'follow-up-appointment',
        timestamp: stemiCase.followUpAppointmentDate || '',
        status: 'Follow-up Appointment',
        description: stemiCase.followUpAppointmentProvider 
          ? `Follow-up with ${stemiCase.followUpAppointmentProvider}`
          : 'Follow-up appointment scheduling',
        icon: <Assignment />,
        color: '#ff9800',
        recorded: !!stemiCase.followUpAppointmentDate,
      },
    ];

    phases.push({
      id: 'post-pci-management',
      title: 'Post-PCI Management Phase',
      description: 'Recovery monitoring, complication assessment, and discharge planning',
      color: '#ff9800',
      icon: <Healing />,
      events: postPciEvents,
      completed: postPciEvents.some(e => e.recorded),
    });

    return phases;
  };

  const timelinePhases = createTimelinePhases();

  /**
   * Exports timeline phases and events to Excel file
   * Uses timelinePhases as the single source of truth
   */
  const handleExportToExcel = async () => {
    // Flatten phases and events for Excel export
    const exportData: Array<{
      'Phase Name': string;
      'Phase Description': string;
      'Event Status': string;
      'Event Description': string;
      'Timestamp': string;
      'Target': string;
      'Recorded': string;
    }> = [];

    timelinePhases.forEach((phase) => {
      phase.events.forEach((event) => {
        // Format timestamp as displayed in UI
        const formattedTimestamp = event.recorded && event.timestamp
          ? StemiDatetimeService.formatForDisplay(event.timestamp)
          : 'Time not recorded';

        exportData.push({
          'Phase Name': phase.title,
          'Phase Description': phase.description,
          'Event Status': event.status,
          'Event Description': event.description,
          'Timestamp': formattedTimestamp,
          'Target': event.target || '',
          'Recorded': event.recorded ? 'Yes' : 'No',
        });
      });
    });

    // Prepare patient data
    const patientName = stemiCase.patient 
      ? `${stemiCase.patient.firstName || ''} ${stemiCase.patient.lastName || ''}`.trim() 
      : '';
    const patientNationalId = stemiCase.patient?.nationalId || '';
    const patientAge = stemiCase.patient?.age ? `${stemiCase.patient.age} years` : '';
    const patientGender = stemiCase.patient?.gender || '';

    // Prepare user metadata
    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '' : '';
    const userRole = user?.role || '';
    const userHospital = user?.hospital?.name || '';

    // Create combined data with patient info, user metadata, and timeline data
    const combinedData: Array<Record<string, any>> = [
      // Patient Information Section (highlighted)
      { 'Phase Name': 'PATIENT INFORMATION', 'Phase Description': '', 'Event Status': '', 'Event Description': '', 'Timestamp': '', 'Target': '', 'Recorded': '' },
      { 'Phase Name': 'Patient Name', 'Phase Description': patientName, 'Event Status': '', 'Event Description': '', 'Timestamp': '', 'Target': '', 'Recorded': '' },
      { 'Phase Name': 'National ID', 'Phase Description': patientNationalId, 'Event Status': '', 'Event Description': '', 'Timestamp': '', 'Target': '', 'Recorded': '' },
      { 'Phase Name': 'Age', 'Phase Description': patientAge, 'Event Status': '', 'Event Description': '', 'Timestamp': '', 'Target': '', 'Recorded': '' },
      { 'Phase Name': 'Gender', 'Phase Description': patientGender, 'Event Status': '', 'Event Description': '', 'Timestamp': '', 'Target': '', 'Recorded': '' },
      // Empty row separator
      { 'Phase Name': '', 'Phase Description': '', 'Event Status': '', 'Event Description': '', 'Timestamp': '', 'Target': '', 'Recorded': '' },
      // User Metadata Section
      { 'Phase Name': 'User Information', 'Phase Description': '', 'Event Status': '', 'Event Description': '', 'Timestamp': '', 'Target': '', 'Recorded': '' },
      { 'Phase Name': 'User Name', 'Phase Description': userName, 'Event Status': '', 'Event Description': '', 'Timestamp': '', 'Target': '', 'Recorded': '' },
      { 'Phase Name': 'User Role', 'Phase Description': userRole, 'Event Status': '', 'Event Description': '', 'Timestamp': '', 'Target': '', 'Recorded': '' },
      { 'Phase Name': 'Organization / Hospital', 'Phase Description': userHospital, 'Event Status': '', 'Event Description': '', 'Timestamp': '', 'Target': '', 'Recorded': '' },
      // Empty row separator
      { 'Phase Name': '', 'Phase Description': '', 'Event Status': '', 'Event Description': '', 'Timestamp': '', 'Target': '', 'Recorded': '' },
      // Timeline Data Header
      { 'Phase Name': 'TIMELINE DATA', 'Phase Description': '', 'Event Status': '', 'Event Description': '', 'Timestamp': '', 'Target': '', 'Recorded': '' },
      // Timeline data rows
      ...exportData,
    ];

    // Create workbook and worksheet using ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Timeline Data');

    // Define column headers
    const headers = ['Phase Name', 'Phase Description', 'Event Status', 'Event Description', 'Timestamp', 'Target', 'Recorded'];
    
    // Add header row with styling
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 25; // Increased header row height
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4caf50' } // Green background for STEMI
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Find where actual timeline data starts (after "TIMELINE DATA" header row)
    const timelineDataHeaderIndex = combinedData.findIndex(row => row['Phase Name'] === 'TIMELINE DATA');
    const actualDataStartIndex = timelineDataHeaderIndex + 1;

    // Add all data rows
    combinedData.forEach((rowData, index) => {
      const row = worksheet.addRow([
        rowData['Phase Name'],
        rowData['Phase Description'],
        rowData['Event Status'],
        rowData['Event Description'],
        rowData['Timestamp'],
        rowData['Target'],
        rowData['Recorded']
      ]);

      // Apply alternating row colors only to actual timeline data rows (skip metadata rows)
      if (index >= actualDataStartIndex) {
        const dataRowIndex = index - actualDataStartIndex;
        const isEvenRow = dataRowIndex % 2 === 0;
        row.eachCell((cell) => {
          if (isEvenRow) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF5F5F5' } // Light gray for even rows
            };
          } else {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFFFF' } // White for odd rows
            };
          }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        });
      } else {
        // Style metadata rows (patient info, user info, etc.) - no alternating colors
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        });
      }
    });

    // Auto-size columns
    worksheet.columns.forEach((column, index) => {
      const columnData = combinedData.map(row => {
        const keys = ['Phase Name', 'Phase Description', 'Event Status', 'Event Description', 'Timestamp', 'Target', 'Recorded'];
        return String(row[keys[index]] || '');
      });
      const maxLength = Math.max(
        headers[index].length,
        ...columnData.map(val => val.length)
      );
      column.width = Math.max(15, Math.min(maxLength + 2, 50));
    });

    // Generate filename with case ID or current date
    const caseId = stemiCase.id ? stemiCase.id.slice(-8).toUpperCase() : '';
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const filename = caseId 
      ? `STEMI_Timeline_${caseId}.xlsx`
      : `STEMI_Timeline_${currentDate}.xlsx`;

    // Write file and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getKpiStatus = (minutes: number, target: number): { status: 'success' | 'warning' | 'error'; color: string } => {
    if (minutes <= target) {
      return { status: 'success', color: '#4caf50' };
    } else if (minutes <= target * 1.2) {
      return { status: 'warning', color: '#ff9800' };
    } else {
      return { status: 'error', color: '#f44336' };
    }
  };

  /**
   * Exports timeline view as PNG image with patient information
   */
  const handleExportToPNG = async () => {
    if (!timelineRef.current) return;
    
    try {
      // Prepare patient data
      const patientName = stemiCase.patient 
        ? `${stemiCase.patient.firstName || ''} ${stemiCase.patient.lastName || ''}`.trim() 
        : 'N/A';
      const patientNationalId = stemiCase.patient?.nationalId || 'N/A';

      // Create a temporary wrapper element with patient info
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'background: white; padding: 20px; font-family: Arial, sans-serif;';
      
      // Create patient info section
      const patientInfo = document.createElement('div');
      patientInfo.style.cssText = 'margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px;';
      
      const title = document.createElement('h3');
      title.textContent = 'Patient Information';
      title.style.cssText = 'margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #333;';
      
      const nameLabel = document.createElement('div');
      nameLabel.style.cssText = 'margin-bottom: 5px; font-size: 14px;';
      nameLabel.innerHTML = `<strong>Patient Name:</strong> ${patientName}`;
      
      const idLabel = document.createElement('div');
      idLabel.style.cssText = 'font-size: 14px;';
      idLabel.innerHTML = `<strong>National ID:</strong> ${patientNationalId}`;
      
      patientInfo.appendChild(title);
      patientInfo.appendChild(nameLabel);
      patientInfo.appendChild(idLabel);
      
      // Clone the timeline content
      const timelineClone = timelineRef.current.cloneNode(true) as HTMLElement;
      
      // Remove export buttons from the clone
      // Find all buttons in the clone
      const buttons = timelineClone.querySelectorAll('button');
      
      buttons.forEach((button) => {
        const buttonText = button.textContent || '';
        // Check if it's an export button
        if (buttonText.includes('Export as PNG') || buttonText.includes('Export to Excel')) {
          // Find the parent container (the Box with flex gap that contains the buttons)
          let parent: HTMLElement | null = button.parentElement;
          while (parent && parent !== timelineClone) {
            // Check if this parent contains multiple buttons (the button container)
            const siblingButtons = parent.querySelectorAll('button');
            if (siblingButtons.length >= 2) {
              // This is the button container, remove it
              parent.remove();
              break;
            }
            parent = parent.parentElement;
          }
        }
      });
      
      // Append to wrapper
      wrapper.appendChild(patientInfo);
      wrapper.appendChild(timelineClone);
      
      // Temporarily add to document for capture
      wrapper.style.position = 'absolute';
      wrapper.style.left = '-9999px';
      document.body.appendChild(wrapper);
      
      // Capture the wrapper
      const canvas = await html2canvas(wrapper, {
        background: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      
      // Clean up
      document.body.removeChild(wrapper);
      
      const link = document.createElement('a');
      const caseId = stemiCase.id ? stemiCase.id.slice(-8).toUpperCase() : '';
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = caseId 
        ? `STEMI_Timeline_${caseId}.png`
        : `STEMI_Timeline_${currentDate}.png`;
      
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error exporting to PNG:', error);
    }
  };

  return (
    <Box ref={timelineRef}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" gutterBottom>
          STEMI Timeline
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ImageIcon />}
            onClick={handleExportToPNG}
            sx={{
              borderColor: '#4caf50',
              color: '#4caf50',
              '&:hover': {
                borderColor: '#45a049',
                backgroundColor: '#f1f8f4',
              },
            }}
          >
            Export as PNG
          </Button>
          <Button
            variant="contained"
            startIcon={<FileDownload />}
            onClick={handleExportToExcel}
            sx={{
              backgroundColor: '#4caf50',
              '&:hover': {
                backgroundColor: '#45a049',
              },
            }}
          >
            Export to Excel
          </Button>
        </Box>
      </Box>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Critical timestamps and KPI performance for this case
      </Typography>

      {/* KPI Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        {/* Door to ECG KPI */}
        {(stemiCase.doorToEcgMinutes !== null && stemiCase.doorToEcgMinutes !== undefined) && (
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Door to ECG
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  {stemiCase.doorToEcgMinutes} min
                </Typography>
                <Chip
                  label="≤10 min"
                  size="small"
                  color={getKpiStatus(stemiCase.doorToEcgMinutes, 10).status}
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Door to Balloon KPI */}
        {(stemiCase.doorToBalloonMinutes !== null && stemiCase.doorToBalloonMinutes !== undefined) && (
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Door to Balloon
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  {stemiCase.doorToBalloonMinutes} min
                </Typography>
                <Chip
                  label={stemiCase.destinationHospital ? "≤120 min" : "≤90 min"}
                  size="small"
                  color={stemiCase.destinationHospital ? getKpiStatus(stemiCase.doorToBalloonMinutes, 120).status : getKpiStatus(stemiCase.doorToBalloonMinutes, 90).status}
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Door to Needle KPI */}
        {(stemiCase.doorToNeedleMinutes !== null && stemiCase.doorToNeedleMinutes !== undefined) && (
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Door to Needle
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  {stemiCase.doorToNeedleMinutes} min
                </Typography>
                <Chip
                  label="≤30 min"
                  size="small"
                  color={getKpiStatus(stemiCase.doorToNeedleMinutes, 30).status}
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Door In Door Out KPI */}
        {(stemiCase.doorInDoorOutMinutes !== null && stemiCase.doorInDoorOutMinutes !== undefined) && (
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Door In Door Out
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  {stemiCase.doorInDoorOutMinutes} min
                </Typography>
                <Chip
                  label="≤30 min"
                  size="small"
                  color={getKpiStatus(stemiCase.doorInDoorOutMinutes, 30).status}
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* RCC Activation KPI - only for transfer cases */}
        {(stemiCase.caseType === 'TRANSFER' && stemiCase.rccActivationToDoorOutMinutes !== null && stemiCase.rccActivationToDoorOutMinutes !== undefined) && (
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                RCC Activation
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  {stemiCase.rccActivationToDoorOutMinutes} min
                </Typography>
                <Chip
                  label="≤15 min"
                  size="small"
                  color={getKpiStatus(stemiCase.rccActivationToDoorOutMinutes, 15).status}
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Cath Lab Activation to Arrival KPI */}
        {(stemiCase.cathLabActivationTime && stemiCase.cathLabArrivalTime) && (
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Cath Lab Activation to Departure
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  {Math.round((new Date(stemiCase.cathLabArrivalTime).getTime() - new Date(stemiCase.cathLabActivationTime).getTime()) / (1000 * 60))} min
                </Typography>
                <Chip
                  label="≤15 min"
                  size="small"
                  color={getKpiStatus(Math.round((new Date(stemiCase.cathLabArrivalTime).getTime() - new Date(stemiCase.cathLabActivationTime).getTime()) / (1000 * 60)), 15).status}
                />
              </Box>
            </CardContent>
          </Card>
        )}    

        {/* Outcome Form Completion */}
        {stemiCase.outcomeFormCompleted && (
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Outcome Form
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  {stemiCase.outcomePercentageCompleteness || 0}%
                </Typography>
                <Chip
                  label="Completed"
                  size="small"
                  color={(stemiCase.outcomePercentageCompleteness ?? 0) >= 80 ? 'success' : (stemiCase.outcomePercentageCompleteness ?? 0) >= 50 ? 'warning' : 'error'}
                />
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Phase-based Timeline */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {timelinePhases.map((phase) => (
          <Card 
            key={phase.id}
            sx={{ 
              border: `2px solid ${phase.completed ? phase.color : '#e0e0e0'}`,
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
              }
            }}
          >
            <CardContent>
              {/* Phase Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: phase.completed ? phase.color : '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    transition: 'all 0.3s ease-in-out',
                    animation: phase.completed ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.05)' },
                      '100%': { transform: 'scale(1)' },
                    },
                  }}
                >
                  {phase.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: phase.completed ? phase.color : '#757575',
                      fontWeight: 600,
                      transition: 'color 0.3s ease-in-out',
                    }}
                  >
                    {phase.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: phase.completed ? phase.color : '#9e9e9e',
                      transition: 'color 0.3s ease-in-out',
                    }}
                  >
                    {phase.description}
                  </Typography>
                </Box>
                {phase.completed && (
                  <Chip
                    label="Active"
                    size="small"
                    sx={{
                      backgroundColor: phase.color,
                      color: 'white',
                      fontWeight: 600,
                      animation: 'fadeIn 0.5s ease-in-out',
                      '@keyframes fadeIn': {
                        '0%': { opacity: 0, transform: 'scale(0.8)' },
                        '100%': { opacity: 1, transform: 'scale(1)' },
                      },
                    }}
                  />
                )}
              </Box>

              {/* Phase Events */}
              <Box>
                {phase.events.map((event, eventIndex) => (
                  <Box key={event.id}>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        py: 2,
                        opacity: event.recorded ? 1 : 0.5,
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': event.recorded ? {
                          backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          borderRadius: 1,
                        } : {},
                      }}
                    >
                      {/* Event Icon */}
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: event.recorded ? event.color : '#e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          transition: 'all 0.3s ease-in-out',
                          animation: event.recorded ? 'glow 2s infinite' : 'none',
                          '@keyframes glow': {
                            '0%': { boxShadow: `0 0 0 0 ${event.color}40` },
                            '70%': { boxShadow: `0 0 0 10px ${event.color}00` },
                            '100%': { boxShadow: `0 0 0 0 ${event.color}00` },
                          },
                        }}
                      >
                        {event.icon}
                      </Box>

                      {/* Event Details */}
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 600,
                              color: event.recorded ? event.color : '#9e9e9e',
                              transition: 'color 0.3s ease-in-out',
                            }}
                          >
                            {event.status}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {event.target && (
                              <Chip
                                label={`Target: ${event.target}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: event.recorded ? event.color : '#e0e0e0',
                                  color: event.recorded ? event.color : '#9e9e9e',
                                  fontSize: '0.75rem',
                                }}
                              />
                            )}
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: event.recorded ? 'text.secondary' : '#9e9e9e',
                                transition: 'color 0.3s ease-in-out',
                              }}
                            >
                              {event.recorded && event.timestamp 
                                ? StemiDatetimeService.formatForDisplay(event.timestamp)
                                : 'Time not recorded'
                              }
                            </Typography>
                          </Box>
                        </Box>

                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: event.recorded ? 'text.primary' : '#9e9e9e',
                            transition: 'color 0.3s ease-in-out',
                          }}
                        >
                          {event.description}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Event Separator */}
                    {eventIndex < phase.events.length - 1 && (
                      <Box
                        sx={{
                          height: 2,
                          backgroundColor: '#f5f5f5',
                          borderRadius: 1,
                          mx: 6,
                          transition: 'background-color 0.3s ease-in-out',
                        }}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default StemiTimelineView;
