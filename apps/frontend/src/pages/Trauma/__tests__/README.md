# Trauma Case Creation Test Suite

This directory contains comprehensive test files for the Trauma Case Creation feature.

## Test Files

### 1. `trauma-case-validation.test.ts` (Comprehensive)
**Coverage:** All validation rules for trauma case creation

**Test Categories:**
- ✅ Patient Information Validation (49 tests)
  - First Name (9 tests)
  - Last Name (7 tests)
  - National ID (6 tests)
  - Age (8 tests) - Minimum 1, Maximum 150
  - Gender (3 tests)
  - Phone Number (8 tests)
  - Origin Hospital (2 tests)
  - Destination Hospital (3 tests)
- ✅ Incident Details Validation (6 tests)
  - Arrival Date Time (2 tests)
  - Mode of Arrival (2 tests)
  - Mechanism of Injury (2 tests)
- ✅ Timeline Validation (6 tests)
  - Incident vs Arrival Time (3 tests)
  - Transfer Request vs Arrival Time (2 tests)
  - Transfer Arrival Time (3 tests)
- ✅ Disposition Validation (2 tests)
  - ED Disposition (2 tests)
- ✅ Form Submission Logic (4 tests)
- ✅ Edge Cases (6 tests)

**Total:** ~73 automated tests

### 2. `trauma-timeline-validation.test.ts` (Focused)
**Coverage:** Timeline validation logic only

**Test Categories:**
- Timeline warnings for incident time
- Timeline warnings for transfer request time
- Timeline warnings for transfer arrival time
- Multiple warnings detection
- Edge cases
- Form submission blocking

**Total:** ~15 automated tests

## Running Tests

### Run All Tests
```bash
cd apps/frontend
npm test
```

### Run Specific Test File
```bash
# Comprehensive validation tests
npm test trauma-case-validation

# Timeline validation tests only
npm test trauma-timeline-validation
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with UI
```bash
npm run test:ui
```

## Test Coverage

The automated tests cover:
- ✅ All validation rules from `test-cases-trauma-case-creation.md`
- ✅ Patient information validation (names, national ID, age, gender, phone)
- ✅ Hospital selection validation (origin and destination)
- ✅ Incident details validation
- ✅ Timeline logic warnings
- ✅ Disposition validation
- ✅ Form submission blocking logic
- ✅ Edge cases and boundary conditions

## Manual Test Cases

For complete manual testing, refer to:
- `test-cases-trauma-case-creation.md` - 95 comprehensive manual test cases

## Test Functions

### Validation Functions
- `validateFirstName()` - First name validation
- `validateLastName()` - Last name validation
- `validateNationalId()` - National ID validation
- `validateAge()` - Age validation (1-150)
- `validateGender()` - Gender validation (MALE/FEMALE)
- `validatePhoneNumber()` - Phone number validation (optional)
- `validateEmergencyPhone()` - Emergency phone validation (optional)
- `validateOriginHospital()` - Origin hospital validation
- `validateDestinationHospital()` - Destination hospital validation (conditional)
- `validateArrivalDateTime()` - Arrival date time validation
- `validateModeOfArrival()` - Mode of arrival validation
- `validateMechanismOfInjury()` - Mechanism of injury validation
- `validateEDDisposition()` - ED disposition validation
- `validateTimeline()` - Timeline validation (returns warnings)

### Integration Functions
- `validatePatientInfo()` - Complete patient info validation
- `validateIncidentDetails()` - Complete incident details validation
- `canSubmitForm()` - Complete form validation (errors + warnings)

## Test Case Mapping

Each test is mapped to a test case from `test-cases-trauma-case-creation.md`:
- Test names include the TC-XXX identifier
- Tests match expected results from the manual test cases
- All critical and high priority test cases are covered

## Notes

- Age validation: Minimum is 1 (not 0)
- Phone numbers: Optional field, 7-15 digits, may start with +
- Email validation: Removed (not required)
- Timeline warnings: Block form submission
- Validation errors: Block form submission

