# Test Cases for Trauma Portal Case Creation

## Overview
This document contains comprehensive test cases for the Create Case feature in the Trauma Portal, covering all validation rules, timeline warnings, and form submission logic implemented in the system.

---

## Step 1: Patient Information

### 1.1 First Name Validation

#### TC-001: Valid First Name - English Letters Only
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "John" in First Name field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-002: Valid First Name - English Letters with Spaces
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

#### TC-004: Valid First Name - Accented Characters
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "José" in First Name field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-005: Valid First Name - Mixed Arabic and English
- **Priority:** Medium
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "Ahmed محمد" in First Name field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-006: Invalid First Name - Contains Numbers
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "John123" in First Name field
  2. Click Next
- **Expected Result:** 
  - Error message: "First name can only include letters (including Arabic) and spaces."
  - Form does not proceed to next step
  - Field has red border

#### TC-007: Invalid First Name - Contains Special Characters
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "John@Doe" in First Name field
  2. Click Next
- **Expected Result:** 
  - Error message: "First name can only include letters (including Arabic) and spaces."
  - Form does not proceed to next step

#### TC-008: Empty First Name - Required Field
- **Priority:** Critical
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Leave First Name field empty
  2. Click Next
- **Expected Result:** 
  - Error message: "Patient Name is required"
  - Form does not proceed to next step
  - Field has red border

#### TC-009: First Name - Only Spaces
- **Priority:** Medium
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "   " (only spaces) in First Name field
  2. Click Next
- **Expected Result:** 
  - Error message: "Patient Name is required" (after trim)
  - Form does not proceed to next step

---

### 1.2 Last Name Validation

#### TC-010: Valid Last Name - English Letters Only
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "Smith" in Last Name field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-011: Valid Last Name - English Letters with Spaces
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "Van Der Berg" in Last Name field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-012: Valid Last Name - Arabic Characters
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "العلي" in Last Name field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-013: Valid Last Name - Accented Characters
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "Müller" in Last Name field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-014: Invalid Last Name - Contains Numbers
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "Smith123" in Last Name field
  2. Click Next
- **Expected Result:** 
  - Error message: "Last name can only include letters (including Arabic) and spaces."
  - Form does not proceed to next step

#### TC-015: Invalid Last Name - Contains Special Characters
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "O'Brien" in Last Name field
  2. Click Next
- **Expected Result:** 
  - Error message: "Last name can only include letters (including Arabic) and spaces."
  - Form does not proceed to next step

#### TC-016: Empty Last Name - Required Field
- **Priority:** Critical
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Leave Last Name field empty
  2. Click Next
- **Expected Result:** 
  - Error message: "Patient Last Name is required"
  - Form does not proceed to next step
  - Field has red border

---

### 1.3 National ID Validation

#### TC-017: Valid National ID - Alphanumeric
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "ABC123456" in National ID field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-018: Valid National ID - Numbers Only
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "123456789" in National ID field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-019: Valid National ID - Letters Only
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "ABCDEFGH" in National ID field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-020: Invalid National ID - Contains Special Characters
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "ABC-123" in National ID field
  2. Click Next
- **Expected Result:** 
  - Error message: "National ID can only contain letters and numbers."
  - Form does not proceed to next step

#### TC-021: Invalid National ID - Contains Spaces
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "ABC 123" in National ID field
  2. Click Next
- **Expected Result:** 
  - Error message: "National ID can only contain letters and numbers."
  - Form does not proceed to next step

#### TC-022: Empty National ID - Required Field
- **Priority:** Critical
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Leave National ID field empty
  2. Click Next
- **Expected Result:** 
  - Error message: "National ID is required"
  - Form does not proceed to next step
  - Field has red border

---

### 1.4 Age Validation

#### TC-023: Valid Age - Minimum Value (1)
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "1" in Age field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-023A: Invalid Age - Zero (0)
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "0" in Age field
  2. Click Next
- **Expected Result:** 
  - Error message: "Age must be a positive number" or "Age must be at least 1"
  - Form does not proceed to next step

#### TC-024: Valid Age - Maximum Value (150)
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "150" in Age field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-025: Valid Age - Typical Value
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "45" in Age field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-026: Invalid Age - Negative Number
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "-5" in Age field
  2. Click Next
- **Expected Result:** 
  - Error message: "Age must be a positive number"
  - Form does not proceed to next step

