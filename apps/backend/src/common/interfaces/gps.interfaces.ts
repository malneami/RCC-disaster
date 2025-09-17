/**
 * GPS System Interfaces
 * Type definitions for all GPS-related data structures
 */

import { GPS_CONSTANTS, GPS_STATUS_TYPES } from '../constants/gps.constants';

/**
 * GPS Location Data
 */
export interface GpsLocation {
  latitude: number;
  longitude: number;
  speed?: number;           // km/h
  direction?: number;       // degrees (0-360)
  timestamp: Date;
  accuracy?: number;        // meters
}

/**
 * Vehicle Status from GPS API
 */
export interface VehicleStatus {
  vehicleId: string;
  location: GpsLocation;
  fuelLevel?: number;       // percentage (0-100)
  engineStatus?: boolean;
  address?: string;
}

/**
 * GPS Validation Result
 */
export interface GpsValidationResult {
  isValid: boolean;
  error?: string;
  accuracy?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  deviation?: number;       // meters
}

/**
 * GPS Status Analysis Result
 */
export interface GpsStatusAnalysis {
  currentStatus: string;
  recommendedStatus: string;
  confidence: number;       // 0-100
  reason: string;
  gpsData: {
    speed: number | undefined;
    distanceToPickup: number | null;
    distanceToDestination: number | null;
    isMoving: boolean;
    isStationary: boolean;
  };
  shouldUpdateStatus: boolean;
}

/**
 * Status Transition Rule
 */
export interface StatusTransitionRule {
  fromStatus: string;
  toStatus: string;
  conditions: {
    speedRange?: [number, number];     // [min, max] km/h
    distanceThreshold?: number;        // meters
    locationType: 'pickup' | 'destination' | 'any';
    minStationaryTime?: number;        // milliseconds
  };
  priority: number;                    // Higher priority rules are checked first
}

/**
 * GPS Alert Data
 */
export interface GpsAlert {
  type: keyof typeof GPS_STATUS_TYPES.ALERT_TYPES;
  ambulanceId: string;
  ticketId?: string;
  severity: keyof typeof GPS_STATUS_TYPES.ALERT_SEVERITY;
  message: string;
  timestamp: Date;
  requiresAction: boolean;
  metadata?: Record<string, any>;
}

/**
 * GPS API Log Data
 */
export interface GpsApiLogData {
  vehicleId: string;
  endpoint: string;
  requestData?: any;
  responseData?: any;
  statusCode?: number;
  responseTime?: number;    // milliseconds
  error?: string;
  timestamp: Date;
  apiKey?: string;
  headers?: Record<string, string>;
}

/**
 * GPS Data Log Entry
 */
export interface GpsDataLogEntry {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  direction?: number;
  timestamp: Date;
  accuracy?: number;
  fuelLevel?: number;
  engineStatus?: boolean;
  address?: string;
  rawData: any;
  validationResult?: any;
  processingTime?: number;  // milliseconds
}

/**
 * GPS Configuration Interface
 */
export interface GpsConfig {
  apiKey: string;
  baseUrl: string;
  updateInterval: number;
  cacheTtl: number;
  rateLimit: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  backoff: 'linear' | 'exponential';
  enableCaching: boolean;
  enableRateLimit: boolean;
  enableRetry: boolean;
  enableApiLogging: boolean;
  enableDataLogging: boolean;
  enableValidationLogging: boolean;
  enableDetailedLogging: boolean;
  logSamplingRate: number;
  maxLogsPerMinute: number;
}

/**
 * GPS Polling Status
 */
export interface GpsPollingStatus {
  isPolling: boolean;
  interval: number;
  lastPoll: string;
  activeAmbulances: number;
  errors: number;
}

/**
 * GPS Health Status
 */
export interface GpsHealthStatus {
  isHealthy: boolean;
  lastUpdate: Date;
  activeConnections: number;
  errorRate: number;
  averageResponseTime: number;
  alerts: GpsAlert[];
}

/**
 * GPS Statistics
 */
export interface GpsStatistics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errorRate: number;
  last24Hours: {
    requests: number;
    errors: number;
    averageResponseTime: number;
  };
}

/**
 * GPS Route Information
 */
export interface GpsRoute {
  pickupLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  destinationLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  estimatedDistance: number;    // meters
  estimatedDuration: number;    // milliseconds
  waypoints?: Array<{
    latitude: number;
    longitude: number;
  }>;
}

/**
 * GPS Movement Analysis
 */
export interface GpsMovementAnalysis {
  isMoving: boolean;
  isStationary: boolean;
  speed: number;
  movementType: keyof typeof GPS_STATUS_TYPES.MOVEMENT_TYPES;
  direction: number;
  acceleration?: number;         // km/h²
  distanceTraveled?: number;   // meters
  timeStationary?: number;      // milliseconds
}

/**
 * GPS Performance Metrics
 */
export interface GpsPerformanceMetrics {
  responseTime: number;         // milliseconds
  accuracy: number;            // meters
  signalStrength?: number;      // percentage
  batteryLevel?: number;        // percentage
  lastUpdateAge: number;        // milliseconds
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * GPS Error Context
 */
export interface GpsErrorContext {
  vehicleId: string;
  timestamp: Date;
  errorType: string;
  errorMessage: string;
  context: Record<string, any>;
  retryCount?: number;
  lastSuccessfulUpdate?: Date;
}

/**
 * GPS Cache Entry
 */
export interface GpsCacheEntry {
  key: string;
  data: VehicleStatus;
  timestamp: Date;
  ttl: number;
  hits: number;
}

/**
 * GPS Batch Request
 */
export interface GpsBatchRequest {
  vehicleIds: string[];
  requestId: string;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

/**
 * GPS Batch Response
 */
export interface GpsBatchResponse {
  requestId: string;
  timestamp: Date;
  results: Array<{
    vehicleId: string;
    success: boolean;
    data?: VehicleStatus;
    error?: string;
  }>;
  processingTime: number;
  totalVehicles: number;
  successfulVehicles: number;
  failedVehicles: number;
}

