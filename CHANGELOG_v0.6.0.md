# CHANGELOG - v0.6.0

## [0.6.0] - 2026-02-01

### ✨ Added
- **Offline Mode (Phase 1):** Complete offline-first data sync using IndexedDB (Dexie.js)
- **Manual Sync Button:** "Синхронизировать" button for user-triggered synchronization
- **Connection Indicators:** Real-time online/offline status display in Field App
- **Sync Queue:** Automatic processing of queued offline operations

### 🔧 Fixed
- **Modal Touch Events:** Completion modal buttons now respond reliably on mobile (onTouchEnd handlers)
- **Defects Counter:** Fixed hardcoded "0" - now calculates actual VIOLATION count from results
- **Field Navigation:** Back button correctly returns to `/field/projects/[id]`
- **Project Title Overflow:** Long project names now wrap instead of extending off-screen
- **Button Sizes:** Increased to 48px height for touch-friendly mobile UX

### 🎨 Improved
- **Mobile Responsiveness:** Better spacing, typography, and layout on mobile devices
- **Touch Targets:** All interactive elements meet 44x44px minimum (iOS/Android guidelines)
- **API Performance:** Added `results` join to `getProjectChecklists` for stats calculation

### 📦 Dependencies
- Added: `dexie@^4.0.10`

### 🧪 Testing
- ✅ Offline data entry and sync verified on mobile device
- ✅ Modal interactions tested and working
- ✅ Statistics counter validated with real data
- ✅ Navigation flows confirmed in Field App

### ⚠️ Known Issues
- Photo uploads don't work offline (planned for Phase 2)
- Quantitative fields not yet integrated with offline sync

---

## [0.5.4] - 2026-01-31

### Added
- Production-ready RLS policies
- Field App redirect fixes
- Report generation enhancements
- Universal Parser stabilization

### Fixed
- Mobile UI redirect loops
- Requirement set filters
- Field engineer access control

---

**Full Release Notes:** See [RELEASE_v0.6.0_PHASE1.md](./RELEASE_v0.6.0_PHASE1.md)
