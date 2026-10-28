# CivicFlow Research Evaluation — Task B: Dataset Leakage Audit Report

**Audit Timestamp:** 2026-10-11T09:51:09.953Z
**Auditor:** Antigravity Research Framework (Task B Read-Only Audit)

---

## 1. Executive Summary and Key Findings

1. **Identifier Separation (Passed Cleanly):**
   - **Incident IDs:** Exactly 0 overlapping `incident_id` values across Train, Validation, and Test splits.
   - **Complaint IDs:** Exactly 0 overlapping complaint IDs across Train, Validation, and Test splits. Each of the 800 complaint records has a globally unique ID (`C0001` through `C0800`).
   - **Split Grouping:** The deterministic grouping implemented in `makeSplits.js` (Seed 42, grouped by `incident_id`) successfully isolated incident clusters for all duplicate pairs.

2. **Template Text Leakage in the 400-Pair Dataset (Critical Finding):**
   - While complaint IDs are unique, **complaint texts are heavily reused across pairs**. Across all 800 complaints in the 400-pair dataset, there are only **237 unique complaint texts**.
   - Because `incident_id` was only populated for the 120 `duplicate` pairs and was blank for `related` and `independent` pairs, `makeSplits.js` treated each non-duplicate pair as an isolated group (`__pair_${pair_id}`).
   - Consequently, pairs sharing identical synthetic complaint templates were assigned across different split boundaries:
     - **87.72%** of unique texts in Validation (100 / 114) also appear in Train.
     - **84.62%** of unique texts in Test (99 / 117) also appear in Train.
     - **97.50%** of Validation pairs (78 / 80) contain at least one complaint text that appears in Train.
     - **95.00%** of Test pairs (76 / 80) contain at least one complaint text that appears in Train.
     - **8 Validation pairs** and **4 Test pairs** have **both** complaints identical to a pair in Train.

3. **Synthetic Challenge Set Integrity (Pristine Zero Leakage):**
   - **Exact Text Overlap with 400-pair Dataset:** **0 instances (0.0%)**.
   - **Near-Duplicate Overlap (Jaccard > 0.80):** **0 instances (0.0%)**.
   - Every single complaint in the 150-pair challenge set is authored with entirely novel phrasing.
   - **Significance:** Text overlap between development splits was measured; whether it explains the test-to-challenge gap is not established. The held-out test split exhibits high template text reuse, whereas the challenge set is a separate stress test authored with novel phrasing.

---

## 2. Dataset and Split Integrity Checksums

| Artifact | Path | SHA-256 Checksum | Record Count |
| :--- | :--- | :--- | :--- |
| **Development Dataset** | `civicflow_400_labeled_complaint_pairs.csv` | `b4653ac507f422a3b6f5ffadb291d5440eab0cb07174f2398ad72739e86a33f2` | 400 pairs (800 complaints) |
| **Splits Manifest** | `BACKEND/data/splits.json` | `58039b02ac69bdc78e220e0d979e1e28aa7c6fcdfb0e30595a5082b53bd4a06a` | 240 train / 80 val / 80 test |
| **Challenge Set** | `BACKEND/data/synthetic_challenge_set_150.csv` | `2774c8e133bbc2344c290dd27c52752be7d5137899a369316836e99ca9d8e89b` | 150 pairs (300 complaints) |

### Split Counts and Proportions:
- **Train:** 240 pairs (60.0%) — Target: 240 (Matches: true)
- **Validation:** 80 pairs (20.0%) — Target: 80 (Matches: true)
- **Test:** 80 pairs (20.0%) — Target: 80 (Matches: true)

---

## 3. Identifier Overlap Audit

### Incident ID Overlaps:
- Train unique `incident_id`s: 72
- Validation unique `incident_id`s: 24
- Test unique `incident_id`s: 24
- Cross-split overlaps:
  - Train ∩ Validation: **0**
  - Train ∩ Test: **0**
  - Validation ∩ Test: **0**
  - 400-Dataset ∩ Challenge Set: **0**

### Complaint ID Overlaps:
- Train unique `complaint_id`s: 480
- Validation unique `complaint_id`s: 160
- Test unique `complaint_id`s: 160
- Cross-split overlaps:
  - Train ∩ Validation: **0**
  - Train ∩ Test: **0**
  - Validation ∩ Test: **0**
  - 400-Dataset ∩ Challenge Set: **0**

---

## 4. Text Overlap and Near-Duplicate Analysis

### Text Normalization Methodology:
1. Lowercase text.
2. Remove punctuation and non-alphanumeric symbols.
3. Collapse consecutive whitespace into single spaces and trim.
4. Tokenization: Whitespace-split into unique word sets.
5. Jaccard similarity: $J(A, B) = \frac{|A \cap B|}{|A \cup B|}$, threshold $> 0.80$.

### Text Comparison Matrix:

| Comparison | Target Split Unique Texts | Overlapping Unique Texts | % Target Overlap | Exact Match Instances | Near-Dup (>0.80) Instances |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Train vs. Validation** | 114 | 100 | **87.72%** | 328 | 359 |
| **Train vs. Test** | 117 | 99 | **84.62%** | 317 | 353 |
| **Validation vs. Test** | 117 | 52 | **44.44%** | 103 | 113 |
| **400-Dataset vs. Challenge** | 290 | **0** | **0.00%** | **0** | **0** |

---

## 5. Pair-Level Leakage Breakdown

### Pairs containing at least one training text:
- **Validation Split:** **78 / 80 pairs (97.5%)**
- **Test Split:** **76 / 80 pairs (95%)**

### Full Pair Identity (both complaints identical to training pair):
- **Validation:** **8 pairs** (P0005, P0018, P0046, P0109, P0120, P0151, P0178, P0244)
- **Test:** **4 pairs** (P0004, P0124, P0239, P0388)

---

## 6. Limitations and Provenance Analysis

1. **Source Generation Provenance:**
   The 400-pair dataset was generated by permuting a fixed dictionary of ~237 synthetic civic complaint phrases across different categories, coordinates, and timestamps. While the pair generator assigned unique IDs to each row, the underlying textual templates were heavily duplicated.
2. **Distinction Between Incident and Template Leakage:**
   The split generation in `makeSplits.js` properly respected `incident_id` groupings. However, because `incident_id` was only annotated for `duplicate` pairs (and not for `related` or `independent` pairs), the split grouping could not prevent cross-split template leakage for non-duplicate complaints.
3. **No Retrospective Modification:**
   In compliance with research integrity rules, the frozen dataset and split manifests remain untouched. These findings contextualize the evaluation results without invalidating the frozen test freeze.

---

## 7. Recommended Next Actions

1. In scientific publications and internal reports, explicitly disclose that the 400-pair held-out test split exhibits high template text redundancy (84.6% text overlap with train), making the Synthetic Challenge Set (0.0% overlap) the authoritative benchmark for genuine out-of-distribution generalization.
2. In future iterations of dataset synthesis (Task G prerequisites), enforce global text-template deduplication prior to split generation.

---

## 8. Overlap-Stratified Accuracy

Overlap was measured; a causal effect on the test-to-challenge performance gap is not established.

### 8.1 Methodology and Distribution Characteristics
For every pair in the held-out test split ($N = 80$), each complaint text was tokenized using the audit's conservative normalization, and its maximum token-Jaccard similarity against all training complaints was computed. The pair overlap is defined as the arithmetic mean of the two maxima:
$$\text{Pair Overlap} = \frac{\max_{t \in \text{Train}} J(A, t) + \max_{t \in \text{Train}} J(B, t)}{2}$$

- **Range:** $[0.6154, 1.0000]$ (mean: $0.9493$, median: $1.0000$)
- **High Overlap Count:** **72 / 80 pairs (90.0%)** have pair overlap $> 0.80$.
- **Distribution Degeneracy:** **57 of 80 test pairs (71.25%)** have an exact pair overlap of $1.00$ (both complaint texts identical to training templates). Because more than two-thirds of pairs share the identical maximum overlap value, both tertile and median splits are reported below.

### 8.2 Tertile Stratification ($N = 27, 27, 26$)

| Tertile | N | Overlap Range | HISC Acc | B1 (Jaccard) | B3 (Cat+Dist) | B4 (TF-IDF) | B6 (Embedding) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Tertile 1 (Low Overlap)** | 27 | $[0.6154, 1.0000]$ | **100.00%** | 66.67% | **100.00%** | 66.67% | 85.19% |
| **Tertile 2 (Mid Overlap)** | 27 | $[1.0000, 1.0000]$ | **100.00%** | 37.04% | **100.00%** | 59.26% | 77.78% |
| **Tertile 3 (High Overlap)**| 26 | $[1.0000, 1.0000]$ | **100.00%** | 76.92% | **100.00%** | 84.62% | 73.08% |

### 8.3 Median Split Stratification ($N = 40, 40$)

| Split Group | N | Overlap Range | HISC Acc | B1 (Jaccard) | B3 (Cat+Dist) | B4 (TF-IDF) | B6 (Embedding) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Lower 50% ($< \text{Median}$)** | 40 | $[0.6154, 1.0000]$ | **100.00%** | 52.50% | **100.00%** | 57.50% | 80.00% |
| **Upper 50% ($\ge \text{Median}$)** | 40 | $[1.0000, 1.0000]$ | **100.00%** | 67.50% | **100.00%** | 82.50% | 77.50% |

### 8.4 Correlation Statistics
- **HISC vs. Pair Overlap:** *Undefined* (zero variance: HISC achieves 100.00% accuracy on all 80 test pairs).
- **B4 (TF-IDF) vs. Pair Overlap:** Point-biserial correlation $r = 0.0479$ (weak positive association between lexical template overlap and TF-IDF accuracy).
