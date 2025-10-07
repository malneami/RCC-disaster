import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { PatientInfoDto } from '../dto/create-stemi-case.dto';

@Injectable()
export class StemiPatientService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdatePatient(patientInfo: PatientInfoDto, userId: string) {
    const {
      firstName,
      lastName,
      nationalId,
      age,
      gender,
      phoneNumber,
      address,
      emergencyContact,
      emergencyPhone,
      medicalHistory,
      allergies,
      medications,
    } = patientInfo;

    try {
      // Try to find existing patient by national ID
      let patient = await this.prisma.patient.findUnique({
        where: { nationalId },
      });

      if (patient) {
        // Update existing patient
        patient = await this.prisma.patient.update({
          where: { id: patient.id },
          data: {
            firstName,
            lastName,
            age: age || undefined,
            gender,
            phoneNumber: phoneNumber || null,
            address: address || null,
            emergencyContact: emergencyContact || null,
            emergencyPhone: emergencyPhone || null,
            medicalHistory: medicalHistory || null,
            allergies: allergies || null,
            medications: medications || null,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new patient
        patient = await this.prisma.patient.create({
          data: {
            firstName,
            lastName,
            nationalId,
            age: age || undefined,
            gender,
            phoneNumber: phoneNumber || null,
            address: address || null,
            emergencyContact: emergencyContact || null,
            emergencyPhone: emergencyPhone || null,
            medicalHistory: medicalHistory || null,
            allergies: allergies || null,
            medications: medications || null,
            createdById: userId,
          },
        });
      }

      return patient;
    } catch (error) {
      console.error('Error creating/updating patient:', error);
      throw error;
    }
  }

  async updatePatient(patientId: string, patientInfo: PatientInfoDto) {
    const {
      firstName,
      lastName,
      nationalId,
      age,
      gender,
      phoneNumber,
      address,
      emergencyContact,
      emergencyPhone,
      medicalHistory,
      allergies,
      medications,
    } = patientInfo;

    try {
      // First, get the current patient to check if nationalId is changing
      const currentPatient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        select: { nationalId: true }
      });

      if (!currentPatient) {
        throw new Error(`Patient with ID ${patientId} not found`);
      }

      // Build update data, only including nationalId if it's actually changing
      const updateData: any = {
        firstName,
        lastName,
        age: age || undefined,
        gender,
        phoneNumber: phoneNumber !== undefined ? (phoneNumber || null) : undefined,
        address: address !== undefined ? (address || null) : undefined,
        emergencyContact: emergencyContact !== undefined ? (emergencyContact || null) : undefined,
        emergencyPhone: emergencyPhone !== undefined ? (emergencyPhone || null) : undefined,
        medicalHistory: medicalHistory !== undefined ? (medicalHistory || null) : undefined,
        allergies: allergies !== undefined ? (allergies || null) : undefined,
        medications: medications !== undefined ? (medications || null) : undefined,
        updatedAt: new Date(),
      };

      // Only update nationalId if it's different from the current value
      if (nationalId && nationalId !== currentPatient.nationalId) {
        // Check if the new nationalId already exists for another patient
        const existingPatient = await this.prisma.patient.findUnique({
          where: { nationalId },
          select: { id: true }
        });
        
        if (existingPatient && existingPatient.id !== patientId) {
          throw new Error(`A patient with national ID ${nationalId} already exists`);
        }
        
        updateData.nationalId = nationalId;
      }

      const patient = await this.prisma.patient.update({
        where: { id: patientId },
        data: updateData,
      });

      return patient;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }
}
