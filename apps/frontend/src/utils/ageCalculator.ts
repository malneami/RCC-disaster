/**
 * Calculate age from date of birth
 * Returns an object with years, months, and days
 */
export interface AgeDetails {
  years: number;
  months: number;
  days: number;
}

export const calculateAge = (dateOfBirth: string | Date): AgeDetails => {
  const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();
  
  // Adjust for negative days
  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  // Adjust for negative months
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
  };
};

/**
 * Format age as a user-friendly string
 * Examples: "5 years, 3 months, 10 days" or "2 months, 5 days" or "15 days"
 */
export const formatAge = (age: AgeDetails): string => {
  const parts: string[] = [];
  
  if (age.years > 0) {
    parts.push(`${age.years} ${age.years === 1 ? 'year' : 'years'}`);
  }
  if (age.months > 0) {
    parts.push(`${age.months} ${age.months === 1 ? 'month' : 'months'}`);
  }
  if (age.days > 0 || parts.length === 0) {
    parts.push(`${age.days} ${age.days === 1 ? 'day' : 'days'}`);
  }
  
  return parts.join(', ');
};

/**
 * Calculate age in years (for backward compatibility)
 */
export const calculateAgeInYears = (dateOfBirth: string | Date): number => {
  const age = calculateAge(dateOfBirth);
  return age.years;
};

/**
 * Parse age text input to extract years, months, and days
 * Accepts formats like: "5 years", "3 months", "10 days", "2 years, 3 months, 5 days", or just "25"
 */
export const parseAgeText = (ageText: string): { years: number; months: number; days: number; isValid: boolean } => {
  if (!ageText || ageText.trim() === '') {
    return { years: 0, months: 0, days: 0, isValid: false };
  }

  const text = ageText.toLowerCase().trim();
  let years = 0;
  let months = 0;
  let days = 0;
  let isValid = false;

  // Try to parse as simple number first (e.g., "25" = 25 years)
  const simpleNumber = parseInt(text);
  if (!isNaN(simpleNumber) && text === simpleNumber.toString()) {
    return { years: simpleNumber, months: 0, days: 0, isValid: true };
  }

  // Parse patterns like "5 years", "3 months", "10 days", or combinations
  const yearMatch = text.match(/(\d+)\s*(?:year|years|y|yr|yrs)/);
  const monthMatch = text.match(/(\d+)\s*(?:month|months|mo|mos)/);
  const dayMatch = text.match(/(\d+)\s*(?:day|days|d)/);

  if (yearMatch) {
    years = parseInt(yearMatch[1]);
    isValid = true;
  }
  if (monthMatch) {
    months = parseInt(monthMatch[1]);
    isValid = true;
  }
  if (dayMatch) {
    days = parseInt(dayMatch[1]);
    isValid = true;
  }

  // If no patterns matched but there are numbers, try to extract
  if (!isValid) {
    const numbers = text.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      // Assume first number is years if no unit specified
      years = parseInt(numbers[0]);
      isValid = true;
    }
  }

  return { years, months, days, isValid };
};

/**
 * Extract years from age text for storage
 * Converts months and days to approximate years if needed
 */
export const extractYearsFromAgeText = (ageText: string): number | undefined => {
  const parsed = parseAgeText(ageText);
  if (!parsed.isValid) {
    return undefined;
  }

  // Convert to years: years + (months / 12) + (days / 365.25)
  const totalYears = parsed.years + (parsed.months / 12) + (parsed.days / 365.25);
  return Math.floor(totalYears);
};

/**
 * Format age for display in view mode
 * - If dateOfBirth exists: shows formatted age (years, months, days)
 * - If ageMonths or ageDays exist: shows formatted age from stored values (can show months/days only or days only)
 * - If only age exists (no dateOfBirth, no months/days): shows "X years" only
 */
export const formatAgeForDisplay = (
  age: number | undefined,
  dateOfBirth: string | Date | undefined,
  ageMonths?: number | undefined,
  ageDays?: number | undefined
): string => {
  // If date of birth exists, calculate and show formatted age (years, months, days)
  if (dateOfBirth) {
    try {
      const ageDetails = calculateAge(dateOfBirth);
      return formatAge(ageDetails);
    } catch (error) {
      // If DOB is invalid, fall through to stored values
    }
  }

  // If ageMonths or ageDays exist, show formatted age from stored values
  // This handles cases like "3 months, 5 days" or "15 days" only
  if (ageMonths !== undefined || ageDays !== undefined) {
    const parts: string[] = [];
    // Only show years if age > 0 (allow age to be 0 for months/days only)
    if (age !== undefined && age !== null && age > 0) {
      parts.push(`${age} ${age === 1 ? 'year' : 'years'}`);
    }
    if (ageMonths !== undefined && ageMonths > 0) {
      parts.push(`${ageMonths} ${ageMonths === 1 ? 'month' : 'months'}`);
    }
    if (ageDays !== undefined && ageDays > 0) {
      parts.push(`${ageDays} ${ageDays === 1 ? 'day' : 'days'}`);
    }
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  }

  // If only age exists (no date of birth, no months/days), show years only
  if (age !== undefined && age !== null) {
    return `${age} ${age === 1 ? 'year' : 'years'}`;
  }

  // If no age data at all, return N/A
  return 'N/A';
};

/**
 * Calculate Date of Birth from age (years, months, days)
 * Calculates back from today's date
 */
export const calculateDoBFromAge = (years: number, months: number, days: number): Date => {
  const today = new Date();
  
  // Clone today to avoid mutating it
  const dob = new Date(today);
  
  // Subtract years
  dob.setFullYear(dob.getFullYear() - (years || 0));
  
  // Subtract months
  dob.setMonth(dob.getMonth() - (months || 0));
  
  // Subtract days
  dob.setDate(dob.getDate() - (days || 0));
  
  return dob;
};

/**
 * Format date to YYYY-MM-DD string using local time
 * This avoids off-by-one errors that can happen with toISOString() due to timezone offsets
 */
export const formatDateToLocalInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
