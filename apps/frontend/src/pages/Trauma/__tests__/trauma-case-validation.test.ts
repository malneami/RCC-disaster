/**
 * Comprehensive Test Functions for Trauma Case Creation
 * 
 * This test file covers all validation rules for trauma case creation:
 * 1. Patient Information Validation (names, national ID, age, gender, phone, hospitals)
 * 2. Incident Details Validation (arrival time, mode of arrival, mechanism of injury)
 * 3. Timeline Validation (incident vs arrival, transfer times)
 * 4. Disposition Validation (ED Disposition)
 * 5. Form Submission Logic
 */

import { describe, it, expect } from 'vitest';

// Validation regex patterns (matching the actual implementation)
const NAME_REGEX = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z\s\u00C0-\u017F]+$/;
const ALPHANUMERIC_REGEX = /^[A-Za-z0-9]+$/;
const PHONE_REGEX = /^\+?\d{7,15}$/;

// Interfaces
interface PatientInfo {
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | '';
  phoneNumber?: string;
  emergencyPhone?: string;
  originHospitalId?: string;
  destinationHospitalId?: string;
}

interface IncidentDetails {
  arrivalDateTime?: string;
  incidentDateTime?: string;
  modeOfArrival?: string;
  mechanismOfInjury?: string;
  transferRequestDateTime?: string;
  transferArrivalDateTime?: string;
}

interface Disposition {
  edDisposition?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

// Validation Functions
function validateFirstName(firstName?: string): ValidationError | null {
  if (!firstName || firstName.trim() === '') {
    return { field: 'patientInfo.firstName', message: 'Patient Name is required' };
  }
  if (!NAME_REGEX.test(firstName.trim())) {
    return { field: 'patientInfo.firstName', message: 'First name can only include letters (including Arabic) and spaces.' };
  }
  return null;
}

function validateLastName(lastName?: string): ValidationError | null {
  if (!lastName || lastName.trim() === '') {
    return { field: 'patientInfo.lastName', message: 'Patient Last Name is required' };
  }
  if (!NAME_REGEX.test(lastName.trim())) {
    return { field: 'patientInfo.lastName', message: 'Last name can only include letters (including Arabic) and spaces.' };
  }
  return null;
}

function validateNationalId(nationalId?: string): ValidationError | null {
  if (!nationalId || nationalId.trim() === '') {
    return { field: 'patientInfo.nationalId', message: 'National ID is required' };
  }
  if (!ALPHANUMERIC_REGEX.test(nationalId.trim())) {
    return { field: 'patientInfo.nationalId', message: 'National ID can only contain letters and numbers.' };
  }
  return null;
}

function validateAge(age?: number): ValidationError | null {
  if (age === undefined || age === null) {
    return { field: 'patientInfo.age', message: 'Age is required' };
  }
  if (typeof age !== 'number' || isNaN(age)) {
    return { field: 'patientInfo.age', message: 'Age must be a number' };
  }
  if (age < 1) {
    return { field: 'patientInfo.age', message: 'Age must be at least 1' };
  }
  if (age > 150) {
    return { field: 'patientInfo.age', message: 'Please enter a realistic age' };
  }
  return null;
}

function validateGender(gender?: string): ValidationError | null {
  if (!gender || gender === '') {
    return { field: 'patientInfo.gender', message: 'Please select a gender' };
  }
  if (gender !== 'MALE' && gender !== 'FEMALE') {
    return { field: 'patientInfo.gender', message: 'Please select a gender' };
  }
  return null;
}

function validatePhoneNumber(phoneNumber?: string): ValidationError | null {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return null; // Optional field
  }
  if (!PHONE_REGEX.test(phoneNumber.trim())) {
    return { field: 'patientInfo.phoneNumber', message: 'Phone numbers can only include digits and may start with +' };
  }
  return null;
}

function validateEmergencyPhone(emergencyPhone?: string): ValidationError | null {
  if (!emergencyPhone || emergencyPhone.trim() === '') {
    return null; // Optional field
  }
  if (!PHONE_REGEX.test(emergencyPhone.trim())) {
    return { field: 'patientInfo.emergencyPhone', message: 'Emergency phone can only include digits and may start with +' };
  }
  return null;
}

function validateOriginHospital(originHospitalId?: string): ValidationError | null {
  if (!originHospitalId || originHospitalId.trim() === '') {
    return { field: 'patientInfo.originHospitalId', message: 'Origin Hospital is required' };
  }
  return null;
}

