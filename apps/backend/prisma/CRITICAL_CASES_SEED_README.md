# Critical Cases Seed Data

This seed file creates comprehensive test data for STEMI, Stroke, and Trauma cases with realistic timestamps and quality metrics.

## What It Creates

### Cases (36 total)
- **12 STEMI Cases** - Heart attack cases with PCI/thrombolysis data
- **12 Stroke Cases** - Brain attack cases with thrombolysis/thrombectomy data  
- **12 Trauma Cases** - Injury cases with surgery and trauma scores

### Transfer Tickets
- **~60% of cases have transfer tickets** (cases requiring hospital transfer)
- **~40% are standalone cases** (treated at origin hospital)

### Supporting Data
- **5 Hospitals** - Different healthcare facilities
- **5 Users** - Medical staff (doctors, nurses, admins)
- **10 Patients** - Diverse patient profiles with medical history

## Quality Metrics Calculated

### STEMI Cases
- **Door to ECG**: ≤10 minutes (KPI 1)
- **Door to Balloon**: ≤90 minutes (KPI 2) 
- **Door to Needle**: ≤30 minutes (KPI 3)
- **Door In Door Out**: ≤120 minutes (KPI 4)

### Stroke Cases
- **Door to CT**: ≤25 minutes (KPI 1)
- **Door to Needle**: ≤60 minutes (KPI 2)
- **Door In Door Out**: ≤120 minutes (KPI 3)

### Trauma Cases
- **Door to Surgery**: ≤60 minutes (KPI 1)
- **Door In Door Out**: ≤120 minutes (KPI 2)

## Realistic Data Features

### Timestamps
- Cases spread over last 30 days
- Realistic time intervals between events
- Proper chronological order of medical events

### Clinical Data
- **STEMI**: Heart scores, ECG results, PCI data, thrombolysis
- **Stroke**: NIHSS scores, CT results, thrombolysis, thrombectomy
- **Trauma**: ISS scores, GCS, injury types, surgery data

### Outcomes
- Success rates, complications, readmissions
- Follow-up call completion rates
- Discharge dates and readmission tracking

## Usage

### Run the Seed
```bash
# From backend directory
npm run db:seed:critical
```

### Or run directly
```bash
# Compile and run
npx tsc prisma/seed-critical-cases.ts --outDir dist --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck
node dist/prisma/seed-critical-cases.js
```

### Or use the helper script
```bash
node run-critical-cases-seed.js
```

## Data Verification

After running the seed, you can verify the data:

1. **Check Prisma Studio**: `npx prisma studio`
2. **Query specific cases**: Look for cases with/without transfer tickets
3. **Verify quality metrics**: Check that calculated metrics are stored
4. **Test frontend**: View cases in the respective portals

## Case Distribution

### With Transfer Tickets (~60%)
- Cases requiring specialized care at another hospital
- Have associated transfer tickets
- Include door out times and destination hospitals

### Without Transfer Tickets (~40%)  
- Cases treated entirely at origin hospital
- No transfer tickets created
- Standalone critical cases

## Notes

- All cases have realistic medical data and timestamps
- Quality metrics are automatically calculated and stored
- KPI achievement flags are set based on time targets
- Cases include both successful and unsuccessful outcomes
- Data is suitable for testing dashboards and reporting features
