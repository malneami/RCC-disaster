import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { PatientMergeService } from '../../patients/patient-merge.service';
import { PatientGender } from '@prisma/client';

export interface PatientInfo {
  firstName: string;
  lastName: string;
  nationalId?: string;
  mrn?: string;
  phoneNumber?: string;
  email?: string;
  dateOfBirth?: string; // Will be removed after migration
  age?: number; // Age in years
  gender?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalHistory?: string;
  allergies?: string;
  medications?: string;
}

@Injectable()
export class TraumaPatientService {
  constructor(
    private prisma: PrismaService,
    private patientMergeService: PatientMergeService
  ) {}

  async processPatient(patientInfo: PatientInfo, userId: string): Promise<string> {
    console.log('=== PATIENT PROCESSING ===');
    console.log('Patient Info:', patientInfo);
    
    let patientId: string | null = null;

    // Check for existing patient by National ID first (primary identifier)
    if (patientInfo.nationalId && patientInfo.nationalId.trim()) {
      console.log('Checking for existing patient by National ID:', patientInfo.nationalId);
      
      try {
        // Use patient merge service to find and merge duplicates
        const existingPatientId = await this.patientMergeService.findAndMergeDuplicatesByNationalId(
          patientInfo.nationalId.trim()
        );
        
        if (existingPatientId) {
          console.log('Found existing patient (or merged duplicates):', existingPatientId);
          patientId = existingPatientId;
        } else {
          console.log('No existing patient found with National ID, will create new patient');
        }
      } catch (error) {
        console.error('Error checking for duplicate patients:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new BadRequestException(`Error checking for duplicate patients: ${errorMessage}`);
      }
    }
    
    // If no existing patient found, create new one
    if (!patientId) {
      console.log('Creating new patient...');
      
      // Validate required fields
      if (!patientInfo.firstName || !patientInfo.lastName) {
        throw new BadRequestException('Patient first name and last name are required');
      }
      
      const patientData: any = {
        firstName: patientInfo.firstName.trim(),
        lastName: patientInfo.lastName.trim(),
        nationalId: patientInfo.nationalId?.trim() || null,
        mrn: patientInfo.mrn?.trim() || null,
        phoneNumber: patientInfo.phoneNumber?.trim() || null,
        email: patientInfo.email?.trim() || null,
        address: patientInfo.address?.trim() || null,
        emergencyContact: patientInfo.emergencyContact?.trim() || null,
        emergencyPhone: patientInfo.emergencyPhone?.trim() || null,
        medicalHistory: patientInfo.medicalHistory?.trim() || null,
        allergies: patientInfo.allergies?.trim() || null,
        medications: patientInfo.medications?.trim() || null,
        createdById: userId,
      };
      
      // Handle age field (preferred over dateOfBirth)
      if (patientInfo.age !== undefined && patientInfo.age !== null) {
        patientData.age = patientInfo.age;
      } else if (patientInfo.dateOfBirth) {
        // Calculate age from dateOfBirth if age not provided
        const today = new Date();
        const birthDate = new Date(patientInfo.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        patientData.age = age;
        patientData.dateOfBirth = birthDate;
      } else {
        // Default values if neither provided
        patientData.age = 0; // Default age
        patientData.dateOfBirth = new Date('1900-01-01'); // Default date
      }
      
      if (patientInfo.gender) {
        patientData.gender = patientInfo.gender as PatientGender;
      } else {
        patientData.gender = PatientGender.UNKNOWN; // Default gender
      }
      
      console.log('Creating new patient with data:', patientData);
      
      try {
        const patient = await this.prisma.patient.create({
          data: patientData,
        });
        console.log('New patient created:', patient.id);
        patientId = patient.id;
      } catch (error: any) {
        console.error('Error creating patient:', error);
        
        // If it's a unique constraint violation, try to find the existing patient
        if (error.code === 'P2002') {
          console.log('Unique constraint violation, attempting to find existing patient...');
          
          if (patientInfo.nationalId) {
            try {
              const existingPatient = await this.prisma.patient.findUnique({
                where: { nationalId: patientInfo.nationalId.trim() }
              });
              
              if (existingPatient) {
                console.log('Found existing patient by National ID:', existingPatient.id);
                patientId = existingPatient.id;
              }
            } catch (findError) {
              console.error('Error finding existing patient:', findError);
            }
          }
          
          if (!patientId) {
            throw new BadRequestException('Patient with this National ID already exists. Please use the existing patient or provide a different National ID.');
          }
        } else {
          throw new BadRequestException(`Error creating patient: ${error.message}`);
        }
      }
    }

    return patientId;
  }

  async updatePatient(patientId: string, patientInfo: Partial<PatientInfo>): Promise<void> {
    console.log('=== UPDATING PATIENT INFO ===');
    console.log('Patient Info:', patientInfo);
    
    const patientUpdateData: any = {};
    
    if (patientInfo.firstName !== undefined) {
      patientUpdateData.firstName = patientInfo.firstName ? patientInfo.firstName.trim() : null;
    }
    if (patientInfo.lastName !== undefined) {
      patientUpdateData.lastName = patientInfo.lastName ? patientInfo.lastName.trim() : null;
    }
    if (patientInfo.nationalId !== undefined) {
      patientUpdateData.nationalId = patientInfo.nationalId ? patientInfo.nationalId.trim() : null;
    }
    if (patientInfo.mrn !== undefined) {
      patientUpdateData.mrn = patientInfo.mrn ? patientInfo.mrn.trim() : null;
    }
    if (patientInfo.phoneNumber !== undefined) {
      patientUpdateData.phoneNumber = patientInfo.phoneNumber ? patientInfo.phoneNumber.trim() : null;
    }
    if (patientInfo.email !== undefined) {
      patientUpdateData.email = patientInfo.email ? patientInfo.email.trim() : null;
    }
    if (patientInfo.dateOfBirth !== undefined) {
      patientUpdateData.dateOfBirth = patientInfo.dateOfBirth ? new Date(patientInfo.dateOfBirth) : null;
    }
    if (patientInfo.gender !== undefined) {
      patientUpdateData.gender = patientInfo.gender ? patientInfo.gender as PatientGender : null;
    }
    if (patientInfo.address !== undefined) {
      patientUpdateData.address = patientInfo.address ? patientInfo.address.trim() : null;
    }
    if (patientInfo.emergencyContact !== undefined) {
      patientUpdateData.emergencyContact = patientInfo.emergencyContact ? patientInfo.emergencyContact.trim() : null;
    }
    if (patientInfo.emergencyPhone !== undefined) {
      patientUpdateData.emergencyPhone = patientInfo.emergencyPhone ? patientInfo.emergencyPhone.trim() : null;
    }
    if (patientInfo.medicalHistory !== undefined) {
      patientUpdateData.medicalHistory = patientInfo.medicalHistory ? patientInfo.medicalHistory.trim() : null;
    }
    if (patientInfo.allergies !== undefined) {
      patientUpdateData.allergies = patientInfo.allergies ? patientInfo.allergies.trim() : null;
    }
    if (patientInfo.medications !== undefined) {
      patientUpdateData.medications = patientInfo.medications ? patientInfo.medications.trim() : null;
    }
    
    if (Object.keys(patientUpdateData).length > 0) {
      try {
        await this.prisma.patient.update({
          where: { id: patientId },
          data: patientUpdateData,
        });
        console.log('Patient info updated successfully');
      } catch (error) {
        console.error('Error updating patient info:', error);
        throw new BadRequestException('Failed to update patient information');
      }
    }
  }

  async validatePatientExists(patientId: string): Promise<void> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
  }
}