#### TC-027: Invalid Age - Exceeds Maximum (151)
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "151" in Age field
  2. Click Next
- **Expected Result:** 
  - Error message: "Please enter a realistic age"
  - Form does not proceed to next step

#### TC-028: Invalid Age - Non-Numeric Value
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "abc" in Age field
  2. Click Next
- **Expected Result:** 
  - Error message: "Age must be a number"
  - Form does not proceed to next step

#### TC-029: Invalid Age - Decimal Number
- **Priority:** Medium
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "45.5" in Age field
  2. Click Next
- **Expected Result:** 
  - Either accepts decimal or shows validation error
  - Form behavior depends on implementation

#### TC-030: Empty Age - Required Field
- **Priority:** Critical
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Leave Age field empty
  2. Click Next
- **Expected Result:** 
  - Error message: "Age is required"
  - Form does not proceed to next step
  - Field has red border

---

### 1.5 Gender Validation

#### TC-031: Valid Gender - Male
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Select "MALE" from Gender dropdown
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-032: Valid Gender - Female
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Select "FEMALE" from Gender dropdown
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-033: Empty Gender - Required Field
- **Priority:** Critical
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Leave Gender field unselected (if possible)
  2. Click Next
- **Expected Result:** 
  - Error message: "Please select a gender"
  - Form does not proceed to next step

---

### 1.6 Phone Number Validation

#### TC-034: Valid Phone Number - Digits Only (7 digits)
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "1234567" in Phone Number field
  2. Click Next
- **Expected Result:** 
  - Error message: "Phone numbers can only include digits and may start with +"
  - Field has red border

#### TC-035: Valid Phone Number - Digits Only (15 digits)
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "123456789012345" in Phone Number field
  2. Click Next
- **Expected Result:** 
  - Error message: "Phone numbers can only include digits and may start with +"
  - Field has red border

#### TC-036: Valid Phone Number - With Plus Prefix
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "+1234567890" in Phone Number field
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-037: Invalid Phone Number - Too Short (6 digits)
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "123456" in Phone Number field
  2. Click Next
- **Expected Result:** 
  - Error message: "Phone numbers can only include digits and may start with +"
  - Form does not proceed to next step

#### TC-038: Invalid Phone Number - Too Long (16 digits)
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "1234567890123456" in Phone Number field
  2. Click Next
- **Expected Result:** 
  - Error message: "Phone numbers can only include digits and may start with +"
  - Form does not proceed to next step

#### TC-039: Invalid Phone Number - Contains Letters
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "123-456-7890" in Phone Number field
  2. Click Next
- **Expected Result:** 
  - Error message: "Phone numbers can only include digits and may start with +"
  - Form does not proceed to next step

#### TC-040: Invalid Phone Number - Contains Special Characters
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "123-456-7890" in Phone Number field
  2. Click Next
- **Expected Result:** 
  - Error message: "Phone numbers can only include digits and may start with +"
  - Form does not proceed to next step

#### TC-041: Valid Phone Number - Empty (Optional Field)
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Leave Phone Number field empty
  2. Fill all required fields
  3. Click Next
- **Expected Result:** 
  - No error message for Phone Number
  - Form proceeds to next step

#### TC-042: Invalid Phone Number - Plus in Middle
- **Priority:** Medium
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Enter "123+4567890" in Phone Number field
  2. Click Next
- **Expected Result:** 
  - Error message: "Phone numbers can only include digits and may start with +"
  - Form does not proceed to next step

---

### 1.7 Origin Hospital Validation

#### TC-043: Valid Origin Hospital - Selected
- **Priority:** Critical
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Select a hospital from Origin Hospital dropdown
  2. Fill all other required fields
  3. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-044: Empty Origin Hospital - Required Field
- **Priority:** Critical
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Leave Origin Hospital field unselected
  2. Fill all other required fields
  3. Click Next
- **Expected Result:** 
  - Error message: "Origin Hospital is required"
  - Form does not proceed to next step
  - Field has red border

---

### 1.8 Destination Hospital Validation

#### TC-045: Destination Hospital - Not Required When Origin Has Trauma Service
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Select an Origin Hospital that provides Trauma service
  2. Leave Destination Hospital empty
  3. Fill all other required fields
  4. Click Next
- **Expected Result:** 
  - No error message for Destination Hospital
  - Form proceeds to next step

