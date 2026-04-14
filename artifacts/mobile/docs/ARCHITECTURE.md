# System Architecture: GMS Complaints Box 🌌

## 🧬 Core Methodology
GMS Complaints Box is designed for real-time operational scale using a **Single-Source-of-Truth** pattern powered by Supabase Realtime and React Context.

## 🌉 Global State Management
- **AppContext**: The heart of the application's data layer. It manages:
    - User authentication and profile resolution.
    - Real-time subscriptions for `complaints`, `sites`, and `site_metrics`.
    - Consolidated data loading (parallel fetching) to minimize TTI (Time to Interactive).

## 🎨 Design System: Soft UI
The visual identity follows a Neumorphic ("Soft UI") approach:
- **Surface Elevation**: Achieved through layered shadows and subtle color gradients (`LinearGradient`).
- **Interactive States**: Use `Pressable` with `haptics` for tactile feedback.
- **Tokens**: Centralized in `constants/Colors.ts` for consistency.

## 🏗️ Data Model
- **Companies**: Top-level entity for business isolation.
- **Sites**: Facility locations belonging to a company.
- **Complaints**: Issues reported at a specific site.
- **Metrics**: Aggregated performance data tracked per site and supervisor.
- **System Logs**: Audit trail for business-critical events.

## 🛡️ Security
- **Role-Based Access Control (RBAC)**: Enforced via `role` field in profiles and filtered queries in `AppContext`.
- **Supabase RLS**: Row Level Security policies (SQL) ensure users only see data belonging to their company/site.
