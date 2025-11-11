# Test Cases for Stroke Portal Case Creation

## Overview
This document contains comprehensive test cases for the Create Case feature in the Stroke Portal, covering all validation rules and timeline warnings implemented.

---

## Step 1: Patient Information Validations

### 1.1 First Name Validation

#### TC-001: Valid First Name - Letters Only
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "John" in First Name field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-002: Valid First Name - Letters with Spaces
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "Mary Jane" in First Name field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-003: Valid First Name - Arabic Characters
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "محمد" in First Name field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-004: Invalid First Name - Contains Numbers
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "John123" in First Name field
  2. Click Next
- **Expected Result:** 
  - Error message: "First name can only include letters (including Arabic) and spaces."
  - Form does not proceed to next step

#### TC-005: Invalid First Name - Contains Special Characters
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "John@Doe" in First Name field
  2. Click Next
- **Expected Result:** 
  - Error message: "First name can only include letters (including Arabic) and spaces."
  - Form does not proceed to next step

#### TC-006: Invalid First Name - Empty Field
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Leave First Name field empty
  2. Click Next
- **Expected Result:** 
  - Error message: "Patient Name is required"
  - Form does not proceed to next step

#### TC-007: Invalid First Name - Only Spaces
- **Priority:** Medium
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "   " (only spaces) in First Name field
  2. Click Next
- **Expected Result:** 
  - Error message: "Patient Name is required"
  - Form does not proceed to next step

---

### 1.2 Last Name Validation

#### TC-008: Valid Last Name - Letters Only
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "Smith" in Last Name field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-009: Valid Last Name - Letters with Spaces
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "Van Der Berg" in Last Name field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-010: Invalid Last Name - Contains Numbers
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "Smith123" in Last Name field
  2. Click Next
- **Expected Result:** 
  - Error message: "Last name can only include letters (including Arabic) and spaces."
  - Form does not proceed to next step

#### TC-011: Invalid Last Name - Contains Special Characters
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "O'Brien" in Last Name field
  2. Click Next
- **Expected Result:** 
  - Error message: "Last name can only include letters (including Arabic) and spaces."
  - Form does not proceed to next step

#### TC-012: Invalid Last Name - Empty Field
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Leave Last Name field empty
  2. Click Next
- **Expected Result:** 
  - Error message: "Patient Last Name is required"
  - Form does not proceed to next step

---

### 1.3 National ID Validation

#### TC-013: Valid National ID - Alphanumeric Only
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "ABC123" in National ID field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-014: Valid National ID - Numbers Only
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "1234567890" in National ID field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-015: Valid National ID - Letters Only
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "ABCDEF" in National ID field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-016: Invalid National ID - Contains Special Characters
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "ABC-123" in National ID field
  2. Click Next
- **Expected Result:** 
  - Error message: "National ID can only contain letters and numbers."
  - Form does not proceed to next step

#### TC-017: Invalid National ID - Contains Spaces
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "ABC 123" in National ID field
  2. Click Next
- **Expected Result:** 
  - Error message: "National ID can only contain letters and numbers."
  - Form does not proceed to next step

#### TC-018: Invalid National ID - Empty Field
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Leave National ID field empty
  2. Click Next
- **Expected Result:** 
  - Error message: "National ID is required"
  - Form does not proceed to next step

---

### 1.4 Age Validation

#### TC-019: Valid Age - Minimum Value (0)
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "0" in Age field
  2. Click Next
- **Expected Result:** 
  - Error message: "Please enter a realistic age"
  - Form does not proceed to next step

#### TC-020: Valid Age - Maximum Value (150)
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "150" in Age field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-021: Valid Age - Typical Value
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "45" in Age field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-022: Invalid Age - Negative Number
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "-5" in Age field
  2. Click Next
- **Expected Result:** 
  - Error message: "Age must be a positive number"
  - Form does not proceed to next step

#### TC-023: Invalid Age - Exceeds Maximum (151)
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "151" in Age field
  2. Click Next
- **Expected Result:** 
  - Error message: "Please enter a realistic age"
  - Form does not proceed to next step

#### TC-024: Invalid Age - Non-Numeric Value
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "abc" in Age field
  2. Click Next