#### TC-046: Destination Hospital - Required When Origin Lacks Trauma Service
- **Priority:** Critical
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Select an Origin Hospital that does NOT provide Trauma service
  2. Leave Destination Hospital empty
  3. Fill all other required fields
  4. Click Next
- **Expected Result:** 
  - Error message: "Destination Hospital is required because the selected origin hospital does not provide Trauma service."
  - Form does not proceed to next step
  - Field has red border
  - Warning alert displayed

#### TC-047: Destination Hospital - Valid Selection When Required
- **Priority:** High
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Select an Origin Hospital that does NOT provide Trauma service
  2. Select a Destination Hospital with Trauma service
  3. Fill all other required fields
  4. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-048: Destination Hospital - Error Clears When Origin Changes
- **Priority:** Medium
- **Preconditions:** User is on Step 1 (Patient Information)
- **Test Steps:**
  1. Select an Origin Hospital without Trauma service
  2. Leave Destination Hospital empty
  3. Click Next (should show error)
  4. Change Origin Hospital to one with Trauma service
  5. Click Next
- **Expected Result:** 
  - Error message for Destination Hospital clears
  - Form proceeds to next step

---

## Step 2: Incident Details

### 2.1 Arrival Date Time Validation

#### TC-049: Valid Arrival Date Time - Selected
- **Priority:** Critical
- **Preconditions:** User is on Step 2 (Incident Details)
- **Test Steps:**
  1. Select a date and time in Arrival Date Time field
  2. Select Mode of Arrival
  3. Select Mechanism of Injury
  4. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-050: Empty Arrival Date Time - Required Field
- **Priority:** Critical
- **Preconditions:** User is on Step 2 (Incident Details)
- **Test Steps:**
  1. Leave Arrival Date Time field empty
  2. Select Mode of Arrival
  3. Select Mechanism of Injury
  4. Click Next
- **Expected Result:** 
  - Error message: "Arrival Date Time is required"
  - Form does not proceed to next step
  - Field has red border

---

### 2.2 Mode of Arrival Validation

#### TC-051: Valid Mode of Arrival - Selected
- **Priority:** Critical
- **Preconditions:** User is on Step 2 (Incident Details)
- **Test Steps:**
  1. Select a mode from Mode of Arrival dropdown
  2. Select Arrival Date Time
  3. Select Mechanism of Injury
  4. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-052: Empty Mode of Arrival - Required Field
- **Priority:** Critical
- **Preconditions:** User is on Step 2 (Incident Details)
- **Test Steps:**
  1. Leave Mode of Arrival field unselected
  2. Select Arrival Date Time
  3. Select Mechanism of Injury
  4. Click Next
- **Expected Result:** 
  - Error message: "Mode of Arrival is required"
  - Form does not proceed to next step
  - Field has red border

---

### 2.3 Mechanism of Injury Validation

#### TC-053: Valid Mechanism of Injury - Selected
- **Priority:** Critical
- **Preconditions:** User is on Step 2 (Incident Details)
- **Test Steps:**
  1. Select a mechanism from Mechanism of Injury dropdown
  2. Select Arrival Date Time
  3. Select Mode of Arrival
  4. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-054: Empty Mechanism of Injury - Required Field
- **Priority:** Critical
- **Preconditions:** User is on Step 2 (Incident Details)
- **Test Steps:**
  1. Leave Mechanism of Injury field unselected
  2. Select Arrival Date Time
  3. Select Mode of Arrival
  4. Click Next
- **Expected Result:** 
  - Error message: "Mechanism of Injury is required"
  - Form does not proceed to next step
  - Field has red border

---

### 2.4 Incident Date Time Validation - Timeline Logic

#### TC-055: Valid Incident Date Time - Before Arrival
- **Priority:** High
- **Preconditions:** User is on Step 2 (Incident Details)
- **Test Steps:**
  1. Set Arrival Date Time: "11/10/2025 02:00 PM"
  2. Set Incident Date Time: "11/10/2025 01:30 PM"
  3. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-056: Valid Incident Date Time - Same as Arrival
- **Priority:** High
- **Preconditions:** User is on Step 2 (Incident Details)
- **Test Steps:**
  1. Set Arrival Date Time: "11/10/2025 02:00 PM"
  2. Set Incident Date Time: "11/10/2025 02:00 PM"
  3. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-057: Incident Date Time - Warning (After Arrival)
