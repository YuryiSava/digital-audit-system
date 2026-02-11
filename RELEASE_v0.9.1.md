# Release v0.9.1: System-Centric Audit Planning & Reliability

## 🚀 Major Changes

### 1. Audit Planning Restructuring (Phase 8)
- **Problem**: Previously, audit planning required selecting abstract "Requirement Sets", which was unintuitive.
- **Solution**: Implemented a **System-Centric** workflow.
    - **Step 1 (Scope)**: User selects Systems (e.g., APS, SOUE, CCTV).
    - **Step 2 (Norms)**: User selects **Normative Documents** (e.g., SP 484, SP 6, GOST R).
    - **Generation**: The system automatically filters restrictions from the selected Norms, keeping ONLY those that apply to the selected Systems (using a new Tag Mapping engine).

### 2. Reliability & Error Handling
- **Global Error Boundaries**: Added `error.tsx` and `global-error.tsx` to prevent the entire application from crashing (White Screen of Death).
- **Component Protection**: Wrapped complex wizards (like Pre-Audit) in a custom `ErrorBoundary` to catch and display UI errors gracefully.
- **404 Handling**: Added a custom `not-found.tsx` page.

## 🛠 Technical Details
- **New Library**: `lib/system-tags.ts` - Maps System IDs (APS, SOUE) to generic Requirement Tags (FIRE_SAFETY, POWER, etc.).
- **Backend**: Updated `freezeProjectBaseline` to use `normIds` and filter by tags.
- **Frontend**: Updated `ProjectPreAuditWizard` to support Norm selection.
- **Fixes**:
  - **Add Audit Section**: Now supports selecting Systems directly (auto-matches Norms).
  - **Norm Edit**: Added "Section/Category" field support.
  - **AI Parsing**: Improved language filtering (ignores non-Russian text).

## 📦 Database Changes
- **Migration**: Added `category` column to `norm_sources`.

## 📝 Usage
1.  Go to **Projects** -> **Create/Select Project**.
2.  Enter **Pre-Audit Setup**.
3.  Select **Scope** (e.g., "Fire Alarm System").
4.  Select **Norms** (e.g., "SP 484").
5.  Click **Freeze Baseline**.
6.  The generated checklist will only contain Fire Alarm requirements from SP 484.
