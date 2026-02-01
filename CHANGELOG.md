# Changelog

## [0.5.1] - 2026-01-31 - "Team Collaboration & UI Polish"

### Added
- **Enhanced Project Member Selection**: "Add Member" dialog now shows all available users by default when opened, with real-time search filtering.
- **Improved User Discovery**: Added `getAllUsers` server action for better team management experience.

### Fixed
- **Registration Flow (v3)**: Finalized multi-step registration logic to ensure correct profile creation and role assignment for new users.
- **Server Startup Stability**: Optimized `force-start.js` to handle zombie processes and port cleanups more reliably on Windows.

## [0.5.0] - 2026-01-28 - "Stability & Field Expert Release"

### Added
- **Maintenance Tools**: New `force-start.js` script to resolve port conflicts and DNS issues (IPv4 preference).
- **Field App Enhancements**: Improved mobile interface for photo evidence and requirement searching.
- **Admin Team Dashboard**: Dedicated UI for managing system-wide user roles and profiles.

### Changed
- **Connectivity**: Enforced IPv4 for database/Next.js to prevent hangs in local area networks.
- **Security**: Hardened RLS policies for profiles and project assignments.

### Fixed
- **Role Assignment**: Resolved issues where new users were not getting the 'engineer' role by default.
- **Database Connection**: Stability fixes for long-running dev sessions.

## [0.3.0] - 2026-01-26 - "Pre-Audit Setup Release"


### Added - Pre-Audit Setup Workflow
- **3-Step Pre-Audit Wizard** for projects (`/projects/[id]/pre-audit`)
  - Step 1: Project Information (review)
  - Step 2: Systems Scope Selection (APS, SOUE, CCTV, ACS, HVAC, etc.)
  - Step 3: Requirement Sets Selection
- **Freeze Baseline** functionality
  - Creates AuditChecklists from selected RequirementSets
  - Generates AuditResults for all requirements
  - Locks project configuration after freeze
  - Updates project status to IN_PROGRESS
- **Extended Project Model** with 6 new fields:
  - `systemsInScope` (array) - systems included in audit
  - `scopeDepth` (BASIC/STANDARD/DEEP) - audit depth level
  - `scopeExclusions` (text) - excluded areas/systems
  - `baselineFrozen` (boolean) - freeze status
  - `baselineFrozenAt` (timestamp) - freeze date
  - `baselineFrozenBy` (text) - who froze baseline

### Added - Requirement Set Publishing
- **Publish RequirementSet Button** on norm detail pages
  - Shows only for DRAFT sets with requirements
  - Displays requirement count before publishing
  - Requires confirmation with summary
  - Changes status from DRAFT to PUBLISHED
  - Only published sets available in Pre-Audit Setup

### Changed
- **UI Cleanup**: Removed old "Запустить AI парсинг" button, kept only "Универсал парсинг v2"
- **getNormById**: Now includes requirementSet information
- **Project workflow**: Pre-Audit Setup required before field work

### Technical
- New files: 9 (actions, components, pages, scripts)
- Modified files: 6 (schema, actions, pages)
- Database migration: `migrations/add_project_preaudit_fields.sql`
- Documentation: `PRE_AUDIT_IMPLEMENTATION.md`, `TESTING_PRE_AUDIT.md`

## [0.2.0] - 2026-01-25 - "AI Pipeline Release"

### Added
- **Universal PDF Parser**: Integration with **OpenAI GPT-4o** for intelligent PDF parsing.
- **Raw Fragments Interface**: New tab in Norm Library to view, approve, or reject AI-extracted fragments.
- **AI Conversion Action**: Server action to convert approved fragments into structured `Requirements` using OpenAI GPT-4o-mini.
- **Auto-Linking**: 
  - Automatic `RequirementSet` creation linked to Norm Source.
  - Automatic handling of `jurisdiction` linking to parent document.
  - Defaulting to `FIRE_GENERAL` system for fire safety norms.

### Fixed
- **Database Consistency**: Resolved multiple `NOT NULL` constraints (`requirementSetId`, `systemId`, `jurisdiction`, `version`, `status`).
- **Environment**: Configured OpenAI API for parsing and reasoning (Gemini not used).
- **UI UX**: Added optimistic UI updates for status buttons and loading states.

## [0.1.0] - Initial Setup
- Project initialization (Next.js, Supabase).
- Basic database schema.
- PDF Upload functionality.