- **Priority:** High
- **Preconditions:** User is on Step 2 (Incident Details)
- **Test Steps:**
  1. Set Arrival Date Time: "11/10/2025 02:00 PM"
  2. Set Incident Date Time: "11/10/2025 02:30 PM"
  3. Observe the field
- **Expected Result:** 
  - Warning message displayed: "Incident time happens after arrival time. Please confirm the order of events."
  - Warning displayed inline at the field
  - Warning displayed in Review & Submit step with highlighted card
  - Keywords "Incident time" and "arrival time" are bolded
  - Form can still proceed to next step (warning, not error)
  - Field has warning border (orange/yellow)
  - Submit button is disabled when this warning exists

#### TC-058: Incident Date Time - Warning Clears When Corrected
- **Priority:** Medium
- **Preconditions:** User is on Step 2 (Incident Details)
- **Test Steps:**
  1. Set Arrival Date Time: "11/10/2025 02:00 PM"
  2. Set Incident Date Time: "11/10/2025 02:30 PM" (creates warning)
  3. Change Incident Date Time to "11/10/2025 01:30 PM"
  4. Observe the field
- **Expected Result:** 
  - Warning message clears immediately
  - Form can proceed to next step
  - Submit button enabled when warning is resolved

---

### 2.5 Transfer Request Date Time - Timeline Warning

#### TC-059: Transfer Request Time - Valid (After Arrival)
- **Priority:** High
- **Preconditions:** User is on Step 2 (Incident Details)
- **Test Steps:**
  1. Set Arrival Date Time: "11/10/2025 02:00 PM"
  2. Set Transfer Request Date Time: "11/10/2025 02:30 PM"
  3. Click Next
- **Expected Result:** 
  - No warning message displayed
  - Form proceeds to next step

#### TC-060: Transfer Request Time - Warning (Before Arrival)
- **Priority:** High
- **Preconditions:** User is on Step 2 (Incident Details)
- **Test Steps:**
  1. Set Arrival Date Time: "11/10/2025 02:00 PM"
  2. Set Transfer Request Date Time: "11/10/2025 01:30 PM"
  3. Observe the field
- **Expected Result:** 
  - Warning message displayed: "Transfer request is logged before arrival. Confirm the request time."
  - Warning displayed inline at the field
  - Warning displayed in Review & Submit step with highlighted card
  - Keywords "Transfer request" and "arrival" are bolded
  - Form can still proceed to next step (warning, not error)
  - Field has warning border (orange/yellow)
  - Submit button is disabled when this warning exists

---

### 2.6 Transfer Arrival Date Time - Timeline Warning

#### TC-061: Transfer Arrival Time - Valid (After Request)
- **Priority:** High
- **Preconditions:** User is on Step 2 (Incident Details)
- **Test Steps:**
  1. Set Transfer Request Date Time: "11/10/2025 02:00 PM"
  2. Set Transfer Arrival Date Time: "11/10/2025 02:30 PM"
  3. Click Next
- **Expected Result:** 
  - No warning message displayed
  - Form proceeds to next step

#### TC-062: Transfer Arrival Time - Warning (Before Request)
- **Priority:** High
- **Preconditions:** User is on Step 2 (Incident Details)
- **Test Steps:**
  1. Set Transfer Request Date Time: "11/10/2025 02:00 PM"
  2. Set Transfer Arrival Date Time: "11/10/2025 01:30 PM"
  3. Observe the field
- **Expected Result:** 
  - Warning message displayed: "Transfer arrival is before the request. Please correct these times."
  - Warning displayed inline at the field
  - Warning displayed in Review & Submit step with highlighted card
  - Keywords "Transfer arrival" and "request" are bolded
  - Form can still proceed to next step (warning, not error)
  - Field has warning border (orange/yellow)
  - Submit button is disabled when this warning exists

#### TC-062A: Transfer Arrival Time - Warning (Before Initial Arrival)
- **Priority:** High
- **Preconditions:** User is on Step 2 (Incident Details)
- **Test Steps:**
  1. Set Arrival Date Time: "11/10/2025 02:00 PM"
  2. Set Transfer Arrival Date Time: "11/10/2025 01:30 PM"
  3. Observe the field
