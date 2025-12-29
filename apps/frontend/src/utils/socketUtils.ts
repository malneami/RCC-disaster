/**
 * Utility functions for WebSocket connections
 */

/**
 * Get the WebSocket base URL by extracting it from the API base URL
 * Removes /api/v1 suffix if present, as Socket.IO doesn't use REST API paths
 */
export function getWebSocketBaseUrl(): string {
  // If VITE_API_BASE_URL is set, use it. Otherwise, construct based on current hostname
  // This allows the app to work on LAN (e.g. 192.168.x.x) without changing env vars
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:3001`;
  
  // Remove /api/v1 or /api suffix if present
  let baseUrl = apiBaseUrl.replace(/\/api\/v\d+$/, '').replace(/\/api$/, '');
  
  // Ensure no trailing slash
  baseUrl = baseUrl.replace(/\/$/, '');
  
  return baseUrl;
}

/**
 * Construct a WebSocket URL with optional namespace
 * @param namespace - Socket.IO namespace (e.g., 'ems', 'notifications')
 * @returns Full WebSocket URL (Socket.IO automatically handles /socket.io path)
 */
export function getWebSocketUrl(namespace?: string): string {
  const baseUrl = getWebSocketBaseUrl();
  
  if (namespace) {
    // Ensure namespace starts with / and doesn't end with /
    // Socket.IO client automatically appends /socket.io for handshake
    const cleanNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
    return `${baseUrl}${cleanNamespace}`;
  }
  
  // For default namespace, just return base URL
  // Socket.IO client will automatically use /socket.io path
  return baseUrl;
}

