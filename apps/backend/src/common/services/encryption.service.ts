import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  keyId: string;
}

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits

  /**
   * Encrypt sensitive patient data
   * @param data - Data to encrypt
   * @param keyId - Unique identifier for the encryption key
   * @returns Encrypted data with IV and key ID
   */
  encrypt(data: string, keyId: string): EncryptedData | null {
    if (!data) return null;

    try {
      // Generate a random IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Get encryption key (in production, this would be from a key management service)
      const key = this.getEncryptionKey(keyId);
      
      // Create cipher
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from(keyId, 'utf8')); // Additional authenticated data
      
      // Encrypt the data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get the authentication tag
      const tag = cipher.getAuthTag();
      
      // Combine encrypted data and tag
      const encryptedData = encrypted + tag.toString('hex');
      
      return {
        encryptedData,
        iv: iv.toString('hex'),
        keyId,
      };
    } catch (error: any) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt sensitive patient data
   * @param encryptedData - Encrypted data object
   * @returns Decrypted data
   */
  decrypt(encryptedData: EncryptedData): string | null {
    if (!encryptedData || !encryptedData.encryptedData) return null;

    try {
      // Get encryption key
      const key = this.getEncryptionKey(encryptedData.keyId);
      
      // Extract IV and encrypted data
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const encrypted = encryptedData.encryptedData;
      
      // Extract tag (last 32 characters)
      const tag = Buffer.from(encrypted.slice(-32), 'hex');
      const ciphertext = encrypted.slice(0, -32);
      
      // Create decipher
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAAD(Buffer.from(encryptedData.keyId, 'utf8'));
      decipher.setAuthTag(tag);
      
      // Decrypt the data
      let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error: any) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate a new encryption key ID
   * @returns Unique key ID
   */
  generateKeyId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Hash sensitive data for search purposes (one-way)
   * @param data - Data to hash
   * @returns Hashed data
   */
  hashForSearch(data: string): string | null {
    if (!data) return null;
    
    const salt = process.env.HASH_SALT || 'default-salt';
    return crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512').toString('hex');
  }

  /**
   * Get encryption key by ID (in production, this would fetch from a key management service)
   * @param keyId - Key identifier
   * @returns Encryption key
   */
  private getEncryptionKey(keyId: string): string {
    // In production, this would fetch from AWS KMS, Azure Key Vault, or similar
    // For now, we'll use a derived key from the master key
    const masterKey = process.env.ENCRYPTION_MASTER_KEY || 'default-master-key-change-in-production';
    return crypto.pbkdf2Sync(masterKey, keyId, 10000, this.keyLength, 'sha256').toString('hex');
  }

  /**
   * Encrypt multiple fields in a patient object
   * @param patientData - Patient data object
   * @param fieldsToEncrypt - Array of field names to encrypt
   * @returns Object with encrypted fields and key ID
   */
  encryptPatientFields(patientData: any, fieldsToEncrypt: string[]): { encryptedFields: any; keyId: string } {
    const keyId = this.generateKeyId();
    const encryptedFields: any = {};

    for (const field of fieldsToEncrypt) {
      if (patientData[field]) {
        const encrypted = this.encrypt(patientData[field], keyId);
        if (encrypted) {
          encryptedFields[field] = encrypted.encryptedData;
        }
      }
    }

    return {
      encryptedFields,
      keyId,
    };
  }

  /**
   * Decrypt multiple fields in a patient object
   * @param patientData - Patient data object with encrypted fields
   * @param fieldsToDecrypt - Array of field names to decrypt
   * @returns Object with decrypted fields
   */
  decryptPatientFields(patientData: any, fieldsToDecrypt: string[]): any {
    const decryptedData = { ...patientData };

    for (const field of fieldsToDecrypt) {
      if (patientData[field]) {
        const encryptedData = {
          encryptedData: patientData[field],
          iv: patientData[`${field}_iv`] || '',
          keyId: patientData.dataEncryptionKey || '',
        };
        
        try {
          decryptedData[field] = this.decrypt(encryptedData);
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
          decryptedData[field] = null;
        }
      }
    }

    return decryptedData;
  }
}
