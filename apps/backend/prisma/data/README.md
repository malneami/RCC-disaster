# Spreadsheet Data Directory

This directory is for storing spreadsheet files (Excel/CSV) that will be processed and seeded into the database.

## How to Upload and Process Spreadsheet Data

### Step 1: Place Your Spreadsheet File

Copy your spreadsheet file (`.xlsx`, `.xls`, or `.csv`) to this directory:

```bash
# Example: Copy your file to the data directory
cp /path/to/your/stroke-data.xlsx apps/backend/prisma/data/
```

Or you can drag and drop the file directly into this folder using your file manager.

### Step 2: Run the Processing Script

Run the processing script with your file path:

```bash
# From the project root
cd apps/backend
npm run db:seed:spreadsheet prisma/data/your-file.xlsx stroke
```

Or using ts-node directly:

```bash
ts-node prisma/process-spreadsheet-seed.ts prisma/data/your-file.xlsx stroke
```

### Supported Case Types

- **stemi** - For STEMI case data
- **stroke** - For Stroke case data (automatically detected if filename contains "stroke")
- **trauma** - For Trauma case data

The script will auto-detect the case type from the filename if you don't specify it.

### Example Commands

```bash
# Process stroke data (auto-detected from filename)
ts-node prisma/process-spreadsheet-seed.ts prisma/data/stroke-cases.xlsx

# Process STEMI data
ts-node prisma/process-spreadsheet-seed.ts prisma/data/stemi-data.xlsx stemi

# Process trauma data
ts-node prisma/process-spreadsheet-seed.ts prisma/data/trauma-cases.csv trauma
```

## Spreadsheet Format Requirements

### Stroke Cases

The script supports the following column names (case-insensitive, with flexible naming):

**Required/Important Columns:**
- `Date of admission` - Patient arrival date/time
- `Patient ID` - Patient identifier (will create patient if not exists)
- `Facility name` - Hospital/facility name
- `Type of Stroke` - ISCHEMIC, HEMORRHAGIC, or TIA

**Timing Columns:**
- `Date of Onset` - Date when symptoms started
- `Time of Onset` - Time when symptoms started
- `Triage Time` - When patient was triaged
- `Time of Physician assessment` - When physician assessed patient
- `Time of Non contrast CT brain performance` - CT scan time
- `Time of Swallowing Screening` - Swallowing screening time
- `Time of ordering IV thrombolysis` - When thrombolysis was ordered
- `Time of administering IV thrombolysis` - When thrombolysis was given
- `Time of MT` - Mechanical thrombectomy time

**Clinical Columns:**
- `Mode of arrival` - How patient arrived (AMBULANCE_RED_CRESCENT, PRIVATE_CAR, etc.)
- `Swallowing Screening Performed?` - Yes/No
- `Swallowing Screening Result` - Pass/Fail/Inconclusive
- `Candidate for IV thrombolysis?` - Yes/No
- `Candidate for Mechanical thrombectomy (MT)?` - Yes/No
- `Disposition?` - Patient disposition

**Optional Columns:**
- `Gender` - Patient gender
- `Age` - Patient age
- `EMS advance notification received` - Yes/No
- `If transferred from another hospital, what is the reason for referral?` - Transfer reason
- `If no, reason for not giving IV thrombolysis?` - Contraindication reason
- `If IV thrombolysis is delayed, provide medical reason & justification` - Delay reason
- `If no, reason for not performing Mechanical thrombectomy (MT)` - Contraindication reason
- `If Mechanical thrombectomy (MT) is delayed, provide medical reason & justification` - Delay reason
- `Cluster name` - Metadata (not currently used)

### STEMI Cases

The script supports the following column names (case-insensitive, with flexible naming):

**Required/Important Columns:**
- `Date of admission` or `Date of admissionDD-MONTH-YY` - Patient arrival date (DD-MONTH-YY format, e.g., "01-JAN-23")
- `Patient ID` or `ID` - Patient identifier (will create patient if not exists)
- `Facility name` - Hospital/facility name
- `Mode of arrival` - How patient arrived (AMBULANCE_RED_CRESCENT, PRIVATE_CAR, etc.)

**Timing Columns (hh:mm format):**
- `Triage Time (Door In) (hh:mm)` - When patient was triaged
- `Time of first ECG (hh:mm)` - First ECG time
- `Time of Thrombolytic administration(hh:mm)` - When thrombolysis was given
- `Door out time(hh:mm)` - When patient left the facility
- `Time of Primary PCI began(hh:mm)` - When PCI procedure started

**Clinical Columns:**
- `Gender` - Patient gender
- `Age` or `Age in years` - Patient age
- `Referred From Hospital` - If patient was transferred from another hospital (indicates transfer case)
- `Referred To Hospital` - If patient was transferred to another hospital (destination)
- `Did the patient given (administered) thrombolytic medication?` - Yes/No
- `PCI location` - Location of PCI procedure

**Vital Signs Columns:**
- `Systolic Blood Pressure` - Systolic BP (mmHg)
- `Diastolic Blood Pressure` - Diastolic BP (mmHg)
- `Heart Rate` - Heart rate (bpm)
- `Glasgow Coma Scale` or `GCS` - Glasgow Coma Scale score
- `Respiratory Rate` or `RR` - Respiratory rate (per minute)
- `Oxygen Saturation` or `O2 Sat` - Oxygen saturation (%)
- `Blood Glucose` - Blood glucose level (mg/dL)
- `Pain Score` - Pain score (0-10)

**Symptoms Columns:**
- `Chest Pain` - Chest pain description
- `Dyspnea` - Dyspnea description
- `Extremities` - Extremities assessment
- `Edema` - Edema description

**Outcome/Disposition Columns:**
- `ED disposition` or `Disposition` - Emergency department disposition
- `ISS Score` - Injury Severity Score (if applicable)
- `Survival Prediction` - Survival prediction
- `Background Risk` - Background risk assessment
- `Other` - Other clinical notes

**Optional Columns:**
- `Cluster` - Metadata (not currently used)

**Notes:**
- Date format: DD-MONTH-YY (e.g., "15-DEC-22", "01-JAN-23")
- Time format: hh:mm (e.g., "08:30", "14:15")
- If "Referred From Hospital" is filled, the case is treated as a TRANSFER case
- The script automatically calculates timing metrics (door-to-ECG, door-to-balloon, etc.)
- KPI flags are automatically calculated based on timing thresholds

### Trauma Cases

See the script for supported column mappings for Trauma cases.

## Notes

- The script will automatically create patients if they don't exist based on Patient ID
- Hospitals will be created if they don't exist based on Facility name
- Date/time parsing is flexible and supports various formats
- Missing or empty values are handled gracefully (set to null)
- The script processes data in batches and shows progress every 10 rows
- Errors for individual rows are logged but don't stop the entire process

## Troubleshooting

**Error: "No hospitals found"**
- Run the main seed script first: `npm run db:seed`

**Error: "No users found"**
- Run the main seed script first: `npm run db:seed`

**Date parsing issues**
- Ensure dates are in a recognizable format (MM/DD/YYYY, YYYY-MM-DD, etc.)
- For combined date/time, use separate columns or a single datetime column

**Column not found**
- Column names are case-insensitive and support various formats
- Check the script for alternative column name mappings
- You can modify the script to add your specific column names