- **Expected Result:** 
  - Error message: "Age must be a number"
  - Form does not proceed to next step

#### TC-025: Invalid Age - Decimal Number
- **Priority:** Medium
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "45.5" in Age field
  2. Click Next
- **Expected Result:** 
  - Error message: "Age must be a number" (or validation may accept it)
  - Form behavior depends on implementation

#### TC-026: Invalid Age - Empty Field
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Leave Age field empty
  2. Click Next
- **Expected Result:** 
  - Error message: "Age is required"
  - Form does not proceed to next step

---

### 1.5 Gender Validation

#### TC-027: Valid Gender - MALE
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Select "MALE" from Gender dropdown
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-028: Valid Gender - FEMALE
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Select "FEMALE" from Gender dropdown
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-029: Invalid Gender - Empty Selection
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Leave Gender field unselected
  2. Click Next
- **Expected Result:** 
  - Error message: "Gender is required" or "Please select a gender"
  - Form does not proceed to next step

#### TC-030: Invalid Gender - UNKNOWN Option Not Available
- **Priority:** Medium
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Open Gender dropdown
  2. Check available options
- **Expected Result:** 
  - Only "MALE" and "FEMALE" options are available
  - "UNKNOWN" option is not present

---

### 1.6 Phone Number Validation

#### TC-031: Valid Phone Number - Digits Only (7 digits)
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "1234567" in Phone Number field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-032: Valid Phone Number - Digits Only (15 digits)
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "123456789012345" in Phone Number field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-033: Valid Phone Number - With Plus Prefix
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "+96612345678" in Phone Number field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-034: Valid Phone Number - Empty Field (Optional)
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Leave Phone Number field empty
  2. Fill all required fields
  3. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-035: Invalid Phone Number - Too Short (Less than 7 digits)
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "123456" in Phone Number field
  2. Click Next
- **Expected Result:** 
  - Error message: "Phone numbers can only include digits and may start with +"
  - Form does not proceed to next step

#### TC-036: Invalid Phone Number - Too Long (More than 15 digits)
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "1234567890123456" in Phone Number field
  2. Click Next
- **Expected Result:** 
  - Error message: "Phone numbers can only include digits and may start with +"
  - Form does not proceed to next step

#### TC-037: Invalid Phone Number - Contains Letters
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "1234567abc" in Phone Number field
  2. Click Next
- **Expected Result:** 
  - Error message: "Phone numbers can only include digits and may start with +"
  - Form does not proceed to next step

#### TC-038: Invalid Phone Number - Contains Special Characters
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "123-456-7890" in Phone Number field
  2. Click Next
- **Expected Result:** 
  - Error message: "Phone numbers can only include digits and may start with +"
  - Form does not proceed to next step

#### TC-039: Invalid Phone Number - Plus Sign in Middle
- **Priority:** Medium
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "123+4567890" in Phone Number field
  2. Click Next
- **Expected Result:** 
  - Error message: "Phone numbers can only include digits and may start with +"
  - Form does not proceed to next step

---

### 1.7 Email Validation

#### TC-040: Valid Email - Standard Format
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "john.doe@example.com" in Email field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-041: Valid Email - Empty Field (Optional)
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Leave Email field empty
  2. Fill all required fields
  3. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-042: Invalid Email - Missing @ Symbol
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "johndoeexample.com" in Email field
  2. Click Next
- **Expected Result:** 
  - Error message: "Please enter a valid email address"
  - Form does not proceed to next step

#### TC-043: Invalid Email - Missing Domain
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "johndoe@" in Email field
  2. Click Next
- **Expected Result:** 
  - Error message: "Please enter a valid email address"
  - Form does not proceed to next step

#### TC-044: Invalid Email - Missing TLD
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "johndoe@example" in Email field
  2. Click Next
- **Expected Result:** 
  - Error message: "Please enter a valid email address"
  - Form does not proceed to next step

#### TC-045: Invalid Email - Multiple @ Symbols
- **Priority:** Medium
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "john@doe@example.com" in Email field
  2. Click Next
- **Expected Result:** 
  - Error message: "Please enter a valid email address"
  - Form does not proceed to next step

---

## Step 2: Hospital Service Validation

### 2.1 Origin Hospital Selection

