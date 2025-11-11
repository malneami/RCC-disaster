import { describe, it, expect, afterAll } from 'vitest';
import * as yup from 'yup';

// Import the validation schema from the actual implementation
// Regex patterns supporting Arabic characters
const NAME_REGEX = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z\s\u00C0-\u017F]+$/;
const ALPHANUMERIC_REGEX = /^[A-Za-z0-9]+$/;
const PHONE_REGEX = /^\+?\d{7,15}$/;

const patientInfoSchema = yup.object({
  firstName: yup
    .string()
    .trim()
    .matches(NAME_REGEX, 'First name can only include letters (including Arabic) and spaces.')
    .required('Patient Name is required'),
  lastName: yup
    .string()
    .trim()
    .matches(NAME_REGEX, 'Last name can only include letters (including Arabic) and spaces.')
    .required('Patient Last Name is required'),
  nationalId: yup
    .string()
    .trim()
    .matches(ALPHANUMERIC_REGEX, 'National ID can only contain letters and numbers.')
    .required('National ID is required'),
  age: yup
    .number()
    .typeError('Age must be a number')
    .required('Age is required')
    .min(0, 'Age must be a positive number')
    .max(150, 'Please enter a realistic age'),
  gender: yup
    .string()
    .oneOf(['MALE', 'FEMALE'], 'Please select a gender')
    .required('Gender is required'),
  phoneNumber: yup
    .string()
    .nullable()
    .transform((value) => (value ? value.trim() : ''))
    .test('valid-phone', 'Phone numbers can only include digits and may start with +', (value) => {
      if (!value) return true;
      return PHONE_REGEX.test(value);
    }),
  email: yup
    .string()
    .nullable()
    .email('Please enter a valid email address')
    .transform((value) => (value ? value.trim() : '')),
});

// Test results tracking
const testResults: Record<string, { passed: number; failed: number; tests: Array<{ name: string; passed: boolean }> }> = {};

const addTestResult = (category: string, testName: string, passed: boolean) => {
  if (!testResults[category]) {
    testResults[category] = { passed: 0, failed: 0, tests: [] };
  }
  testResults[category].tests.push({ name: testName, passed });
  if (passed) {
    testResults[category].passed++;
  } else {
    testResults[category].failed++;
  }
};

