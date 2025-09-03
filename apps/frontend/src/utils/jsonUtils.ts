/**
 * Safely parse a JSON string that might be an array or plain text
 * @param jsonString - The string to parse
 * @returns An array of strings, or empty array if parsing fails
 */
export const parseJsonArray = (jsonString: string | null | undefined): string[] => {
  if (!jsonString) return [];
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    // If JSON parsing fails, treat it as a single string
    return [jsonString];
  }
};

/**
 * Safely parse a JSON string that might be an object or plain text
 * @param jsonString - The string to parse
 * @returns An object, or empty object if parsing fails
 */
export const parseJsonObject = (jsonString: string | null | undefined): Record<string, any> => {
  if (!jsonString) return {};
  try {
    const parsed = JSON.parse(jsonString);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (error) {
    // If JSON parsing fails, return empty object
    return {};
  }
};

/**
 * Safely stringify an object to JSON
 * @param obj - The object to stringify
 * @returns JSON string, or empty string if stringifying fails
 */
export const safeStringify = (obj: any): string => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    return '';
  }
};
