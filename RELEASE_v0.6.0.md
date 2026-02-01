# Release v0.6.0 - Offline Mode for Field App

**Release Date:** TBD (In Progress)  
**Status:** 🚧 In Development

---

## 🎯 Overview

This release focuses on implementing **full offline support** for Field App, enabling engineers to work in areas without internet connectivity. Data will be stored locally in IndexedDB and synchronized when connection is restored.

**Key Goal:** Field engineers can collect audit data completely offline and sync when back online.

---

## 🚀 Major Features

### 1. **Offline Data Collection**
- [ ] Integrate `useOfflineSync` hook into `AuditExecutionList`
- [ ] Replace direct `saveAuditResult` calls with `updateResult`
- [ ] Local storage in IndexedDB (Dexie)
- [ ] Sync queue management
- [ ] Auto-sync when connection restored

### 2. **Offline Photo Storage**
- [ ] Store photos as Blobs in IndexedDB
- [ ] Upload photos when online
- [ ] Show pending upload count
- [ ] Compress photos before upload (reduce data usage)

### 3. **Connection Status UI**
- [ ] Online/Offline indicator in Field App header
- [ ] Sync status badge (pending items count)
- [ ] Manual sync button
- [ ] Last sync timestamp display

### 4. **Data Sync Intelligence**
- [ ] Conflict resolution (server wins vs client wins)
- [ ] Retry failed operations
- [ ] Exponential backoff for network errors
- [ ] Sync history log

---

## 🔧 Technical Implementation

### Architecture

```
┌─────────────────────────────────────┐
│        Field App UI                 │
│  (AuditExecutionList component)     │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│      useOfflineSync Hook            │
│  - isOnline status                  │
│  - updateResult()                   │
│  - savePhoto()                      │
│  - processSyncQueue()               │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│      IndexedDB (Dexie)              │
│  Tables:                            │
│  - auditResults (local cache)       │
│  - images (blobs)                   │
│  - syncQueue (pending operations)   │
└──────────┬──────────────────────────┘
           │
           ▼ (when online)
┌─────────────────────────────────────┐
│      Supabase Database              │
│  - audit_results                    │
│  - Storage (evidence photos)        │
└─────────────────────────────────────┘
```

### Data Flow

**Offline Write:**
1. User changes audit item status
2. `updateResult()` called
3. Data saved to IndexedDB immediately
4. Operation added to sync queue
5. UI shows "Pending sync" indicator

**Online Sync:**
1. Connection detected
2. `processSyncQueue()` triggered
3. Each queued operation sent to server
4. Success → Remove from queue
5. Failure → Retry with backoff
6. UI updates sync status

---

## 📁 Files to Modify

### Existing Files
- `components/audit/audit-execution-list.tsx` - **Main integration point**
  - Replace `saveAuditResult()` with `useOfflineSync.updateResult()`
  - Add offline status indicators
  - Handle sync errors gracefully

- `hooks/use-offline-sync.ts` - **Enhance existing hook**
  - Add conflict resolution
  - Improve error handling
  - Add sync history tracking

- `app/field/checklist/[id]/page.tsx` - **Add sync UI**
  - Show sync status in header
  - Display pending items count
  - Manual sync button

### New Files
- `components/field/offline-status.tsx` - **Connection indicator**
- `components/field/sync-status-badge.tsx` - **Pending sync count**
- `lib/sync-logger.ts` - **Sync history tracking**

---

## 🧪 Testing Plan

### Unit Tests
- [ ] `useOfflineSync` hook behavior
- [ ] IndexedDB operations (CRUD)
- [ ] Sync queue processing
- [ ] Conflict resolution logic

### Integration Tests
- [ ] Offline → Online transition
- [ ] Multiple pending operations sync
- [ ] Failed sync retry mechanism
- [ ] Photo upload queue

### E2E Tests (Mobile Device)
- [ ] Fill audit items offline
- [ ] Add photos offline
- [ ] Turn on Wi-Fi
- [ ] Verify all data synced
- [ ] Check server has correct data

---

## ⚡ Performance Goals

| Metric | Target |
|--------|--------|
| Offline save latency | < 50ms |
| Sync queue processing | < 500ms per item |
| Photo compression | 70% size reduction |
| UI responsiveness | No blocking on sync |

---

## 🐛 Known Issues to Address

1. **Form metadata not saving from Field App**
   - Issue: `updateChecklistDetails` not working on mobile
   - Fix: Debug and fix server action

2. **Photo upload optimization**
   - Issue: Full resolution photos slow on cellular
   - Fix: Client-side compression before upload

3. **Sync queue overflow**
   - Issue: No limit on pending operations
   - Fix: Add max queue size (100 items)

---

## 📝 Implementation Checklist

### Phase 1: Core Offline Support (Week 1)
- [ ] Integrate useOfflineSync into AuditExecutionList
- [ ] Replace all saveAuditResult calls
- [ ] Test basic offline write → online sync
- [ ] Add connection status indicator

### Phase 2: Photo Handling (Week 1)
- [ ] Implement offline photo storage
- [ ] Add photo upload queue
- [ ] Test photo sync
- [ ] Add compression

### Phase 3: UI/UX Polish (Week 2)
- [ ] Add sync status badges
- [ ] Manual sync button
- [ ] Sync history viewer
- [ ] Error notifications

### Phase 4: Testing & Validation (Week 2)
- [ ] E2E test on real device
- [ ] Stress test (100+ pending items)
- [ ] Network flakiness simulation
- [ ] Battery impact analysis

---

## 🚦 Success Criteria

**Release v0.6.0 is ready when:**
- ✅ Engineers can fill entire checklist offline
- ✅ Photos are stored and uploaded correctly
- ✅ All data syncs without loss
- ✅ UI clearly shows online/offline status
- ✅ No data corruption or conflicts
- ✅ E2E test passes on real mobile device

---

## 🔮 Future Enhancements (v0.6.x)

- [ ] Selective sync (choose what to sync)
- [ ] Background sync (service worker)
- [ ] Offline map caching for addresses
- [ ] Voice notes (offline audio recording)
- [ ] Draft mode (save without validating)

---

## 👥 Contributors

- **Offline Architecture:** Assistant
- **Testing:** Yuriy (usa52)

---

**Status:** 🚧 In Progress - Starting Phase 1