function validateDestinationHospital(
  _originHospitalId?: string,
  destinationHospitalId?: string,
  originHasTraumaService: boolean = true
): ValidationError | null {
  if (!originHasTraumaService && (!destinationHospitalId || destinationHospitalId.trim() === '')) {
    return {
      field: 'patientInfo.destinationHospitalId',
      message: 'Destination Hospital is required because the selected origin hospital does not provide Trauma service.'
    };
  }
  return null;
}

function validateArrivalDateTime(arrivalDateTime?: string): ValidationError | null {
  if (!arrivalDateTime || arrivalDateTime.trim() === '') {
    return { field: 'incidentDetails.arrivalDateTime', message: 'Arrival Date Time is required' };
  }
  return null;
}

function validateModeOfArrival(modeOfArrival?: string): ValidationError | null {
  if (!modeOfArrival || modeOfArrival.trim() === '') {
    return { field: 'incidentDetails.modeOfArrival', message: 'Mode of Arrival is required' };
  }
  return null;
}

function validateMechanismOfInjury(mechanismOfInjury?: string): ValidationError | null {
  if (!mechanismOfInjury || mechanismOfInjury.trim() === '') {
    return { field: 'incidentDetails.mechanismOfInjury', message: 'Mechanism of Injury is required' };
  }
  return null;
}

