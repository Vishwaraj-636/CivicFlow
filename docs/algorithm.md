# CivicFlow Incident Intelligence (HISC Algorithm V2)

## 1. Overview and Architecture

CivicFlow's **HISC (Hybrid Incident Similarity and Clustering)** algorithm coordinates municipal grievance reports into unified incident entities. It operates in two stages:

1. **Candidate Retrieval Stage:** Filters active reports using MongoDB `2dsphere` spatial indexing bounded by `radiusInMeters = 1000m` and temporal cutoff `temporalWindowHours = 720h` (30 days). Scoring is bounded to at most 40 candidate reports.
2. **Multi-Attribute Ranking & Evidence Gating Stage:** Evaluates multi-attribute feature affinity $H(i,j) \in [0, 1]$ combined with domain-aware evidence gating to classify the relationship as `duplicate`, `related`, or `independent`.

---

## 2. Mathematical Formulation

$$H(i,j) = \frac{w_C C(i,j) + w_G G(i,j) + w_L L(i,j) + w_S S(i,j) + w_T T(i,j)}{\sum w}$$

### Feature Components:
- **$C(i,j)$ — Category Compatibility Matrix:**
  - Same Category: $1.0$
  - Compatible Municipal Families (Roads & Transport $\leftrightarrow$ Street Infrastructure, Drainage $\leftrightarrow$ Water Utilities): $0.6$
  - Interacting Civic Domains (Drainage $\leftrightarrow$ Roads, Drainage $\leftrightarrow$ Waste Sanitation): $0.4$
  - Road Surface $\leftrightarrow$ Water Utilities: $0.2$
  - Missing/Unknown Categories: $0.3$ (neutral fallback)
  - Incompatible Categories: $0.0$
- **$G(i,j) = \exp(-d_{ij} / R)$ — Geospatial Proximity:**
  Haversine geodesic distance $d_{ij}$ in meters decaying over operational radius $R = 1000\text{m}$.
- **$L(i,j) = \frac{|T_i \cap T_j|}{|T_i \cup T_j|}$ — Lexical Jaccard Overlap:**
  Word tokenization filtered against domain stopwords (eliminates false overlap from generic road names or street locations).
- **$S(i,j) = \frac{|E_i \cap E_j|}{|E_i \cup E_j|}$ — Semantic Concept Overlap:**
  Extracted civic concepts across 10 municipal infrastructure domains combined with token expansion.
- **$T(i,j) = \exp(-\Delta t_{ij} / W)$ — Temporal Decay:**
  Time differential in hours decaying over window $W = 720\text{h}$ (30 days).

### Production Feature Weights:
- $w_C = 0.20$ (Category Compatibility)
- $w_G = 0.25$ (Geographic Proximity)
- $w_L = 0.10$ (Lexical Overlap)
- $w_S = 0.30$ (Semantic Concept Overlap)
- $w_T = 0.15$ (Temporal Proximity)

---

## 3. Phase A4 Vocabulary & Cross-Asset Improvements

### A. 10 Municipal Infrastructure Domain Concepts
HISC extracts deterministic civic concepts across 10 infrastructure failure domains:
1. `road_defect`: Potholes, asphalt cavities, road rutting, craters, median kerb stones.
2. `streetlight`: Street lamps, lamp posts, light poles, luminaires, dark stretches.
3. `traffic_signal`: Signal heads, pedestrian signals, traffic lights, controllers, blinking amber.
4. `electrical_hazard`: Transformers, sparking wires, high voltage lines, substations, power poles.
5. `water_leak`: Pipeline leaks, water mains, pipe bursts, hydrants, potable supply.
6. `drainage`: Stormwater drains, culverts, sewer backflows, manholes, waterlogging, flooding.
7. `garbage`: Waste heaps, overflowing public bins, discarded debris, illegal dumping.
8. `fallen_tree`: Snapped branches, uprooted trees, downed trunks, overhanging boughs.
9. `ground_collapse`: Sinkholes, road cave-ins, ground subsidence, trench collapses.
10. `sidewalk_defect`: Broken pavers, displaced slabs, pedestrian walkway hazards, bus shelter panels.

### B. Cross-Asset Evidence Gating
Spatial and temporal proximity alone do not establish municipal incident causality:
1. **Incompatible Category Protection:** When $C(i,j) = 0.0$ (e.g., street light outage vs. garbage dump), complaints are classified as `independent` unless explicit causal interaction is documented.
2. **Documented Causal Pairs:** Legitimate multi-infrastructure interactions (e.g., fallen tree snapping electrical wire, pipe burst undermining road, garbage clogging drain) are recognized and classified as `related`.
3. **Distance Boundary Protection:** Pairs separated by $>3000\text{m}$ are never local incidents. Pairs $>1000\text{m}$ require substantive causal defect evidence.
4. **Temporal Boundary Protection:** Reports separated by $>30$ days (720 hours) represent distinct seasonal/weather cycles and are classified as `independent`.
5. **Directional Transit Protection:** Opposing directional modifiers (e.g., northbound vs. southbound, eastern vs. western carriageway) prevent separate transit stops from merging as duplicates.
6. **Duplicate Evidence Criteria:** Exact duplicates require identical category ($C \ge 0.9$), local proximity ($d \le 250\text{m}$), submission within 7 days ($h \le 168\text{h}$), and defect evidence.

---

## 4. Evaluation and Performance Benchmarks

The improved HISC algorithm is evaluated across 5 partitions using deterministic Mulberry32 bootstrap resampling (1,000 iterations, 95% empirical percentile CI):

| Partition | Samples | Phase A3 Baseline Macro F1 | Phase A4 Improved Macro F1 | Phase A4 Accuracy | 95% Bootstrap CI |
|---|:---:|:---:|:---:|:---:|:---:|
| **Train (60%)** | 240 | 0.9831 | **0.9957** | 99.58% | [0.9861, 1.0000] |
| **Validation (20%)** | 80 | 0.9881 | **1.0000** | 100.00% | [1.0000, 1.0000] |
| **Held-out Test (20%)** | 80 | 0.9752 | **1.0000** | 100.00% | [1.0000, 1.0000] |
| **Full Original** | 400 | 0.9825 | **0.9974** | 99.75% | [0.9914, 1.0000] |
| **Synthetic Challenge** | 150 | 0.4956 | **0.8278** | 83.33% | [0.7633, 0.8831] |

**Key Diagnostic Gains on Challenge Set:**
- **Macro F1:** Improved from `0.4956` $\rightarrow$ `0.8278` (+0.3322).
- **Independent Class Recall:** Improved from `7.02%` $\rightarrow$ `75.44%` (+68.42%).
- **Independent Class F1:** Improved from `0.1311` $\rightarrow$ `0.8037` (+0.6726).
- **Held-out Test Macro F1:** Maintained at `1.0000` (exceeding baseline `0.9752`).