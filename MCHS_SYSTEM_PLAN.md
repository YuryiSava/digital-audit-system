# 🏛️ МЧС РК (B2G) Expansion Plan

Specific requirements and features for the Ministry of Emergency Situations (МЧС) transition.

---

## 🛡️ 1. Anti-Corruption & Verification Layer
*Goal: Ensure that inspections are real and data is untampered.*

- **GPS-Fencing:** 
    - The Field App checks current coordinates against the "Object Address" coordinates.
    - If the auditor is more than 500m away, the "Start Audit" button is locked.
- **Camera-Only Constraint:** 
    - Gallery uploads are disabled for MCHS projects.
    - Auditors must take photos directly within the app.
- **Watermark Injection:** 
    - Every photo is watermarked with: `DateTime`, `GPS Coordinates`, `Auditor Name`, and `Project ID`.

---

## ⚖️ 2. Regulatory & Legal Integration
*Goal: Map safety violations to legal consequences.*

- **KoAP Mapping:**
    - Every normative requirement (СН/СП) is linked to a specific Article in the Administrative Code (КоАП РК).
    - Example: Clause 5.2.1 of Fire Safety Norms -> Article 410 of KoAP.
- **Automatic Sanctions:**
    - Marking a violation automatically suggests the corresponding fine or sanction range.
- **Subject Search (BIN/IIN):**
    - Integration with official databases to pull legal entity info automatically.

---

## 📄 3. Official Documentation Generation
*Goal: Replace paper protocols with legally binding digital acts.*

- **Act of Inspection (Акт проверки):** Automated generation in the official state format.
- **Mandatory Order (Предписание):** Listing only the "Violations" with remediation timelines.
- **Digital Signature (ЭЦП):** Integration with national SDK for signing the final PDF on a tablet.

---

## 🔌 4. Deployment & Sovereignty
*Requirement: Full independence from international cloud providers.*

- **On-Premise Ready:** Containerized deployment (Docker/Kubernetes) for government data centers (AO "NIT").
- **Local AI:** Option to use locally hosted LLMs (Llama-3/Mistral) for parsing sensitive norms.
- **RK Data Residency:** All files (Supabase Storage alternative) remain within Kazakhstan frontiers.

---

*Verified by Assistant & Yuriy - 2026-02-02*