#### TC-046: Valid Origin Hospital - With Stroke Service
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Select an origin hospital that provides Stroke service
  2. Fill all required patient information fields
  3. Click Next
- **Expected Result:** 
  - No warning about destination hospital
  - Destination hospital field is optional
  - Form proceeds to next step

#### TC-047: Valid Origin Hospital - Without Stroke Service
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Select an origin hospital that does NOT provide Stroke service
  2. Fill all required patient information fields
  3. Click Next
- **Expected Result:** 
  - Warning alert displayed: "Please select a destination hospital because the selected origin hospital does not provide Stroke service."
  - Destination hospital field becomes required
  - Form does not proceed to next step until destination is selected

#### TC-048: Origin Hospital Change - From With Service to Without Service
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Select origin hospital with Stroke service
  2. Fill all required fields
  3. Change origin hospital to one without Stroke service
- **Expected Result:** 
  - Warning alert appears immediately
  - Destination hospital becomes required
  - Real-time validation updates

#### TC-049: Origin Hospital Change - From Without Service to With Service
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Select origin hospital without Stroke service
  2. Select a destination hospital
  3. Change origin hospital to one with Stroke service
- **Expected Result:** 
  - Warning alert disappears
  - Destination hospital becomes optional
  - Real-time validation updates

---

### 2.2 Destination Hospital Selection

#### TC-050: Valid Destination Hospital - Stroke Service Available
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information), Origin hospital does not provide Stroke service
- **Test Steps:**
  1. Select origin hospital without Stroke service
  2. Select destination hospital with Stroke service
  3. Fill all required patient information fields
  4. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-051: Valid Destination Hospital - Stroke Unit Service
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information), Origin hospital does not provide Stroke service
- **Test Steps:**
  1. Select origin hospital without Stroke service
  2. Select destination hospital with Stroke Unit service
  3. Fill all required patient information fields
  4. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-052: Valid Destination Hospital - Thrombolysis Service
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information), Origin hospital does not provide Stroke service
- **Test Steps:**
  1. Select origin hospital without Stroke service
  2. Select destination hospital with Thrombolysis service
  3. Fill all required patient information fields
  4. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-053: Valid Destination Hospital - Thrombectomy Service
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information), Origin hospital does not provide Stroke service
- **Test Steps:**
  1. Select origin hospital without Stroke service
  2. Select destination hospital with Thrombectomy service
  3. Fill all required patient information fields
  4. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-054: Destination Hospital Filtering - Only Relevant Services Shown
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information), Origin hospital does not provide Stroke service
- **Test Steps:**
  1. Select origin hospital without Stroke service
  2. Open destination hospital dropdown
  3. Check available hospitals
- **Expected Result:** 
  - Only hospitals with Stroke, Stroke Unit, Thrombolysis, or Thrombectomy services are shown
  - Hospitals without these services are filtered out

#### TC-055: Invalid Destination Hospital - Not Selected When Required
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information), Origin hospital does not provide Stroke service
- **Test Steps:**
  1. Select origin hospital without Stroke service
  2. Leave destination hospital unselected
  3. Fill all required patient information fields
  4. Click Next
- **Expected Result:** 
  - Error message displayed for destination hospital
  - Form does not proceed to next step

---

## Step 3: Timeline Validation Logic

### 3.1 Assessment & Timing Validations

#### TC-056: Symptom Onset Warning - After Admission
- **Priority:** High
- **Preconditions:** User is on Step 2 (Assessment)
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter symptom onset time: "2025-01-15 11:00 AM" (after admission)
  3. Navigate to Review step
- **Expected Result:** 
  - Warning displayed: "Symptom onset happens after admission. Please confirm the order of events."
  - Warning shown inline at symptom onset field
  - Warning shown in Review step with bolded keywords

#### TC-057: Symptom Onset Valid - Before Admission
- **Priority:** High
- **Preconditions:** User is on Step 2 (Assessment)
- **Test Steps:**
  1. Enter symptom onset time: "2025-01-15 09:00 AM"
  2. Enter admission time: "2025-01-15 10:00 AM"
  3. Navigate to Review step
- **Expected Result:** 
  - No warning displayed
  - Form proceeds normally

