# Media Tracker

A PWA-ready media tracking application built with **TanStack Start**, **Supabase**, and **Tailwind CSS**.

## Features
- **Wall of Covers**: Visual dashboard for Movies, TV Shows, and Books.
- **PWA Support**: Installable on mobile devices with key meta tags and manifest.
- **Supabase Integration**: Auth, Database, and Storage (Schema provided).
- **Mock Data Mode**: Works without credentials for UI preview.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    # Note: Requires Node.js 18+ (tested on v24)
    ```

2.  **Environment Setup**:
    Copy `.env` and fill in your Supabase credentials:
    ```bash
    SUPABASE_URL=...
    SUPABASE_ANON_KEY=...
    ```

3.  **Database Setup**:
    Run the SQL script in `supabase/schema.sql` in your Supabase Dashboard (SQL Editor).

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Deployment (Vercel)

1.  Push to GitHub.
2.  Import project in Vercel.
3.  Set **Framework Preset** to "Vite" or "Other".
4.  Add Environment Variables (`SUPABASE_URL`, etc.).
5.  Deploy!

## PWA
To test PWA features, build and preview:
```bash
npm run build
npm run start
```
Then open in browser and look for the install icon.
