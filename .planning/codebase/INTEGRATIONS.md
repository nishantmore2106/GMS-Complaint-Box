# Integrations

## Core Services
- **Supabase**: Primary database and authentication provider. Used for real-time complaint tracking and site state.
- **Expo Notifications**: Handles push notifications for Supervisors, Founders, and Clients.

## Monitoring
- **Sentry**: Integration present in `_layout.tsx` but currently **disabled** (unwrapped) in the root export due to development runtime issues with React 19/RN 0.81.

## Hardware & Maps
- **Expo Location**: Used for geofencing validation during complaint submission.
- **Expo Camera**: Used for QR code scanning in the public portal.
- **React Native Maps**: Used for site creation and geographic visualization.
- **Expo Haptics**: Native vibration feedback for interaction validation.
