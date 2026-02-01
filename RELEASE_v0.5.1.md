# Release Notes v0.5.1 - Team Collaboration & Security Hardening

**Date:** 2026-01-31
**Status:** Pilot Ready (Stable)

## 🚀 Key Highlights
This release focuses on improving the project management experience and finalizing the security/identity foundation of the system.

### 👥 Team & Project Management
- **Smart Member Assignment**: 
  - The "Add Member" dialog now fetches and displays all registered users by default.
  - This eliminates guess-work for PMs and makes onboarding existing team members to new projects seamless.
  - Search functionality remains active for quickly finding specific individuals in large teams.
- **Backend Service**: New `getAllUsers` action to support team discovery.

### 🛡️ Identity & Access (Finalized)
- **Registration v3**: 
  - Integrated the final registration logic that cleanly handles first-time user creation in Supabase.
  - Ensures every user is assigned the correct `engineer` role and `user_profiles` record.
- **RLS Policy Audit**: 
  - Verified and fixed Row Level Security policies for `project_assignments` and `user_profiles`.
  - Administrators now have consistent visibility across all team members.

### ⚙️ Maintenance & Operations
- **Enhanced `force-start.js`**:
  - Improved logic for detecting and killing zombie Node.js processes on Windows.
  - Ensures a "clean slate" Every time `npm run dev:lan` is executed.
  - Maintaining IPv4-first DNS order to prevent network timeouts.

## 📝 Next Steps (Phase 1 Roadmap)
1. **Session Optimization**: Finalizing cookie settings for seamless auth across different network environments.
2. **Automated Backups**: Setting up a cron for database dumps.
3. **Data Validation**: Enhancing field app inputs to prevent edge-case sync errors.

---
**Deployment Instructions:**
1. Check environment: `.env` should have correct Supabase/OpenAI keys.
2. Startup: Use `npm run dev:lan` for the most stable experience.
3. Database: If roles are missing, run `node scripts/fix-roles.js`.
