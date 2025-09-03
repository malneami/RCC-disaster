# Patients Components Structure

This directory contains all the components used in the Patients module, organized by functionality and purpose.

## Directory Structure

```
components/
├── cards/                    # Patient information cards
│   ├── PatientDemographicsCard.tsx
│   ├── PatientContactCard.tsx
│   ├── PatientEmergencyCard.tsx
│   ├── PatientInsuranceCard.tsx
│   ├── PatientMedicalCard.tsx
│   └── index.ts
├── dialogs/                  # Modal dialogs
│   ├── MedicalRecordDetailsDialog.tsx
│   ├── MedicalRecordFormDialog.tsx
│   └── index.ts
├── forms/                    # Form components
│   ├── MultiStepPatientForm.tsx
│   ├── PatientActions.tsx
│   └── index.ts
├── tabs/                     # Tab content components
│   ├── PatientMedicalRecordsTab.tsx
│   ├── PatientOverviewTab.tsx
│   ├── PatientAccessLogsTab.tsx
│   ├── PatientTicketsTab.tsx
│   └── index.ts
├── table/                    # Table-related components
│   ├── PatientTableColumns.tsx
│   ├── PatientTabsContent.tsx
│   └── index.ts
├── PatientFormSteps/         # Multi-step form steps
│   ├── PersonalInfoStep.tsx
│   ├── ContactInfoStep.tsx
│   ├── MedicalInfoStep.tsx
│   ├── InsurancePrivacyStep.tsx
│   └── ReviewStep.tsx
├── PatientHeader.tsx         # Main patient header component
├── DuplicateDetection.tsx    # Duplicate detection component
├── PatientDetails.tsx        # Patient details component
├── PatientStatistics.tsx     # Patient statistics component
├── index.ts                  # Main export file
└── README.md                 # This file
```

## Component Categories

### Cards (`cards/`)
Display patient information in card format for the overview tab.

### Dialogs (`dialogs/`)
Modal dialogs for medical record management and detailed views.

### Forms (`forms/`)
Form components for patient creation, editing, and actions.

### Tabs (`tabs/`)
Content components for different tabs in the patient details view.

### Table (`table/`)
Table-related components for the patients list view.

### PatientFormSteps (`PatientFormSteps/`)
Individual steps for the multi-step patient form.

## Usage

### Importing Components

```typescript
// Import specific components
import { PatientDemographicsCard } from './components/cards';
import { MedicalRecordFormDialog } from './components/dialogs';
import { MultiStepPatientForm } from './components/forms';

// Or import from main index
import { PatientHeader, PatientOverviewTab } from './components';
```

### File Size Guidelines

- Each file should be under 200 lines
- Follow single responsibility principle
- Use index files for clean imports
- Maintain consistent naming conventions

## Best Practices

1. **Organization**: Group related components in subdirectories
2. **Naming**: Use descriptive, consistent names
3. **Exports**: Use index files for clean imports
4. **Size**: Keep files under 200 lines
5. **Reusability**: Make components as reusable as possible
6. **Documentation**: Add JSDoc comments for complex components