function validateEDDisposition(edDisposition?: string): ValidationError | null {
  if (!edDisposition || edDisposition.trim() === '') {
    return { field: 'disposition.edDisposition', message: 'ED Disposition is required' };
  }
  return null;
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function validateTimeline(incidentDetails: IncidentDetails): ValidationError[] {
  const warnings: ValidationError[] = [];
  const arrivalTime = parseDate(incidentDetails.arrivalDateTime);
  const incidentTime = parseDate(incidentDetails.incidentDateTime);
  const transferRequestTime = parseDate(incidentDetails.transferRequestDateTime);
  const transferArrivalTime = parseDate(incidentDetails.transferArrivalDateTime);

  // Incident time cannot be after arrival time
  if (incidentTime && arrivalTime && incidentTime > arrivalTime) {
    warnings.push({
      field: 'incidentDetails.incidentDateTime',
      message: 'Incident time happens after arrival time. Please confirm the order of events.'
    });
  }

  // Transfer request cannot be before arrival
  if (transferRequestTime && arrivalTime && transferRequestTime < arrivalTime) {
    warnings.push({
      field: 'incidentDetails.transferRequestDateTime',
      message: 'Transfer request is logged before arrival. Confirm the request time.'
    });
  }

  // Transfer arrival cannot be before transfer request
  if (transferArrivalTime && transferRequestTime && transferArrivalTime < transferRequestTime) {
    warnings.push({
      field: 'incidentDetails.transferArrivalDateTime',
      message: 'Transfer arrival is before the request. Please correct these times.'
    });
  }

  // Transfer arrival cannot be before initial arrival
  if (transferArrivalTime && arrivalTime && transferArrivalTime < arrivalTime) {
    warnings.push({
      field: 'incidentDetails.transferArrivalDateTime',
      message: 'Transfer arrival is before initial arrival. Check both timestamps.'
    });
  }

  return warnings;
}

function validatePatientInfo(patientInfo: PatientInfo, originHasTraumaService: boolean = true): ValidationError[] {
  const errors: ValidationError[] = [];

  const firstNameError = validateFirstName(patientInfo.firstName);
  if (firstNameError) errors.push(firstNameError);

  const lastNameError = validateLastName(patientInfo.lastName);
  if (lastNameError) errors.push(lastNameError);

  const nationalIdError = validateNationalId(patientInfo.nationalId);
  if (nationalIdError) errors.push(nationalIdError);

  const ageError = validateAge(patientInfo.age);
  if (ageError) errors.push(ageError);

  const genderError = validateGender(patientInfo.gender);
  if (genderError) errors.push(genderError);

  const phoneError = validatePhoneNumber(patientInfo.phoneNumber);
  if (phoneError) errors.push(phoneError);

  const emergencyPhoneError = validateEmergencyPhone(patientInfo.emergencyPhone);
  if (emergencyPhoneError) errors.push(emergencyPhoneError);

  const originHospitalError = validateOriginHospital(patientInfo.originHospitalId);
  if (originHospitalError) errors.push(originHospitalError);

  const destinationHospitalError = validateDestinationHospital(
    patientInfo.originHospitalId,
    patientInfo.destinationHospitalId,
    originHasTraumaService
  );
  if (destinationHospitalError) errors.push(destinationHospitalError);

  return errors;
}

function validateIncidentDetails(incidentDetails: IncidentDetails): ValidationError[] {
  const errors: ValidationError[] = [];

  const arrivalError = validateArrivalDateTime(incidentDetails.arrivalDateTime);
  if (arrivalError) errors.push(arrivalError);

  const modeOfArrivalError = validateModeOfArrival(incidentDetails.modeOfArrival);
  if (modeOfArrivalError) errors.push(modeOfArrivalError);

  const mechanismError = validateMechanismOfInjury(incidentDetails.mechanismOfInjury);
  if (mechanismError) errors.push(mechanismError);

  return errors;
}

function canSubmitForm(
  patientInfo: PatientInfo,
  incidentDetails: IncidentDetails,
  disposition: Disposition,
  originHasTraumaService: boolean = true
): { canSubmit: boolean; errors: ValidationError[]; warnings: ValidationError[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate patient info
  errors.push(...validatePatientInfo(patientInfo, originHasTraumaService));

  // Validate incident details
  errors.push(...validateIncidentDetails(incidentDetails));

  // Validate disposition
  const edDispositionError = validateEDDisposition(disposition.edDisposition);
  if (edDispositionError) errors.push(edDispositionError);

  // Validate timeline (warnings)
  warnings.push(...validateTimeline(incidentDetails));

  // Cannot submit if there are errors or warnings
  const canSubmit = errors.length === 0 && warnings.length === 0;

  return { canSubmit, errors, warnings };
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('Trauma Case Creation - Patient Information Validation', () => {
  describe('First Name Validation', () => {
    it('TC-001: Should accept valid first name - English letters only', () => {
      const error = validateFirstName('John');
      expect(error).toBeNull();
    });

    it('TC-002: Should accept valid first name - English letters with spaces', () => {
      const error = validateFirstName('Mary Jane');
      expect(error).toBeNull();
    });

    it('TC-003: Should accept valid first name - Arabic characters', () => {
      const error = validateFirstName('محمد');
      expect(error).toBeNull();
    });

    it('TC-004: Should accept valid first name - Accented characters', () => {
      const error = validateFirstName('José');
      expect(error).toBeNull();
    });

    it('TC-005: Should accept valid first name - Mixed Arabic and English', () => {
      const error = validateFirstName('Ahmed محمد');
      expect(error).toBeNull();
    });

    it('TC-006: Should reject first name with numbers', () => {
      const error = validateFirstName('John123');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('First name can only include letters (including Arabic) and spaces.');
    });

    it('TC-007: Should reject first name with special characters', () => {
      const error = validateFirstName('John@Doe');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('First name can only include letters (including Arabic) and spaces.');
    });

    it('TC-008: Should reject empty first name', () => {
      const error = validateFirstName('');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Patient Name is required');
    });

    it('TC-009: Should reject first name with only spaces', () => {
      const error = validateFirstName('   ');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Patient Name is required');
    });
  });

  describe('Last Name Validation', () => {
    it('TC-010: Should accept valid last name - English letters only', () => {
      const error = validateLastName('Smith');
      expect(error).toBeNull();
    });

    it('TC-011: Should accept valid last name - English letters with spaces', () => {
      const error = validateLastName('Van Der Berg');
      expect(error).toBeNull();
    });

    it('TC-012: Should accept valid last name - Arabic characters', () => {
      const error = validateLastName('العلي');
      expect(error).toBeNull();
    });

    it('TC-013: Should accept valid last name - Accented characters', () => {
      const error = validateLastName('Müller');
      expect(error).toBeNull();
    });

    it('TC-014: Should reject last name with numbers', () => {
      const error = validateLastName('Smith123');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Last name can only include letters (including Arabic) and spaces.');
    });

    it('TC-015: Should reject last name with special characters', () => {
      const error = validateLastName("O'Brien");
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Last name can only include letters (including Arabic) and spaces.');
    });

    it('TC-016: Should reject empty last name', () => {
      const error = validateLastName('');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Patient Last Name is required');
    });
  });

  describe('National ID Validation', () => {
    it('TC-017: Should accept valid national ID - alphanumeric', () => {
      const error = validateNationalId('ABC123456');
      expect(error).toBeNull();
    });

    it('TC-018: Should accept valid national ID - numbers only', () => {
      const error = validateNationalId('123456789');
      expect(error).toBeNull();
    });

    it('TC-019: Should accept valid national ID - letters only', () => {
      const error = validateNationalId('ABCDEFGH');
      expect(error).toBeNull();
    });

    it('TC-020: Should reject national ID with special characters', () => {
      const error = validateNationalId('ABC-123');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('National ID can only contain letters and numbers.');
    });

    it('TC-021: Should reject national ID with spaces', () => {
      const error = validateNationalId('ABC 123');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('National ID can only contain letters and numbers.');
    });

    it('TC-022: Should reject empty national ID', () => {
      const error = validateNationalId('');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('National ID is required');
    });
  });

  describe('Age Validation', () => {
    it('TC-023: Should accept valid age - minimum value (1)', () => {
      const error = validateAge(1);
      expect(error).toBeNull();
    });

    it('TC-023A: Should reject age - zero (0)', () => {
      const error = validateAge(0);
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Age must be at least 1');
    });

    it('TC-024: Should accept valid age - maximum value (150)', () => {
      const error = validateAge(150);
      expect(error).toBeNull();
    });

    it('TC-025: Should accept valid age - typical value', () => {
      const error = validateAge(45);
      expect(error).toBeNull();
    });

    it('TC-026: Should reject negative age', () => {
      const error = validateAge(-5);
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Age must be at least 1');
    });

    it('TC-027: Should reject age exceeding maximum (151)', () => {
      const error = validateAge(151);
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Please enter a realistic age');
    });

    it('TC-028: Should reject non-numeric age', () => {
      const error = validateAge(NaN);
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Age must be a number');
    });

    it('TC-030: Should reject empty age', () => {
      const error = validateAge(undefined);
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Age is required');
    });
  });

  describe('Gender Validation', () => {
    it('TC-031: Should accept valid gender - MALE', () => {
      const error = validateGender('MALE');
      expect(error).toBeNull();
    });

    it('TC-032: Should accept valid gender - FEMALE', () => {
      const error = validateGender('FEMALE');
      expect(error).toBeNull();
    });

    it('TC-033: Should reject empty gender', () => {
      const error = validateGender('');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Please select a gender');
    });
  });

  describe('Phone Number Validation', () => {
    it('TC-034: Should accept valid phone number - 7 digits', () => {
      const error = validatePhoneNumber('1234567');
      expect(error).toBeNull();
    });

    it('TC-035: Should accept valid phone number - 15 digits', () => {
      const error = validatePhoneNumber('123456789012345');
      expect(error).toBeNull();
    });

    it('TC-036: Should accept valid phone number - with plus prefix', () => {
      const error = validatePhoneNumber('+1234567890');
      expect(error).toBeNull();
    });

    it('TC-037: Should reject phone number - too short (6 digits)', () => {
      const error = validatePhoneNumber('123456');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Phone numbers can only include digits and may start with +');
    });

    it('TC-038: Should reject phone number - too long (16 digits)', () => {
      const error = validatePhoneNumber('1234567890123456');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Phone numbers can only include digits and may start with +');
    });

    it('TC-039: Should reject phone number - contains special characters', () => {
      const error = validatePhoneNumber('123-456-7890');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Phone numbers can only include digits and may start with +');
    });

    it('TC-041: Should accept empty phone number (optional field)', () => {
      const error = validatePhoneNumber('');
      expect(error).toBeNull();
    });

    it('TC-042: Should reject phone number - plus in middle', () => {
      const error = validatePhoneNumber('123+4567890');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Phone numbers can only include digits and may start with +');
    });
  });

  describe('Origin Hospital Validation', () => {
    it('TC-043: Should accept valid origin hospital', () => {
      const error = validateOriginHospital('hospital-id-123');
      expect(error).toBeNull();
    });

    it('TC-044: Should reject empty origin hospital', () => {
      const error = validateOriginHospital('');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Origin Hospital is required');
    });
  });

  describe('Destination Hospital Validation', () => {
    it('TC-045: Should not require destination hospital when origin has trauma service', () => {
      const error = validateDestinationHospital('hospital-1', undefined, true);
      expect(error).toBeNull();
    });

    it('TC-046: Should require destination hospital when origin lacks trauma service', () => {
      const error = validateDestinationHospital('hospital-1', undefined, false);
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Destination Hospital is required because the selected origin hospital does not provide Trauma service.');
    });

    it('TC-047: Should accept valid destination hospital when required', () => {
      const error = validateDestinationHospital('hospital-1', 'hospital-2', false);
      expect(error).toBeNull();
    });
  });
});

describe('Trauma Case Creation - Incident Details Validation', () => {
  describe('Arrival Date Time Validation', () => {
    it('TC-049: Should accept valid arrival date time', () => {
      const error = validateArrivalDateTime('2025-11-10T14:00:00');
      expect(error).toBeNull();
    });

    it('TC-050: Should reject empty arrival date time', () => {
      const error = validateArrivalDateTime('');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Arrival Date Time is required');
    });
  });

  describe('Mode of Arrival Validation', () => {
    it('TC-051: Should accept valid mode of arrival', () => {
      const error = validateModeOfArrival('AMBULANCE_RED_CRESCENT');
      expect(error).toBeNull();
    });

    it('TC-052: Should reject empty mode of arrival', () => {
      const error = validateModeOfArrival('');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Mode of Arrival is required');
    });
  });

  describe('Mechanism of Injury Validation', () => {
    it('TC-053: Should accept valid mechanism of injury', () => {
      const error = validateMechanismOfInjury('MOTOR_VEHICLE_ACCIDENT');
      expect(error).toBeNull();
    });

    it('TC-054: Should reject empty mechanism of injury', () => {
      const error = validateMechanismOfInjury('');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Mechanism of Injury is required');
    });
  });
});

describe('Trauma Case Creation - Timeline Validation', () => {
  describe('Incident Time vs Arrival Time', () => {
    it('TC-055: Should allow incident time before arrival time', () => {
      const warnings = validateTimeline({
        arrivalDateTime: '2025-11-10T14:00:00',
        incidentDateTime: '2025-11-10T13:30:00',
      });
      expect(warnings).toHaveLength(0);
    });

    it('TC-056: Should allow incident time same as arrival time', () => {
      const warnings = validateTimeline({
        arrivalDateTime: '2025-11-10T14:00:00',
        incidentDateTime: '2025-11-10T14:00:00',
      });
      expect(warnings).toHaveLength(0);
    });

    it('TC-057: Should warn when incident time is after arrival time', () => {
      const warnings = validateTimeline({
        arrivalDateTime: '2025-11-10T14:00:00',
        incidentDateTime: '2025-11-10T14:30:00',
      });
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].field).toBe('incidentDetails.incidentDateTime');
      expect(warnings[0].message).toBe('Incident time happens after arrival time. Please confirm the order of events.');
    });
  });

  describe('Transfer Request Time vs Arrival Time', () => {
    it('TC-059: Should allow transfer request time after arrival time', () => {
      const warnings = validateTimeline({
        arrivalDateTime: '2025-11-10T14:00:00',
        transferRequestDateTime: '2025-11-10T14:30:00',
      });
      expect(warnings).toHaveLength(0);
    });

    it('TC-060: Should warn when transfer request time is before arrival time', () => {
      const warnings = validateTimeline({
        arrivalDateTime: '2025-11-10T14:00:00',
        transferRequestDateTime: '2025-11-10T13:30:00',
      });
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].field).toBe('incidentDetails.transferRequestDateTime');
    });
  });

  describe('Transfer Arrival Time Validation', () => {
    it('TC-061: Should allow transfer arrival time after transfer request time', () => {
      const warnings = validateTimeline({
        transferRequestDateTime: '2025-11-10T14:00:00',
        transferArrivalDateTime: '2025-11-10T14:30:00',
      });
      expect(warnings).toHaveLength(0);
    });

    it('TC-062: Should warn when transfer arrival time is before transfer request time', () => {
      const warnings = validateTimeline({
        transferRequestDateTime: '2025-11-10T14:00:00',
        transferArrivalDateTime: '2025-11-10T13:30:00',
      });
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].field).toBe('incidentDetails.transferArrivalDateTime');
    });

    it('TC-062A: Should warn when transfer arrival time is before initial arrival time', () => {
      const warnings = validateTimeline({
        arrivalDateTime: '2025-11-10T14:00:00',
        transferArrivalDateTime: '2025-11-10T13:30:00',
      });
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].field).toBe('incidentDetails.transferArrivalDateTime');
    });
  });
});

