# GMS Complaints Box

## Overview

Multi-Tenant Manpower Complaint & Resolution System built with Expo (React Native) and a shared Express API backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Mobile**: Expo (React Native) with Expo Router
- **Backend**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **State**: AsyncStorage + React Context
- **UI**: Custom design system, dark navy (#0B1F3A) primary color

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── mobile/             # Expo React Native app (GMS Complaints Box)
│       ├── app/
│       │   ├── index.tsx           # Login screen
│       │   ├── _layout.tsx         # Root layout + providers
│       │   ├── (tabs)/             # Tab navigation
│       │   │   ├── index.tsx       # Dashboard (role-based)
│       │   │   ├── complaints.tsx  # Complaints list + filter
│       │   │   ├── analytics.tsx   # Analytics (founder/client only)
│       │   │   └── profile.tsx     # Profile + logout
│       │   └── complaint/
│       │       ├── [id].tsx        # Complaint detail + actions
│       │       └── new.tsx         # New complaint form
│       ├── components/
│       │   ├── ComplaintCard.tsx
│       │   ├── KPICard.tsx
│       │   ├── StatusBadge.tsx
│       │   ├── PriorityBadge.tsx
│       │   └── SectionHeader.tsx
│       ├── context/
│       │   └── AppContext.tsx      # Multi-tenant state management
│       └── constants/
│           └── colors.ts           # Design tokens
```

## Features

### Roles
- **Founder**: Full overview, company switcher, analytics, read-only
- **Client**: Raise complaints, track own complaints, site-filtered view
- **Supervisor**: View assigned complaints, start work, upload proof, resolve

### Multi-Tenant Architecture
- Each company has isolated data (companyId on all entities)
- Users can only see their company's complaints/sites
- Founder can switch between companies via top dropdown

### Data Model
- `companies`: id, name
- `users`: id, phone, name, role, companyId
- `sites`: id, name, companyId, clientId
- `complaints`: id, companyId, siteId, clientId, supervisorId, status, description, category, priority, before/after media, timestamps

### Demo Accounts
- `1001` - John Smith (Founder, TechCorp)
- `1002` - Sarah Connor (Client, TechCorp)  
- `1003` - Mike Johnson (Supervisor, TechCorp)
- `2001` - Emma Davis (Founder, BuildMaster)
- `2002` - David Lee (Client, BuildMaster)
- `2003` - Lisa Park (Supervisor, BuildMaster)

## Color Palette
- Primary: `#0B1F3A` (dark navy)
- Accent: `#2A6FFF` (blue)
- Success: `#22C55E`
- Warning: `#F59E0B`
- Danger: `#E53935`
