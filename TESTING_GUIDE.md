# Testing Guide for Trauma Case Creation

This guide explains how to run the test cases and test functions for the Trauma Case Creation feature.

## Table of Contents
1. [Backend Tests (Jest)](#backend-tests-jest)
2. [Frontend Tests (Vitest)](#frontend-tests-vitest)
3. [Manual Test Cases](#manual-test-cases)
4. [Test File Structure](#test-file-structure)

---

## Backend Tests (Jest)

The backend uses Jest for testing. The test file for timeline validation is located at:
```
apps/frontend/src/pages/Trauma/__tests__/trauma-timeline-validation.test.ts
```

### Prerequisites
- Node.js installed
- Dependencies installed (`npm install`)

### Running Backend Tests

#### Run all tests:
```bash
cd apps/backend
npm test
```

#### Run tests in watch mode (auto-rerun on file changes):
```bash
cd apps/backend
npm run test:watch
```

#### Run tests with coverage:
```bash
cd apps/backend
npm run test:cov
```

#### Run specific test file:
```bash
cd apps/backend
npm test trauma-timeline-validation
```

#### Run E2E tests:
```bash
cd apps/backend
npm run test:e2e
```

---

## Frontend Tests (Vitest)

The frontend uses Vitest for testing (configured to work with Vite).

### Setup (First Time Only)

1. Install Vitest and testing dependencies:
```bash
cd apps/frontend
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

2. Update `vite.config.ts` to include Vitest configuration (see below)

### Running Frontend Tests

#### Run all tests:
```bash
cd apps/frontend
npm test
```

#### Run tests in watch mode:
```bash
cd apps/frontend
npm run test:watch
```

#### Run tests with UI:
```bash
cd apps/frontend
npm run test:ui
```

#### Run specific test file:
```bash
cd apps/frontend
npm test trauma-timeline-validation
```

### Frontend Test Scripts

Add these scripts to `apps/frontend/package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## Manual Test Cases

The comprehensive test case document (`test-cases-trauma-case-creation.md`) contains 95 manual test cases that should be executed manually in the browser.

### Running Manual Tests

1. **Start the application:**
   ```bash
   # Terminal 1: Start backend
   cd apps/backend
   npm run dev

   # Terminal 2: Start frontend
   cd apps/frontend
   npm run dev
   ```

2. **Access the application:**
   - Frontend: http://localhost:5173 (or the port shown in terminal)
   - Backend: http://localhost:3001

3. **Navigate to Trauma Portal:**
   - Login to the application
   - Navigate to Trauma Portal
   - Click "Create Case" button

4. **Follow the test cases:**
   - Open `test-cases-trauma-case-creation.md`
   - Execute each test case (TC-001 through TC-095)
   - Document results (Pass/Fail) for each test case

### Test Case Checklist

Use the checklist at the end of `test-cases-trauma-case-creation.md` to track progress:
- [ ] All Critical priority test cases executed
- [ ] All High priority test cases executed
- [ ] All Medium priority test cases executed
- [ ] All Low priority test cases executed
- [ ] All timeline warnings verified
- [ ] All error messages match expected text

---

## Test File Structure

### Timeline Validation Test File

**Location:** `apps/frontend/src/pages/Trauma/__tests__/trauma-timeline-validation.test.ts`

**What it tests:**
- Incident time vs Arrival time validation
- Transfer request time vs Arrival time validation
- Transfer arrival time vs Transfer request time validation
- Transfer arrival time vs Initial arrival time validation
- Multiple warnings detection
- Edge cases (missing dates, invalid dates, same times)
- Form submission blocking logic
- Real-time validation updates

**Test Functions Included:**
- `validateTimeline()` - Core validation logic
- `validateTimelineInForm()` - Integration helper
- `formatTimelineWarningsForReview()` - UI formatting helper

---

## Quick Start Commands

### Run All Automated Tests
```bash
# Backend tests
cd apps/backend && npm test

# Frontend tests (after setup)
cd apps/frontend && npm test
```

### Run Specific Test Suite
```bash
# Backend: Timeline validation tests
cd apps/backend
npm test trauma-timeline-validation

# Frontend: Timeline validation tests
cd apps/frontend
npm test trauma-timeline-validation
```

### Development Workflow
```bash
# Terminal 1: Backend in watch mode
cd apps/backend
npm run dev

# Terminal 2: Frontend in watch mode
cd apps/frontend
npm run dev

# Terminal 3: Tests in watch mode
cd apps/frontend
npm run test:watch
```

---

## Troubleshooting

### Backend Tests Not Running
- Ensure dependencies are installed: `cd apps/backend && npm install`
- Check if Jest is configured: Look for `jest.config.js` or Jest config in `package.json`
- Verify Node.js version: `node --version` (should be >= 18.0.0)

### Frontend Tests Not Running
- Install Vitest: `cd apps/frontend && npm install --save-dev vitest`
- Check `vite.config.ts` has Vitest configuration
- Verify test file uses correct imports (Vitest instead of Jest)

### Tests Failing
- Check console output for specific error messages
- Verify test data matches expected format
- Ensure date strings are in ISO format (e.g., `2025-11-10T14:00:00`)

---

## Test Coverage Goals

- **Unit Tests:** Timeline validation logic (automated)
- **Integration Tests:** Form submission with warnings (automated)
- **E2E Tests:** Complete form flow (manual via test cases)
- **Manual Tests:** All 95 test cases in `test-cases-trauma-case-creation.md`

---

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/guide/)
- [Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)

