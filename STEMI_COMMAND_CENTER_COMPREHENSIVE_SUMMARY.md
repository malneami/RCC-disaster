# STEMI Command Center - Component Summary

## KPIMetrics Component
**Calculation**: Displays total STEMI cases, PCI procedures, mortality rate, and overall compliance rate
- Total Cases: Count of all STEMI cases in selected period
- Total PCI: Count of cases that received primary PCI treatment
- Mortality Rate: (Deceased cases / Total cases) × 100
- Compliance Rate: Average of key KPI percentages

## TrafficLightSystem Component
**Calculation**: Shows color-coded compliance status for each KPI
- Green: ≥90% compliance (Excellent)
- Yellow: 75-89.9% compliance (Good)  
- Red: <75% compliance (Needs Improvement)

## Door-to-ECG Time (KPI 1)
**Calculation**: (First ECG Time - Triage Time) in minutes
- Target: ≤10 minutes
- Compliance: (Cases within 10 minutes / Total cases) × 100
- Status: Green ≥90%, Yellow 75-89%, Red <75%

## Door-to-Balloon Time - Direct Cases (KPI 2 Direct)
**Calculation**: (Balloon Inflation Time - Triage Time) in minutes
- Target: ≤90 minutes
- Eligibility: Only PCI-eligible direct cases
- Compliance: (Direct cases within 90 minutes / PCI-eligible direct cases) × 100
- Status: Green ≥90%, Yellow 75-89%, Red <75%

## Door-to-Balloon Time - Transfer Cases (KPI 2 Transfer)
**Calculation**: (Balloon Inflation Time - Triage Time) in minutes
- Target: ≤120 minutes
- Eligibility: Only PCI-eligible transfer cases
- Compliance: (Transfer cases within 120 minutes / PCI-eligible transfer cases) × 100
- Status: Green ≥90%, Yellow 75-89%, Red <75%

## Door-to-Needle Time (KPI 3)
**Calculation**: (Thrombolytic Administration Time - Triage Time) in minutes
- Target: ≤30 minutes
- Eligibility: Only transfer cases where thrombolytic was given
- Compliance: (Thrombolytic cases within 30 minutes / Total thrombolytic transfer cases) × 100
- Status: Green ≥90%, Yellow 75-89%, Red <75%

## RCC Activation Time (KPI 4)
**Calculation**: (Door Out Time - EMS Contact Time) in minutes
- Target: ≤15 minutes
- Eligibility: Only PCI-eligible transfer cases with EMS contact
- Compliance: (Transfer cases within 15 minutes / PCI-eligible transfer cases with EMS contact) × 100
- Status: Green ≥90%, Yellow 75-89%, Red <75%

## Door-In-Door-Out Time (KPI 5)
**Calculation**: (Door Out Time - Triage Time) in minutes
- Target: ≤30 minutes
- Eligibility: Only PCI-eligible transfer cases
- Compliance: (Transfer cases within 30 minutes / PCI-eligible transfer cases) × 100
- Status: Green ≥90%, Yellow 75-89%, Red <75%

## Primary PCI Success Rate (KPI 6)
**Calculation**: (Successful PCI cases / Total primary PCI cases) × 100
- Target: ≥95%
- Eligibility: All primary PCI cases
- Status: Green ≥95%, Yellow 85-94%, Red <85%

## Mortality Rate (KPI 9)
**Calculation**: (Deceased cases / Total cases) × 100
- Target: ≤5%
- Eligibility: All cases
- Status: Green ≤5%, Yellow 5-10%, Red >10%

## Follow-up Call Completion (KPI 11)
**Calculation**: (Completed follow-up calls / Total cases) × 100
- Target: ≥90%
- Eligibility: All cases
- Status: Green ≥90%, Yellow 75-89%, Red <75%

## VisualAnalytics Component
**Calculation**: Generates interactive charts showing:
- Referral Source Distribution: Direct vs Transfer cases
- PCI Cases Breakdown: Thrombolytic, Primary PCI, Transferred cases
- DIDO Compliance: Compliant vs Non-compliant cases
- Treatment Distribution: PCI Only vs Thrombolysis Only
- Patient Outcomes: Survived vs Deceased cases
- Hospital Performance: D2B compliance by hospital

## HospitalPerformanceHeatmap Component
**Calculation**: Hospital-wise performance matrix showing:
- Door-to-ECG Compliance: (Compliant cases / Valid cases) × 100
- Door-to-Needle Compliance: (Compliant cases / Valid cases) × 100
- Door-to-Balloon Compliance: (Compliant cases / Valid cases) × 100
- Activation-to-Door-Out Compliance: (Compliant cases / Valid cases) × 100
- Door-In-Door-Out Compliance: (Compliant cases / Valid cases) × 100
- Data Quality Score: Based on data completeness and accuracy
- Data Completeness Score: (Populated fields / Total fields) × 100

## Overall Compliance Rate
**Calculation**: Average of key KPI percentages (D2ECG, D2B Direct, D2B Transfer, D2N, DIDO)

## Data Quality Score
**Calculation**: Based on data completeness and accuracy metrics
- Data Completeness: (Populated fields / Total fields) × 100
- Quality Score: Completeness score + accuracy adjustments
