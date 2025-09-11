# DateOfBirth to Age Migration Guide

This guide outlines the complete migration from `dateOfBirth` (DateTime) to `age` (Int) field across the entire system while preserving all existing data.

## 🎯 Migration Overview

**Goal**: Replace `dateOfBirth` field with `age` field across all tables and forms while preserving existing data.

**Strategy**: Gradual migration with backward compatibility during transition period.

## 📋 Migration Steps

### Phase 1: Database Schema Changes ✅

1. **Patient Schema Updated**:
   - Added `age Int?` field
   - Made `dateOfBirth DateTime?` optional (nullable)
   - Updated index from `dateOfBirth` to `age`

2. **Migration Scripts Created**:
   - `prisma/migrate-dateOfBirth-to-age.js` - Node.js migration script
   - `prisma/migrations/add-age-field-to-patient.sql` - SQL migration script

### Phase 2: Backend Updates ✅

1. **DTOs Updated**:
   - `CreatePatientDto`: Added `age?` field, made `dateOfBirth?` optional
   - `UpdatePatientDto`: Added `age?` field, made `dateOfBirth?` optional
   - `PatientSearchDto`: Added `ageMin?` and `ageMax?` instead of dateOfBirth ranges

2. **Frontend Interfaces Updated**:
   - `Patient` interface: Added `age?` field, made `dateOfBirth?` optional
   - `CreatePatientData` interface: Added `age?` field, made `dateOfBirth?` optional

### Phase 3: Data Migration (Manual Step)

**When database is accessible, run:**

```bash
# Option 1: Using Node.js script
cd /home/ali/rcc/apps/backend
node prisma/migrate-dateOfBirth-to-age.js

# Option 2: Using Prisma migration
npx prisma migrate dev --name add-age-field-to-patient

# Option 3: Using SQL directly
psql -d your_database -f prisma/migrations/add-age-field-to-patient.sql
```

### Phase 4: Frontend Form Updates (Next Steps)

**Forms to Update:**
1. `apps/frontend/src/components/Common/PatientForm.tsx`
2. `apps/frontend/src/pages/Patients/components/PatientFormSteps/PersonalInfoStep.tsx`
3. `apps/frontend/src/pages/Stroke/components/CreateStrokeCase/BasicInformationStep.tsx`
4. `apps/frontend/src/pages/Stemi/components/forms/PatientInfoStep.tsx`
5. `apps/frontend/src/pages/Trauma/components/forms/PatientInfoStep.tsx`
6. `apps/frontend/src/pages/Tickets/components/PatientSelect.tsx`
7. All other patient-related forms

**Changes Needed:**
- Replace `dateOfBirth` input fields with `age` number inputs
- Update validation rules
- Update form submission logic
- Update display logic in tables and cards

### Phase 5: Backend Service Updates (Next Steps)

**Services to Update:**
1. `apps/backend/src/modules/patients/patients.service.ts`
2. `apps/backend/src/modules/stemi-cases/services/stemi-patient.service.ts`
3. `apps/backend/src/modules/trauma-cases/services/trauma-patient.service.ts`
4. All other services that create/update patients

**Changes Needed:**
- Update patient creation logic to use `age` instead of `dateOfBirth`
- Update search/filter logic to use age ranges
- Update validation logic

### Phase 6: Display Updates (Next Steps)

**Components to Update:**
1. `apps/frontend/src/pages/Patients/components/table/PatientTableColumns.tsx`
2. `apps/frontend/src/pages/Patients/components/cards/PatientDemographicsCard.tsx`
3. All other components that display patient age

**Changes Needed:**
- Remove `calculateAge()` functions
- Display `age` field directly
- Update age display formatting

### Phase 7: Cleanup (Final Step)

**After all forms and services are updated:**
1. Remove `dateOfBirth` field from Patient schema
2. Remove `dateOfBirth` from all DTOs and interfaces
3. Remove all `calculateAge()` functions
4. Update database to drop `dateOfBirth` column

## 🔧 Migration Script Details

### Node.js Migration Script (`migrate-dateOfBirth-to-age.js`)

**Features:**
- Calculates age from existing `dateOfBirth` values
- Updates all patient records with calculated age
- Provides verification and sample data display
- Handles edge cases (leap years, etc.)

**Usage:**
```bash
cd /home/ali/rcc/apps/backend
node prisma/migrate-dateOfBirth-to-age.js
```

### SQL Migration Script (`add-age-field-to-patient.sql`)

**Features:**
- Adds `age` column to patients table
- Uses PostgreSQL `AGE()` function for accurate calculation
- Makes `dateOfBirth` nullable
- Adds index on age column
- Includes documentation comments

## 📊 Data Preservation

**All existing data will be preserved:**
- `dateOfBirth` values remain in database during transition
- Age is calculated and stored alongside `dateOfBirth`
- No data loss during migration
- Rollback possible by removing `age` column

## 🚨 Important Notes

1. **Backward Compatibility**: Both `dateOfBirth` and `age` fields exist during transition
2. **Data Accuracy**: Age calculation handles leap years and month/day edge cases
3. **Performance**: New index on `age` field for better query performance
4. **Validation**: Age must be positive integer (0-150 years)
5. **Forms**: All forms need to be updated to use age input instead of date picker

## ✅ Verification Steps

After migration:
1. Verify all patients have age values calculated
2. Test patient creation with age field
3. Test patient search by age ranges
4. Verify all forms work with age input
5. Test age display in tables and cards

## 🎯 Benefits After Migration

1. **Simplified Forms**: No more date picker for age
2. **Better Performance**: Integer comparison vs date calculation
3. **Easier Queries**: Age ranges instead of date ranges
4. **Consistent Data**: No calculation discrepancies
5. **Better UX**: Direct age input is more user-friendly

## 📝 Next Actions

1. **Run database migration** when database is accessible
2. **Update frontend forms** to use age input
3. **Update backend services** to handle age field
4. **Test thoroughly** before removing dateOfBirth
5. **Remove dateOfBirth** field after full migration

---

**Migration Status**: Phase 1 & 2 Complete ✅  
**Next Phase**: Frontend Form Updates  
**Estimated Time**: 2-3 hours for complete migration
