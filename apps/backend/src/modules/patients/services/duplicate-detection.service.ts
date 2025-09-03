import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { EncryptionService } from '../../../common/services/encryption.service';

export interface DuplicateMatch {
  patientId: string;
  confidence: number;
  matchReason: string;
  matchedFields: string[];
}

export interface DuplicateGroup {
  groupId: string;
  patients: DuplicateMatch[];
  primaryPatientId: string;
  totalConfidence: number;
}

@Injectable()
export class DuplicateDetectionService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  /**
   * Detect potential duplicate patients
   * @param patientId - ID of the patient to check
   * @param confidenceThreshold - Minimum confidence threshold (0-1)
   * @returns Array of potential duplicates
   */
  async detectDuplicates(patientId: string, confidenceThreshold: number = 0.8): Promise<DuplicateMatch[]> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    const duplicates: DuplicateMatch[] = [];

    // Check for exact matches first
    const exactMatches = await this.findExactMatches(patient);
    duplicates.push(...exactMatches);

    // Check for fuzzy matches
    const fuzzyMatches = await this.findFuzzyMatches(patient, confidenceThreshold);
    duplicates.push(...fuzzyMatches);

    // Remove duplicates and sort by confidence
    const uniqueDuplicates = this.removeDuplicateMatches(duplicates);
    return uniqueDuplicates.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Find exact matches based on unique identifiers
   */
  private async findExactMatches(patient: any): Promise<DuplicateMatch[]> {
    const exactMatches: DuplicateMatch[] = [];

    // Check MRN match
    if (patient.mrn) {
      const mrnMatches = await this.prisma.patient.findMany({
        where: {
          mrn: patient.mrn,
          id: { not: patient.id },
          deletedAt: null,
        },
      });

      for (const match of mrnMatches) {
        exactMatches.push({
          patientId: match.id,
          confidence: 1.0,
          matchReason: 'Exact MRN match',
          matchedFields: ['mrn'],
        });
      }
    }

    // TODO: Add National ID check once schema is updated
    // Check National ID match
    // if (patient.nationalId) {
    //   const nationalIdMatches = await this.prisma.patient.findMany({
    //     where: {
    //       nationalId: patient.nationalId,
    //       id: { not: patient.id },
    //       deletedAt: null,
    //     },
    //   });
    // }

    return exactMatches;
  }

  /**
   * Find fuzzy matches based on name, DOB, and other fields
   */
  private async findFuzzyMatches(patient: any, confidenceThreshold: number): Promise<DuplicateMatch[]> {
    const fuzzyMatches: DuplicateMatch[] = [];

    // Get all patients for comparison
    const allPatients = await this.prisma.patient.findMany({
      where: {
        id: { not: patient.id },
        deletedAt: null,
      },
    });

    for (const candidate of allPatients) {
      const confidence = this.calculateMatchConfidence(patient, candidate);
      
      if (confidence >= confidenceThreshold) {
        const matchedFields = this.getMatchedFields(patient, candidate);
        fuzzyMatches.push({
          patientId: candidate.id,
          confidence,
          matchReason: this.getMatchReason(confidence, matchedFields),
          matchedFields,
        });
      }
    }

    return fuzzyMatches;
  }

  /**
   * Calculate confidence score between two patients
   */
  private calculateMatchConfidence(patient1: any, patient2: any): number {
    let totalScore = 0;
    let maxScore = 0;

    // Name matching (40% weight)
    const nameScore = this.calculateNameSimilarity(patient1, patient2);
    totalScore += nameScore * 0.4;
    maxScore += 0.4;

    // Date of birth matching (30% weight)
    const dobScore = this.calculateDOBSimilarity(patient1, patient2);
    totalScore += dobScore * 0.3;
    maxScore += 0.3;

    // Gender matching (10% weight)
    const genderScore = patient1.gender === patient2.gender ? 1 : 0;
    totalScore += genderScore * 0.1;
    maxScore += 0.1;

    // Phone number matching (10% weight)
    const phoneScore = this.calculatePhoneSimilarity(patient1, patient2);
    totalScore += phoneScore * 0.1;
    maxScore += 0.1;

    // Address matching (10% weight)
    const addressScore = this.calculateAddressSimilarity(patient1, patient2);
    totalScore += addressScore * 0.1;
    maxScore += 0.1;

    return totalScore / maxScore;
  }

  /**
   * Calculate name similarity using Levenshtein distance
   */
  private calculateNameSimilarity(patient1: any, patient2: any): number {
    const name1 = `${patient1.firstName} ${patient1.lastName}`.toLowerCase();
    const name2 = `${patient2.firstName} ${patient2.lastName}`.toLowerCase();

    if (name1 === name2) return 1.0;

    const distance = this.levenshteinDistance(name1, name2);
    const maxLength = Math.max(name1.length, name2.length);
    
    return 1 - (distance / maxLength);
  }

  /**
   * Calculate date of birth similarity
   */
  private calculateDOBSimilarity(patient1: any, patient2: any): number {
    if (!patient1.dateOfBirth || !patient2.dateOfBirth) return 0;

    const dob1 = new Date(patient1.dateOfBirth);
    const dob2 = new Date(patient2.dateOfBirth);

    if (dob1.getTime() === dob2.getTime()) return 1.0;

    // Allow for small differences (e.g., different time zones, data entry errors)
    const diffDays = Math.abs(dob1.getTime() - dob2.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 1 ? 0.9 : 0;
  }

  /**
   * Calculate phone number similarity
   */
  private calculatePhoneSimilarity(patient1: any, patient2: any): number {
    if (!patient1.phoneNumber || !patient2.phoneNumber) return 0;

    const phone1 = patient1.phoneNumber.replace(/\D/g, '');
    const phone2 = patient2.phoneNumber.replace(/\D/g, '');

    if (phone1 === phone2) return 1.0;

    // Check if one is a substring of the other (e.g., with/without country code)
    if (phone1.includes(phone2) || phone2.includes(phone1)) return 0.8;

    return 0;
  }

  /**
   * Calculate address similarity
   */
  private calculateAddressSimilarity(patient1: any, patient2: any): number {
    if (!patient1.address || !patient2.address) return 0;

    const address1 = patient1.address.toLowerCase();
    const address2 = patient2.address.toLowerCase();

    if (address1 === address2) return 1.0;

    // Simple word matching
    const words1 = address1.split(/\s+/);
    const words2 = address2.split(/\s+/);
    
    const commonWords = words1.filter((word: string) => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return commonWords.length / totalWords;
  }

  /**
   * Get matched fields between two patients
   */
  private getMatchedFields(patient1: any, patient2: any): string[] {
    const matchedFields: string[] = [];

    if (patient1.firstName === patient2.firstName) matchedFields.push('firstName');
    if (patient1.lastName === patient2.lastName) matchedFields.push('lastName');
    if (patient1.dateOfBirth?.getTime() === patient2.dateOfBirth?.getTime()) matchedFields.push('dateOfBirth');
    if (patient1.gender === patient2.gender) matchedFields.push('gender');
    if (patient1.phoneNumber === patient2.phoneNumber) matchedFields.push('phoneNumber');
    if (patient1.address === patient2.address) matchedFields.push('address');

    return matchedFields;
  }

  /**
   * Get human-readable match reason
   */
  private getMatchReason(confidence: number, matchedFields: string[]): string {
    if (confidence === 1.0) {
      return 'Exact match';
    } else if (confidence >= 0.9) {
      return 'Very high similarity';
    } else if (confidence >= 0.8) {
      return 'High similarity';
    } else if (confidence >= 0.7) {
      return 'Moderate similarity';
    } else {
      return 'Low similarity';
    }
  }

  /**
   * Remove duplicate matches from the same patient
   */
  private removeDuplicateMatches(matches: DuplicateMatch[]): DuplicateMatch[] {
    const seen = new Set<string>();
    return matches.filter(match => {
      if (seen.has(match.patientId)) {
        return false;
      }
      seen.add(match.patientId);
      return true;
    });
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Merge duplicate patients into a group
   * TODO: Implement once schema is updated
   */
  async mergeDuplicates(primaryPatientId: string, duplicatePatientIds: string[]): Promise<void> {
    // TODO: Implement duplicate merging once schema is updated
    console.log('Duplicate merging not yet implemented');
  }

  /**
   * Get duplicate groups
   * TODO: Implement once schema is updated
   */
  async getDuplicateGroups(): Promise<DuplicateGroup[]> {
    // TODO: Implement duplicate groups once schema is updated
    return [];
  }
}
