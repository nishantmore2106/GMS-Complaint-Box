# Structure

## Root
- `.planning/`: GSD system folder (Project context, Roadmap, State).
- `artifacts/`: Project monorepo packages.
- `seed-admin.js`: Script for initializing administrative users.

## Mobile (@workspace/mobile)
- `app/`: Routing entry points.
- `app/_layout.tsx`: Root layout with Context Providers and Sentry setup.
- `app/index.tsx`: Universal entry (Login for mobile, Portal for web scan).
- `components/`: Reusable UI elements (SoftButton, SoftInput, MapPicker, etc.).
- `context/`: Application state (`AppContext.tsx`).
- `constants/`: Global style tokens (`colors.ts`).
- `services/`: Service classes for business logic (NotificationManager).
- `lib/`: Framework primitives (Supabase client).

## Admin Web (@workspace/admin-web)
- `src/`: Source code for the Next.js/React administration portal.
