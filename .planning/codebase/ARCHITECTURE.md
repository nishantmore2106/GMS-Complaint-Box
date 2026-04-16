# Architecture

## Monorepo Structure
The project is a pnpm monorepo with multiple artifacts:
- `artifacts/mobile`: Core Mobile App (Expo)
- `artifacts/admin-web`: Web-based administration dashboard
- `artifacts/api-server`: Backend logic and shared services

## State Management
- **AppContext**: A central provider (`AppProvider`) wraps the application in `_layout.tsx`. It handles authentication state, global configuration (site/company), and Supabase synchronization.
- **Client/Supervisor Context**: Role-based state is derived from the `currentUser` in the `AppProvider`.

## Routing & Navigation
- **Expo Router**: Uses file-based routing.
- **Route Groups**:
  - `(tabs)`: Main user dashboard (Admin/Supervisor/Founder features).
  - `admin/`: Exclusive founder tools for company and site management.
  - `public/`: Public-facing portal for anonymous complaint submission via QR scan.

## Data Layer
- **Supabase**: Direct interaction with the database from the client for real-time updates and simplified auth.
- **State Sync**: Data is refreshed on app navigation and manual refresh actions via the `refreshData` method in `AppProvider`.
