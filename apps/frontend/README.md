# RCC Healthcare Platform - Frontend

A modern React-based frontend application for the RCC Healthcare Platform, built with Vite, TypeScript, and Material-UI.

## 🏗️ Technology Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Material-UI (MUI)** - Component library
- **React Router** - Routing
- **Axios** - HTTP client
- **Socket.IO Client** - WebSocket communication
- **Chart.js / Recharts** - Data visualization

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Backend server running (see main README)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `https://localhost:5173` (HTTPS by default).

## ⚙️ Environment Configuration

The frontend uses environment variables to configure API endpoints, WebSocket connections, and development server settings. All environment variables must be prefixed with `VITE_` to be accessible in the application.

**All environment variables are required.** Create a `.env` file in the `apps/frontend` directory with all the following variables:

```env
# API Base URL - Full URL including path
# This is used by the frontend API client for making HTTP requests
VITE_API_BASE_URL=http://localhost:3001/api/v1

# Socket URL - Base URL for WebSocket connections
# Socket.IO will automatically append /socket.io path
VITE_SOCKET_URL=http://localhost:3001

# API Timeout in milliseconds
VITE_API_TIMEOUT=10000

# Development Server Port
VITE_PORT=5173

# Enable HTTPS for dev server
# Set to 'true' to enable HTTPS, 'false' to disable
VITE_HTTPS=true

# Enable host access (allows access from network)
# Set to 'true' to enable network access, 'false' for localhost only
VITE_HOST=true

# Proxy Security - SSL certificate verification for proxy connections
# Set to 'true' to verify SSL certificates, 'false' to skip verification
VITE_PROXY_SECURE=false
```

### Environment Variable Details

#### `VITE_API_BASE_URL` (Required)

The full URL to the backend API, including the API path.

**Format:** `http://hostname:port/api/v1` or `https://hostname:port/api/v1`

**Examples:**
- Local development: `http://localhost:3001/api/v1`
- Remote server: `http://10.138.40.24:3001/api/v1`
- Production: `https://api.example.com/api/v1`

**Usage:**
- Used by `apiClient` (Axios instance) for all HTTP requests
- Automatically includes `/api/v1` prefix in all API calls
- Used by Vite proxy configuration to forward `/api` requests

#### `VITE_SOCKET_URL` (Required)

The base URL for WebSocket/Socket.IO connections.

**Format:** `http://hostname:port` or `https://hostname:port`

**Examples:**
- Local development: `http://localhost:3001`
- Remote server: `http://10.138.40.24:3001`
- Production: `https://api.example.com`

**Usage:**
- Used for Socket.IO connections (notifications, real-time updates, video calls)
- Socket.IO automatically appends `/socket.io` path
- Used by `socketUtils.ts` and WebSocket services
- Used by Vite proxy configuration to forward `/socket.io` requests

#### `VITE_API_TIMEOUT` (Required)

Timeout for API requests in milliseconds.

**Format:** Integer value in milliseconds

**Examples:**
- `10000` (10 seconds)
- `15000` (15 seconds)
- `20000` (20 seconds)

**Usage:**
- Applied to all HTTP requests made through the `apiClient`
- Prevents requests from hanging indefinitely

#### `VITE_PORT` (Required)

Port number for the Vite development server.

**Format:** Integer port number

**Examples:**
- `5173` (default Vite port)
- `3000`
- `8080`

**Usage:**
- Development server will run on `https://localhost:VITE_PORT`
- Must be an available port on your system

#### `VITE_HTTPS` (Required)

Enable or disable HTTPS for the development server.

**Format:** `true` or `false` (string)

**Values:**
- `true`: HTTPS enabled (uses self-signed certificate)
- `false`: HTTP enabled

**Usage:**
- Controls whether the development server uses HTTPS or HTTP
- HTTPS is recommended for development to match production environment and test WebSocket connections properly
- When `true`, Vite will generate a self-signed certificate automatically

#### `VITE_HOST` (Required)

Enable or disable host access (allows access from network).

**Format:** `true` or `false` (string)

**Values:**
- `true`: Accessible from network (e.g., `https://192.168.1.100:5173`)
- `false`: Only accessible from localhost

**Usage:**
- Controls whether the development server is accessible from other devices on the network
- Set to `true` if you need to access the app from mobile devices or other computers on the same network
- Set to `false` for localhost-only access

#### `VITE_PROXY_SECURE` (Required)

Enable SSL certificate verification for proxy connections.

**Format:** `true` or `false` (string)

**Values:**
- `true`: Verify SSL certificates (use for production with valid certificates)
- `false`: Skip SSL verification (use for development with self-signed certificates)

