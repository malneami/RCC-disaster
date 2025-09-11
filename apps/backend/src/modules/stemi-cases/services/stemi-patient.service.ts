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
      const patient = await this.prisma.patient.update({
        where: { id: patientId },
        data: {
          firstName,
          lastName,
          nationalId,
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
        },
      });

      return patient;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }
}