- **Expected Result:** 
  - Warning message displayed: "Transfer arrival is before initial arrival. Check both timestamps."
  - Warning displayed inline at the field
  - Warning displayed in Review & Submit step with highlighted card
  - Keywords "Transfer arrival" and "initial arrival" are bolded
  - Form can still proceed to next step (warning, not error)
  - Field has warning border (orange/yellow)
  - Submit button is disabled when this warning exists

---

## Step 3: Vitals Assessment

### 3.1 Vitals Assessment - Optional Step

#### TC-063: Vitals Assessment - All Fields Optional
- **Priority:** Medium
- **Preconditions:** User is on Step 3 (Vitals Assessment)
- **Test Steps:**
  1. Leave all vitals fields empty
  2. Click Next
- **Expected Result:** 
  - No error messages displayed
  - Form proceeds to next step

#### TC-064: Vitals Assessment - Partial Data Entry
- **Priority:** Medium
- **Preconditions:** User is on Step 3 (Vitals Assessment)
- **Test Steps:**
  1. Enter some vitals data (e.g., only temperature)
  2. Leave other fields empty
  3. Click Next
- **Expected Result:** 
  - No error messages displayed
  - Form proceeds to next step

---

## Step 4: Injury Assessment

### 4.1 Injury Assessment - Optional Step

#### TC-065: Injury Assessment - All Fields Optional
- **Priority:** Medium
- **Preconditions:** User is on Step 4 (Injury Assessment)
- **Test Steps:**
  1. Leave all injury fields empty
  2. Click Next
- **Expected Result:** 
  - No error messages displayed
  - Form proceeds to next step

#### TC-066: Injury Assessment - Partial Data Entry
- **Priority:** Medium
- **Preconditions:** User is on Step 4 (Injury Assessment)
- **Test Steps:**
  1. Enter some injury data (e.g., only head and neck injury)
  2. Leave other fields empty
  3. Click Next
- **Expected Result:** 
  - No error messages displayed
  - Form proceeds to next step

---

## Step 5: Disposition

### 5.1 ED Disposition Validation

#### TC-067: Valid ED Disposition - Selected
- **Priority:** Critical
- **Preconditions:** User is on Step 5 (Disposition)
- **Test Steps:**
  1. Select an ED Disposition from dropdown
  2. Click Next
- **Expected Result:** 
  - No error message displayed
  - Form proceeds to next step

#### TC-068: Empty ED Disposition - Required Field
- **Priority:** Critical
- **Preconditions:** User is on Step 5 (Disposition)
- **Test Steps:**
  1. Leave ED Disposition field unselected
  2. Click Next
- **Expected Result:** 
  - Error message: "ED Disposition is required"
  - Form does not proceed to next step
  - Field has red border

---

## Step 6: Review & Submit

### 6.1 Review Step - Validation Error Display

#### TC-069: Review Step - Validation Errors Displayed
- **Priority:** High
- **Preconditions:** User has entered data with validation errors across multiple steps
- **Test Steps:**
  1. Navigate through all steps entering data with various validation errors
  2. Reach Review & Submit step
  3. Review the displayed errors
- **Expected Result:** 
  - Red alert banner at the top listing all validation errors
  - Individual error messages for each problematic field
  - Cards highlighted with error styling for sections with errors
  - Inline error messages for specific fields (Age, ED Disposition)
  - Problematic values displayed in bold, warning-colored text
  - No yellow background (as per UX requirements)

#### TC-070: Review Step - Submit Blocked with Validation Errors
- **Priority:** Critical
- **Preconditions:** User is on Review & Submit step with validation errors
- **Test Steps:**
  1. Ensure there are validation errors present
  2. Attempt to click "Create Case" button
- **Expected Result:** 
  - "Create Case" button is disabled
  - Error messages displayed
  - User cannot submit until errors are resolved
  - Form automatically navigates to first step with errors

---

### 6.2 Review Step - Timeline Warning Display

#### TC-071: Review Step - Timeline Warnings Displayed
- **Priority:** High
- **Preconditions:** User has entered data with timeline warnings across multiple steps
- **Test Steps:**
  1. Navigate through all steps entering data with various timeline warnings
  2. Reach Review & Submit step
  3. Review the displayed warnings
- **Expected Result:** 
  - Warning alert banner for timeline issues
  - Cards highlighted with warning styling
  - Individual warnings displayed with bold keywords
  - Clear indication of which timestamps have logical issues
  - Problematic values displayed in bold, warning-colored text

