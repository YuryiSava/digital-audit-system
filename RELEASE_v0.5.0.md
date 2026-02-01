# Release Notes v0.5.0 - Stability & Team Management

**Date:** 2026-01-28
**Status:** Pilot Ready (Stable)

## 🚀 Key Highlights
This release stabilizes the platform for real-world pilot usage, fixing critical connectivity issues and enabling full team management.

### 👥 Team & Access Management (New)
- **Admin Dashboard**: New `/team` section for Administrators to view all users and manage roles.
- **Robust Registration**: Fixed user onboarding flow. New users are automatically created as `engineers` with correct profile data.
- **Role-Based Access**:
  - **Admins**: Full system access + Team Management.
  - **Engineers**: Access to assigned audits and field app.

### 🛠 Core Stability & Architecture
- **Stable Database Connection**: Resolved persistent connection drops on Windows (IPv6/IPv4 conflicts) by enforcing IPv4 preference.
- **Reliable Start Script**: Added `npm run dev:lan` (via `scripts/force-start.js`) which:
  - Automatically cleans up zombie processes on port 3000.
  - Forces correct DNS resolution order (IPv4 first).
  - Ensures clean application startup every time.

### 📱 Field App (Mobile First)
- **Dedicated Interface**: A completely new mobile-optimized experience at `/field`.
- **Photo Evidence**:
  - **Split Evidence Upload**: Distinct buttons for "Camera" (Capture) and "Gallery" (Upload).
  - Direct upload to Supabase Storage.
- **Offline Capable**: Foundation built on DexieJS for caching projects locally (Beta).

### 🔒 Security
- **Row Level Security (RLS)**:
  - Users can only edit their own profiles.
  - Public profile visibility for team collaboration.
  - Secure integration with Supabase Auth V3.

## 📝 Known Issues / Next Steps
- **Offline Sync**: Currently manual; automatic background sync is in development.
- **PDF Generation**: Styles need polish for Cyrillic fonts.
- **Invite System**: Currently users register themselves; email invites are planned for v0.6.

---
**Deployment Instructions:**
1. Update database: `npm run db:push`
2. Start server: `npm run dev:lan`
3. Admin Setup: First registered user may need manual upgrade via `scripts/fix-roles.js` if not automatically detected.
