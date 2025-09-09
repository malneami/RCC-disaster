# Global Filter Components

This directory contains reusable filter components that can be used throughout the application to provide consistent filtering functionality.

## Components

### `FilterComponents.tsx`
Contains the core filter components and utilities:

- **`FilterField`** - Interface for defining filter fields
- **`FilterFieldComponent`** - Individual filter field renderer
- **`FilterForm`** - Grid-based filter form layout
- **`FilterChips`** - Active filter chips display
- **`GenericFilterDialog`** - Complete filter dialog component
- **Utility functions** - For generating chips, counting filters, etc.

### `GenericFilterDialog.tsx`
A complete, reusable filter dialog that can be used for any type of filtering.

## Usage Examples

### 1. Hospital Filters (Current Implementation)

```typescript
// config/hospitalFilters.ts
import { FilterField } from '../../../components/common/FilterComponents';

export const hospitalFilterFields: FilterField[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    gridSize: 6,
    options: [
      { value: '', label: 'All Statuses' },
      { value: 'AVAILABLE', label: 'Available' },
      // ... more options
    ],
  },
  // ... more fields
];

// components/FilterDialog.tsx
import GenericFilterDialog from '../../../components/common/GenericFilterDialog';
import { hospitalFilterFields } from '../config/hospitalFilters';

const FilterDialog: React.FC<FilterDialogProps> = ({ open, filters, onClose, onApply, onReset }) => {
  return (
    <GenericFilterDialog
      open={open}
      title="Filter Hospitals"
      fields={hospitalFilterFields}
      values={filters}
      onClose={onClose}
      onApply={onApply}
      onReset={onReset}
    />
  );
};
```

### 2. Patient Filters (Example)

```typescript
// config/patientFilters.ts
export const patientFilterFields: FilterField[] = [
  {
    key: 'gender',
    label: 'Gender',
    type: 'select',
    options: [
      { value: '', label: 'All Genders' },
      { value: 'MALE', label: 'Male' },
      { value: 'FEMALE', label: 'Female' },
    ],
  },
  {
    key: 'city',
    label: 'City',
    type: 'text',
    placeholder: 'Enter city name',
  },
  // ... more fields
];

// Usage in component
<GenericFilterDialog
  open={filterDialogOpen}
  title="Filter Patients"
  fields={patientFilterFields}
  values={patientFilters}
  onClose={() => setFilterDialogOpen(false)}
  onApply={handleApplyFilters}
  onReset={handleResetFilters}
/>
```

### 3. Ticket Filters (Example)

```typescript
// config/ticketFilters.ts
export const ticketFilterFields: FilterField[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: '', label: 'All Statuses' },
      { value: 'PENDING', label: 'Pending' },
      { value: 'ASSIGNED', label: 'Assigned' },
      { value: 'COMPLETED', label: 'Completed' },
    ],
  },
  {
    key: 'priority',
    label: 'Priority',
    type: 'select',
    options: [
      { value: '', label: 'All Priorities' },
      { value: 'LOW', label: 'Low' },
      { value: 'MEDIUM', label: 'Medium' },
      { value: 'HIGH', label: 'High' },
      { value: 'CRITICAL', label: 'Critical' },
    ],
  },
  {
    key: 'dateRange',
    label: 'Date Range',
    type: 'date',
    gridSize: 6,
  },
  {
    key: 'assignedTo',
    label: 'Assigned To',
    type: 'multiselect',
    options: [
      { value: 'user1', label: 'User 1' },
      { value: 'user2', label: 'User 2' },
    ],
  },
];
```

## Field Types

### `select`
Dropdown selection with predefined options.

```typescript
{
  key: 'status',
  label: 'Status',
  type: 'select',
  options: [
    { value: '', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ],
}
```

### `boolean`
True/False selection with "All" option.

```typescript
{
  key: 'hasService',
  label: 'Has Service',
  type: 'boolean',
}
```

### `text`
Text input field.

```typescript
{
  key: 'search',
  label: 'Search',
  type: 'text',
  placeholder: 'Enter search term',
}
```

### `number`
Numeric input field.

```typescript
{
  key: 'age',
  label: 'Age',
  type: 'number',
  placeholder: 'Enter age',
}
```

### `date`
Date picker field.

```typescript
{
  key: 'createdDate',
  label: 'Created Date',
  type: 'date',
}
```

### `multiselect`
Multiple selection dropdown.

```typescript
{
  key: 'categories',
  label: 'Categories',
  type: 'multiselect',
  options: [
    { value: 'cat1', label: 'Category 1' },
    { value: 'cat2', label: 'Category 2' },
  ],
}
```

## Grid Layout

Control the layout using `gridSize`:

- `gridSize: 12` - Full width (1 field per row)
- `gridSize: 6` - Half width (2 fields per row)
- `gridSize: 4` - One-third width (3 fields per row)
- `gridSize: 3` - Quarter width (4 fields per row)

## Benefits

1. **Consistency** - All filters look and behave the same
2. **Reusability** - Write once, use everywhere
3. **Maintainability** - Changes in one place affect all filters
4. **Type Safety** - Full TypeScript support
5. **Extensibility** - Easy to add new field types
6. **Performance** - Optimized rendering and state management

## Adding New Field Types

To add a new field type:

1. Add the type to the `FilterField` interface
2. Add the case in `FilterFieldComponent`
3. Update `generateFilterChips` function
4. Update `resetFilters` function

```typescript
// In FilterField interface
type: 'select' | 'boolean' | 'text' | 'number' | 'date' | 'multiselect' | 'newType';

// In FilterFieldComponent
case 'newType':
  return <YourNewComponent />;

// In generateFilterChips
case 'newType':
  label = `${field.label}: ${formatValue(value)}`;
  resetValue = defaultValue;
  break;
```