#### TC-072: Review Step - Submit Blocked with Timeline Warnings
- **Priority:** Critical
- **Preconditions:** User is on Review & Submit step with timeline warnings
- **Test Steps:**
  1. Ensure there are timeline warnings present (e.g., incident time after arrival, transfer request before arrival)
  2. Attempt to click "Create Case" button
- **Expected Result:** 
  - "Create Case" button is disabled
  - Error message displayed: "Please review the timeline warnings before submitting."
  - User cannot submit until warnings are resolved
  - All timeline warnings are displayed with highlighted cards
  - Bold keywords in warnings for quick identification

#### TC-073: Review Step - Submit Allowed Without Warnings or Errors
- **Priority:** Critical
- **Preconditions:** User is on Review & Submit step with no timeline warnings or validation errors
- **Test Steps:**
  1. Ensure all timeline validations pass (no warnings)
  2. All required fields are filled correctly
  3. Click "Create Case" button
- **Expected Result:** 
  - "Create Case" button is enabled
  - Form submits successfully
  - Case is created
  - Success message displayed

---

### 6.3 Review Step - Error Navigation

#### TC-074: Review Step - Auto-Navigation to First Error
- **Priority:** High
- **Preconditions:** User is on Review & Submit step with validation errors
- **Test Steps:**
  1. Ensure there are validation errors in multiple steps
  2. Click "Create Case" button
- **Expected Result:** 
  - Form automatically navigates to the first step with errors
  - Clear error messages guide users to fix issues
  - Submit button remains disabled

---

## Integration & End-to-End Test Cases

### 7.1 Complete Form Submission

#### TC-075: Complete Valid Form Submission
- **Priority:** Critical
- **Preconditions:** User starts creating a new case
- **Test Steps:**
  1. Fill Step 1: Valid patient information (all required fields)
  2. Fill Step 2: Valid incident details with proper timeline
  3. Fill Step 3: Optional vitals assessment
  4. Fill Step 4: Optional injury assessment
  5. Fill Step 5: Valid disposition (ED Disposition selected)
  6. Review Step 6: Verify all data
  7. Click "Create Case"
- **Expected Result:** 
  - All steps complete without errors
  - No warnings displayed
  - Case is successfully created
  - Success message displayed
  - Form resets to initial state

#### TC-076: Form Submission with Timeline Warnings
- **Priority:** High
- **Preconditions:** User starts creating a new case
- **Test Steps:**
  1. Fill all required fields
  2. Enter timeline data that creates warnings (e.g., incident time after arrival)
  3. Navigate to Review & Submit step
  4. Attempt to submit
- **Expected Result:** 
  - Warnings are displayed in Review step
  - Submit button is disabled
  - User must correct timeline issues before submitting

#### TC-077: Form Submission with Validation Errors
- **Priority:** High
- **Preconditions:** User starts creating a new case
- **Test Steps:**
  1. Fill form with invalid data (e.g., invalid name, missing required fields)
  2. Navigate to Review & Submit step
  3. Attempt to submit
- **Expected Result:** 
  - Validation errors are displayed in Review step
  - Submit button is disabled
  - Form automatically navigates to first step with errors
  - User must correct errors before submitting

---

### 7.2 Form Navigation

#### TC-078: Form Navigation - Step Validation
- **Priority:** High
- **Preconditions:** User is creating a case
- **Test Steps:**
  1. Fill Step 1 with invalid data
  2. Click Next
  3. Correct errors
  4. Click Next again
- **Expected Result:** 
  - Step 1 validation errors prevent navigation
  - After corrections, navigation to Step 2 is allowed
  - Validation errors clear when corrected

#### TC-079: Form Navigation - Back Button
- **Priority:** Medium
- **Preconditions:** User is on Step 3 or later
- **Test Steps:**
  1. Click Back button
  2. Modify data on previous step
  3. Click Next again
- **Expected Result:** 
  - Navigation to previous step works
  - Data is preserved
  - Validation runs when returning to next step

#### TC-080: Form Navigation - Stepper Click Navigation
- **Priority:** Medium
- **Preconditions:** User is on Step 3 or later
- **Test Steps:**
  1. Click on Step 1 in the stepper
  2. Modify data
  3. Click Next to proceed
