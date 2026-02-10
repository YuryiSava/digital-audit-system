# Release v0.8.0: Advanced Field Audit Capabilities

**Date**: 2026-02-10
**Status**: Production Ready

## 🚀 Key Features

### 1. Standard Violations (Typical Faults)
Drastically reduces reporting time by providing pre-defined lists of common citations.
- **Smart Selection**: Tags "Violations" or "Warnings" with one click using populated chips (e.g., "Expired", "No Seal", "Mechanical Damage").
- **Context-Aware**: distinct fault lists for Document vs. Visual checks vs. Fire Extinguishers.
- **Customization**: Engineers can add custom faults on the fly (`+ Custom`), which are saved to the system for future use.

### 2. Multiple Objects Tracking
Enables precise defect tracking for requirements covering multiple units (e.g., "All smoke detectors in Block A").
- **Granular Defects**: Record individual defects with specific **Location** (Room/Floor) and **Description** inside a single requirement.
- **Auto-Calculation**: The system automatically counts the number of logged defects to determine the "Fail Count".
- **Evidence**: Support for specific photos per requirement (and projected for per-defect future updates).

### 3. Unified Audit View (Refined)
- **System Tabs**: Dynamic tabs (APS, SOUE, AGPT) based on project contents.
- **Performance**: Optimized rendering for large checklists (500+ items).

## 🛠 Technical Improvements
- **Database**:
    - Added `defect_items` JSONB column to `audit_results`.
    - Added `typical_faults` TEXT[] column to `requirements`.
- **UI/UX**:
    - Fixed React Fragment syntax issues for robust rendering.
    - Improved mobile responsiveness for the audit execution list.
- **Safety**:
    - Strictly typed interfaces for all new data structures (`DefectItem`, `AuditRequirement`).

## 📋 Migration Notes
- Run `npm run db:push` or execute `scripts/run-defect-migration.js` and `scripts/run-migration.js` to update the schema.
- No breaking changes for existing audit data.
