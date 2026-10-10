# CIVICFLOW Synthetic Challenge Set Documentation

## 1. Synthetic-Data Declaration
This evaluation dataset (`synthetic_challenge_set_150.csv`) consists of **150 synthetic complaint pairs** designed specifically to stress-test the HISC incident deduplication and clustering algorithms under realistic Chennai municipal edge cases.

> [!IMPORTANT]
> **Synthetic Status & Verification:** These records are synthetic evaluation examples and have not been sourced from live production citizen submissions. They serve as a rigorous benchmark to expose algorithm vulnerabilities, vocabulary gaps, and boundary errors. All labels have undergone a comprehensive Phase A2.1 annotation audit and scenario-grounding review; formal final validation requires user verification.

---

## 2. Clarified Label Definitions & Scenario Grounding Rules

Under Phase A2.1, labeling definitions have been clarified to eliminate ambiguity and enforce strict physical grounding:

### Duplicate
Both complaints describe the **exact same physical municipal incident or defect** occurring at the same specific location and within the active incident resolution window.
- Identical defective physical asset (e.g., the same pothole, the same unlit lamp post, the same overflowing dumper bin).
- Nearness in coordinates or timestamps alone is insufficient; they must refer to the same defect.
- Merged into the same incident cluster in HISC with an assigned synthetic incident identifier (`CH_INC0001` - `CH_INC0050`).

### Related
The complaints describe **distinct but meaningfully connected problems** associated with a shared physical event, persistent issue, or documented causal/dependency relationship.
- **Strict Grounding Rule:** The connection must be explicitly grounded in the complaint descriptions or underlying scenario ground truth—not merely inferred from geographic proximity or concurrent timestamps.
- **Valid Causal Scenarios Include:**
  - Distinct assets damaged in a documented shared vehicular collision (e.g., lorry ramming median divider and toppling streetlight mast).
  - Common electrical feed or cable faults affecting adjacent light poles.
  - Subsurface water pipe ruptures causing road foundation erosion and pavement cave-ins directly above.
  - Sluice gate or transmission trunk main failures causing upstream backwater flooding or downstream residential supply cutoffs.
  - Waste accumulation directly choking an adjacent stormwater drain inlet.
  - Chronic uncleaned waste sites developing around an unserviced, broken dumper bin over consecutive months.
- Co-located assets across different municipal domains (e.g., a pothole and a leaning pole at the same intersection) with no documented physical interaction are **NOT** related.
- Handled as associated cross-departmental tickets with empty `incident_id` (`""`), matching the source dataset schema.

### Independent
The complaints concern **separate, unrelated incidents** with no documented causal, operational, or physical connection.
- Applies even if the complaints share keywords, civic categories, nearby coordinates, or timestamps.
- Co-located maintenance items across different municipal domains without a common triggering event are independent.
- Geographically distant assets (>4 km) or facility-level breakdowns vs neighborhood collection bins (2.5 km away) are independent operational tickets.
- Must never be clustered together. Assigned empty `incident_id` (`""`).

---

## 3. Phase A2.1 Annotation Quality Audit Results

A complete, 100% audit of all 150 synthetic challenge pairs was executed in Phase A2.1 to resolve ambiguity where `related` was previously assigned based on assumed, ungrounded causal links.

### Audit Summary:
- **Total Pairs Audited:** 150
- **Retained (Defensible Grounding):** 123 pairs (82.00%)
- **Relabeled (Indefensible `related` -> `independent`):** 7 pairs (4.67%)
- **Rewritten (Grounded Causal Descriptions):** 20 pairs (13.33%)
- **Unresolved (`needs_review`):** 0 pairs (0.00%)

### Reviewed Class Distribution:
- **`duplicate`:** 50 pairs (33.33%)
- **`related`:** 43 pairs (28.67%)
- **`independent`:** 57 pairs (38.00%)

> [!NOTE]
> **Prioritizing Ground-Truth Annotation Over Artificial Balance:**
> Rather than artificially relabeling independent pairs to preserve a 50/50/50 balance, Phase A2.1 strictly adheres to defensible municipal ground truth. Unconnected adjacent complaints have been relabeled `independent`, yielding the audited 50/43/57 distribution.

### Detailed Log of Relabeled Pairs (7 Pairs):

