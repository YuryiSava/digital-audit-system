# Release v0.9.0: The Unified Audit Experience

## 🚀 Key Features

### 1. Unified Audit View (Field Efficiency)
- **Single Interface**: All project requirements are now visible in one place, regardless of their source document.
- **System Tabs**: Filter requirements instantly by system (Fire Alarm, Extinguishing, etc.) using dynamic tabs.
- **Aggregated Stats**: Real-time progress tracking for the entire facility.

### 2. Standard Violations (Quick Inputs)
- **Typical Faults**: Introduced "Chips" for common violations (e.g., "Expired", "No Seal") to reduce typing.
- **Smart Suggestions**: Context-aware faults based on the check method (Visual vs Documentation).
- **Custom Faults**: Auditors can add their own "Typical Faults" on the fly, saving them for future use.

### 3. Multiple Objects (Advanced Tracking)
- **Granular Defect List**: For requirements covering multiple devices (sensors, speakers), track individual defects rather than just a single comment.
- **Auto-Counting**: The system automatically calculates the "Fail Count" based on the number of logged defects.

### 4. Defect Evidence (Enhanced Documentation)
- **Video Links**: Attach external video verification (YouTube/Drive) to:
    - Individual defects in a list.
    - Specific requirements (via the main action menu).
- **Defect-Specific Photos**: Capture photo evidence for each specific defect in a multiple-object scenario ensuring clarity on location.

## 🛠️ Technical Improvements
- **Refactored `AuditResultItem`**: Improved performance and maintainability.
- **Database Schema**: Added `typical_faults`, `defect_items` (JSONB), and `video_link` columns.
- **Offline Sync**: Updated sync logic to handle complex nested data (defect lists, video links).

## ⚠️ Migration Steps
Run the following SQL migrations on production:
1. `migrations/add-typical-faults.sql`
2. `migrations/add-defect-items.sql`
3. `migrations/add-video-link-to-results.sql`
