# Helper Functions

This folder contains utility functions used throughout the EMS application.

## DateTime Helpers (`datetime.ts`)

### Functions

#### `formatForDateTimeLocal(utcString: string): string`
Converts UTC string to datetime-local input format.

**Parameters:**
- `utcString` - UTC date string (e.g., "2024-01-15T14:30:00.000Z")

**Returns:**
- Formatted string for datetime-local input (e.g., "2024-01-15T17:30")

**Usage:**
```typescript
import { formatForDateTimeLocal } from '../helpers';

// In a datetime-local input
<TextField
  type="datetime-local"
  value={formatForDateTimeLocal(formData.assignedAt)}
  onChange={(e) => onFormDataChange('assignedAt', e.target.value)}
/>
```

#### `formatForUTC(localDateTimeString: string): string`
Converts local datetime string to UTC for backend storage.

**Parameters:**
- `localDateTimeString` - Local datetime string (e.g., "2024-01-15T17:30")

**Returns:**
- UTC ISO string (e.g., "2024-01-15T14:30:00.000Z")

**Usage:**
```typescript
import { formatForUTC } from '../helpers';

// When sending data to backend
const assignmentData = {
  journeyStartTime: formatForUTC(formData.journeyStartTime)
};
```

#### `formatForDisplay(utcString: string, options?: Intl.DateTimeFormatOptions): string`
Formats UTC string for display in local timezone.

**Parameters:**
- `utcString` - UTC date string
- `options` - Intl.DateTimeFormatOptions for customization

**Returns:**
- Formatted local time string

**Usage:**
```typescript
import { formatForDisplay } from '../helpers';

// Display formatted time
const displayTime = formatForDisplay(assignment.createdAt);
```

#### `getCurrentUTC(): string`
Gets current time in UTC format.

**Returns:**
- Current UTC ISO string

#### `getCurrentDateTimeLocal(): string`
Gets current time in datetime-local format.

**Returns:**
- Current local time in datetime-local format

#### `isValidISODate(dateString: string): boolean`
Validates if a string is a valid ISO date.

**Parameters:**
- `dateString` - Date string to validate

**Returns:**
- True if valid ISO date, false otherwise

#### `getUserTimezone(): string`
Gets user's timezone.

**Returns:**
- User's timezone string (e.g., "Asia/Riyadh")

## Import Examples

```typescript
// Import specific functions
import { formatForDateTimeLocal, formatForUTC } from '../helpers';

// Import all datetime helpers
import * as DateTimeHelpers from '../helpers/datetime';

// Import from index
import { formatForDateTimeLocal } from '../helpers';
```

## Best Practices

1. **Always use UTC for backend storage** - Use `formatForUTC()` when sending data to the backend
2. **Use datetime-local format for inputs** - Use `formatForDateTimeLocal()` for datetime-local inputs
3. **Validate dates** - Use `isValidISODate()` to validate date strings
4. **Handle empty values** - All functions handle empty/null values gracefully
5. **Error handling** - Functions log warnings for invalid dates and return empty strings

