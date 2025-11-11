# Stroke Case Creation - Test Suite

This test suite validates all field validations for the Create Stroke Case feature.

## Prerequisites

Make sure you have the following dependencies installed:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

## Running the Tests

### Run all validation tests:
```bash
cd apps/frontend
npm test -- CreateStrokeCaseDialog.validation.test.tsx
```

### Run tests in watch mode:
```bash
npm run test:watch
```

### Run tests with UI:
```bash
npm run test:ui
```

### Run tests with coverage:
```bash
npm run test:coverage
```

### Run specific test category:
```bash
npm test -- CreateStrokeCaseDialog.validation.test.tsx -t "First Name"
```

## Test Coverage

The test suite covers:

### Step 1: Patient Information
- ✅ First Name validation (7 tests)
  - Valid: letters only, letters with spaces, Arabic characters
  - Invalid: numbers, special characters, empty, only spaces
- ✅ Last Name validation (5 tests)
  - Valid: letters only, letters with spaces
  - Invalid: numbers, special characters, empty
- ✅ National ID validation (6 tests)
  - Valid: alphanumeric, numbers only, letters only
  - Invalid: special characters, spaces, empty
- ✅ Age validation (8 tests)
  - Valid: typical age, maximum (150)
  - Invalid: 0, negative, exceeds max, non-numeric, empty, decimal
- ✅ Gender validation (4 tests)
  - Valid: MALE, FEMALE
  - Invalid: empty, UNKNOWN
- ✅ Phone Number validation (9 tests)
  - Valid: 7-15 digits, with + prefix, empty (optional)
  - Invalid: too short, too long, letters, special characters, + in middle
- ✅ Email validation (6 tests)
  - Valid: standard format, empty (optional)
  - Invalid: missing @, missing domain, missing TLD, multiple @

## Test Results

After running the tests, you'll see a summary showing:
- ✅ Passed tests
- ❌ Failed tests
- Total count per category

## Notes

1. **Age Validation (TC-019)**: The test expects age 0 to be rejected, but the current schema allows `min(0)`. If the test fails, the schema may need to be updated to use `.min(1)` or add custom validation.

2. **Optional Fields**: Phone Number and Email are optional fields and should accept empty values.

3. **Arabic Support**: Name fields support Arabic characters in addition to English letters.

4. **Timeline Validations**: Timeline validation tests are not included in this file as they require UI interaction and date parsing. These should be tested separately with integration tests.

## Adding New Tests

To add new test cases:

1. Add the test case to `test-cases-stroke-case-creation.md`
2. Add the corresponding test function in `CreateStrokeCaseDialog.validation.test.tsx`
3. Use the `addTestResult()` helper to track results
4. Follow the existing test structure

## Troubleshooting

### Tests not running
- Ensure vitest is installed: `npm install --save-dev vitest`
- Check that `vite.config.ts` includes vitest configuration

### Import errors
- Ensure all dependencies are installed
- Check that the validation schema is correctly imported

### Age 0 test failing
- This is expected if the schema allows `min(0)`
- Update the schema to reject age 0 if that's the requirement

