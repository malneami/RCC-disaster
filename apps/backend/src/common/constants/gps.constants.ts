/**
 * GPS System Constants
 * Centralized configuration for all GPS-related functionality
 */

export const GPS_CONSTANTS = {
  // Speed thresholds (km/h)
  SPEED: {
    MOVING_THRESHOLD: 5,        // Above this speed is considered moving
    STATIONARY_THRESHOLD: 2,    // Below this speed is considered stationary
    MAX_REASONABLE_SPEED: 120,  // Maximum reasonable speed for validation
  },

  // Distance thresholds (meters)
  DISTANCE: {
    PICKUP_ARRIVAL_THRESHOLD: 50,      // Distance to consider arrived at pickup
    DESTINATION_ARRIVAL_THRESHOLD: 100, // Distance to consider arrived at destination
    ROUTE_DEVIATION_THRESHOLD: 1000,   // Maximum deviation from planned route
  },

  // Time thresholds (milliseconds)
  TIME: {
    MIN_STATIONARY_TIME: 60000,        // 1 minute - minimum time stationary for arrival confirmation
    GPS_DATA_MAX_AGE: 300000,          // 5 minutes - maximum age of GPS data
    DEFAULT_POLLING_INTERVAL: 60000,   // 1 minute - default polling interval
    DEFAULT_CACHE_TTL: 60000,          // 1 minute - default cache TTL
    DEFAULT_TIMEOUT: 10000,            // 10 seconds - default API timeout
  },

  // Confidence thresholds (percentage)
  CONFIDENCE: {
    MIN_STATUS_UPDATE: 80,             // Minimum confidence for automatic status updates
    HIGH_CONFIDENCE: 90,               // High confidence threshold
    MEDIUM_CONFIDENCE: 70,             // Medium confidence threshold
    LOW_CONFIDENCE: 50,                // Low confidence threshold
  },

  // Saudi Arabia GPS bounds
  BOUNDS: {
    MIN_LATITUDE: 16.0,
    MAX_LATITUDE: 32.0,
    MIN_LONGITUDE: 34.0,
    MAX_LONGITUDE: 55.0,
  },

  // GPS accuracy thresholds (meters)
  ACCURACY: {
    MIN_REQUIRED: 10,                  // Minimum required GPS accuracy
    EXCELLENT: 5,                      // Excellent GPS accuracy
    GOOD: 10,                          // Good GPS accuracy
    FAIR: 20,                          // Fair GPS accuracy
  },

  // Logging configuration
  LOGGING: {
    DEFAULT_SAMPLING_RATE: 0.1,        // 10% of requests logged by default
    DEFAULT_MAX_LOGS_PER_MINUTE: 60,   // Maximum logs per vehicle per minute
    DEFAULT_MAX_LOGS_PER_HOUR: 3600,   // Maximum logs per vehicle per hour
  },

  // Retry configuration
  RETRY: {
    DEFAULT_ATTEMPTS: 3,
    DEFAULT_DELAY: 1000,               // 1 second
    DEFAULT_BACKOFF: 'exponential' as const,
  },

  // Rate limiting
  RATE_LIMIT: {
    DEFAULT_REQUESTS_PER_MINUTE: 100,
    DEFAULT_REQUESTS_PER_HOUR: 1000,
  },
} as const;

/**
 * GPS Status Types
 */
export const GPS_STATUS_TYPES = {
  ASSIGNMENT_STATUS: {
    ASSIGNED: 'ASSIGNED',
    EMS_CONTACT: 'EMS_CONTACT',
    EN_ROUTE: 'EN_ROUTE',
    AT_PICKUP: 'AT_PICKUP',
    PATIENT_LOADED: 'PATIENT_LOADED',
    EMS_ARRIVAL: 'EMS_ARRIVAL',
    DEPARTED: 'DEPARTED',
    ARRIVED: 'ARRIVED',
    CANCELLED: 'CANCELLED',
  },
  
  EVENT_TYPES: {
    EMS_TRANSPORT_START: 'ems_transport_start',
    AMBULANCE_ARRIVED: 'ambulance_arrived',
    PATIENT_LOADED: 'patient_loaded',
    EMS_ARRIVAL: 'ems_arrival',
    STATUS_CHANGE: 'status_change',
  },

  MOVEMENT_TYPES: {
    MOVING: 'moving',
    STATIONARY: 'stationary',
    SLOW_MOVING: 'slow_moving',
  },

  ALERT_TYPES: {
    SIGNAL_LOSS: 'signal_loss',
    INVALID_COORDINATES: 'invalid_coordinates',
    SPEED_VIOLATION: 'speed_violation',
    ACCURACY_ISSUE: 'accuracy_issue',
    STALE_DATA: 'stale_data',
    ROUTE_DEVIATION: 'route_deviation',
  },

  ALERT_SEVERITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  },
} as const;

/**
 * GPS Error Messages
 */
export const GPS_ERROR_MESSAGES = {
  NO_GPS_DATA: 'No GPS data available for ambulance',
  INVALID_COORDINATES: 'Coordinates outside operational area',
  STALE_DATA: 'GPS data is stale',
  SPEED_EXCEEDED: 'Speed exceeds maximum limit',
  ACCURACY_INSUFFICIENT: 'GPS accuracy insufficient',
  SIGNAL_LOSS: 'GPS signal lost',
  VALIDATION_FAILED: 'GPS validation failed',
  API_ERROR: 'GPS API error',
  NETWORK_ERROR: 'Network error accessing GPS API',
  RATE_LIMIT_EXCEEDED: 'GPS API rate limit exceeded',
  TIMEOUT: 'GPS API request timeout',
} as const;

/**
 * GPS Configuration Defaults
 */
export const GPS_CONFIG_DEFAULTS = {
  API_KEY: '',
  BASE_URL: 'http://gps3.tawasolmap.com/new_api',
  UPDATE_INTERVAL: GPS_CONSTANTS.TIME.DEFAULT_POLLING_INTERVAL,
  CACHE_TTL: GPS_CONSTANTS.TIME.DEFAULT_CACHE_TTL,
  TIMEOUT: GPS_CONSTANTS.TIME.DEFAULT_TIMEOUT,
  RETRY_ATTEMPTS: GPS_CONSTANTS.RETRY.DEFAULT_ATTEMPTS,
  RETRY_DELAY: GPS_CONSTANTS.RETRY.DEFAULT_DELAY,
  BACKOFF: GPS_CONSTANTS.RETRY.DEFAULT_BACKOFF,
  RATE_LIMIT: GPS_CONSTANTS.RATE_LIMIT.DEFAULT_REQUESTS_PER_MINUTE,
  ENABLE_CACHING: true,
  ENABLE_RATE_LIMIT: true,
  ENABLE_RETRY: true,
  ENABLE_API_LOGGING: false,
  ENABLE_DATA_LOGGING: false,
  ENABLE_VALIDATION_LOGGING: true,
  ENABLE_DETAILED_LOGGING: false,
  LOG_SAMPLING_RATE: GPS_CONSTANTS.LOGGING.DEFAULT_SAMPLING_RATE,
  MAX_LOGS_PER_MINUTE: GPS_CONSTANTS.LOGGING.DEFAULT_MAX_LOGS_PER_MINUTE,
} as const;