#### TC-058: Triage Warning - Before Admission
- **Priority:** High
- **Preconditions:** User is on Step 2 (Assessment)
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter triage time: "2025-01-15 09:00 AM" (before admission)
  3. Navigate to Review step
- **Expected Result:** 
  - Warning displayed: "Triage time occurs before admission. Double-check both times."
  - Warning shown inline at triage field
  - Warning shown in Review step with bolded keywords

#### TC-059: Triage Valid - After Admission
- **Priority:** High
- **Preconditions:** User is on Step 2 (Assessment)
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter triage time: "2025-01-15 10:15 AM"
  3. Navigate to Review step
- **Expected Result:** 
  - No warning displayed
  - Form proceeds normally

#### TC-060: First ECG Warning - Before Admission
- **Priority:** High
- **Preconditions:** User is on Step 2 (Assessment)
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter first ECG time: "2025-01-15 09:00 AM" (before admission)
  3. Navigate to Review step
- **Expected Result:** 
  - Warning displayed: "First ECG time is before the patient arrived. Please revise the timestamps."
  - Warning shown inline at first ECG field
  - Warning shown in Review step

#### TC-061: First ECG Warning - Before Triage
- **Priority:** High
- **Preconditions:** User is on Step 2 (Assessment)
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter triage time: "2025-01-15 10:15 AM"
  3. Enter first ECG time: "2025-01-15 10:10 AM" (before triage)
  4. Navigate to Review step
- **Expected Result:** 
  - Warning displayed: "First ECG usually follows triage. Please review the entries."
  - Warning shown inline at first ECG field
  - Warning shown in Review step

#### TC-062: Transfer Request Warning - Before Admission
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter transfer request time: "2025-01-15 09:00 AM" (before admission)
  3. Navigate to Review step
- **Expected Result:** 
  - Warning displayed: "Transfer request is logged before admission. Confirm the request time."
  - Warning shown inline at transfer request field
  - Warning shown in Review step with bolded keywords

#### TC-063: Transfer Arrival Warning - Before Transfer Request
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter transfer request time: "2025-01-15 10:00 AM"
  2. Enter transfer arrival time: "2025-01-15 09:30 AM" (before request)
  3. Navigate to Review step
- **Expected Result:** 
  - Warning displayed: "Transfer arrival is before the request. Please correct these times."
  - Warning shown inline at transfer arrival field
  - Warning shown in Review step with bolded keywords

#### TC-064: SRCA Call Time Warning - After Admission
- **Priority:** High
- **Preconditions:** User is on Step 2 (Assessment), Mode of arrival is AMBULANCE_RED_CRESCENT
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter SRCA call time: "2025-01-15 11:00 AM" (after admission)
  3. Navigate to Review step
- **Expected Result:** 
  - Warning displayed: "SRCA call time is after admission. Please verify the timeline."
  - Warning shown inline at SRCA call time field
  - Warning shown in Review step

#### TC-065: Physician Assessment Warning - Before Admission
- **Priority:** High
- **Preconditions:** User is on Step 2 (Assessment)
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter physician assessment time: "2025-01-15 09:00 AM" (before admission)
  3. Navigate to Review step
- **Expected Result:** 
  - Warning displayed: "Physician assessment is before admission. Please revise the timestamps."
  - Warning shown inline at physician assessment field
  - Warning shown in Review step

#### TC-066: Physician Assessment Warning - Before Triage
- **Priority:** High
- **Preconditions:** User is on Step 2 (Assessment)
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter triage time: "2025-01-15 10:15 AM"
  3. Enter physician assessment time: "2025-01-15 10:10 AM" (before triage)
  4. Navigate to Review step
- **Expected Result:** 
  - Warning displayed: "Physician assessment usually follows triage. Please review the entries."
  - Warning shown inline at physician assessment field
  - Warning shown in Review step

---

### 3.2 Diagnosis Validations

#### TC-067: CT Scan Start Warning - Before Admission
- **Priority:** High
- **Preconditions:** User is on Step 3 (Diagnosis), CT scan performed is checked
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter CT scan start time: "2025-01-15 09:00 AM" (before admission)
  3. Navigate to Review step