describe('Trauma Case Creation - Disposition Validation', () => {
  describe('ED Disposition Validation', () => {
    it('TC-067: Should accept valid ED disposition', () => {
      const error = validateEDDisposition('DISCHARGED');
      expect(error).toBeNull();
    });

    it('TC-068: Should reject empty ED disposition', () => {
      const error = validateEDDisposition('');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('ED Disposition is required');
    });
  });
});

describe('Trauma Case Creation - Form Submission Logic', () => {
  it('TC-075: Should allow submission with all valid data', () => {
    const result = canSubmitForm(
      {
        firstName: 'John',
        lastName: 'Smith',
        nationalId: 'ABC123',
        age: 45,
        gender: 'MALE',
        originHospitalId: 'hospital-1',
      },
      {
        arrivalDateTime: '2025-11-10T14:00:00',
        incidentDateTime: '2025-11-10T13:30:00',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        mechanismOfInjury: 'MOTOR_VEHICLE_ACCIDENT',
      },
      {
        edDisposition: 'DISCHARGED',
      }
    );
    expect(result.canSubmit).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('TC-072: Should block submission with timeline warnings', () => {
    const result = canSubmitForm(
      {
        firstName: 'John',
        lastName: 'Smith',
        nationalId: 'ABC123',
        age: 45,
        gender: 'MALE',
        originHospitalId: 'hospital-1',
      },
      {
        arrivalDateTime: '2025-11-10T14:00:00',
        incidentDateTime: '2025-11-10T14:30:00', // Warning: after arrival
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        mechanismOfInjury: 'MOTOR_VEHICLE_ACCIDENT',
      },
      {
        edDisposition: 'DISCHARGED',
      }
    );
    expect(result.canSubmit).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('TC-070: Should block submission with validation errors', () => {
    const result = canSubmitForm(
      {
        firstName: '', // Error: required
        lastName: 'Smith',
        nationalId: 'ABC123',
        age: 45,
        gender: 'MALE',
        originHospitalId: 'hospital-1',
      },
      {
        arrivalDateTime: '2025-11-10T14:00:00',
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        mechanismOfInjury: 'MOTOR_VEHICLE_ACCIDENT',
      },
      {
        edDisposition: 'DISCHARGED',
      }
    );
    expect(result.canSubmit).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('TC-046: Should require destination hospital when origin lacks trauma service', () => {
    const errors = validatePatientInfo(
      {
        firstName: 'John',
        lastName: 'Smith',
        nationalId: 'ABC123',
        age: 45,
        gender: 'MALE',
        originHospitalId: 'hospital-1',
        destinationHospitalId: undefined,
      },
      false // origin does not have trauma service
    );
    const destinationError = errors.find(e => e.field === 'patientInfo.destinationHospitalId');
    expect(destinationError).not.toBeUndefined();
    expect(destinationError?.message).toContain('Destination Hospital is required');
  });
});

describe('Trauma Case Creation - Edge Cases', () => {
  it('TC-085: Should accept age boundary - exactly 1 (minimum)', () => {
    const error = validateAge(1);
    expect(error).toBeNull();
  });

  it('TC-086: Should reject age boundary - zero (0)', () => {
    const error = validateAge(0);
    expect(error).not.toBeNull();
  });

  it('TC-087: Should accept age boundary - exactly 150', () => {
    const error = validateAge(150);
    expect(error).toBeNull();
  });

  it('TC-088: Should accept phone number boundary - exactly 7 digits', () => {
    const error = validatePhoneNumber('1234567');
    expect(error).toBeNull();
  });

  it('TC-089: Should accept phone number boundary - exactly 15 digits', () => {
    const error = validatePhoneNumber('123456789012345');
    expect(error).toBeNull();
  });

  it('TC-090: Should allow exact same times for timeline', () => {
    const warnings = validateTimeline({
      arrivalDateTime: '2025-11-10T14:00:00',
      incidentDateTime: '2025-11-10T14:00:00',
      transferRequestDateTime: '2025-11-10T14:00:00',
      transferArrivalDateTime: '2025-11-10T14:00:00',
    });
    expect(warnings).toHaveLength(0);
  });

  it('TC-092: Should trim national ID with leading/trailing spaces', () => {
    const error = validateNationalId('  ABC123  ');
    expect(error).toBeNull(); // Should pass after trim
  });

  it('TC-093: Should trim phone number with leading/trailing spaces', () => {
    const error = validatePhoneNumber('  1234567890  ');
    expect(error).toBeNull(); // Should pass after trim
  });
});