**Usage:**
- Controls SSL certificate verification for Vite proxy connections to the backend
- Set to `false` when using self-signed certificates in development
- Set to `true` in production environments with valid SSL certificates

### Example Configuration Files

#### Local Development (.env.local)

```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_SOCKET_URL=http://localhost:3001
VITE_API_TIMEOUT=10000
VITE_PORT=5173
VITE_HTTPS=true
VITE_HOST=true
VITE_PROXY_SECURE=false
```

#### Remote Development (.env.development)

```env
VITE_API_BASE_URL=http://10.138.40.24:3001/api/v1
VITE_SOCKET_URL=http://10.138.40.24:3001
VITE_API_TIMEOUT=15000
VITE_PORT=5173
VITE_HTTPS=true
VITE_HOST=true
VITE_PROXY_SECURE=false
```

#### Production (.env.production)

```env
VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_SOCKET_URL=https://api.example.com
VITE_API_TIMEOUT=20000
VITE_PORT=5173
VITE_HTTPS=true
VITE_HOST=true
VITE_PROXY_SECURE=true
```

**Note:** All environment variables must be set in your `.env` file. The application will not work correctly if any variable is missing.

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

### Project Structure

```
apps/frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── services/        # API and service layer
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── theme/           # Material-UI theme
│   └── main.tsx         # Application entry point
├── public/              # Static assets
├── vite.config.ts       # Vite configuration
└── package.json         # Dependencies and scripts
```

## 🌐 API Integration

### API Client

The frontend uses a centralized Axios instance configured in `src/services/apiClient.ts`:

```typescript
import apiClient from '@/services/apiClient';

// GET request
const response = await apiClient.get('/patients');

// POST request
const response = await apiClient.post('/patients', data);
```

The API client automatically:
- Uses `VITE_API_BASE_URL` as the base URL
- Adds authentication tokens from localStorage
- Handles 401 errors (redirects to login)
- Applies timeout from `VITE_API_TIMEOUT`

### WebSocket Connections

WebSocket connections are managed through utility functions in `src/utils/socketUtils.ts`:

```typescript
import { getWebSocketUrl } from '@/utils/socketUtils';
import { io } from 'socket.io-client';

// Connect to default namespace
const socket = io(getWebSocketUrl());

// Connect to specific namespace
const videoCallSocket = io(getWebSocketUrl('/video-calls'));
```

The WebSocket utilities:
- Use `VITE_SOCKET_URL` if set, otherwise derive from `VITE_API_BASE_URL`
- Automatically handle Socket.IO path conventions
- Support multiple namespaces

## 🔐 Authentication

The frontend uses JWT tokens stored in localStorage:
- `accessToken` - Used for API authentication
- `refreshToken` - Used for token refresh (if implemented)

Tokens are automatically added to API requests via the `apiClient` interceptor.

## 🧪 Testing

Tests are written using Vitest and React Testing Library:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📦 Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

The build output will be in the `dist/` directory.

### Production Environment Variables

For production builds, create a `.env.production` file with all required variables:

```env
VITE_API_BASE_URL=https://api.production.com/api/v1
VITE_SOCKET_URL=https://api.production.com
VITE_API_TIMEOUT=20000
VITE_PORT=5173
VITE_HTTPS=true
VITE_HOST=true
VITE_PROXY_SECURE=true
```

Build with production environment:

```bash
npm run build
```

## 🐛 Troubleshooting

### API Connection Issues

1. **Check `VITE_API_BASE_URL`**: Ensure it points to the correct backend URL
2. **Check CORS**: Ensure backend allows requests from frontend origin
3. **Check Network**: Verify backend server is running and accessible

### WebSocket Connection Issues

1. **Check `VITE_SOCKET_URL`**: Ensure it points to the correct backend URL (without `/api/v1`)
2. **Check Proxy**: Verify Vite proxy configuration in `vite.config.ts`
3. **Check HTTPS**: WebSocket connections may require HTTPS in production

### Development Server Issues

1. **Port Already in Use**: Change `VITE_PORT` to a different port
2. **HTTPS Certificate Warnings**: This is normal with self-signed certificates in development
3. **Network Access**: Set `VITE_HOST=true` to access from other devices on the network

## 📝 Notes

- All environment variables must be prefixed with `VITE_` to be accessible in the application
- Environment variables are embedded at build time, not runtime
- Changes to `.env` require restarting the development server
- The Vite proxy configuration automatically forwards `/api` and `/socket.io` requests to the backend

## 🔗 Related Documentation

- [Main README](../../README.md) - Project overview and setup
- [Backend README](../../apps/backend/README.md) - Backend documentation
- [Vite Documentation](https://vitejs.dev/) - Vite build tool documentation