- **Expected Result:** 
  - Warning displayed: "CT scan start is before admission. Check both timestamps."
  - Warning shown inline at CT scan start field
  - Warning shown in Review step with bolded keywords ("CT scan", "Admission")

#### TC-068: CT Scan Start Valid - After Admission
- **Priority:** High
- **Preconditions:** User is on Step 3 (Diagnosis), CT scan performed is checked
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter CT scan start time: "2025-01-15 10:30 AM"
  3. Navigate to Review step
- **Expected Result:** 
  - No warning displayed
  - Form proceeds normally

#### TC-069: CT Report Final Warning - Before CT Scan Start
- **Priority:** High
- **Preconditions:** User is on Step 3 (Diagnosis), CT scan performed is checked
- **Test Steps:**
  1. Enter CT scan start time: "2025-01-15 10:30 AM"
  2. Enter CT report final time: "2025-01-15 10:20 AM" (before scan start)
  3. Navigate to Review step
- **Expected Result:** 
  - Warning displayed: "CT report final is before scan start. Please confirm these times."
  - Warning shown inline at CT report final field
  - Warning shown in Review step with bolded keywords ("CT report", "CT scan")

#### TC-070: CT Report Final Valid - After CT Scan Start
- **Priority:** High
- **Preconditions:** User is on Step 3 (Diagnosis), CT scan performed is checked
- **Test Steps:**
  1. Enter CT scan start time: "2025-01-15 10:30 AM"
  2. Enter CT report final time: "2025-01-15 10:45 AM"
  3. Navigate to Review step
- **Expected Result:** 
  - No warning displayed
  - Form proceeds normally

#### TC-071: Swallowing Screening Warning - Before Admission
- **Priority:** High
- **Preconditions:** User is on Step 3 (Diagnosis), Swallowing screening performed is checked
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter swallowing screening time: "2025-01-15 09:00 AM" (before admission)
  3. Navigate to Review step
- **Expected Result:** 
  - Warning displayed: "Swallowing screening is before admission. Please review the entries."
  - Warning shown inline at swallowing screening field
  - Warning shown in Review step with bolded keywords ("Swallowing screening", "Admission")

#### TC-072: Swallowing Screening Valid - After Admission
- **Priority:** High
- **Preconditions:** User is on Step 3 (Diagnosis), Swallowing screening performed is checked
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter swallowing screening time: "2025-01-15 10:30 AM"
  3. Navigate to Review step
- **Expected Result:** 
  - No warning displayed
  - Form proceeds normally

---

### 3.3 Treatment Validations

#### TC-073: Thrombolysis Order Warning - Before Admission
- **Priority:** High
- **Preconditions:** User is on Step 4 (Treatment), Candidate for IV Thrombolysis is YES
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter thrombolysis order time: "2025-01-15 09:00 AM" (before admission)
  3. Navigate to Review step
- **Expected Result:** 
  - Warning displayed: "Thrombolysis order is before admission. Confirm the time."
  - Warning shown inline at thrombolysis order field
  - Warning shown in Review step with bolded keywords ("Thrombolysis", "Admission")

#### TC-074: Thrombolysis Order Warning - Before CT Report
- **Priority:** High
- **Preconditions:** User is on Step 4 (Treatment), Candidate for IV Thrombolysis is YES, CT scan performed
- **Test Steps:**
  1. Enter CT report final time: "2025-01-15 10:45 AM"
  2. Enter thrombolysis order time: "2025-01-15 10:30 AM" (before CT report)
  3. Navigate to Review step
- **Expected Result:** 
  - Warning displayed (if validation exists)
  - Warning shown inline at thrombolysis order field
  - Warning shown in Review step

#### TC-075: Thrombolysis Order Valid - After Admission and CT Report
- **Priority:** High
- **Preconditions:** User is on Step 4 (Treatment), Candidate for IV Thrombolysis is YES
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter CT report final time: "2025-01-15 10:45 AM"
  3. Enter thrombolysis order time: "2025-01-15 11:00 AM"
  4. Navigate to Review step
- **Expected Result:** 
  - No warning displayed
  - Form proceeds normally

