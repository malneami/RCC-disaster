# RCC Healthcare Platform

A comprehensive healthcare coordination platform for managing patient transfers between hospitals with role-based access control and real-time communication capabilities.

## 🏥 Overview

The RCC Healthcare Platform is designed to streamline patient transfers across healthcare networks, focusing on three critical pathways:
- **STEMI** (ST-Elevation Myocardial Infarction)
- **Stroke** (Cerebrovascular Accidents)
- **Trauma** (Critical Injury Management)

## 🏗 Architecture

This is a monorepo containing:
- **Backend**: NestJS + TypeScript + PostgreSQL + Prisma ORM
- **Frontend**: React 18 + TypeScript + Material UI + Vite

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd rcc-healthcare-platform
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your specific configuration
```

### 3. Database Setup

```bash
# Start PostgreSQL and Redis containers
npm run db:up

# Generate Prisma client and run migrations
cd apps/backend
npm run db:generate
npm run db:migrate

# Seed development data
npm run db:seed
```

### 4. Start Development Servers

```bash
# Start both backend and frontend simultaneously
npm run dev

# Or start individually:
npm run dev:backend  # Backend at http://localhost:3001
npm run dev:frontend # Frontend at http://localhost:5173
```

## 👥 User Roles & Access

| Role | Access Level | Description |
|------|-------------|-------------|
| **Admin** | Full System | Complete platform access and user management |
| **RCC** | All Portals | Regional coordination center staff |
| **EMS** | Transport Management | Ambulance and transport coordination |
| **Data Collector** | Clinical Data | STEMI/Stroke/Trauma data entry |
| **Cath Lab User** | STEMI Portal Only | Catheterization lab staff |

## 🔐 Default Development Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@rcc-healthcare.com | Healthcare@2024 | Admin |
| coordinator@rcc-healthcare.com | Healthcare@2024 | RCC |
| ems@rcc-healthcare.com | Healthcare@2024 | EMS |
| datacollector@rcc-healthcare.com | Healthcare@2024 | Data Collector |
| cathlab@rcc-healthcare.com | Healthcare@2024 | Cath Lab User |

## 📋 Available Scripts

### Root Level
- `npm run dev` - Start both backend and frontend
- `npm run build` - Build both applications
- `npm run lint` - Lint all workspaces
- `npm run format` - Format code with Prettier
- `npm run db:up` - Start database containers
- `npm run db:down` - Stop database containers
- `npm run db:reset` - Reset database with fresh data

### Backend (apps/backend)
- `npm run dev` - Start NestJS development server
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed development data

### Frontend (apps/frontend)
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🏥 Key Features

### Authentication & Security
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Password policy enforcement
- Account lockout protection
- Session management with timeout
- HIPAA-compliant audit logging

### Healthcare Management
- **Patient Management**: Secure patient data with medical history
- **Hospital Network**: Real-time bed capacity and service availability
- **Transfer Coordination**: Streamlined patient transfer workflows
- **Clinical Portals**: Specialized interfaces for STEMI, Stroke, and Trauma

### Technical Features
- **Database**: PostgreSQL with Prisma ORM
- **API Documentation**: Swagger/OpenAPI integration
- **Real-time Updates**: WebSocket support for live data
- **Responsive Design**: Mobile-optimized for field use
- **Audit Trail**: Comprehensive activity logging

## 🔧 Development Guidelines

### Database Changes
1. Create new migration file in `apps/backend/prisma/migrations/`
2. Never modify existing migrations
3. Always include proper RLS policies
4. Test migrations thoroughly

### Code Organization
- Follow the established module structure
- Use TypeScript strict mode
- Implement proper error handling
- Include comprehensive tests

### Security Considerations
- Never commit sensitive data
- Use environment variables for configuration
- Follow HIPAA compliance guidelines
- Implement proper data encryption

## 🏗 Database Schema

### Core Entities
- **Users**: Authentication and role management
- **Hospitals**: Healthcare facility information
- **Patients**: Secure patient data management
- **Tickets**: Transfer request coordination
- **Activities**: Comprehensive audit trail

### Relationships
- Users belong to hospitals (optional)
- Tickets link patients to origin/destination hospitals
- Activities track all system interactions
- Role-based data access patterns

## 🔒 Security Features

### HIPAA Compliance
- Data encryption at rest and in transit
- Audit logging with 7-year retention
- Access controls and user authentication
- Secure password policies
- Data anonymization capabilities

### Technical Security
- Helmet.js security headers
- CORS configuration
- Request throttling
- SQL injection prevention
- XSS protection

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api/v1/health

## 🐳 Docker Services

The platform uses Docker for local development:
- **PostgreSQL 15**: Primary database
- **Redis 7**: Session storage and caching

## 🚨 Emergency Protocols

The platform supports three critical care pathways:

### STEMI Protocol
- Rapid cath lab activation
- Door-to-balloon time tracking
- EKG transmission capabilities

### Stroke Protocol
- NIHSS assessment tools
- Time-critical treatment windows
- Neurological intervention coordination

### Trauma Protocol
- Trauma center level verification
- Surgical team availability
- Multi-disciplinary care coordination

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Use conventional commit messages
3. Include comprehensive tests
4. Update documentation
5. Ensure HIPAA compliance

## 📄 License

This project is proprietary software designed for healthcare organizations. 
Unauthorized distribution is prohibited.

## 🆘 Support

For technical support or emergency issues, contact the development team or your system administrator.

---

**⚠️ Healthcare Compliance Notice**: This platform handles protected health information (PHI). 
Ensure proper HIPAA training and compliance protocols are followed at all times.