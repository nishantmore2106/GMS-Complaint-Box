# GMS Complaints Box 🏢

A high-fidelity real-time facility management and complaint tracking system built with Expo (React Native) and Supabase.

## 🚀 Key Features
- **📊 Operational Dashboards**: Tailored views for Founders (Metrics/KPIs), Supervisors (Task Management), and Clients (Issue Tracking).
- **⚡ Real-time Sync**: Instant updates across all roles using Supabase Realtime subscriptions.
- **🏗️ Facility Management**: Add and monitor multiple sites with performance tracking.
- **✨ Soft UI Implementation**: Modern, neumorphic design system for a premium experience.
- **🔍 Global Search**: Combined search for Sites, Personnel, and Complaints.

## 🛠️ Tech Stack
- **Frontend**: React Native with Expo Router
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **Styling**: Vanilla CSS-in-JS (StyleSheet)
- **State**: AppContext (React Context + Real-time Listeners)
- **Icons**: Expo Vector Icons (Feather)

## 📦 Getting Started

1. **Clone & Install**:
   ```bash
   pnpm install
   ```

2. **Environment Setup**:
   Copy `.env.example` to `.env` and add your Supabase URL/Key.

3. **Run Dev Server**:
   ```bash
   pnpm run dev:tunnel
   ```

## 📂 Project Structure
- `app/`: Expo Router screens organized by role and feature.
- `context/`: Core application state and real-time synchronization.
- `components/`: Modular UI components (KPICards, ComplaintCards).
- `lib/`: External service initializations (Supabase).
- `migrations/`: SQL scripts for database schema and metrics.

## 📜 License
Internal use only. GMS Complaint Box © 2026.