#### TC-076: IV Thrombolysis Administration Warning - Before Order Time
- **Priority:** High
- **Preconditions:** User is on Step 4 (Treatment), Candidate for IV Thrombolysis is YES
- **Test Steps:**
  1. Enter thrombolysis order time: "2025-01-15 11:00 AM"
  2. Enter IV thrombolysis administration time: "2025-01-15 10:50 AM" (before order)
  3. Navigate to Review step
- **Expected Result:** 
  - Warning displayed: "IV thrombolysis administration is before order time. Please verify the sequence."
  - Warning shown inline at administration time field
  - Warning shown in Review step with bolded keywords ("Thrombolysis", "order time")

#### TC-077: IV Thrombolysis Administration Warning - Before CT Report
- **Priority:** High
- **Preconditions:** User is on Step 4 (Treatment), Candidate for IV Thrombolysis is YES, CT scan performed
- **Test Steps:**
  1. Enter CT report final time: "2025-01-15 10:45 AM"
  2. Enter IV thrombolysis administration time: "2025-01-15 10:30 AM" (before CT report)
  3. Navigate to Review step
- **Expected Result:** 
  - Warning displayed: "IV thrombolysis is given before CT report final. Please verify the sequence."
  - Warning shown inline at administration time field
  - Warning shown in Review step with bolded keywords ("Thrombolysis", "CT report")

#### TC-078: IV Thrombolysis Administration Valid - After Order and CT Report
- **Priority:** High
- **Preconditions:** User is on Step 4 (Treatment), Candidate for IV Thrombolysis is YES
- **Test Steps:**
  1. Enter thrombolysis order time: "2025-01-15 11:00 AM"
  2. Enter CT report final time: "2025-01-15 10:45 AM"
  3. Enter IV thrombolysis administration time: "2025-01-15 11:15 AM"
  4. Navigate to Review step
- **Expected Result:** 
  - No warning displayed
  - Form proceeds normally

#### TC-079: Thrombectomy Puncture Warning - Before Admission
- **Priority:** High
- **Preconditions:** User is on Step 4 (Treatment), Candidate for Mechanical Thrombectomy is YES
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter thrombectomy puncture time: "2025-01-15 09:00 AM" (before admission)
  3. Navigate to Review step
- **Expected Result:** 
  - Warning displayed: "Thrombectomy puncture is before admission. Please review the entries."
  - Warning shown inline at puncture time field
  - Warning shown in Review step with bolded keywords ("Thrombectomy", "Admission")

#### TC-080: Thrombectomy Puncture Warning - Before CT Report
- **Priority:** High
- **Preconditions:** User is on Step 4 (Treatment), Candidate for Mechanical Thrombectomy is YES, CT scan performed
- **Test Steps:**
  1. Enter CT report final time: "2025-01-15 10:45 AM"
  2. Enter thrombectomy puncture time: "2025-01-15 10:30 AM" (before CT report)
  3. Navigate to Review step
- **Expected Result:** 
  - Warning displayed (if validation exists)
  - Warning shown inline at puncture time field
  - Warning shown in Review step

#### TC-081: Thrombectomy Puncture Valid - After Admission and CT Report
- **Priority:** High
- **Preconditions:** User is on Step 4 (Treatment), Candidate for Mechanical Thrombectomy is YES
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter CT report final time: "2025-01-15 10:45 AM"
  3. Enter thrombectomy puncture time: "2025-01-15 11:30 AM"
  4. Navigate to Review step
- **Expected Result:** 
  - No warning displayed
  - Form proceeds normally

#### TC-082: Thrombectomy Complete Warning - Before Puncture Time
- **Priority:** High
- **Preconditions:** User is on Step 4 (Treatment), Mechanical Thrombectomy Performed is checked
- **Test Steps:**
  1. Enter thrombectomy puncture time: "2025-01-15 11:30 AM"
  2. Enter thrombectomy complete time: "2025-01-15 11:20 AM" (before puncture)
  3. Navigate to Review step
- **Expected Result:** 
  - Warning displayed: "Thrombectomy complete is before puncture. Please confirm these times."
  - Warning shown inline at complete time field
  - Warning shown in Review step with bolded keywords ("Thrombectomy", "puncture")

