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
  Assignment,
  EventAvailable,
  LocalShipping,
  Healing,
  DepartureBoard,
  CallMade,
  CheckCircleOutline,
  Accessibility,
  Psychology,
  Medication,
  Assessment,
  Scanner,
  FileDownload,
  Image as ImageIcon,
} from '@mui/icons-material';
import * as ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';
import { StrokeCase } from '../../../services/strokeService';
import { useAuth } from '../../../contexts/AuthContext';

interface StrokeTimelineViewProps {
  strokeCase: StrokeCase;
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

const StrokeTimelineView: React.FC<StrokeTimelineViewProps> = ({ strokeCase }) => {
  const { user } = useAuth();
  const timelineRef = React.useRef<HTMLDivElement>(null);

  const createTimelinePhases = (): TimelinePhase[] => {
    const phases: TimelinePhase[] = [];

    // Emergency Department Phase
    const emergencyEvents: TimelineEvent[] = [
      {
        id: 'date-of-admission',
        timestamp: strokeCase.dateOfAdmission || '',
        status: 'Date of Admission',
        description: 'Patient admission to emergency department',
        icon: <EventAvailable />,
        color: '#2196f3',
        recorded: !!strokeCase.dateOfAdmission,
      },
      {
        id: 'triage-time',
        timestamp: strokeCase.timeOfTriage || '',
        status: 'Triage Time',
        description: 'Patient triaged and assessed',
        icon: <MedicalServices />,
        color: '#9c27b0',
        recorded: !!strokeCase.timeOfTriage,
        target: '10 min',
      },
      {
        id: 'physician-assessment',
        timestamp: strokeCase.timeOfPhysicianAssessment || '',
        status: 'Physician Assessment',
        description: 'Initial physician assessment completed',
        icon: <LocalHospital />,
        color: '#4caf50',
        recorded: !!strokeCase.timeOfPhysicianAssessment,
        target: '15 min',
      },
      {
        id: 'swallowing-screening',
        timestamp: strokeCase.timeOfSwallowingScreening || '',
        status: 'Swallowing Screening',
        description: strokeCase.swallowingScreeningResult 
          ? `Swallowing screening completed - Result: ${strokeCase.swallowingScreeningResult}`
          : 'Swallowing screening assessment',
        icon: <Assessment />,
        color: '#ff9800',
        recorded: !!strokeCase.timeOfSwallowingScreening,
        target: '4 hours',
      },
    ];

    phases.push({
      id: 'emergency-department',
      title: 'Emergency Department Phase',
      description: 'Initial assessment and triage',
      color: '#f44336',
      icon: <LocalHospital />,
      events: emergencyEvents,
      completed: emergencyEvents.some(e => e.recorded),
    });

    // Diagnostic Phase
    const diagnosticEvents: TimelineEvent[] = [
      {
        id: 'ct-scan-start',
        timestamp: strokeCase.timeOfCtScanStart || '',
        status: 'CT Scan Start',
        description: 'CT scan initiated for stroke diagnosis',
        icon: <Scanner />,
        color: '#9c27b0',
        recorded: !!strokeCase.timeOfCtScanStart,
        target: '20 min',
      },
      {
        id: 'ct-report-final',
        timestamp: strokeCase.timeOfCtReportFinal || '',
        status: 'CT Report Final',
        description: strokeCase.ctFindings 
          ? `CT scan completed - Findings: ${strokeCase.ctFindings}`
          : 'CT scan report finalized',
        icon: <CheckCircleOutline />,
        color: '#9c27b0',
        recorded: !!strokeCase.timeOfCtReportFinal,
        target: '30 min',
      },
    ];

    phases.push({
      id: 'diagnostic-phase',
      title: 'Diagnostic Phase',
      description: 'Imaging and diagnostic procedures',
      color: '#9c27b0',
      icon: <Scanner />,
      events: diagnosticEvents,
      completed: diagnosticEvents.some(e => e.recorded),
    });

    // Treatment Phase
    const treatmentEvents: TimelineEvent[] = [
      {
        id: 'thrombolysis-order',
        timestamp: strokeCase.thrombolysisOrderTime || '',
        status: 'Thrombolysis Order',
        description: strokeCase.candidateForIVThrombolysis === 'YES' 
          ? 'IV thrombolysis ordered for eligible patient'
          : 'Thrombolysis treatment planning',
        icon: <Medication />,
        color: '#4caf50',
        recorded: !!strokeCase.thrombolysisOrderTime,
        target: '60 min',
      },
      {
        id: 'iv-thrombolysis-admin',
        timestamp: strokeCase.ivThrombolysisAdministrationTime || '',
        status: 'IV Thrombolysis Administration',
        description: strokeCase.ivThrombolysisGiven === 'YES'
          ? 'IV thrombolysis successfully administered'
          : strokeCase.reasonForNotAdministeringIV 
            ? `IV thrombolysis not given - ${strokeCase.reasonForNotAdministeringIV}`
            : 'IV thrombolysis administration',
        icon: <Healing />,
        color: '#4caf50',
        recorded: !!strokeCase.ivThrombolysisAdministrationTime,
        target: '60 min',
      },
      {
        id: 'mechanical-thrombectomy-puncture',
        timestamp: strokeCase.timeOfMechanicalThrombectomyPuncture || '',
        status: 'Mechanical Thrombectomy Puncture',
        description: strokeCase.candidateForMechanicalThrombectomy === 'YES'
          ? 'Mechanical thrombectomy procedure initiated'
          : 'Mechanical thrombectomy procedure planning',
        icon: <Build />,
        color: '#4caf50',
        recorded: !!strokeCase.timeOfMechanicalThrombectomyPuncture,
        target: '120 min',
      },
      {
        id: 'thrombectomy-complete',
        timestamp: strokeCase.timeOfThrombectomyComplete || '',
        status: 'Thrombectomy Complete',
        description: strokeCase.mechanicalThrombectomyPerformed === true
          ? 'Mechanical thrombectomy procedure completed'
          : 'Thrombectomy procedure completion',
        icon: <CheckCircle />,
        color: '#4caf50',
        recorded: !!strokeCase.timeOfThrombectomyComplete,
      },
    ];

    phases.push({
      id: 'treatment-phase',
      title: 'Treatment Phase',
      description: 'Acute stroke treatment and interventions',
      color: '#4caf50',
      icon: <Healing />,
      events: treatmentEvents,
      completed: treatmentEvents.some(e => e.recorded),
    });

    // Transfer Phase (if applicable)
    if (strokeCase.transferToAnotherHospital) {
      const transferEvents: TimelineEvent[] = [
        {
          id: 'transfer-activation',
          timestamp: strokeCase.timeOfTransferActivation || '',
          status: 'Transfer Activation',
          description: 'Patient transfer to another hospital activated',
          icon: <LocalShipping />,
          color: '#ff5722',
          recorded: !!strokeCase.timeOfTransferActivation,
        },
        {
          id: 'transfer-departure',
          timestamp: strokeCase.timeOfTransferDeparture || '',
          status: 'Transfer Departure',
          description: 'Patient departed for receiving hospital',
          icon: <DepartureBoard />,
          color: '#ff5722',
          recorded: !!strokeCase.timeOfTransferDeparture,
          target: strokeCase.facilityHasCt ? '40 min' : '20 min',
        },
      ];

      phases.push({
        id: 'transfer-phase',
        title: 'Transfer Phase',
        description: 'Transfer to receiving hospital',
        color: '#ff5722',
        icon: <LocalShipping />,
        events: transferEvents,
        completed: transferEvents.some(e => e.recorded),
      });
    }

    // Post-Treatment Management Phase
    const postTreatmentEvents: TimelineEvent[] = [
      {
        id: 'stroke-unit-admission',
        timestamp: strokeCase.admittedToStrokeUnit ? (strokeCase.dateOfAdmission || '') : '',
        status: 'Stroke Unit Admission',
        description: strokeCase.admittedToStrokeUnit
          ? 'Patient admitted to specialized stroke unit'
          : 'Stroke unit admission planning',
        icon: <LocalHospital />,
        color: '#ff9800',
        recorded: !!strokeCase.admittedToStrokeUnit,
        target: '24 hours',
      },
      {
        id: 'disposition',
        timestamp: strokeCase.disposition ? (strokeCase.dateOfAdmission || '') : '',
        status: 'Patient Disposition',
        description: strokeCase.disposition 
          ? `Patient disposition: ${strokeCase.disposition}`
          : 'Patient disposition planning',
        icon: <Assignment />,
        color: '#ff9800',
        recorded: !!strokeCase.disposition,
      },
      {
        id: 'follow-up-contact',
        timestamp: strokeCase.followUpContactAttempted ? (strokeCase.updatedAt || '') : '',
        status: 'Follow-up Contact',
        description: strokeCase.followUpContactAttempted
          ? 'Follow-up contact attempted'
          : 'Follow-up contact planning',
        icon: <CallMade />,
        color: '#ff9800',
        recorded: !!strokeCase.followUpContactAttempted,
      },
      {
        id: 'modified-rankin-scale',
        timestamp: strokeCase.modifiedRankinScaleAt90Days ? (strokeCase.updatedAt || '') : '',
        status: 'Modified Rankin Scale',
        description: strokeCase.modifiedRankinScaleAt90Days
          ? `90-day mRS score: ${strokeCase.modifiedRankinScaleAt90Days}`
          : '90-day Modified Rankin Scale assessment',
        icon: <Accessibility />,
        color: '#ff9800',
        recorded: !!strokeCase.modifiedRankinScaleAt90Days,
      },
    ];

    phases.push({
      id: 'post-treatment-management',
      title: 'Post-Treatment Management Phase',
      description: 'Recovery monitoring and follow-up care',
      color: '#ff9800',
      icon: <Psychology />,
      events: postTreatmentEvents,
      completed: postTreatmentEvents.some(e => e.recorded),
    });

    return phases;
  };

  const timelinePhases = createTimelinePhases();

  const formatDateTime = (timestamp: string): string => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  /**
   * Parses target string (e.g., "10 min", "4 hours") to minutes
   */
  const parseTargetToMinutes = (targetString: string): number | null => {
    if (!targetString) return null;
    
    const normalized = targetString.trim().toLowerCase();
    const match = normalized.match(/(\d+(?:\.\d+)?)\s*(min|mins|minute|minutes|hour|hours|hr|hrs)/);
    
    if (!match) return null;
    
    const value = parseFloat(match[1]);
    const unit = match[2];
    
    if (unit.startsWith('hour') || unit.startsWith('hr')) {
      return value * 60; // Convert hours to minutes
    } else {
      return value; // Already in minutes
    }
  };

  /**
   * Calculates time difference in minutes between two datetime strings
   */
  const calculateTimeDifference = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }
    
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
  };

  /**
   * Validates a timeline event against its KPI target
   * Returns validation status if target exists and both times are available, null otherwise
   */
  const validateEventKpi = (event: TimelineEvent): { met: boolean; actualMinutes: number; targetMinutes: number } | null => {
    // Only validate if target exists
    if (!event.target) return null;
    
    // Need reference time (dateOfAdmission) and event timestamp
    const referenceTime = strokeCase.dateOfAdmission;
    if (!referenceTime || !event.timestamp || !event.recorded) return null;
    
    // Parse target to minutes
    const targetMinutes = parseTargetToMinutes(event.target);
    if (targetMinutes === null) return null;
    
    // Calculate actual time difference in minutes
    const actualMinutes = calculateTimeDifference(referenceTime, event.timestamp);
    
    return {
      met: actualMinutes <= targetMinutes,
      actualMinutes,
      targetMinutes,
    };
  };

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
          ? formatDateTime(event.timestamp)
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
    const patientName = strokeCase.patient 
      ? `${strokeCase.patient.firstName || ''} ${strokeCase.patient.lastName || ''}`.trim() 
      : '';
    const patientNationalId = strokeCase.patient?.nationalId || '';
    const patientAge = strokeCase.patient?.age ? `${strokeCase.patient.age} years` : '';
    const patientGender = strokeCase.patient?.gender || '';

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
        fgColor: { argb: 'FFf44336' } // Red background for Stroke
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
    const caseId = strokeCase.id ? strokeCase.id.slice(-8).toUpperCase() : '';
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const filename = caseId 
      ? `Stroke_Timeline_${caseId}.xlsx`
      : `Stroke_Timeline_${currentDate}.xlsx`;

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

  /**
   * Exports timeline view as PNG image with patient information
   */
  const handleExportToPNG = async () => {
    if (!timelineRef.current) return;
    
    try {
      // Prepare patient data
      const patientName = strokeCase.patient 
        ? `${strokeCase.patient.firstName || ''} ${strokeCase.patient.lastName || ''}`.trim() 
        : 'N/A';
      const patientNationalId = strokeCase.patient?.nationalId || 'N/A';

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
      const caseId = strokeCase.id ? strokeCase.id.slice(-8).toUpperCase() : '';
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = caseId 
        ? `Stroke_Timeline_${caseId}.png`
        : `Stroke_Timeline_${currentDate}.png`;
      
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
          Stroke Timeline
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ImageIcon />}
            onClick={handleExportToPNG}
            sx={{
              borderColor: '#f44336',
              color: '#f44336',
              '&:hover': {
                borderColor: '#d32f2f',
                backgroundColor: '#ffebee',
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
              backgroundColor: '#f44336',
              '&:hover': {
                backgroundColor: '#d32f2f',
              },
            }}
          >
            Export to Excel
          </Button>
        </Box>
      </Box>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Critical timestamps and KPI performance for this stroke case
      </Typography>

      {/* Stroke Type Display */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom align="center">
              Stroke Type
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
              <Typography variant="h6">
                {strokeCase.strokeType || strokeCase.strokeTypeDetailed || 'Unknown'}
              </Typography>
              <Chip
                label="Type"
                size="small"
                color="primary"
              />
            </Box>
          </CardContent>
        </Card>
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
                            {(() => {
                              const validation = validateEventKpi(event);
                              if (validation) {
                                return (
                                  <Chip
                                    label={validation.met ? '✓ Met Target' : '✗ Missed Target'}
                                    size="small"
                                    color={validation.met ? 'success' : 'error'}
                                    sx={{
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                    }}
                                  />
                                );
                              }
                              return null;
                            })()}
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: event.recorded ? 'text.secondary' : '#9e9e9e',
                                transition: 'color 0.3s ease-in-out',
                              }}
                            >
                              {event.recorded && event.timestamp 
                                ? formatDateTime(event.timestamp)
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

export default StrokeTimelineView;