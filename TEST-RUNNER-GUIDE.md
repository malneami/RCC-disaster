# Stroke Case Creation – Test Runner Guide

## Quick Start

### Run the automated regression suite
```bash
cd apps/frontend
npm test -- CreateStrokeCaseDialog.test.tsx
```

### Useful variants
```bash
# Watch mode
npm run test:watch -- CreateStrokeCaseDialog.test.tsx

# Vitest UI
npm run test:ui

# Coverage report
npm run test:coverage
```

## What the suite covers

- **Patient information validation**  
  Required fields (name, national ID, age, gender) and optional formats (phone, email).

- **Hospital routing logic**  
  Destination hospital requirement toggled by origin hospital service availability.

- **Timeline sanity checks**  
  Symptom onset vs admission and a submission guard when warnings are present.

Each scenario verifies both the inline error state and the review-step guardrails to mirror the UX described in the stroke portal update.

## Reading the output

- Each test prints a concise scenario name (e.g. “requires destination hospital when origin lacks stroke service”).
- Timeline warnings are rendered twice (inline field alert + review card); the test asserts both are present.
- The final test asserts the `Create Case` action remains disabled while warnings exist, matching the submission block requirement.

## File layout

```
apps/frontend/src/pages/Stroke/components/__tests__/
├── CreateStrokeCaseDialog.test.tsx   # Automated suite (6 scenarios)
└── setupTests.ts                     # Shared RTL/Vitest setup
```

## Troubleshooting tips

- **Missing hospitals?** The test suite stubs `hospitalService.getAllHospitals`; add IDs there if you extend coverage.
- **Date warnings not firing?** Ensure values are ISO strings (the test uses the component's datetime-local inputs so conversions run exactly as in production).
- **Flaky selects?** The helper opens the underlying MUI select via the label text; if labels change, update `selectOption()` in the test file.

## Next steps

1. Run `npm test -- CreateStrokeCaseDialog.test.tsx`.
2. Inspect failures in the console (Vitest stack traces include rendered markup).
3. Fix validation/timeline logic in `CreateStrokeCaseDialog` or its child steps.
4. Re-run to confirm a green suite before shipping.