| Pair ID | Challenge Category | Old Label | New Label | Reason & Evidence Basis |
| :--- | :--- | :---: | :---: | :--- |
| **CH0053** | Very Short and Vague Descriptions | `related` | `independent` | Road crater and leaning lamp pole at Adyar signal are separate physical assets and defects. Without documented causal undermining in the text, adjacency does not establish a relationship. |
| **CH0054** | Very Short and Vague Descriptions | `related` | `independent` | Drinking water leak and stormwater drain overflow at Porur toll are distinct utility failures with no documented cross-contamination. |
| **CH0055** | Very Short and Vague Descriptions | `related` | `independent` | Street trash pile and choked gutter at Mylapore tank are separate complaints with no textual or physical evidence linking them. |
| **CH0056** | Very Short and Vague Descriptions | `related` | `independent` | Vague complaints for 'Broken railing' and 'Curb broken' at Saidapet bus stop do not establish a shared collision event. Assuming a vehicular accident without textual evidence is ungrounded. |
| **CH0061** | Same Location, Different Issue | `related` | `independent` | Road pothole and damaged speed-breaker reflector sign outside Medavakkam police station are independent maintenance items. Claiming pothole impacts loosened the sign is an unsupported inference. |
| **CH0078** | Same Issue, Geographically Distant | `related` | `independent` | Central transfer station compactor breakdown in Velachery and local ward collection bins in Madipakkam 2.5 km away are separate operational tickets. Clustering algorithms must not group them. |
| **CH0103** | Similar Wording, Distinct Incidents | `related` | `independent` | Pedestrian fence crossing breaches and heavy concrete kerbstone displacements are distinct physical failure mechanisms along the Tambaram railway approach. |

### Summary of Rewritten & Grounded Pairs (20 Pairs):
For pairs where the underlying engineering concept of a causal link was valid but the complaint texts lacked explicit scenario details, the descriptions were rewritten to clearly ground the shared incident without making the text trivial:
- **Vehicle Collisions:** `CH0011` (Saidapet court railing & kerbstone collision), `CH0117` (Chromepet railway gate lorry median crash toppling streetlight mast).
- **Subsurface Utility & Road Collapse:** `CH0023` (Guindy drain overflow eroding into pothole), `CH0024` (Adyar pipeline leak eroding road sub-base), `CH0062` (Velachery Phoenix mall underground leak causing road depression), `CH0114` (Medavakkam pipe burst causing cave-in), `CH0123` (Mylapore culvert collapse caving road).
- **Downstream Infrastructure Blockage & Overflows:** `CH0063` (Tambaram station dumped garbage blocking drain), `CH0102` (Velachery missing grate allowing trash ingress blocking downstream conduit), `CH0104` (Chromepet continuous tap leak overflowing blocked basin), `CH0127` (Koyambedu market animal waste choking drain).
- **Hydraulic & Power Network Transmissions:** `CH0076` (Porur trunk main burst cutting off Ramapuram supply), `CH0077` (Adyar river mouth stuck sluice gate causing upstream backwater flooding), `CH0105` (Guindy race course road underground cable fault affecting sequential poles 14 & 15).
- **Direct Physical Interactions:** `CH0116` (Tambaram canal overflow submerging and sparking streetlight box), `CH0118` (Guindy sewage main rupture backflowing into stormwater drain), `CH0124` (Saidapet road grading machine cracking water valve), `CH0125` (Perungalathur lighting excavation severing stormwater pipe), `CH0128` (IIT Madras fallen tree branch crushing traffic signal).
- **Progressive Temporal Failures:** `CH0091` (Velachery monsoon runoff leaving uncleaned silt clogging drain 4 weeks later), `CH0093` (Chromepet unaddressed May pipe leak culminating in dry taps in July), `CH0101` (Medavakkam southbound shelter shared overnight vandalism).

---

## 4. Audited Category Allocations