- **Expected Result:** 
  - Navigation to clicked step works
  - Data is preserved
  - Steps with errors are highlighted
  - Visual indicators show which steps have validation errors or timeline warnings

---

### 7.3 Error Clearing on Field Changes

#### TC-081: Error Clearing - Real-Time Validation
- **Priority:** High
- **Preconditions:** User has entered invalid data
- **Test Steps:**
  1. Enter invalid first name (e.g., "John123")
  2. Click Next (error appears)
  3. Correct the first name to "John"
  4. Observe the field
- **Expected Result:** 
  - Error message appears when invalid data is entered
  - Error message clears automatically when field is corrected
  - Real-time feedback as users correct issues
  - Smooth user experience without persistent error states

#### TC-082: Error Clearing - Timeline Warnings Update
- **Priority:** High
- **Preconditions:** User has entered timeline data with warnings
- **Test Steps:**
  1. Set Arrival Date Time: "11/10/2025 02:00 PM"
  2. Set Incident Date Time: "11/10/2025 02:30 PM" (creates error)
  3. Change Incident Date Time to "11/10/2025 01:30 PM"
  4. Observe the field
- **Expected Result:** 
  - Error appears immediately when invalid time is entered
  - Error disappears immediately when time is corrected
  - No page refresh required
  - Real-time validation updates

---

### 7.4 Form Reset

#### TC-083: Form Reset - Cancel Button
- **Priority:** Medium
- **Preconditions:** User has entered data in multiple steps
- **Test Steps:**
  1. Enter data in Steps 1-3
  2. Click Cancel button
  3. Reopen the form
- **Expected Result:** 
  - Form closes
  - All entered data is cleared
  - Form resets to initial state when reopened

#### TC-084: Form Reset - After Successful Submission
- **Priority:** Medium
- **Preconditions:** User successfully submits a case
- **Test Steps:**
  1. Complete and submit a case successfully
  2. Reopen the form
- **Expected Result:** 
  - All form fields are cleared
  - Form starts at Step 1
  - No previous data is retained

---

## Edge Cases & Boundary Conditions

### 8.1 Boundary Value Testing

#### TC-085: Age Boundary - Exactly 1 (Minimum)
- **Priority:** Medium
- **Test Steps:**
  1. Enter age: 1
  2. Fill other required fields
  3. Submit
- **Expected Result:** 
  - Age 1 is accepted
  - Form submits successfully

#### TC-086: Age Boundary - Zero (0) Not Allowed
- **Priority:** Medium
- **Test Steps:**
  1. Enter age: 0
  2. Fill other required fields
  3. Submit
- **Expected Result:** 
  - Error message: "Age must be a positive number" or "Age must be at least 1"
  - Form does not submit

#### TC-087: Age Boundary - Exactly 150
- **Priority:** Medium
- **Test Steps:**
  1. Enter age: 150
  2. Fill other required fields
  3. Submit
- **Expected Result:** 
  - Age 150 is accepted
  - Form submits successfully

#### TC-088: Phone Number Boundary - Exactly 7 Digits
- **Priority:** Medium
- **Test Steps:**
  1. Enter phone: "1234567"
  2. Fill other required fields
  3. Submit
- **Expected Result:** 
  - Phone number is accepted
  - Form submits successfully

#### TC-089: Phone Number Boundary - Exactly 15 Digits
- **Priority:** Medium
- **Test Steps:**
  1. Enter phone: "123456789012345"
  2. Fill other required fields
  3. Submit
- **Expected Result:** 
  - Phone number is accepted
  - Form submits successfully

#### TC-090: Timeline Boundary - Exact Same Time
- **Priority:** Medium
- **Test Steps:**
  1. Set Arrival Date Time: "11/10/2025 02:00 PM"
  2. Set Incident Date Time: "11/10/2025 02:00 PM" (exact same time)
  3. Observe warnings
- **Expected Result:** 
  - No error message (same time is acceptable)
  - Form proceeds to next step

---

### 8.2 Special Character & Input Testing

#### TC-091: Name with Unicode Characters
- **Priority:** Low
- **Test Steps:**
  1. Enter name with Unicode characters (e.g., "José", "Müller")
  2. Submit
- **Expected Result:** 
  - Names with accented characters are accepted
  - Form submits successfully

