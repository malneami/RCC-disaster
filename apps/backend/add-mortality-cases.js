const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addMortalityCases() {
  console.log('🏥 Adding trauma cases with mortality...');

  try {
    // Get hospitals
    const hospitals = await prisma.hospital.findMany({
      take: 5
    });

    if (hospitals.length < 2) {
      console.log('❌ Need at least 2 hospitals');
      return;
    }

    const originHospital = hospitals[0];
    const destinationHospital = hospitals[1];

    // Mortality cases data
    const mortalityCases = [
      {
        patientInfo: {
          firstName: "Ahmed",
          lastName: "Al-Mansouri",
          nationalId: "9876543210",
          dateOfBirth: "1975-03-15",
          gender: "MALE",
          phoneNumber: "+966501234567",
          address: "Riyadh, Saudi Arabia",
          emergencyContact: "Fatima Al-Mansouri",
          emergencyPhone: "+966509876543",
          medicalHistory: "Hypertension, Diabetes",
          allergies: "Penicillin",
          medications: "Metformin, Lisinopril"
        },
        incidentDetails: {
          chiefComplaint: "Severe head trauma from MVA",
          mechanismOfInjury: "MOTOR_VEHICLE_ACCIDENT",
          modeOfArrival: "AMBULANCE"
        },
        vitalsAssessment: {
          vitalSigns: {
            temperature: 35.2,
            heartRate: 45,
            bloodPressure: "80/50",
            oxygenSaturation: 85,
            respiratoryRate: 8
          },
          glasgowComaScale: 3, // Very low - critical
          systolicBloodPressure: 80,
          respiratoryRate: 8,
          additionalVitalSigns: "Hypotensive, bradycardic"
        },
        injuryAssessment: {
          headAndNeckInjury: "5 - Critical: Severe head trauma with GCS 3",
          faceInjury: "3 - Moderate: Facial fractures",
          chestInjury: "4 - Severe: Multiple rib fractures, pneumothorax",
          abdomenInjury: "3 - Moderate: Internal bleeding",
          extremitiesInjury: "2 - Minor: Fractured femur",
          externalInjury: "4 - Severe: Multiple lacerations"
        },
        disposition: {
          edDisposition: "DEATH",
          additionalNotes: "Patient expired despite aggressive resuscitation efforts",
          disposition: {
            dischargeInstructions: "N/A - Patient deceased",
            followUpRequired: false,
            followUpDate: "",
            medicationsPrescribed: "",
            restrictions: ""
          }
        }
      },
      {
        patientInfo: {
          firstName: "Sara",
          lastName: "Al-Zahra",
          nationalId: "9876543211",
          dateOfBirth: "1988-07-22",
          gender: "FEMALE",
          phoneNumber: "+966502345678",
          address: "Jeddah, Saudi Arabia",
          emergencyContact: "Mohammed Al-Zahra",
          emergencyPhone: "+966510123456",
          medicalHistory: "Asthma",
          allergies: "None known",
          medications: "Albuterol inhaler"
        },
        incidentDetails: {
          chiefComplaint: "Massive internal bleeding from fall",
          mechanismOfInjury: "FALL",
          modeOfArrival: "AMBULANCE"
        },
        vitalsAssessment: {
          vitalSigns: {
            temperature: 36.8,
            heartRate: 120,
            bloodPressure: "60/40",
            oxygenSaturation: 70,
            respiratoryRate: 25
          },
          glasgowComaScale: 6, // Low - critical
          systolicBloodPressure: 60,
          respiratoryRate: 25,
          additionalVitalSigns: "Severely hypotensive, tachycardic"
        },
        injuryAssessment: {
          headAndNeckInjury: "4 - Severe: Subdural hematoma",
          faceInjury: "2 - Minor: Facial abrasions",
          chestInjury: "5 - Critical: Massive hemothorax",
          abdomenInjury: "5 - Critical: Ruptured spleen, liver laceration",
          extremitiesInjury: "3 - Moderate: Pelvic fracture",
          externalInjury: "3 - Moderate: Multiple contusions"
        },
        disposition: {
          edDisposition: "DEATH",
          additionalNotes: "Patient died from massive hemorrhage despite emergency surgery",
          disposition: {
            dischargeInstructions: "N/A - Patient deceased",
            followUpRequired: false,
            followUpDate: "",
            medicationsPrescribed: "",
            restrictions: ""
          }
        }
      },
      {
        patientInfo: {
          firstName: "Omar",
          lastName: "Al-Rashid",
          nationalId: "9876543212",
          dateOfBirth: "1965-11-08",
          gender: "MALE",
          phoneNumber: "+966503456789",
          address: "Dammam, Saudi Arabia",
          emergencyContact: "Aisha Al-Rashid",
          emergencyPhone: "+966511234567",
          medicalHistory: "Heart disease, COPD",
          allergies: "Aspirin",
          medications: "Warfarin, Albuterol"
        },
        incidentDetails: {
          chiefComplaint: "Cardiac arrest following trauma",
          mechanismOfInjury: "MOTOR_VEHICLE_ACCIDENT",
          modeOfArrival: "AMBULANCE"
        },
        vitalsAssessment: {
          vitalSigns: {
            temperature: 34.5,
            heartRate: 0,
            bloodPressure: "0/0",
            oxygenSaturation: 0,
            respiratoryRate: 0
          },
          glasgowComaScale: 3, // Very low - critical
          systolicBloodPressure: 0,
          respiratoryRate: 0,
          additionalVitalSigns: "Cardiac arrest, no pulse"
        },
        injuryAssessment: {
          headAndNeckInjury: "5 - Critical: Severe head trauma",
          faceInjury: "3 - Moderate: Facial fractures",
          chestInjury: "5 - Critical: Cardiac contusion",
          abdomenInjury: "4 - Severe: Internal bleeding",
          extremitiesInjury: "2 - Minor: Fractures",
          externalInjury: "4 - Severe: Multiple injuries"
        },
        disposition: {
          edDisposition: "DEATH",
          additionalNotes: "Patient arrived in cardiac arrest, resuscitation unsuccessful",
          disposition: {
            dischargeInstructions: "N/A - Patient deceased",
            followUpRequired: false,
            followUpDate: "",
            medicationsPrescribed: "",
            restrictions: ""
          }
        }
      }
    ];

    // Generate dates (recent cases)
    const now = new Date();
    const dates = {
      incidentDateTime: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last week
      arrivalDateTime: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 min after incident
      transferRequestDateTime: null,
      transferArrivalDateTime: null
    };

    for (let i = 0; i < mortalityCases.length; i++) {
      const data = mortalityCases[i];
      
      // Create unique patient
      const uniqueNationalId = `${data.patientInfo.nationalId}${i}`;
      const patient = await prisma.patient.upsert({
        where: { nationalId: uniqueNationalId },
        update: {
          firstName: data.patientInfo.firstName,
          lastName: data.patientInfo.lastName,
          dateOfBirth: new Date(data.patientInfo.dateOfBirth),
          gender: data.patientInfo.gender,
          phoneNumber: data.patientInfo.phoneNumber,
          address: data.patientInfo.address,
          emergencyContact: data.patientInfo.emergencyContact,
          emergencyPhone: data.patientInfo.emergencyPhone,
          medicalHistory: data.patientInfo.medicalHistory,
          allergies: data.patientInfo.allergies,
          medications: data.patientInfo.medications,
          updatedAt: new Date(),
        },
        create: {
          firstName: data.patientInfo.firstName,
          lastName: data.patientInfo.lastName,
          nationalId: uniqueNationalId,
          dateOfBirth: new Date(data.patientInfo.dateOfBirth),
          gender: data.patientInfo.gender,
          phoneNumber: data.patientInfo.phoneNumber,
          address: data.patientInfo.address,
          emergencyContact: data.patientInfo.emergencyContact,
          emergencyPhone: data.patientInfo.emergencyPhone,
          medicalHistory: data.patientInfo.medicalHistory,
          allergies: data.patientInfo.allergies,
          medications: data.patientInfo.medications,
          createdById: '069b34bc-26ae-478d-b962-bba99707b50d', // Admin user
        }
      });

      // Create unique ticket
      const uniqueTicketNumber = `TRAUMA-MORTALITY-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;

      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: uniqueTicketNumber,
          patientId: patient.id,
          originHospitalId: originHospital.id,
          destinationHospitalId: destinationHospital.id,
          priority: 'CRITICAL',
          status: 'COMPLETED',
          pathway: 'TRAUMA',
          chiefComplaint: data.incidentDetails.chiefComplaint,
          vitals: JSON.stringify(data.vitalsAssessment.vitalSigns),
          isEmergency: true,
          emergencyType: 'TRAUMA',
          emergencySeverity: 'CRITICAL',
          notes: `Mortality case: ${data.incidentDetails.mechanismOfInjury}`,
          createdById: '069b34bc-26ae-478d-b962-bba99707b50d', // Admin user
          completedAt: new Date(dates.arrivalDateTime),
        }
      });

      // Create trauma case
      const traumaCase = await prisma.traumaCase.create({
        data: {
          ticketId: ticket.id,
          patientId: patient.id,
          originHospitalId: originHospital.id,
          destinationHospitalId: destinationHospital.id,
          arrivalDateTime: new Date(dates.arrivalDateTime),
          incidentDateTime: new Date(dates.incidentDateTime),
          modeOfArrival: data.incidentDetails.modeOfArrival,
          transferRequestDateTime: dates.transferRequestDateTime ? new Date(dates.transferRequestDateTime) : null,
          transferArrivalDateTime: dates.transferArrivalDateTime ? new Date(dates.transferArrivalDateTime) : null,
          transferDurationMinutes: dates.transferArrivalDateTime && dates.transferRequestDateTime ?
            Math.floor((new Date(dates.transferArrivalDateTime).getTime() - new Date(dates.transferRequestDateTime).getTime()) / (1000 * 60)) : null,
          chiefComplaint: data.incidentDetails.chiefComplaint,
          mechanismOfInjury: data.incidentDetails.mechanismOfInjury,
          vitalSigns: JSON.stringify(data.vitalsAssessment.vitalSigns),
          glasgowComaScale: data.vitalsAssessment.glasgowComaScale,
          systolicBloodPressure: data.vitalsAssessment.systolicBloodPressure,
          respiratoryRate: data.vitalsAssessment.respiratoryRate,
          additionalVitalSigns: data.vitalsAssessment.additionalVitalSigns,
          headAndNeckInjury: data.injuryAssessment.headAndNeckInjury,
          faceInjury: data.injuryAssessment.faceInjury,
          chestInjury: data.injuryAssessment.chestInjury,
          abdomenInjury: data.injuryAssessment.abdomenInjury,
          extremitiesInjury: data.injuryAssessment.extremitiesInjury,
          externalInjury: data.injuryAssessment.externalInjury,
          primarySurveyFindings: "Primary survey completed - ABCDE assessment",
          edDisposition: data.disposition.edDisposition,
          additionalNotes: data.disposition.additionalNotes,
          disposition: JSON.stringify(data.disposition.disposition),
          responseTimeMinutes: Math.floor((new Date(dates.arrivalDateTime).getTime() - new Date(dates.incidentDateTime).getTime()) / (1000 * 60)),
          criticalCase: data.vitalsAssessment.glasgowComaScale < 8,
          transferCase: Math.random() > 0.5, // Random transfer cases
          createdById: '069b34bc-26ae-478d-b962-bba99707b50d', // Admin user
        }
      });

      console.log(`✅ Created mortality case ${i + 1}: ${patient.firstName} ${patient.lastName} (${data.disposition.edDisposition})`);
    }

    console.log('🎯 Mortality cases added successfully!');
    console.log('📊 New KPI summary:');
    
    // Test KPI calculation
    const kpiResponse = await fetch('http://localhost:3001/api/v1/trauma-cases/kpis');
    const kpiData = await kpiResponse.json();
    console.log(`Total Cases: ${kpiData.totalCases}`);
    console.log(`Mortality Rate: ${kpiData.mortalityRate}%`);
    console.log(`Critical Cases: ${kpiData.criticalCases}`);

  } catch (error) {
    console.error('❌ Error adding mortality cases:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMortalityCases();