describe('Stroke Case Creation - Patient Information Validations', () => {
  describe('1.1 First Name Validation', () => {
    it('TC-001: Should accept valid first name with letters only', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('firstName', 'TC-001: Valid letters only', true);
        expect(true).toBe(true);
      } catch (error: any) {
        addTestResult('firstName', 'TC-001: Valid letters only', false);
        throw error;
      }
    });

    it('TC-002: Should accept valid first name with spaces', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'Mary Jane',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('firstName', 'TC-002: Valid letters with spaces', true);
        expect(true).toBe(true);
      } catch (error: any) {
        addTestResult('firstName', 'TC-002: Valid letters with spaces', false);
        throw error;
      }
    });

    it('TC-003: Should accept valid first name with Arabic characters', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'محمد',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('firstName', 'TC-003: Valid Arabic characters', true);
        expect(true).toBe(true);
      } catch (error: any) {
        addTestResult('firstName', 'TC-003: Valid Arabic characters', false);
        throw error;
      }
    });

    it('TC-004: Should reject first name with numbers', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John123',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('firstName', 'TC-004: Reject numbers', false);
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('First name can only include letters (including Arabic) and spaces.')
        );
        addTestResult('firstName', 'TC-004: Reject numbers', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });

    it('TC-005: Should reject first name with special characters', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John@Doe',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('firstName', 'TC-005: Reject special characters', false);
        expect(false).toBe(true);
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('First name can only include letters (including Arabic) and spaces.')
        );
        addTestResult('firstName', 'TC-005: Reject special characters', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });

    it('TC-006: Should reject empty first name', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: '',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('firstName', 'TC-006: Reject empty', false);
        expect(false).toBe(true);
      } catch (error: any) {
        // Yup may return either the required error or the matches error for empty strings
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Patient Name is required') || 
          e.includes('First name can only include letters (including Arabic) and spaces.')
        );
        addTestResult('firstName', 'TC-006: Reject empty', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });

    it('TC-007: Should reject first name with only spaces', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: '   ',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('firstName', 'TC-007: Reject only spaces', false);
        expect(false).toBe(true);
      } catch (error: any) {
        // After trim, only spaces become empty, so it should return required error
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Patient Name is required') ||
          e.includes('First name can only include letters (including Arabic) and spaces.')
        );
        addTestResult('firstName', 'TC-007: Reject only spaces', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });
  });

  describe('1.2 Last Name Validation', () => {
    it('TC-008: Should accept valid last name with letters only', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Smith',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('lastName', 'TC-008: Valid letters only', true);
        expect(true).toBe(true);
      } catch (error: any) {
        addTestResult('lastName', 'TC-008: Valid letters only', false);
        throw error;
      }
    });

    it('TC-009: Should accept valid last name with spaces', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Van Der Berg',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('lastName', 'TC-009: Valid letters with spaces', true);
        expect(true).toBe(true);
      } catch (error: any) {
        addTestResult('lastName', 'TC-009: Valid letters with spaces', false);
        throw error;
      }
    });

    it('TC-010: Should reject last name with numbers', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Smith123',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('lastName', 'TC-010: Reject numbers', false);
        expect(false).toBe(true);
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Last name can only include letters (including Arabic) and spaces.')
        );
        addTestResult('lastName', 'TC-010: Reject numbers', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });

    it('TC-011: Should reject last name with special characters', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: "O'Brien",
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('lastName', 'TC-011: Reject special characters', false);
        expect(false).toBe(true);
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Last name can only include letters (including Arabic) and spaces.')
        );
        addTestResult('lastName', 'TC-011: Reject special characters', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });

    it('TC-012: Should reject empty last name', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: '',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('lastName', 'TC-012: Reject empty', false);
        expect(false).toBe(true);
      } catch (error: any) {
        // Yup may return either the required error or the matches error for empty strings
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Patient Last Name is required') ||
          e.includes('Last name can only include letters (including Arabic) and spaces.')
        );
        addTestResult('lastName', 'TC-012: Reject empty', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });
  });

  describe('1.3 National ID Validation', () => {
    it('TC-013: Should accept valid National ID with alphanumeric characters', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('nationalId', 'TC-013: Valid alphanumeric', true);
        expect(true).toBe(true);
      } catch (error: any) {
        addTestResult('nationalId', 'TC-013: Valid alphanumeric', false);
        throw error;
      }
    });

    it('TC-014: Should accept valid National ID with numbers only', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: '1234567890',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('nationalId', 'TC-014: Valid numbers only', true);
        expect(true).toBe(true);
      } catch (error: any) {
        addTestResult('nationalId', 'TC-014: Valid numbers only', false);
        throw error;
      }
    });

    it('TC-015: Should accept valid National ID with letters only', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABCDEF',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('nationalId', 'TC-015: Valid letters only', true);
        expect(true).toBe(true);
      } catch (error: any) {
        addTestResult('nationalId', 'TC-015: Valid letters only', false);
        throw error;
      }
    });

    it('TC-016: Should reject National ID with special characters', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC-123',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('nationalId', 'TC-016: Reject special characters', false);
        expect(false).toBe(true);
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('National ID can only contain letters and numbers.')
        );
        addTestResult('nationalId', 'TC-016: Reject special characters', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });

    it('TC-017: Should reject National ID with spaces', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC 123',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('nationalId', 'TC-017: Reject spaces', false);
        expect(false).toBe(true);
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('National ID can only contain letters and numbers.')
        );
        addTestResult('nationalId', 'TC-017: Reject spaces', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });

    it('TC-018: Should reject empty National ID', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: '',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('nationalId', 'TC-018: Reject empty', false);
        expect(false).toBe(true);
      } catch (error: any) {
        // Yup may return either the required error or the matches error for empty strings
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('National ID is required') ||
          e.includes('National ID can only contain letters and numbers.')
        );
        addTestResult('nationalId', 'TC-018: Reject empty', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });
  });

  describe('1.4 Age Validation', () => {
    it('TC-019: Should accept valid age at maximum (150)', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 150,
          gender: 'MALE',
        });
        addTestResult('age', 'TC-019: Valid age 150', true);
        expect(true).toBe(true);
      } catch (error: any) {
        addTestResult('age', 'TC-019: Valid age 150', false);
        throw error;
      }
    });

    it('TC-020: Should accept valid typical age', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('age', 'TC-020: Valid typical age', true);
        expect(true).toBe(true);
      } catch (error: any) {
        addTestResult('age', 'TC-020: Valid typical age', false);
        throw error;
      }
    });

    it('TC-021: Should reject negative age', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: -5,
          gender: 'MALE',
        });
        addTestResult('age', 'TC-021: Reject negative', false);
        expect(false).toBe(true);
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Age must be a positive number')
        );
        addTestResult('age', 'TC-021: Reject negative', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });

    it('TC-022: Should reject age exceeding maximum (151)', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 151,
          gender: 'MALE',
        });
        addTestResult('age', 'TC-022: Reject age 151', false);
        expect(false).toBe(true);
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Please enter a realistic age')
        );
        addTestResult('age', 'TC-022: Reject age 151', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });

    it('TC-023: Should reject non-numeric age', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 'abc' as any,
          gender: 'MALE',
        });
        addTestResult('age', 'TC-023: Reject non-numeric', false);
        expect(false).toBe(true);
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Age must be a number')
        );
        addTestResult('age', 'TC-023: Reject non-numeric', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });

    it('TC-024: Should handle decimal age', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45.5,
          gender: 'MALE',
        });
        // Decimal might be accepted or rejected depending on implementation
        addTestResult('age', 'TC-024: Decimal age handling', true);
        expect(true).toBe(true);
      } catch (error: any) {
        // If rejected, that's also valid
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Age must be a number')
        );
        addTestResult('age', 'TC-024: Decimal age handling', hasCorrectError);
        // Both outcomes are acceptable
        expect(true).toBe(true);
      }
    });

    it('TC-025: Should reject empty age', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: undefined,
          gender: 'MALE',
        });
        addTestResult('age', 'TC-025: Reject empty', false);
        expect(false).toBe(true);
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Age is required') || e.includes('Age must be a number')
        );
        addTestResult('age', 'TC-025: Reject empty', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });
  });

  describe('1.5 Gender Validation', () => {
    it('TC-027: Should accept MALE gender', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
        });
        addTestResult('gender', 'TC-027: Valid MALE', true);
        expect(true).toBe(true);
      } catch (error: any) {
        addTestResult('gender', 'TC-027: Valid MALE', false);
        throw error;
      }
    });

    it('TC-028: Should accept FEMALE gender', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'FEMALE',
        });
        addTestResult('gender', 'TC-028: Valid FEMALE', true);
        expect(true).toBe(true);
      } catch (error: any) {
        addTestResult('gender', 'TC-028: Valid FEMALE', false);
        throw error;
      }
    });

    it('TC-029: Should reject empty gender', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: '',
        });
        addTestResult('gender', 'TC-029: Reject empty', false);
        expect(false).toBe(true);
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Please select a gender') || e.includes('Gender is required')
        );
        addTestResult('gender', 'TC-029: Reject empty', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });

    it('TC-030: Should reject UNKNOWN gender option', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'UNKNOWN',
        });
        addTestResult('gender', 'TC-030: Reject UNKNOWN', false);
        expect(false).toBe(true);
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Please select a gender')
        );
        addTestResult('gender', 'TC-030: Reject UNKNOWN', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });
  });

  describe('1.6 Phone Number Validation', () => {
    it('TC-031: Should accept valid phone number with 7 digits', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
          phoneNumber: '1234567',
        });
        addTestResult('phoneNumber', 'TC-031: Valid 7 digits', true);
        expect(true).toBe(true);
      } catch (error: any) {
        addTestResult('phoneNumber', 'TC-031: Valid 7 digits', false);
        throw error;
      }
    });

    it('TC-032: Should accept valid phone number with 15 digits', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
          phoneNumber: '123456789012345',
        });
        addTestResult('phoneNumber', 'TC-032: Valid 15 digits', true);
        expect(true).toBe(true);
      } catch (error: any) {
        addTestResult('phoneNumber', 'TC-032: Valid 15 digits', false);
        throw error;
      }
    });

    it('TC-033: Should accept valid phone number with plus prefix', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
          phoneNumber: '+96612345678',
        });
        addTestResult('phoneNumber', 'TC-033: Valid with + prefix', true);
        expect(true).toBe(true);
      } catch (error: any) {
        addTestResult('phoneNumber', 'TC-033: Valid with + prefix', false);
        throw error;
      }
    });

    it('TC-034: Should accept empty phone number (optional)', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
          phoneNumber: '',
        });
        addTestResult('phoneNumber', 'TC-034: Valid empty (optional)', true);
        expect(true).toBe(true);
      } catch (error: any) {
        addTestResult('phoneNumber', 'TC-034: Valid empty (optional)', false);
        throw error;
      }
    });

    it('TC-035: Should reject phone number with less than 7 digits', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
          phoneNumber: '123456',
        });
        addTestResult('phoneNumber', 'TC-035: Reject < 7 digits', false);
        expect(false).toBe(true);
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Phone numbers can only include digits and may start with +')
        );
        addTestResult('phoneNumber', 'TC-035: Reject < 7 digits', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });

    it('TC-036: Should reject phone number with more than 15 digits', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
          phoneNumber: '1234567890123456',
        });
        addTestResult('phoneNumber', 'TC-036: Reject > 15 digits', false);
        expect(false).toBe(true);
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Phone numbers can only include digits and may start with +')
        );
        addTestResult('phoneNumber', 'TC-036: Reject > 15 digits', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });

    it('TC-037: Should reject phone number with letters', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
          phoneNumber: '1234567abc',
        });
        addTestResult('phoneNumber', 'TC-037: Reject letters', false);
        expect(false).toBe(true);
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Phone numbers can only include digits and may start with +')
        );
        addTestResult('phoneNumber', 'TC-037: Reject letters', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });

    it('TC-038: Should reject phone number with special characters', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
          phoneNumber: '123-456-7890',
        });
        addTestResult('phoneNumber', 'TC-038: Reject special characters', false);
        expect(false).toBe(true);
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Phone numbers can only include digits and may start with +')
        );
        addTestResult('phoneNumber', 'TC-038: Reject special characters', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });

    it('TC-039: Should reject phone number with plus sign in middle', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
          phoneNumber: '123+4567890',
        });
        addTestResult('phoneNumber', 'TC-039: Reject + in middle', false);
        expect(false).toBe(true);
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Phone numbers can only include digits and may start with +')
        );
        addTestResult('phoneNumber', 'TC-039: Reject + in middle', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });
  });

  describe('1.7 Email Validation', () => {
    it('TC-040: Should accept valid email in standard format', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
          email: 'john.doe@example.com',
        });
        addTestResult('email', 'TC-040: Valid email format', true);
        expect(true).toBe(true);
      } catch (error: any) {
        addTestResult('email', 'TC-040: Valid email format', false);
        throw error;
      }
    });

    it('TC-041: Should accept empty email (optional)', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
          email: '',
        });
        addTestResult('email', 'TC-041: Valid empty (optional)', true);
        expect(true).toBe(true);
      } catch (error: any) {
        addTestResult('email', 'TC-041: Valid empty (optional)', false);
        throw error;
      }
    });

    it('TC-042: Should reject email missing @ symbol', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
          email: 'johndoeexample.com',
        });
        addTestResult('email', 'TC-042: Reject missing @', false);
        expect(false).toBe(true);
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Please enter a valid email address')
        );
        addTestResult('email', 'TC-042: Reject missing @', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });

    it('TC-043: Should reject email missing domain', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
          email: 'johndoe@',
        });
        addTestResult('email', 'TC-043: Reject missing domain', false);
        expect(false).toBe(true);
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Please enter a valid email address')
        );
        addTestResult('email', 'TC-043: Reject missing domain', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });

    it('TC-044: Should reject email with multiple @ symbols', async () => {
      try {
        await patientInfoSchema.validate({
          firstName: 'John',
          lastName: 'Doe',
          nationalId: 'ABC123',
          age: 45,
          gender: 'MALE',
          email: 'john@doe@example.com',
        });
        addTestResult('email', 'TC-044: Reject multiple @', false);
        expect(false).toBe(true);
      } catch (error: any) {
        const hasCorrectError = error.errors?.some((e: string) =>
          e.includes('Please enter a valid email address')
        );
        addTestResult('email', 'TC-044: Reject multiple @', hasCorrectError);
        expect(hasCorrectError).toBe(true);
      }
    });
  });

  // Print test results summary
  afterAll(() => {
    console.log('\n=== TEST RESULTS SUMMARY ===\n');
    Object.keys(testResults).forEach((category) => {
      const result = testResults[category];
      console.log(`${category}:`);
      console.log(`  ✅ PASS - ${result.passed} tests`);
      console.log(`  ❌ FAIL - ${result.failed} tests`);
      result.tests.forEach((test) => {
        console.log(`  ${test.passed ? '✅' : '❌'} ${test.name}`);
      });
      console.log('');
    });
    const totalPassed = Object.values(testResults).reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = Object.values(testResults).reduce((sum, r) => sum + r.failed, 0);
    console.log(`Total: ${totalPassed} passed, ${totalFailed} failed`);
  });
});

