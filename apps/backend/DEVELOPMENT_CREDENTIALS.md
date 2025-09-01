# Development Login Credentials

## 🔐 User Accounts

All users use the same password: **Healthcare@2024**

| Role | Email | Full Name | Hospital Assignment |
|------|-------|-----------|-------------------|
| **Admin** | `admin@rcc-healthcare.com` | System Administrator | King Fahad Central Hospital |
| **RCC Coordinator** | `coordinator@rcc-healthcare.com` | RCC Coordinator | King Fahad Central Hospital |
| **EMS Operator** | `ems@rcc-healthcare.com` | EMS Operator | Jazan General Hospital |
| **Data Collector** | `datacollector@rcc-healthcare.com` | Data Collector | Prince Mohammed Bin Nasser Hospital |
| **Cath Lab Technician** | `cathlab@rcc-healthcare.com` | Cath Lab Technician | King Fahad Central Hospital |

## 🏥 Hospital Assignments

- **King Fahad Central Hospital (KFCH)**: Admin, RCC Coordinator, Cath Lab Technician
- **Jazan General Hospital (JGH)**: EMS Operator
- **Prince Mohammed Bin Nasser Hospital (PMNH)**: Data Collector

## 🚀 Quick Login

Copy and paste these credentials for quick testing:

### Admin Access
```
Email: admin@rcc-healthcare.com
Password: Healthcare@2024
```

### RCC Coordinator Access
```
Email: coordinator@rcc-healthcare.com
Password: Healthcare@2024
```

### EMS Operator Access
```
Email: ems@rcc-healthcare.com
Password: Healthcare@2024
```

### Data Collector Access
```
Email: datacollector@rcc-healthcare.com
Password: Healthcare@2024
```

### Cath Lab Technician Access
```
Email: cathlab@rcc-healthcare.com
Password: Healthcare@2024
```

## 🔧 Restoration Commands

If you need to restore these users:

```bash
# Restore development users
npm run db:restore-users

# Seed all data (preserves existing users)
npm run db:seed
```

## 📋 Features by Role

- **Admin**: Full system access, user management, hospital management
- **RCC Coordinator**: Hospital coordination, critical case management, ticket oversight
- **EMS Operator**: Emergency response, patient transport, real-time updates
- **Data Collector**: Data entry, reporting, analytics
- **Cath Lab Technician**: Cardiac procedures, STEMI cases, equipment management

