# 🚀 DAS Scaling Strategy: Multi-Industry Expansion

This document outlines the strategy for scaling the Digital Audit System (DAS) from a specialized Fire Safety tool into a comprehensive **Regulatory Compliance Platform** (v0.7.0+).

---

## 🏗️ 1. Current State Fixation (v0.5.4-v0.6.0)

Before any major architectural pivots, the system state is frozen to ensure a stable fallback.

- **Baseline:** [RELEASE_v0.5.4_FINAL_STATE.md](./RELEASE_v0.5.4_FINAL_STATE.md)
- **Snapshot Archive:** `backups\release_v0.5.4_snapshot\DAS_v0.5.4_Source_Only_20260202_1524.zip`
- **Current Milestone:** Offline Mode (v0.6.0) in progress.

---

## 🏛️ 2. The B2G Vector: MCHS RK (МЧС РК)

The primary "direction" of scaling is the transformation into a state-grade tool for the **Ministry of Emergency Situations**.

### Key Transformations:
1.  **Legal Enforcement:** Automatic generation of "Акт проверки" (Act of Inspection) and "Предписание" (Mandatory Order) in official forms.
2.  **Anti-Corruption Measures:** 
    *   GPS-fencing for audits (cannot start audit if not on site).
    *   Camera-only photo proof (no gallery uploads).
    *   Timestamp verification.
3.  **National Integration:** 
    *   **BIN/IIN Database:** Automatic lookup of entities.
    *   **EDS (ЭЦП):** Digital signature for legal validity of documents.
    *   **Local Sovereignty:** Deployment to "NIT" or Ministry local clouds (On-Premise).

---

## 🔄 3. Horizontal Scaling: Growth Verticals

DAS will adapt its core "AI Extraction + Field Audit" engine for other regulatory domains:

| Direction | Vertical | Target Standard | Core Content |
| :--- | :--- | :--- | :--- |
| **Industry** | **Industrial Safety** | СНиП, РД | Lifting gear, pressure vessels, hazardous sites. |
| **Eco** | **Environmental Audit**| Экологический кодекс | Waste disposal, air emissions, soil samples. |
| **Health** | **Occupational Health**| Трудовой кодекс | Personal protective equipment (PPE), training logs. |
| **Food** | **Food Safety (HACCP)** | СанПиН (СЭС) | Production line hygiene, temperature logs, storage. |
| **Admin** | **General Compliance** | ISO / Internal Regs | Corporate compliance and internal audits. |

---

## 🛠️ 4. Technical Refactoring for Scaling (The "Core + Modules" Model)

To support these directions with **minimal rework**, we adopt a **Micro-Kernel Architecture**:

1.  **DAS-Core:** The stable engine (Auth, AI Parser, Offline Sync, Generic Audit Logic).
2.  **Industry Overlays (Verticals):** Industry-specific metadata, logic, and reports.

### **Key Refactoring Steps:**
- **Term Overlays (i18n):** Move all "Fire Safety" specific text to localization files (e.g., `audit` -> `inspection`, `defects` -> `violations`).
- **Standard Metadata Interface:** Use a `metadata` JSONB field in `Requirement` and `AuditResult` to hold industry-specific data (e.g., KoAP Article for MCHS).
- **Plug-and-Play Reporting:** Move from hardcoded PDF layouts to a provider-based template engine.
- **Vertical-Specific UI:** Conditional rendering of fields based on `project.verticalId`.

---

## 📈 5. Implementation Roadmap

### Phase A: Technical Hardening (Current / v0.6.x)
- Complete Offline Mode.
- Finalize RLS and Security policies.
- **Fix:** Document current state for copyright registration.

### Phase B: B2G Pilot (MCHS)
- Implement "Ministry Forms" report generator.
- Add GPS/Timestamp security layer.
- Trial on-premise installation.

### Phase C: Vertical Diversification
- Add specialized Norm Libraries for Industrial Safety and Eco.
- Launch "Eco-Audit" module with waste calculation logic.

---

*Verified by Assistant & Yuriy - 2026-02-02*
