/**
 * Application-wide configuration and environment variables
 */

export const APP_CONFIG = {
  NAME: 'YukiMart ERP',
  VERSION: '1.0.0',
  DEFAULT_LOCALE: 'vi',
  
  API: {
    BASE_URL: import.meta.env.VITE_API_URL || '/api',
    TIMEOUT: 15000,
    RETRY_COUNT: 2
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_PER_PAGE: 20
  }
}
