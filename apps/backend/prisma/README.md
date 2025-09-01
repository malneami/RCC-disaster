# Prisma Schema Splitting Setup

This project uses a custom schema splitting solution to organize Prisma models across multiple files for better maintainability.

## 📁 File Structure

```
prisma/
├── schema.prisma              # Generated schema (do not edit directly)
├── merge-schema.js            # Schema merging script
├── seed.ts                    # Main seed orchestration file
├── schemas/                   # Split schema files
│   ├── enums.prisma          # All enum definitions
│   ├── user.prisma           # User model
│   ├── hospital.prisma       # Hospital model
│   ├── patient.prisma        # Patient model
│   ├── ticket.prisma         # Ticket model
│   ├── critical-case.prisma  # CriticalCase model
│   ├── hospital-ticket.prisma # HospitalTicket model
│   ├── activity.prisma       # Activity model
│   └── system.prisma         # SystemConfig model
└── relations/                # Relation files (optional)
    └── (future relation files)
```

## 🔧 Available Scripts

### Schema Management
- `npm run schema:merge` - Merge split schema files into single schema.prisma
- `npm run schema:generate` - Merge schemas and generate Prisma client
- `npm run schema:migrate` - Merge schemas and run migrations

### Database Operations
- `npm run db:seed` - Run comprehensive seed data (preserves existing data)
- `npm run db:restore-users` - Restore original working users
- `npm run db:add-hospitals` - Add missing hospitals from seed-hospitals-new.ts
- `npm run db:reset` - Reset database and run migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:status` - Check migration status

## 🚀 How It Works

1. **Schema Files**: Each model is defined in its own `.prisma` file in the `schemas/` directory
2. **Merging**: The `merge-schema.js` script combines all files in the correct order
3. **Generation**: Prisma client is generated from the merged schema
4. **Validation**: The merge script validates that all required components are present

## 📋 File Processing Order

The schema files are processed in this specific order to handle dependencies:

1. `enums.prisma` - All enum definitions first
2. `user.prisma` - User model (referenced by others)
3. `hospital.prisma` - Hospital model (referenced by others)
4. `patient.prisma` - Patient model
5. `ticket.prisma` - Ticket model
6. `critical-case.prisma` - CriticalCase model
7. `hospital-ticket.prisma` - HospitalTicket model
8. `activity.prisma` - Activity model
9. `system.prisma` - SystemConfig model

## 🔄 Workflow

### Adding New Models
1. Create a new `.prisma` file in `schemas/` directory
2. Add the file to the `SCHEMA_ORDER` array in `merge-schema.js`
3. Run `npm run schema:generate` to update the client
4. Create and run migrations if needed

### Modifying Existing Models
1. Edit the appropriate file in `schemas/` directory
2. Run `npm run schema:generate` to update the client
3. Create and run migrations if schema changes are made

### Seeding Data
1. Edit `seed.ts` to add new seed data
2. Run `npm run db:seed` to populate the database

## ✅ Validation

The merge script validates:
- Generator block presence
- Datasource block presence
- Required models (User, Hospital, CriticalCase, HospitalTicket)
- Enum definitions

## 🎯 Benefits

- **Better Organization**: Related models are grouped together
- **Easier Maintenance**: Smaller files are easier to navigate
- **Team Collaboration**: Multiple developers can work on different models
- **Version Control**: Better diff tracking for model changes
- **Scalability**: Easy to add new models without cluttering one file

## 🚨 Important Notes

- **Never edit `schema.prisma` directly** - It's generated automatically
- **Always run `schema:generate`** after making changes to split files
- **Keep file order in mind** when adding new models with dependencies
- **Test the merge** before committing changes

## 🔍 Troubleshooting

### Merge Errors
- Check that all files in `SCHEMA_ORDER` exist
- Verify syntax in individual schema files
- Ensure no circular dependencies

### Generation Errors
- Run `npm run schema:merge` first to check for issues
- Verify that all referenced models exist
- Check enum references are correct

### Seed Errors
- Ensure database is running and accessible
- Check that all required models exist
- Verify foreign key relationships
