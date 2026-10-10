# CIVICFLOW Synthetic Challenge Set Documentation

## 1. Synthetic-Data Declaration
This evaluation dataset (`synthetic_challenge_set_150.csv`) consists of **150 newly constructed synthetic complaint pairs** designed specifically to stress-test the HISC incident deduplication and clustering algorithms under realistic Chennai municipal edge cases.

> [!IMPORTANT]
> **Synthetic Status:** These records are synthetic evaluation examples and have not been sourced from live production citizen submissions. They serve as a benchmark to expose algorithm vulnerabilities, vocabulary gaps, and boundary errors. All labels are currently proposed benchmark labels pending user review.

---

## 2. Label Definitions
The challenge set adheres strictly to the 3-class schema established in the original 400-pair ground-truth dataset:

| Label | Definition | Clustering Semantic | Incident ID Assignment |
| :--- | :--- | :--- | :--- |
| **`duplicate`** | Both complaints describe the exact same physical municipal incident occurring at the same specific location and within the active incident resolution window. | Should be merged into the existing incident cluster. | Assigned synthetic incident identifier `CH_INC0001` - `CH_INC0050`. |
| **`related`** | The complaints describe distinct physical issues that are causally, geographically, or infrastructurally linked (e.g. water pipe burst causing road cave-in; broken drain causing downstream waterlogging). | Should be linked as associated incident tickets requiring cross-departmental awareness. | Empty (`""`), consistent with source dataset schema. |
| **`independent`** | The complaints describe separate, unrelated events (different locations, different asset types, or separated by long time intervals), even if they share keywords, civic categories, or landmark names. | Must never be clustered together. | Empty (`""`), consistent with source dataset schema. |

---

## 3. Construction Methodology
Pairs were constructed to reflect civic issues across Greater Chennai Corporation and Tambaram Corporation jurisdictions (e.g., Medavakkam, Velachery, Tambaram, Chromepet, Guindy, T. Nagar, Anna Nagar, Adyar, Mylapore, Sholinganallur, Porur, Perungalathur, Saidapet, Koyambedu).

Key safeguards:
1. **Zero Overlap with Original Dataset:** No pair text or pair ID exists in `civicflow_400_labeled_complaint_pairs.csv`.
2. **Schema Uniformity:** Uses exact identical 15 columns (`pair_id`, `complaint_a_id`, `complaint_b_id`, `complaint_a`, `complaint_b`, `category_a`, `category_b`, `latitude_a`, `longitude_a`, `latitude_b`, `longitude_b`, `timestamp_a`, `timestamp_b`, `label`, `incident_id`).
3. **Balanced Allocation:** Exactly 50 `duplicate`, 50 `related`, and 50 `independent` pairs.
4. **Targeted Failure Modes:** Systematically exercises 10 challenging edge-case categories.

---

## 4. Category Allocations

| # | Challenge Category | Description | Count | Class Breakdown |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Paraphrases with Novel Vocabulary** | Expressions using technical or descriptive civic vocabulary not present in the HISC synonym dictionary (*asphalt fissure, tarmac peeling, sodium luminaire, blackout, dumper bin, conduit rupture, culvert*). | 15 | 7 duplicate, 4 related, 4 independent |
| 2 | **Typos and Spelling Variations** | Phonetic misspellings, concatenated words, and typos (*pothol, roaddmg, streat lite, grabage, leekage, wtrlogging*). | 15 | 7 duplicate, 4 related, 4 independent |
| 3 | **Tanglish and Colloquial Phrasing** | Transliterated Tamil/Hindi civic complaints (*theru vilakku eriyala, kuppai allala, thanni leak aaguthu, salai la periya pallam, mazhai thanni thenguthu*). | 15 | 7 duplicate, 4 related, 4 independent |
| 4 | **Very Short and Vague Descriptions** | Minimal 2–4 word complaints lacking descriptive detail (*Road damage, No light, Garbage, Water leak, Waterlogging*). | 15 | 7 duplicate, 4 related, 4 independent |
| 5 | **Same Location, Different Issue** | Identical or near-identical coordinates / landmarks with distinct civic problems (e.g. pothole vs broken streetlight at Medavakkam). | 15 | 0 duplicate, 6 related, 9 independent |
| 6 | **Same Issue, Geographically Distant** | Identical complaint types situated 5 to 25 km apart in different zones (e.g. pothole in Tambaram vs Anna Nagar). | 15 | 0 duplicate, 3 related, 12 independent |
| 7 | **Temporally Distant at Same Location** | Same location and problem type separated by 4 to 20 weeks (cyclone rain vs summer digging vs monsoon silt). | 10 | 0 duplicate, 5 related, 5 independent |
| 8 | **Similar Wording, Distinct Incidents** | Similar keywords referring to physically separate assets (opposite bus shelters on dual carriageway, separate manholes). | 13 | 0 duplicate, 5 related, 8 independent |
| 9 | **Cascading Related Failures** | Co-located or proximate multi-departmental failures (water main blowout eroding road; snapped cable causing scooter accident). | 15 | 0 duplicate, 15 related, 0 independent |
| 10 | **True Duplicates with Disparate Phrasing** | Genuine duplicates describing the exact same incident in radically dissimilar words. | 22 | 22 duplicate, 0 related, 0 independent |
| **Total** | | | **150** | **50 duplicate, 50 related, 50 independent** |

