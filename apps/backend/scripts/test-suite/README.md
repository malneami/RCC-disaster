# EMS Automation Test Suite

This directory contains standalone TypeScript scripts for verifying the EMS, Zone Logic, and ETA systems of the RCC application.

## 📂 Structure

- **`utils.ts`**: Shared helpers for database cleanup, mock entity creation (Ambulance, Hospital, Patient), and distance calculations.
- **`test-zones-gps.ts` (Module 1)**: Tests Zone Entry/Exit, GPS Glitch Protection, Tug-of-War stability, and Boundary Hysteresis.
- **`test-eta-selection.ts` (Module 2)**: Tests Ambulance Selection logic (Nearest First) and ETA accuracy (OSRM integration).
- **`test-lifecycle.ts` (Module 3)**: Tests the full End-to-End Assignment Lifecycle (Creation -> Assignment -> PickUp -> DropOff -> Completion).
- **`test-chaos.ts` (Module 4)**: Stress testing (Load) and Invalid Data handling.

## 🚀 How to Run

Run each module using `ts-node` from the project root (`apps/backend` or root depending on your tsconfig, usually root):

```bash
# Module 1: Zone Logic & GPS
npx ts-node apps/backend/scripts/test-suite/ems/test-zones-gps.ts

# Module 2: ETA & Selection
npx ts-node apps/backend/scripts/test-suite/ems/test-eta-selection.ts

# Module 3: Lifecycle
npx ts-node apps/backend/scripts/test-suite/ems/test-lifecycle.ts

# Module 4: Chaos/Edge Cases
npx ts-node apps/backend/scripts/test-suite/ems/test-chaos.ts
```

## ✅ Coverage
The suite currently covers:
- Core Zone Transitions (Entry/Exit)
- Glitch Protection (Ghost points)
- Stability Checks (Hysteresis, Stale Data)
- Basic OSRM Integration & Selection Ranking
- Full "Happy Path" Workflow
- Basic Cancellation Flow
- High Volume Load Test (50+ assignments)
- Database Constraint Verification