| # | Challenge Category | Description | Count | Audited Class Breakdown |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Paraphrases with Novel Vocabulary** | Technical or descriptive civic vocabulary not present in the HISC synonym dictionary (*asphalt fissure, tarmac peeling, sodium luminaire, blackout, dumper bin, conduit rupture, culvert*). | 15 | 7 duplicate, 4 related, 4 independent |
| 2 | **Typos and Spelling Variations** | Phonetic misspellings, concatenated words, and typos (*pothol, roaddmg, streat lite, grabage, leekage, wtrlogging*). | 15 | 7 duplicate, 4 related, 4 independent |
| 3 | **Tanglish and Colloquial Phrasing** | Transliterated Tamil/Hindi civic complaints (*theru vilakku eriyala, kuppai allala, thanni leak aaguthu, salai la periya pallam, mazhai thanni thenguthu*). | 15 | 7 duplicate, 4 related, 4 independent |
| 4 | **Very Short and Vague Descriptions** | Minimal 2–4 word complaints lacking descriptive detail (*Road damage, No light, Garbage, Water leak, Waterlogging*). | 15 | 7 duplicate, 0 related, 8 independent |
| 5 | **Same Location, Different Issue** | Identical or near-identical coordinates / landmarks with distinct civic problems (e.g. pothole vs broken streetlight at Medavakkam). | 15 | 0 duplicate, 5 related, 10 independent |
| 6 | **Same Issue, Geographically Distant** | Identical complaint types situated 5 to 25 km apart in different zones (e.g. pothole in Tambaram vs Anna Nagar). | 15 | 0 duplicate, 2 related, 13 independent |
| 7 | **Temporally Distant at Same Location** | Same location and problem type separated by 4 to 20 weeks (cyclone rain vs summer digging vs monsoon silt). | 10 | 0 duplicate, 5 related, 5 independent |
| 8 | **Similar Wording, Distinct Incidents** | Similar keywords referring to physically separate assets (opposite bus shelters on dual carriageway, separate manholes). | 13 | 0 duplicate, 4 related, 9 independent |
| 9 | **Cascading Related Failures** | Co-located or proximate multi-departmental failures (water main blowout eroding road; snapped cable causing scooter accident). | 15 | 0 duplicate, 15 related, 0 independent |
| 10 | **True Duplicates with Disparate Phrasing** | Genuine duplicates describing the exact same incident in radically dissimilar words. | 22 | 22 duplicate, 0 related, 0 independent |
| **Total** | | | **150** | **50 duplicate, 43 related, 57 independent** |

---

## 5. Artifacts and Deterministic Generation

All challenge-set data and evaluation artifacts are deterministically generated from `BACKEND/src/evaluation/generateChallengeSet.js`:

1. **`synthetic_challenge_set_150.csv`**: The complete 150-pair evaluation dataset matching the 15-column schema.
2. **`challenge_annotation_audit_150.json`**: Complete machine-readable audit of every pair containing `pair_id`, `challenge_category`, `original_label`, `reviewed_label`, `decision` (`retain`, `relabel`, `rewrite_example`), `reason`, and `evidence_basis`.
3. **`challenge_annotation_audit_150.md`**: Human-readable markdown audit table documenting the per-pair review.
4. **`challenge_review_sample_50.json`**: Deterministic 50-pair sample (seed 42) for user manual inspection.
5. **`challenge_review_sample_50.md`**: Companion markdown table with change log and explicit review status (`PENDING_USER_VERIFICATION`).

### Deterministic Generation Command:
```bash
node BACKEND/src/evaluation/generateChallengeSet.js
```

---

## 6. Synonym-Dictionary Novelty Audit

The existing HISC algorithm (`incidentIntelligence.service.js`) relies on 5 hardcoded synonym groups containing 20 base keywords.

### Audit Results on Corrected Challenge Set:
- **Total Unique Tokens:** 718
- **Tokens Present in Existing Dictionary:** 21 (2.92%)
- **Novel Tokens Outside Dictionary:** 697 (**97.08% vocabulary novelty**)

---

## 7. Known Limitations and Next Gate Requirements

1. **Synthetic Nature:** All 150 pairs remain synthetic constructions. While grounded in realistic Chennai municipal geography and infrastructure engineering, they are not real citizen submissions.
2. **Class Imbalance:** Audited ground truth yields a 50 duplicate / 43 related / 57 independent distribution. Evaluation metrics calculated in Phase A3 must account for class distribution rather than assuming uniform priors.
3. **User Manual Review Gate:** The 50-pair sample (`challenge_review_sample_50.md`) is provided for user review. Phase A3 must not begin until this gate is explicitly reviewed and approved.