---

## 5. Geographic and Temporal Separation Assumptions

- **Co-located Incidents:** Coordinates placed within 5–50 meters of each other represent the same micro-location or intersection.
- **Geographically Distant:** Incidents placed > 4 km (typically 8–24 km) apart represent separate municipal zones and cannot be duplicates.
- **Immediate Proximity Window:** Timestamps within 1 to 2 hours reflect contemporaneous citizen submissions for the same unfolding incident.
- **Extended Temporal Window:** Incidents separated by > 4 weeks represent distinct episodes or recurring maintenance tickets, precluding duplicate grouping unless verified as persistent ongoing failures.

---

## 6. Synonym-Dictionary Novelty Audit

The existing HISC algorithm (`incidentIntelligence.service.js`) relies on 5 hardcoded synonym groups containing 20 total base keywords:
1. `["pothole", "crater", "road damage", "road defect"]`
2. `["streetlight", "street lamp", "lamp post", "light pole"]`
3. `["garbage", "waste", "trash", "rubbish"]`
4. `["leak", "leakage", "burst", "broken pipe"]`
5. `["flood", "flooding", "waterlogging", "inundation"]`

### Audit Results:
- **Total Unique Tokens in Challenge Set:** 708
- **Tokens Present in Existing Dictionary:** 21 (2.97%)
- **Novel Tokens Outside Dictionary:** 687 (**97.03% vocabulary novelty**)
- **Sample Novel Vocabulary Introduced:**
  - *Roads:* `asphalt`, `fissure`, `tarmac`, `peeling`, `subsidence`, `depression`, `rutting`, `caved-in`, `trench`, `kerbstone`, `carriageway`, `median`.
  - *Lighting:* `sodium`, `luminaire`, `fixture`, `blackout`, `illumination`, `darkness`, `unlit`, `tilting`, `footing`, `cowl`.
  - *Sanitation:* `dumper`, `refuse`, `putrid`, `rotting`, `stench`, `debris`, `rubble`, `carcass`, `uncollected`, `commercial`.
  - *Water/Utilities:* `potable`, `conduit`, `rupture`, `blowout`, `spewing`, `seepage`, `hydrant`, `valve`, `pipeline`.
  - *Drainage:* `culvert`, `masonry`, `runoff`, `stagnation`, `canal`, `sludge`, `grate`, `backflow`, `inlet`, `outlet`.
  - *Colloquial/Tanglish:* `pallam`, `kuli`, `eriyala`, `vilakku`, `allala`, `kuppai`, `thenguthu`, `sadak`, `gaddha`, `kachra`.

---

## 7. Known Limitations and Risks of Synthetic Bias

1. **Synthetic Stylization:** Descriptions follow grammatical patterns that may be slightly more articulate than raw mobile citizen input.
2. **Fixed Distribution:** The exact 50/50/50 balance does not reflect real-world municipal submission ratios (where duplicates often outnumber related incidents during monsoon events).
3. **Pending Ground-Truth Human Verification:** All labels have been assigned following strict municipal engineering logic, but require human audit prior to algorithm benchmarking.

---

## 8. Instructions for Reviewing and Correcting Labels

1. Open `challenge_review_sample_50.json` or `challenge_review_sample_50.md`.
2. Inspect the 50 sampled pairs. Each entry contains:
   - `pair_id`
   - Both complaint texts and civic categories
   - Geographic coordinates and timestamps
   - Currently proposed label (`duplicate`, `related`, or `independent`)
   - Explicit engineering rationale
3. If any proposed label should be altered:
   - Note the `pair_id` and the desired corrected label.
   - Provide the rationale for the correction.
   - Adjustments will be applied to `synthetic_challenge_set_150.csv` before beginning Phase A3.