#### TC-083: Thrombectomy Complete Valid - After Puncture Time
- **Priority:** High
- **Preconditions:** User is on Step 4 (Treatment), Mechanical Thrombectomy Performed is checked
- **Test Steps:**
  1. Enter thrombectomy puncture time: "2025-01-15 11:30 AM"
  2. Enter thrombectomy complete time: "2025-01-15 12:00 PM"
  3. Navigate to Review step
- **Expected Result:** 
  - No warning displayed
  - Form proceeds normally

#### TC-084: Transfer Activation Warning - Before Admission
- **Priority:** High
- **Preconditions:** User is on Step 4 (Treatment)
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter transfer activation time: "2025-01-15 09:00 AM" (before admission)
  3. Navigate to Review step
- **Expected Result:** 
  - Warning displayed: "Transfer activation is before admission. Check both timestamps."
  - Warning shown inline at transfer activation field
  - Warning shown in Review step

#### TC-085: Transfer Departure Warning - Before Activation
- **Priority:** High
- **Preconditions:** User is on Step 4 (Treatment)
- **Test Steps:**
  1. Enter transfer activation time: "2025-01-15 11:00 AM"
  2. Enter transfer departure time: "2025-01-15 10:30 AM" (before activation)
  3. Navigate to Review step
- **Expected Result:** 
  - Warning displayed: "Transfer departure is before activation. Please correct these times."
  - Warning shown inline at transfer departure field
  - Warning shown in Review step

---

## Step 4: Interactive Stepper Navigation

### 4.1 Clickable Steps

#### TC-086: Step Navigation - Click on Step Label
- **Priority:** High
- **Preconditions:** User is on any step of the form
- **Test Steps:**
  1. Click on "Assessment" step label (Step 2)
- **Expected Result:** 
  - Form navigates to Assessment step
  - Step becomes active

#### TC-087: Step Navigation - Click on Completed Step
- **Priority:** High
- **Preconditions:** User has completed Step 1 and is on Step 2
- **Test Steps:**
  1. Click on "Patient" step label (Step 1)
- **Expected Result:** 
  - Form navigates back to Patient step
  - Previously entered data is preserved

#### TC-088: Step Navigation - Click on Future Step
- **Priority:** Medium
- **Preconditions:** User is on Step 1, has not completed validation
- **Test Steps:**
  1. Click on "Review & Submit" step label (Step 5)
- **Expected Result:** 
  - Form may navigate or may require validation first (depends on implementation)
  - Behavior should be consistent

---

### 4.2 Visual Indicators for Steps with Issues

#### TC-089: Step Indicator - Validation Error Present
- **Priority:** High
- **Preconditions:** User is on Step 1, has validation errors
- **Test Steps:**
  1. Leave required field empty
  2. Try to proceed
  3. Observe step indicator
- **Expected Result:** 
  - Step label text is bold
  - Step icon is bold
  - Step has warning color (orange/amber)

#### TC-090: Step Indicator - Timeline Warning Present
- **Priority:** High
- **Preconditions:** User has entered timeline data with warnings
- **Test Steps:**
  1. Enter admission time
  2. Enter triage time before admission
  3. Navigate to Review step
  4. Observe step indicators
- **Expected Result:** 
  - Assessment step (Step 2) shows warning indicator
  - Step label text is bold
  - Step icon is bold
  - Step has warning color (orange/amber)

#### TC-091: Step Indicator - No Issues Present
- **Priority:** Medium
- **Preconditions:** User has completed step with no errors or warnings
- **Test Steps:**
  1. Complete Step 1 with all valid data
  2. Observe step indicator
- **Expected Result:** 
  - Step label text is normal weight
  - Step icon is normal
  - Step has normal color

---

## Step 5: Enhanced Review Step

### 5.1 Card-based Layout

#### TC-092: Review Step - Patient Info Card Displayed
- **Priority:** High
- **Preconditions:** User navigates to Review & Submit step
- **Test Steps:**
  1. Complete all previous steps
  2. Navigate to Review & Submit step
- **Expected Result:** 
  - Patient Info card is displayed
  - Contains all patient information entered

#### TC-093: Review Step - Assessment & Timing Card Displayed
- **Priority:** High
- **Preconditions:** User navigates to Review & Submit step
- **Test Steps:**
  1. Complete Assessment step
  2. Navigate to Review & Submit step
