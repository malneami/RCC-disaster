/**
 * Constants for video call UI components
 */

export const VIDEO_CALL_CONSTANTS = {
  // Panel dimensions
  MINIMIZED_PANEL_WIDTH: 200,
  MINIMIZED_PANEL_HEIGHT: 60,
  
  // Layout dimensions
  APP_BAR_HEIGHT: 64,
  SIDEBAR_WIDTH: 280,
  
  // Hidden panel position (off-screen to keep connection alive)
  HIDDEN_PANEL_TOP: '-9999px',
  HIDDEN_PANEL_LEFT: '-9999px',
  HIDDEN_PANEL_WIDTH: '320px',
  HIDDEN_PANEL_HEIGHT: '240px',
  
  // Panel spacing
  PANEL_MARGIN: 20,
  
  // Z-index layers
  Z_INDEX_FULL_PAGE: 1000,
  Z_INDEX_FLOATING_PANEL: 1300,
  Z_INDEX_HIDDEN: -1,
  
  // Token fetch retry settings
  TOKEN_RETRY_MAX_ATTEMPTS: 3,
  TOKEN_RETRY_DELAY_MS: 1000,
} as const;