#### TC-092: National ID with Leading/Trailing Spaces
- **Priority:** Medium
- **Test Steps:**
  1. Enter National ID: "  ABC123  " (with spaces)
  2. Submit
- **Expected Result:** 
  - Spaces should be trimmed
  - Validation should work on trimmed value
  - Form submits successfully

#### TC-093: Phone Number with Leading/Trailing Spaces
- **Priority:** Medium
- **Test Steps:**
  1. Enter Phone: "  1234567890  " (with spaces)
  2. Submit
- **Expected Result:** 
  - Spaces should be trimmed
  - Validation should work on trimmed value
  - Form submits successfully

---

### 8.3 Data Persistence

#### TC-094: Form Data Persistence During Navigation
- **Priority:** High
- **Test Steps:**
  1. Fill Step 1 data
  2. Navigate to Step 2
  3. Fill Step 2 data
  4. Navigate back to Step 1
  5. Navigate forward to Step 2
- **Expected Result:** 
  - All entered data is preserved
  - No data loss during navigation

#### TC-095: Timeline Warnings Update in Real-Time
- **Priority:** High
- **Test Steps:**
  1. Set Arrival Date Time: "11/10/2025 02:00 PM"
  2. Set Incident Date Time: "11/10/2025 02:30 PM" (creates error)
  3. Change Incident Date Time to "11/10/2025 01:30 PM"
- **Expected Result:** 
  - Error appears immediately when invalid time is entered
  - Error disappears immediately when time is corrected
  - No page refresh required

---

## Test Summary

### Test Coverage Summary
- **Total Test Cases:** 95
- **Critical Priority:** 18
- **High Priority:** 52
- **Medium Priority:** 22
- **Low Priority:** 3

### Test Categories
1. **Patient Information Validation:** 49 test cases (removed 6 email validation cases, added 1 age zero case)
2. **Incident Details Validation:** 14 test cases
3. **Vitals Assessment:** 2 test cases
4. **Injury Assessment:** 2 test cases
5. **Disposition Validation:** 2 test cases
6. **Review & Submit:** 5 test cases
7. **Integration & E2E:** 10 test cases
8. **Edge Cases & Boundaries:** 11 test cases

### Validation Types Covered
- ✅ Required field validation
- ✅ Format validation (regex patterns for names, national ID, phone)
- ✅ Range validation (age: 1-150, phone length: 7-15 digits)
- ✅ Timeline validation (errors and warnings)
- ✅ Conditional validation (destination hospital based on origin hospital service)
- ✅ Real-time validation updates
- ✅ Form navigation validation
- ✅ Submit validation
- ✅ Error clearing on field changes
- ✅ Arabic character support in names

---

## Notes for Test Execution

1. **Timeline Testing:** When testing timeline validations, ensure all prerequisite timestamps are set before testing dependent timestamps.

2. **Warning vs Error:** Remember that timeline validations show warnings (not blocking errors) for transfer times, but errors for incident time after arrival. Warnings allow form progression but block final submission.

3. **Review Step:** All timeline warnings and validation errors should be visible in the Review & Submit step with highlighted cards and bolded keywords.

4. **Data Format:** Ensure date/time inputs are in the correct format as expected by the application (likely MM/DD/YYYY HH:MM AM/PM).

5. **Hospital Selection:** For destination hospital testing, ensure you have access to hospitals with and without Trauma services.

6. **Arabic Support:** When testing Arabic character support, ensure the system properly handles Arabic Unicode characters in name fields.

7. **Error Clearing:** Verify that validation errors clear automatically when users modify fields, providing real-time feedback.

8. **Stepper Navigation:** Verify that steps are clickable and visual indicators show which steps have validation errors or timeline warnings.

---

## Test Execution Checklist

- [ ] All Critical priority test cases executed
- [ ] All High priority test cases executed
- [ ] All Medium priority test cases executed
- [ ] All Low priority test cases executed
- [ ] All timeline warnings verified in both inline and Review step
- [ ] All error messages match expected text
- [ ] All validation rules match specifications
- [ ] Form submission blocked when warnings present
- [ ] Form submission blocked when validation errors present
- [ ] Form submission allowed when no warnings or errors
- [ ] Data persistence verified during navigation
- [ ] Real-time validation updates verified
- [ ] Error clearing on field changes verified
- [ ] Arabic character support verified
- [ ] Stepper navigation with visual indicators verified