- **Expected Result:** 
  - Assessment & Timing card is displayed
  - Contains all assessment data entered

#### TC-094: Review Step - Diagnosis Card Displayed
- **Priority:** High
- **Preconditions:** User navigates to Review & Submit step
- **Test Steps:**
  1. Complete Diagnosis step
  2. Navigate to Review & Submit step
- **Expected Result:** 
  - Diagnosis card is displayed
  - Contains all diagnosis data entered

#### TC-095: Review Step - Treatment Card Displayed
- **Priority:** High
- **Preconditions:** User navigates to Review & Submit step
- **Test Steps:**
  1. Complete Treatment step
  2. Navigate to Review & Submit step
- **Expected Result:** 
  - Treatment card is displayed
  - Contains all treatment data entered

---

### 5.2 Timeline Warnings Display in Review

#### TC-096: Review Step - Warning Alert with Keyword Emphasis
- **Priority:** High
- **Preconditions:** User has timeline warnings, navigates to Review step
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter triage time: "2025-01-15 09:00 AM" (before admission)
  3. Navigate to Review & Submit step
- **Expected Result:** 
  - Warning alert displayed in Review step
  - Keywords like "Admission", "Triage" are bolded
  - Problematic values highlighted in bold warning color
  - No yellow background (clean UX)

#### TC-097: Review Step - Multiple Warnings Displayed
- **Priority:** High
- **Preconditions:** User has multiple timeline warnings
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter triage time: "2025-01-15 09:00 AM" (before admission)
  3. Enter CT scan start: "2025-01-15 09:30 AM" (before admission)
  4. Navigate to Review & Submit step
- **Expected Result:** 
  - All warnings displayed
  - Each warning has bolded keywords
  - Warnings organized by section

#### TC-098: Review Step - Card Border Highlighting for Warnings
- **Priority:** Medium
- **Preconditions:** User has timeline warnings in a specific section
- **Test Steps:**
  1. Enter admission time: "2025-01-15 10:00 AM"
  2. Enter CT scan start: "2025-01-15 09:00 AM" (before admission)
  3. Navigate to Review & Submit step
- **Expected Result:** 
  - Diagnosis card has subtle border highlighting
  - Warning alert displayed within the card

---

## Summary

### Test Case Statistics
- **Total Test Cases:** 98
- **Patient Information Validations:** 45 test cases
- **Hospital Service Validations:** 10 test cases
- **Timeline Validations:** 30 test cases
- **Interactive Stepper Navigation:** 6 test cases
- **Enhanced Review Step:** 7 test cases

### Priority Distribution
- **High Priority:** 85 test cases
- **Medium Priority:** 13 test cases

### Validation Coverage
- ✅ First Name validation (7 cases)
- ✅ Last Name validation (5 cases)
- ✅ National ID validation (6 cases)
- ✅ Age validation (8 cases)
- ✅ Gender validation (4 cases)
- ✅ Phone Number validation (9 cases)
- ✅ Email validation (6 cases)
- ✅ Origin Hospital selection (4 cases)
- ✅ Destination Hospital selection and filtering (6 cases)
- ✅ Timeline validations for Assessment & Timing (11 cases)
- ✅ Timeline validations for Diagnosis (6 cases)
- ✅ Timeline validations for Treatment (13 cases)
- ✅ Interactive stepper navigation (6 cases)
- ✅ Review step display and warnings (7 cases)

---

## Notes

1. **Timeline Warnings:** All timeline warnings are non-blocking (warnings, not errors). Users can proceed with the form even if warnings are present.

2. **Keyword Emphasis:** In warning messages, important medical terms (e.g., "Admission", "Triage", "CT scan", "Thrombolysis") are displayed in bold for quick scanning.

3. **Real-time Validation:** Destination hospital requirement updates immediately when origin hospital changes.

4. **Service Filtering:** Destination hospital dropdown only shows hospitals with Stroke, Stroke Unit, Thrombolysis, or Thrombectomy services.

5. **Arabic Support:** Name fields support Arabic characters in addition to English letters.

6. **Optional Fields:** Phone Number and Email are optional fields. All other patient information fields are required.

