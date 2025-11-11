# Quick Start: Running Tests

## 🚀 Quick Commands

### Backend Tests (Jest)
```bash
cd apps/backend
npm test
```

### Frontend Tests (Vitest) - Setup Required First
```bash
# First time setup
cd apps/frontend
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Then run tests
npm test
```

### Manual Test Cases
1. Start the app: `npm run dev` (from root)
2. Open browser: http://localhost:5173
3. Follow test cases in `test-cases-trauma-case-creation.md`

---

## 📋 Step-by-Step Setup

### 1. Install Frontend Test Dependencies

```bash
cd apps/frontend
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### 2. Run Backend Tests

```bash
cd apps/backend
npm test
```

### 3. Run Frontend Tests

```bash
cd apps/frontend
npm test

# Or run specific test file
npm test trauma-case-validation
npm test trauma-timeline-validation
```

### 4. Run Tests in Watch Mode (Auto-rerun)

```bash
# Backend
cd apps/backend
npm run test:watch

# Frontend
cd apps/frontend
npm run test:watch
```

### 5. Run Specific Test File

```bash
# Backend
cd apps/backend
npm test trauma-timeline-validation

# Frontend - Comprehensive tests
cd apps/frontend
npm test trauma-case-validation

# Frontend - Timeline validation only
cd apps/frontend
npm test trauma-timeline-validation
```

---

## 📝 Test Files

- **Comprehensive Automated Tests:** `apps/frontend/src/pages/Trauma/__tests__/trauma-case-validation.test.ts`
  - Patient Information Validation (names, national ID, age, gender, phone, hospitals)
  - Incident Details Validation (arrival time, mode of arrival, mechanism of injury)
  - Timeline Validation (incident vs arrival, transfer times)
  - Disposition Validation (ED Disposition)
  - Form Submission Logic
  - Edge Cases

- **Timeline Validation Tests:** `apps/frontend/src/pages/Trauma/__tests__/trauma-timeline-validation.test.ts`
  - Focused on timeline logic warnings

- **Manual Test Cases:** `test-cases-trauma-case-creation.md`
  - 95 comprehensive manual test cases

---

## ✅ Expected Output

### Successful Test Run
```
✓ Trauma Case Creation - Patient Information Validation (49)
  ✓ First Name Validation (9)
  ✓ Last Name Validation (7)
  ✓ National ID Validation (6)
  ✓ Age Validation (8)
  ✓ Gender Validation (3)
  ✓ Phone Number Validation (8)
  ✓ Origin Hospital Validation (2)
  ✓ Destination Hospital Validation (3)

✓ Trauma Case Creation - Incident Details Validation (6)
  ✓ Arrival Date Time Validation (2)
  ✓ Mode of Arrival Validation (2)
  ✓ Mechanism of Injury Validation (2)

✓ Trauma Case Creation - Timeline Validation (6)
  ✓ Incident Time vs Arrival Time (3)
  ✓ Transfer Request Time vs Arrival Time (2)
  ✓ Transfer Arrival Time Validation (3)

✓ Trauma Case Creation - Disposition Validation (2)
  ✓ ED Disposition Validation (2)

✓ Trauma Case Creation - Form Submission Logic (4)
✓ Trauma Case Creation - Edge Cases (6)

Test Files  1 passed (1)
     Tests  73 passed (73)
```

---

## 🐛 Troubleshooting

**"Cannot find module 'vitest'"**
→ Run: `cd apps/frontend && npm install --save-dev vitest`

**"Tests not found"**
→ Ensure test files end with `.test.ts` or `.spec.ts`

**"Module not found"**
→ Check that all dependencies are installed: `npm install`

---

For detailed information, see [TESTING_GUIDE.md](./TESTING_GUIDE.md)

