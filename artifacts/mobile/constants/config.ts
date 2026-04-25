export const APP_CONFIG = {
  GEOFENCE: {
    DEFAULT_RADIUS: 250, // Meters
    MIN_ACCURACY: 50,    // Meters
    REFRESH_INTERVAL: 10000, // MS
  },
  STORAGE: {
    BUCKET_NAME: 'complaints',
    MAX_IMAGE_SIZE: 1024 * 1024 * 5, // 5MB
  },
  AUTH: {
    SESSION_RECOVERY_KEY: 'gms_active_tracker_id',
  },
  SYSTEM: {
    VERSION: '1.2.0',
    MAINTENANCE_CHECK_INTERVAL: 60000 * 5, // 5 mins
  },
  CACHE: {
    SITES: 'cached_sites',
    COMPLAINTS: 'cached_complaints',
    SITE_METRICS: 'cached_site_metrics',
    SUP_METRICS: 'cached_supervisor_metrics',
    LAST_SYNCED: 'last_synced_timestamp',
    PROFILE_IMAGE_PREFIX: 'profileImage_',
  }
};
