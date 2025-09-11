import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class StrokeExportService {
  constructor(private prisma: PrismaService) {}

  async exportStrokeCasesToExcel() {
    try {
      // Fetch all stroke cases with related data
      const strokeCases = await this.prisma.strokeCase.findMany({
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true,
              mrn: true,
              age: true,
              gender: true,
              phoneNumber: true,
              email: true,
              address: true,
              emergencyContact: true,
              emergencyPhone: true,
              medicalHistory: true,
              allergies: true,
              medications: true,
              bloodType: true,
              rhFactor: true,
            },
          },
          originHospital: {
            select: {
              id: true,
              name: true,
              cluster: true,
              hasStrokeUnit: true,
              hasThrombolysis: true,
              hasThrombectomy: true,
            },
          },
          destinationHospital: {
            select: {
              id: true,
              name: true,
              cluster: true,
              hasStrokeUnit: true,
              hasThrombolysis: true,
              hasThrombectomy: true,
            },
          },
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              pathway: true,
              status: true,
              priority: true,
              chiefComplaint: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transform data for Excel export
      const exportData = strokeCases.map((case_, index) => {
        const patient = case_.patient;
        const originHospital = case_.originHospital;
        const destinationHospital = case_.destinationHospital;
        const ticket = case_.ticket;

        // Get patient age
        const age = patient.age;

        // Calculate time metrics
        const symptomOnsetTime = case_.symptomOnset ? new Date(case_.symptomOnset) : null;
        const lastKnownWellTime = case_.lastKnownWell ? new Date(case_.lastKnownWell) : null;
        const pathwayStartedTime = case_.pathwayStarted ? new Date(case_.pathwayStarted) : null;
        const pathwayCompletedTime = case_.pathwayCompleted ? new Date(case_.pathwayCompleted) : null;
        const strokeUnitAdmissionTime = case_.strokeUnitAdmissionTime ? new Date(case_.strokeUnitAdmissionTime) : null;

        // Calculate pathway duration
        const pathwayDurationMinutes = pathwayStartedTime && pathwayCompletedTime
          ? Math.floor((pathwayCompletedTime.getTime() - pathwayStartedTime.getTime()) / (1000 * 60))
          : null;

        // Calculate symptom to hospital time
        const symptomToHospitalTime = case_.symptomToHospitalMinutes || null;

        // Calculate door-to-treatment times
        const doorToImagingTime = case_.doorToImagingMinutes || null;
        const doorToNeedleTime = case_.doorToNeedleMinutes || null;
        const doorToGroinTime = case_.doorToGroinMinutes || null;

        // Calculate symptom-to-treatment times
        const symptomToNeedleTime = case_.symptomNeedleMinutes || null;
        const symptomToGroinTime = case_.symptomGroinMinutes || null;

        // Calculate imaging-to-treatment times
        const imagingToNeedleTime = case_.imagingToNeedleMinutes || null;
        const imagingToGroinTime = case_.imagingToGroinMinutes || null;

        // Calculate rehabilitation times
        const dysphagiaScreeningTime = case_.dysphagiaScreeningMinutes || null;
        const earlyMobilizationTime = case_.earlyMobilizationHours || null;
        const speechTherapyTime = case_.speechTherapyHours || null;
        const physiotherapyTime = case_.physiotherapyHours || null;
        const occupationalTherapyTime = case_.occupationalTherapyHours || null;

        // Calculate NIHSS improvement
        const nihssImprovement = case_.nihssBaseline && case_.nihssDischarge
          ? case_.nihssBaseline - case_.nihssDischarge
          : null;

        // Calculate mRS improvement
        const mrsImprovement = case_.mrsBaseline && case_.mrs90day
          ? case_.mrsBaseline - case_.mrs90day
          : null;

        // Calculate Barthel improvement
        const barthelImprovement = case_.barthelBaseline && case_.barthelDischarge
          ? case_.barthelDischarge - case_.barthelBaseline
          : null;

        // Determine treatment eligibility
        const thrombolysisEligible = case_.eligibleForThrombolysis ? 'Yes' : 'No';
        const thrombectomyEligible = case_.eligibleForThrombectomy ? 'Yes' : 'No';

        // Determine wake-up stroke
        const wakeUpStroke = case_.wakeUpStroke ? 'Yes' : 'No';

        // Format dates
        const formatDate = (date: Date | null) => {
          if (!date) return '';
          return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
          });
        };

        const formatDateTime = (date: Date | null) => {
          if (!date) return '';
          return date.toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        };

        return {
          'Case #': index + 1,
          'Patient ID': patient.id,
          'MRN': patient.mrn,
          'National ID': patient.nationalId,
          'Patient Name': `${patient.firstName} ${patient.lastName}`,
          'Age': age,
          'Gender': patient.gender,
          'Phone Number': patient.phoneNumber,
          'Email': patient.email,
          'Address': patient.address,
          'Emergency Contact': patient.emergencyContact,
          'Emergency Phone': patient.emergencyPhone,
          'Medical History': patient.medicalHistory,
          'Allergies': patient.allergies,
          'Medications': patient.medications,
          'Blood Type': patient.bloodType,
          'RH Factor': patient.rhFactor,
          'Ticket Number': ticket?.ticketNumber || 'N/A',
          'Ticket Status': ticket?.status || 'N/A',
          'Ticket Priority': ticket?.priority || 'N/A',
          'Chief Complaint': ticket?.chiefComplaint || 'N/A',
          'Ticket Created': ticket ? formatDateTime(ticket.createdAt) : 'N/A',
          'Stroke Type': case_.strokeType,
          'Stroke Subtype': case_.strokeSubtype,
          'Stroke Severity': case_.strokeSeverity,
          'Current Status': case_.currentStatus,
          'Selected Treatment': case_.selectedTreatment,
          'Presenting Symptoms': case_.presentingSymptoms,
          'Symptom Onset Date': formatDate(symptomOnsetTime),
          'Symptom Onset Time': symptomOnsetTime ? symptomOnsetTime.toLocaleTimeString('en-US', { hour12: false }) : '',
          'Last Known Well Date': formatDate(lastKnownWellTime),
          'Last Known Well Time': lastKnownWellTime ? lastKnownWellTime.toLocaleTimeString('en-US', { hour12: false }) : '',
          'Wake-up Stroke': wakeUpStroke,
          'Symptom to Hospital Time (min)': symptomToHospitalTime,
          'NIHSS Baseline': case_.nihssBaseline,
          'NIHSS 24hr': case_.nihss24hr,
          'NIHSS Discharge': case_.nihssDischarge,
          'NIHSS Improvement': nihssImprovement,
          'mRS Baseline': case_.mrsBaseline,
          'mRS 90-day': case_.mrs90day,
          'mRS Improvement': mrsImprovement,
          'Barthel Baseline': case_.barthelBaseline,
          'Barthel Discharge': case_.barthelDischarge,
          'Barthel Improvement': barthelImprovement,
          'ASPECTS Score': case_.aspectsScore,
          'GCS Baseline': case_.gcsBaseline,
          'Thrombolysis Eligible': thrombolysisEligible,
          'Thrombolysis Contraindications': case_.thrombolysisContraindications,
          'Thrombectomy Eligible': thrombectomyEligible,
          'Thrombectomy Contraindications': case_.thrombectomyContraindications,
          'Pathway Started Date': formatDate(pathwayStartedTime),
          'Pathway Started Time': pathwayStartedTime ? pathwayStartedTime.toLocaleTimeString('en-US', { hour12: false }) : '',
          'Pathway Completed Date': formatDate(pathwayCompletedTime),
          'Pathway Completed Time': pathwayCompletedTime ? pathwayCompletedTime.toLocaleTimeString('en-US', { hour12: false }) : '',
          'Pathway Duration (min)': pathwayDurationMinutes,
          'Stroke Unit Admission Date': formatDate(strokeUnitAdmissionTime),
          'Stroke Unit Admission Time': strokeUnitAdmissionTime ? strokeUnitAdmissionTime.toLocaleTimeString('en-US', { hour12: false }) : '',
          'Door to Imaging Time (min)': doorToImagingTime,
          'Door to Needle Time (min)': doorToNeedleTime,
          'Door to Groin Time (min)': doorToGroinTime,
          'Symptom to Needle Time (min)': symptomToNeedleTime,
          'Symptom to Groin Time (min)': symptomToGroinTime,
          'Imaging to Needle Time (min)': imagingToNeedleTime,
          'Imaging to Groin Time (min)': imagingToGroinTime,
          'Dysphagia Screening Time (min)': dysphagiaScreeningTime,
          'Early Mobilization Time (hrs)': earlyMobilizationTime,
          'Speech Therapy Time (hrs)': speechTherapyTime,
          'Physiotherapy Time (hrs)': physiotherapyTime,
          'Occupational Therapy Time (hrs)': occupationalTherapyTime,
          'CT Results': case_.ctResults,
          'CTA Results': case_.ctaResults,
          'CTP Results': case_.ctpResults,
          'MRI Results': case_.mriResults,
          'MRA Results': case_.mraResults,
          'Echocardiogram': case_.echocardiogram,
          'Carotid UCS Doppler': case_.carotidUcsDoppler,
          'Origin Hospital': originHospital?.name || '',
          'Origin Hospital Cluster': originHospital?.cluster || '',
          'Origin Hospital Stroke Unit': originHospital?.hasStrokeUnit ? 'Yes' : 'No',
          'Origin Hospital Thrombolysis': originHospital?.hasThrombolysis ? 'Yes' : 'No',
          'Origin Hospital Thrombectomy': originHospital?.hasThrombectomy ? 'Yes' : 'No',
          'Destination Hospital': destinationHospital?.name || '',
          'Destination Hospital Cluster': destinationHospital?.cluster || '',
          'Destination Hospital Stroke Unit': destinationHospital?.hasStrokeUnit ? 'Yes' : 'No',
          'Destination Hospital Thrombolysis': destinationHospital?.hasThrombolysis ? 'Yes' : 'No',
          'Destination Hospital Thrombectomy': destinationHospital?.hasThrombectomy ? 'Yes' : 'No',
          'Case Created': formatDateTime(case_.createdAt),
          'Case Updated': formatDateTime(case_.updatedAt),
        };
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 8 },   // Case #
        { wch: 15 },  // Patient ID
        { wch: 20 },  // MRN
        { wch: 20 },  // National ID
        { wch: 25 },  // Patient Name
        { wch: 8 },   // Age
        { wch: 10 },  // Gender
        { wch: 15 },  // Phone Number
        { wch: 25 },  // Email
        { wch: 30 },  // Address
        { wch: 20 },  // Emergency Contact
        { wch: 15 },  // Emergency Phone
        { wch: 30 },  // Medical History
        { wch: 20 },  // Allergies
        { wch: 30 },  // Medications
        { wch: 10 },  // Blood Type
        { wch: 10 },  // RH Factor
        { wch: 20 },  // Ticket Number
        { wch: 15 },  // Ticket Status
        { wch: 12 },  // Ticket Priority
        { wch: 30 },  // Chief Complaint
        { wch: 20 },  // Ticket Created
        { wch: 15 },  // Stroke Type
        { wch: 20 },  // Stroke Subtype
        { wch: 15 },  // Stroke Severity
        { wch: 20 },  // Current Status
        { wch: 20 },  // Selected Treatment
        { wch: 40 },  // Presenting Symptoms
        { wch: 15 },  // Symptom Onset Date
        { wch: 15 },  // Symptom Onset Time
        { wch: 15 },  // Last Known Well Date
        { wch: 15 },  // Last Known Well Time
        { wch: 12 },  // Wake-up Stroke
        { wch: 20 },  // Symptom to Hospital Time
        { wch: 15 },  // NIHSS Baseline
        { wch: 12 },  // NIHSS 24hr
        { wch: 15 },  // NIHSS Discharge
        { wch: 15 },  // NIHSS Improvement
        { wch: 12 },  // mRS Baseline
        { wch: 12 },  // mRS 90-day
        { wch: 15 },  // mRS Improvement
        { wch: 15 },  // Barthel Baseline
        { wch: 15 },  // Barthel Discharge
        { wch: 15 },  // Barthel Improvement
        { wch: 12 },  // ASPECTS Score
        { wch: 12 },  // GCS Baseline
        { wch: 18 },  // Thrombolysis Eligible
        { wch: 30 },  // Thrombolysis Contraindications
        { wch: 18 },  // Thrombectomy Eligible
        { wch: 30 },  // Thrombectomy Contraindications
        { wch: 15 },  // Pathway Started Date
        { wch: 15 },  // Pathway Started Time
        { wch: 15 },  // Pathway Completed Date
        { wch: 15 },  // Pathway Completed Time
        { wch: 18 },  // Pathway Duration
        { wch: 20 },  // Stroke Unit Admission Date
        { wch: 20 },  // Stroke Unit Admission Time
        { wch: 20 },  // Door to Imaging Time
        { wch: 18 },  // Door to Needle Time
        { wch: 18 },  // Door to Groin Time
        { wch: 20 },  // Symptom to Needle Time
        { wch: 20 },  // Symptom to Groin Time
        { wch: 20 },  // Imaging to Needle Time
        { wch: 20 },  // Imaging to Groin Time
        { wch: 20 },  // Dysphagia Screening Time
        { wch: 20 },  // Early Mobilization Time
        { wch: 18 },  // Speech Therapy Time
        { wch: 18 },  // Physiotherapy Time
        { wch: 20 },  // Occupational Therapy Time
        { wch: 30 },  // CT Results
        { wch: 30 },  // CTA Results
        { wch: 30 },  // CTP Results
        { wch: 30 },  // MRI Results
        { wch: 30 },  // MRA Results
        { wch: 30 },  // Echocardiogram
        { wch: 30 },  // Carotid UCS Doppler
        { wch: 25 },  // Origin Hospital
        { wch: 20 },  // Origin Hospital Cluster
        { wch: 20 },  // Origin Hospital Stroke Unit
        { wch: 20 },  // Origin Hospital Thrombolysis
        { wch: 20 },  // Origin Hospital Thrombectomy
        { wch: 25 },  // Destination Hospital
        { wch: 20 },  // Destination Hospital Cluster
        { wch: 20 },  // Destination Hospital Stroke Unit
        { wch: 20 },  // Destination Hospital Thrombolysis
        { wch: 20 },  // Destination Hospital Thrombectomy
        { wch: 20 },  // Case Created
        { wch: 20 },  // Case Updated
      ];

      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Stroke Cases');

      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return {
        buffer: excelBuffer,
        filename: `stroke-cases-export-${new Date().toISOString().split('T')[0]}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };

    } catch (error) {
      console.error('Error exporting stroke cases:', error);
      throw new Error('Failed to export stroke cases to Excel');
    }
  }
}
