# Netlify Deployment Guide: GMS Admin Control Panel

This guide covers the deployment of the GMS Complaint Box Admin Control Panel (web build) to Netlify.

## 1. Build the Application
Since the admin panel is part of the Expo project, you need to generate a web production build.

```bash
npx expo export -p web
```
This will create a `dist/` directory.

## 2. Netlify Configuration
Create a `netlify.toml` file in the root directory (already included if previously set up, or create one with these contents):

```toml
[build]
  publish = "dist"
  command = "npx expo export -p web"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 3. Environment Variables
You MUST configure the following Environment Variables in the Netlify Dashboard (**Site Settings > Build & Deploy > Environment**):

| Key | Value |
|-----|-------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |

## 4. Deployment Steps
1. Push your code to a GitHub repository.
2. Link the repository to a new site on [Netlify](https://app.netlify.com).
3. Set the build command to `npx expo export -p web` and the publish directory to `dist`.
4. Deploy!

## 5. Security Note ⚠️
The Admin Control Panel routes (`/admin/*`) are protected by a `Role Guard` in `AppContext.tsx`. Only users with the `founder` role can access the Operational Controls. Ensure you have at least one user with `role = 'founder'` in your Supabase `users` table to manage the system.

## 6. Real-time Operations
Once deployed, changes made in the Control Panel (e.g., toggling Maintenance Mode) will propagate **instantly** to all active mobile and web clients via Supabase Realtime.
