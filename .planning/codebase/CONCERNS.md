# Concerns

## Technical Debt
- **React 19 Compatibility**: Some packages (like Sentry) may have runtime conflicts with the latest React 19 / RN 0.81 experimental stack.
- **Bundler Issues**: Bundler failures can cause "Strict MIME" errors on web if syntax errors occur in entry files.
- **State Monolith**: `AppContext` is large and handles too many responsibilities (Auth, DB sync, UI state). It should be refactored into domain-specific providers.

## Pending Items
- **Sentry DSN**: Currently using a dummy string; error monitoring is disabled.
- **Geofencing Config**: Radius for site-locked submissions is mostly hardcoded to 200m/500m instead of being fully dynamic via the UI.
