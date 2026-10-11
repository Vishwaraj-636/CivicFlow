# CivicFlow Error Analysis — Validation Split: B1: Text Jaccard Similarity (`B1_jaccard`)

## 1. Executive Summary & Evaluation Context

- **Method ID:** `B1_jaccard`
- **Method Name:** B1: Text Jaccard Similarity
- **Formula:** S = |Tokens_A ∩ Tokens_B| / |Tokens_A ∪ Tokens_B| on normalized alphanumeric word tokens.
- **Split:** `validation` ($N = 80$ pairs)
- **Source Evaluation Artifact:** `BACKEND/results/t1_validation_baseline_comparison.json`
- **Source Git Commit:** `040d2e78a3c87b8ad31924d0a6d4b2e6115c59eb`
- **Generation Timestamp:** `2026-10-11T06:46:41.725Z`
- **Selected Decision Thresholds:** Duplicate = `0.35`, Related = `0.20`
- **Validation Accuracy:** 70.00%
- **Validation Macro F1:** **0.6792**
- **Misclassified Pairs:** **24** out of 80 pairs (30.0% error rate)

> [!NOTE]
> **Protocol Compliance:** This error analysis was conducted strictly on the **Validation split** ($N = 80$). No held-out test pairs or synthetic challenge set pairs were evaluated.

## 2. Confusion Matrix & Per-Class Performance

**Per-Class Metrics:**

| Class | Support | Precision | Recall | F1 Score |
|---|:---:|:---:|:---:|:---:|
| `duplicate` | 24 | 1.0000 | 0.4167 | **0.5882** |
| `related` | 28 | 0.6333 | 0.6786 | **0.6552** |
| `independent` | 28 | 0.6750 | 0.9643 | **0.7941** |

**Confusion Matrix (Actual Rows \ Predicted Columns):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 10 | 10 | 4 |
| **Actual `related`** | 0 | 19 | 9 |
| **Actual `independent`** | 0 | 1 | 27 |

## 3. Detailed Misclassified Pairs Analysis

Total misclassified items: **24**

| Pair ID | True Label | Pred Label | Score | Distance | Time | Confusion Category |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `P0005` | `duplicate` | `independent` | `0.1667` | 127m | 24h | `actual_duplicate_pred_independent` |
| `P0015` | `duplicate` | `related` | `0.2143` | 26m | 21h | `actual_duplicate_pred_related` |
| `P0016` | `duplicate` | `related` | `0.2500` | 114m | 34h | `actual_duplicate_pred_related` |
| `P0017` | `duplicate` | `related` | `0.2143` | 33m | 22h | `actual_duplicate_pred_related` |
| `P0018` | `duplicate` | `independent` | `0.1538` | 138m | 48h | `actual_duplicate_pred_independent` |
| `P0020` | `duplicate` | `related` | `0.2500` | 21m | 2h | `actual_duplicate_pred_related` |
| `P0038` | `duplicate` | `related` | `0.2000` | 176m | 27h | `actual_duplicate_pred_related` |
| `P0039` | `duplicate` | `related` | `0.2667` | 101m | 53h | `actual_duplicate_pred_related` |
| `P0043` | `duplicate` | `related` | `0.2857` | 176m | 24h | `actual_duplicate_pred_related` |
| `P0046` | `duplicate` | `related` | `0.2000` | 160m | 4h | `actual_duplicate_pred_related` |
| `P0049` | `duplicate` | `related` | `0.2143` | 148m | 25h | `actual_duplicate_pred_related` |
| `P0057` | `duplicate` | `independent` | `0.1765` | 168m | 28h | `actual_duplicate_pred_independent` |
| `P0075` | `duplicate` | `related` | `0.2667` | 174m | 30h | `actual_duplicate_pred_related` |
| `P0109` | `duplicate` | `independent` | `0.1538` | 209m | 44h | `actual_duplicate_pred_independent` |
| `P0151` | `related` | `independent` | `0.1765` | 23m | 52h | `actual_related_pred_independent` |
| `P0153` | `related` | `independent` | `0.1176` | 212m | 442h | `actual_related_pred_independent` |
| `P0156` | `related` | `independent` | `0.1333` | 87m | 91h | `actual_related_pred_independent` |
| `P0157` | `related` | `independent` | `0.1176` | 76m | 209h | `actual_related_pred_independent` |
| `P0165` | `related` | `independent` | `0.1250` | 72m | 78h | `actual_related_pred_independent` |
| `P0173` | `related` | `independent` | `0.1667` | 155m | 2h | `actual_related_pred_independent` |
| `P0215` | `related` | `independent` | `0.1176` | 187m | 116h | `actual_related_pred_independent` |
| `P0219` | `related` | `independent` | `0.1667` | 164m | 152h | `actual_related_pred_independent` |
| `P0252` | `related` | `independent` | `0.1250` | 192m | 65h | `actual_related_pred_independent` |
| `P0320` | `independent` | `related` | `0.2353` | 5977m | 227h | `actual_independent_pred_related` |

### Itemized Evidence and Failure Hypotheses

#### 1. Pair `P0005` [Actual: `duplicate` $\rightarrow$ Predicted: `independent`]

- **Complaint A:** "Water is escaping onto the road from a damaged pipe at Medavakkam Junction." (Category: `Water & Utilities`)
- **Complaint B:** "Continuous water leakage reported close to Medavakkam Junction." (Category: `Water & Utilities`)
- **Model Score:** `0.1667` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **127m**, Time Difference = **24h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.88`, Lexical=`0.25`, Semantic=`0.22`, Temporal=`0.97`
- **Directly Observed Evidence:** Observed score = 0.1667 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'duplicate' but model predicted 'independent'. Geographic distance between complaints is 127 meters. Submission timestamps differ by 24 hours. Complaint A category: 'Water & Utilities', Complaint B category: 'Water & Utilities'. HISC scorer component affinities: Category=1.00, Geo=0.88, Lex=0.25, Sem=0.22, Time=0.97.
- **Likely Cause Hypothesis:** Lexical paraphrase gap: Both complaints report the identical physical incident at the same location, but citizen descriptions use completely non-overlapping vocabulary (e.g. synonym variation or distinct syntactic phrasing). Because B1 relies exclusively on surface unigram Jaccard similarity without synonym mapping or spatial proximity, similarity falls below the related threshold.
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 2. Pair `P0015` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Water is leaking from a pipe near Medavakkam Junction." (Category: `Water & Utilities`)
- **Complaint B:** "Continuous water leakage reported close to Medavakkam Junction." (Category: `Water & Utilities`)
- **Model Score:** `0.2143` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **26m**, Time Difference = **21h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.97`, Lexical=`0.33`, Semantic=`0.43`, Temporal=`0.97`
- **Directly Observed Evidence:** Observed score = 0.2143 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 26 meters. Submission timestamps differ by 21 hours. Complaint A category: 'Water & Utilities', Complaint B category: 'Water & Utilities'. HISC scorer component affinities: Category=1.00, Geo=0.97, Lex=0.33, Sem=0.43, Time=0.97.
- **Likely Cause Hypothesis:** Sub-threshold surface lexical overlap: The pair shares some common words (e.g. location or defect terms) allowing it to cross the related threshold, but insufficient identical tokens prevent it from reaching the duplicate threshold (0.35).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 3. Pair `P0016` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Garbage has been dumped near GST Road." (Category: `Waste & Cleanliness`)
- **Complaint B:** "The public bin is overflowing near GST Road." (Category: `Waste & Cleanliness`)
- **Model Score:** `0.2500` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **114m**, Time Difference = **34h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.89`, Lexical=`0.17`, Semantic=`0.33`, Temporal=`0.95`
- **Directly Observed Evidence:** Observed score = 0.2500 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 114 meters. Submission timestamps differ by 34 hours. Complaint A category: 'Waste & Cleanliness', Complaint B category: 'Waste & Cleanliness'. HISC scorer component affinities: Category=1.00, Geo=0.89, Lex=0.17, Sem=0.33, Time=0.95.
- **Likely Cause Hypothesis:** Sub-threshold surface lexical overlap: The pair shares some common words (e.g. location or defect terms) allowing it to cross the related threshold, but insufficient identical tokens prevent it from reaching the duplicate threshold (0.35).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 4. Pair `P0017` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Uncollected waste is causing a cleanliness issue near GST Road." (Category: `Waste & Cleanliness`)
- **Complaint B:** "Garbage has been dumped near GST Road." (Category: `Waste & Cleanliness`)
- **Model Score:** `0.2143` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **33m**, Time Difference = **22h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.97`, Lexical=`0.14`, Semantic=`0.29`, Temporal=`0.97`
- **Directly Observed Evidence:** Observed score = 0.2143 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 33 meters. Submission timestamps differ by 22 hours. Complaint A category: 'Waste & Cleanliness', Complaint B category: 'Waste & Cleanliness'. HISC scorer component affinities: Category=1.00, Geo=0.97, Lex=0.14, Sem=0.29, Time=0.97.
- **Likely Cause Hypothesis:** Sub-threshold surface lexical overlap: The pair shares some common words (e.g. location or defect terms) allowing it to cross the related threshold, but insufficient identical tokens prevent it from reaching the duplicate threshold (0.35).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 5. Pair `P0018` [Actual: `duplicate` $\rightarrow$ Predicted: `independent`]

- **Complaint A:** "Road surface has broken badly close to Pallavaram Market." (Category: `Roads & Transport`)
- **Complaint B:** "Large pothole reported near Pallavaram Market." (Category: `Roads & Transport`)
- **Model Score:** `0.1538` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **138m**, Time Difference = **48h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.87`, Lexical=`0.17`, Semantic=`0.29`, Temporal=`0.94`
- **Directly Observed Evidence:** Observed score = 0.1538 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'duplicate' but model predicted 'independent'. Geographic distance between complaints is 138 meters. Submission timestamps differ by 48 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Roads & Transport'. HISC scorer component affinities: Category=1.00, Geo=0.87, Lex=0.17, Sem=0.29, Time=0.94.
- **Likely Cause Hypothesis:** Lexical paraphrase gap: Both complaints report the identical physical incident at the same location, but citizen descriptions use completely non-overlapping vocabulary (e.g. synonym variation or distinct syntactic phrasing). Because B1 relies exclusively on surface unigram Jaccard similarity without synonym mapping or spatial proximity, similarity falls below the related threshold.
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 6. Pair `P0020` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "A large pile of rubbish is present at Velachery Main Road." (Category: `Waste & Cleanliness`)
- **Complaint B:** "The public bin is overflowing near Velachery Main Road." (Category: `Waste & Cleanliness`)
- **Model Score:** `0.2500` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **21m**, Time Difference = **2h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.98`, Lexical=`0.13`, Semantic=`0.22`, Temporal=`1.00`
- **Directly Observed Evidence:** Observed score = 0.2500 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 21 meters. Submission timestamps differ by 2 hours. Complaint A category: 'Waste & Cleanliness', Complaint B category: 'Waste & Cleanliness'. HISC scorer component affinities: Category=1.00, Geo=0.98, Lex=0.13, Sem=0.22, Time=1.00.
- **Likely Cause Hypothesis:** Sub-threshold surface lexical overlap: The pair shares some common words (e.g. location or defect terms) allowing it to cross the related threshold, but insufficient identical tokens prevent it from reaching the duplicate threshold (0.35).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 7. Pair `P0038` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "A burst pipe is causing water loss near GST Road." (Category: `Water & Utilities`)
- **Complaint B:** "Continuous water leakage reported close to GST Road." (Category: `Water & Utilities`)
- **Model Score:** `0.2000` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **176m**, Time Difference = **27h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.84`, Lexical=`0.25`, Semantic=`0.33`, Temporal=`0.96`
- **Directly Observed Evidence:** Observed score = 0.2000 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 176 meters. Submission timestamps differ by 27 hours. Complaint A category: 'Water & Utilities', Complaint B category: 'Water & Utilities'. HISC scorer component affinities: Category=1.00, Geo=0.84, Lex=0.25, Sem=0.33, Time=0.96.
- **Likely Cause Hypothesis:** Sub-threshold surface lexical overlap: The pair shares some common words (e.g. location or defect terms) allowing it to cross the related threshold, but insufficient identical tokens prevent it from reaching the duplicate threshold (0.35).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 8. Pair `P0039` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Water is leaking from a pipe near VIT Main Gate." (Category: `Water & Utilities`)
- **Complaint B:** "Continuous water leakage reported close to VIT Main Gate." (Category: `Water & Utilities`)
- **Model Score:** `0.2667` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **101m**, Time Difference = **53h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.90`, Lexical=`0.43`, Semantic=`0.50`, Temporal=`0.93`
- **Directly Observed Evidence:** Observed score = 0.2667 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 101 meters. Submission timestamps differ by 53 hours. Complaint A category: 'Water & Utilities', Complaint B category: 'Water & Utilities'. HISC scorer component affinities: Category=1.00, Geo=0.90, Lex=0.43, Sem=0.50, Time=0.93.
- **Likely Cause Hypothesis:** Sub-threshold surface lexical overlap: The pair shares some common words (e.g. location or defect terms) allowing it to cross the related threshold, but insufficient identical tokens prevent it from reaching the duplicate threshold (0.35).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 9. Pair `P0043` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Waste is accumulating around Chromepet Bus Stand." (Category: `Waste & Cleanliness`)
- **Complaint B:** "A large pile of rubbish is present at Chromepet Bus Stand." (Category: `Waste & Cleanliness`)
- **Model Score:** `0.2857` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **176m**, Time Difference = **24h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.84`, Lexical=`0.33`, Semantic=`0.40`, Temporal=`0.97`
- **Directly Observed Evidence:** Observed score = 0.2857 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 176 meters. Submission timestamps differ by 24 hours. Complaint A category: 'Waste & Cleanliness', Complaint B category: 'Waste & Cleanliness'. HISC scorer component affinities: Category=1.00, Geo=0.84, Lex=0.33, Sem=0.40, Time=0.97.
- **Likely Cause Hypothesis:** Sub-threshold surface lexical overlap: The pair shares some common words (e.g. location or defect terms) allowing it to cross the related threshold, but insufficient identical tokens prevent it from reaching the duplicate threshold (0.35).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 10. Pair `P0046` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Damaged section of road near Velachery Main Road needs repair." (Category: `Roads & Transport`)
- **Complaint B:** "Road surface has broken badly close to Velachery Main Road." (Category: `Roads & Transport`)
- **Model Score:** `0.2000` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **160m**, Time Difference = **4h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.85`, Lexical=`0.20`, Semantic=`0.17`, Temporal=`0.99`
- **Directly Observed Evidence:** Observed score = 0.2000 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 160 meters. Submission timestamps differ by 4 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Roads & Transport'. HISC scorer component affinities: Category=1.00, Geo=0.85, Lex=0.20, Sem=0.17, Time=0.99.
- **Likely Cause Hypothesis:** Sub-threshold surface lexical overlap: The pair shares some common words (e.g. location or defect terms) allowing it to cross the related threshold, but insufficient identical tokens prevent it from reaching the duplicate threshold (0.35).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 11. Pair `P0049` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Water is overflowing from the drain at GST Road." (Category: `Drainage & Flooding`)
- **Complaint B:** "Blocked drainage is causing waterlogging around GST Road." (Category: `Drainage & Flooding`)
- **Model Score:** `0.2143` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **148m**, Time Difference = **25h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.86`, Lexical=`0.13`, Semantic=`0.25`, Temporal=`0.97`
- **Directly Observed Evidence:** Observed score = 0.2143 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 148 meters. Submission timestamps differ by 25 hours. Complaint A category: 'Drainage & Flooding', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=1.00, Geo=0.86, Lex=0.13, Sem=0.25, Time=0.97.
- **Likely Cause Hypothesis:** Sub-threshold surface lexical overlap: The pair shares some common words (e.g. location or defect terms) allowing it to cross the related threshold, but insufficient identical tokens prevent it from reaching the duplicate threshold (0.35).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 12. Pair `P0057` [Actual: `duplicate` $\rightarrow$ Predicted: `independent`]

- **Complaint A:** "Deep road crater causing problems for vehicles at Sholinganallur Junction." (Category: `Roads & Transport`)
- **Complaint B:** "Vehicles are struggling because of a pothole around Sholinganallur Junction." (Category: `Roads & Transport`)
- **Model Score:** `0.1765` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **168m**, Time Difference = **28h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.85`, Lexical=`0.20`, Semantic=`0.27`, Temporal=`0.96`
- **Directly Observed Evidence:** Observed score = 0.1765 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'duplicate' but model predicted 'independent'. Geographic distance between complaints is 168 meters. Submission timestamps differ by 28 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Roads & Transport'. HISC scorer component affinities: Category=1.00, Geo=0.85, Lex=0.20, Sem=0.27, Time=0.96.
- **Likely Cause Hypothesis:** Lexical paraphrase gap: Both complaints report the identical physical incident at the same location, but citizen descriptions use completely non-overlapping vocabulary (e.g. synonym variation or distinct syntactic phrasing). Because B1 relies exclusively on surface unigram Jaccard similarity without synonym mapping or spatial proximity, similarity falls below the related threshold.
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 13. Pair `P0075` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Blocked drainage is causing waterlogging around Velachery Main Road." (Category: `Drainage & Flooding`)
- **Complaint B:** "Water is overflowing from the drain at Velachery Main Road." (Category: `Drainage & Flooding`)
- **Model Score:** `0.2667` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **174m**, Time Difference = **30h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.84`, Lexical=`0.13`, Semantic=`0.25`, Temporal=`0.96`
- **Directly Observed Evidence:** Observed score = 0.2667 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 174 meters. Submission timestamps differ by 30 hours. Complaint A category: 'Drainage & Flooding', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=1.00, Geo=0.84, Lex=0.13, Sem=0.25, Time=0.96.
- **Likely Cause Hypothesis:** Sub-threshold surface lexical overlap: The pair shares some common words (e.g. location or defect terms) allowing it to cross the related threshold, but insufficient identical tokens prevent it from reaching the duplicate threshold (0.35).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 14. Pair `P0109` [Actual: `duplicate` $\rightarrow$ Predicted: `independent`]

- **Complaint A:** "Large pothole reported near Sholinganallur Junction." (Category: `Roads & Transport`)
- **Complaint B:** "Road surface has broken badly close to Sholinganallur Junction." (Category: `Roads & Transport`)
- **Model Score:** `0.1538` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **209m**, Time Difference = **44h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.81`, Lexical=`0.17`, Semantic=`0.29`, Temporal=`0.94`
- **Directly Observed Evidence:** Observed score = 0.1538 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'duplicate' but model predicted 'independent'. Geographic distance between complaints is 209 meters. Submission timestamps differ by 44 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Roads & Transport'. HISC scorer component affinities: Category=1.00, Geo=0.81, Lex=0.17, Sem=0.29, Time=0.94.
- **Likely Cause Hypothesis:** Lexical paraphrase gap: Both complaints report the identical physical incident at the same location, but citizen descriptions use completely non-overlapping vocabulary (e.g. synonym variation or distinct syntactic phrasing). Because B1 relies exclusively on surface unigram Jaccard similarity without synonym mapping or spatial proximity, similarity falls below the related threshold.
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 15. Pair `P0151` [Actual: `related` $\rightarrow$ Predicted: `independent`]

- **Complaint A:** "Vehicles are struggling because of a pothole around Velachery Main Road." (Category: `Roads & Transport`)
- **Complaint B:** "The roadside drain is clogged near Velachery Main Road." (Category: `Drainage & Flooding`)
- **Model Score:** `0.1765` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **23m**, Time Difference = **52h**
- **Feature Breakdown:** Category=`0.40`, Geographic=`0.98`, Lexical=`0.11`, Semantic=`0.09`, Temporal=`0.93`
- **Directly Observed Evidence:** Observed score = 0.1765 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'related' but model predicted 'independent'. Geographic distance between complaints is 23 meters. Submission timestamps differ by 52 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=0.40, Geo=0.98, Lex=0.11, Sem=0.09, Time=0.93.
- **Likely Cause Hypothesis:** Cross-defect vocabulary disparity: The complaints represent causally or geographically related infrastructure defects (e.g. blocked drain and water leak), but text descriptions share no common terms, causing unigram Jaccard similarity to fall below the related threshold.
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 16. Pair `P0153` [Actual: `related` $\rightarrow$ Predicted: `independent`]

- **Complaint A:** "Vehicles are struggling because of a pothole around Pallavaram Market." (Category: `Roads & Transport`)
- **Complaint B:** "Drain overflow reported close to Pallavaram Market after rainfall." (Category: `Drainage & Flooding`)
- **Model Score:** `0.1176` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **212m**, Time Difference = **442h**
- **Feature Breakdown:** Category=`0.40`, Geographic=`0.81`, Lexical=`0.11`, Semantic=`0.09`, Temporal=`0.54`
- **Directly Observed Evidence:** Observed score = 0.1176 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'related' but model predicted 'independent'. Geographic distance between complaints is 212 meters. Submission timestamps differ by 442 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=0.40, Geo=0.81, Lex=0.11, Sem=0.09, Time=0.54.
- **Likely Cause Hypothesis:** Cross-defect vocabulary disparity: The complaints represent causally or geographically related infrastructure defects (e.g. blocked drain and water leak), but text descriptions share no common terms, causing unigram Jaccard similarity to fall below the related threshold.
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 17. Pair `P0156` [Actual: `related` $\rightarrow$ Predicted: `independent`]

- **Complaint A:** "Road surface has broken badly close to Medavakkam Junction." (Category: `Roads & Transport`)
- **Complaint B:** "The roadside drain is clogged near Medavakkam Junction." (Category: `Drainage & Flooding`)
- **Model Score:** `0.1333` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **87m**, Time Difference = **91h**
- **Feature Breakdown:** Category=`0.40`, Geographic=`0.92`, Lexical=`0.14`, Semantic=`0.11`, Temporal=`0.88`
- **Directly Observed Evidence:** Observed score = 0.1333 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'related' but model predicted 'independent'. Geographic distance between complaints is 87 meters. Submission timestamps differ by 91 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=0.40, Geo=0.92, Lex=0.14, Sem=0.11, Time=0.88.
- **Likely Cause Hypothesis:** Cross-defect vocabulary disparity: The complaints represent causally or geographically related infrastructure defects (e.g. blocked drain and water leak), but text descriptions share no common terms, causing unigram Jaccard similarity to fall below the related threshold.
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 18. Pair `P0157` [Actual: `related` $\rightarrow$ Predicted: `independent`]

- **Complaint A:** "Deep road crater causing problems for vehicles at Medavakkam Junction." (Category: `Roads & Transport`)
- **Complaint B:** "Drain overflow reported close to Medavakkam Junction after rainfall." (Category: `Drainage & Flooding`)
- **Model Score:** `0.1176` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **76m**, Time Difference = **209h**
- **Feature Breakdown:** Category=`0.40`, Geographic=`0.93`, Lexical=`0.11`, Semantic=`0.09`, Temporal=`0.75`
- **Directly Observed Evidence:** Observed score = 0.1176 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'related' but model predicted 'independent'. Geographic distance between complaints is 76 meters. Submission timestamps differ by 209 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=0.40, Geo=0.93, Lex=0.11, Sem=0.09, Time=0.75.
- **Likely Cause Hypothesis:** Cross-defect vocabulary disparity: The complaints represent causally or geographically related infrastructure defects (e.g. blocked drain and water leak), but text descriptions share no common terms, causing unigram Jaccard similarity to fall below the related threshold.
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 19. Pair `P0165` [Actual: `related` $\rightarrow$ Predicted: `independent`]

- **Complaint A:** "Road surface has broken badly close to Sholinganallur Junction." (Category: `Roads & Transport`)
- **Complaint B:** "Water is overflowing from the drain at Sholinganallur Junction." (Category: `Drainage & Flooding`)
- **Model Score:** `0.1250` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **72m**, Time Difference = **78h**
- **Feature Breakdown:** Category=`0.40`, Geographic=`0.93`, Lexical=`0.14`, Semantic=`0.11`, Temporal=`0.90`
- **Directly Observed Evidence:** Observed score = 0.1250 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'related' but model predicted 'independent'. Geographic distance between complaints is 72 meters. Submission timestamps differ by 78 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=0.40, Geo=0.93, Lex=0.14, Sem=0.11, Time=0.90.
- **Likely Cause Hypothesis:** Cross-defect vocabulary disparity: The complaints represent causally or geographically related infrastructure defects (e.g. blocked drain and water leak), but text descriptions share no common terms, causing unigram Jaccard similarity to fall below the related threshold.
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 20. Pair `P0173` [Actual: `related` $\rightarrow$ Predicted: `independent`]

- **Complaint A:** "The light pole near VIT Main Gate is damaged and the light is off." (Category: `Street Infrastructure`)
- **Complaint B:** "Road surface has broken badly close to VIT Main Gate." (Category: `Roads & Transport`)
- **Model Score:** `0.1667` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **155m**, Time Difference = **2h**
- **Feature Breakdown:** Category=`0.60`, Geographic=`0.86`, Lexical=`0.22`, Semantic=`0.18`, Temporal=`1.00`
- **Directly Observed Evidence:** Observed score = 0.1667 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'related' but model predicted 'independent'. Geographic distance between complaints is 155 meters. Submission timestamps differ by 2 hours. Complaint A category: 'Street Infrastructure', Complaint B category: 'Roads & Transport'. HISC scorer component affinities: Category=0.60, Geo=0.86, Lex=0.22, Sem=0.18, Time=1.00.
- **Likely Cause Hypothesis:** Cross-defect vocabulary disparity: The complaints represent causally or geographically related infrastructure defects (e.g. blocked drain and water leak), but text descriptions share no common terms, causing unigram Jaccard similarity to fall below the related threshold.
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 21. Pair `P0215` [Actual: `related` $\rightarrow$ Predicted: `independent`]

- **Complaint A:** "Road surface has broken badly close to Medavakkam Junction." (Category: `Roads & Transport`)
- **Complaint B:** "A faulty streetlight is causing poor visibility near Medavakkam Junction." (Category: `Street Infrastructure`)
- **Model Score:** `0.1176` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **187m**, Time Difference = **116h**
- **Feature Breakdown:** Category=`0.60`, Geographic=`0.83`, Lexical=`0.11`, Semantic=`0.10`, Temporal=`0.85`
- **Directly Observed Evidence:** Observed score = 0.1176 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'related' but model predicted 'independent'. Geographic distance between complaints is 187 meters. Submission timestamps differ by 116 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Street Infrastructure'. HISC scorer component affinities: Category=0.60, Geo=0.83, Lex=0.11, Sem=0.10, Time=0.85.
- **Likely Cause Hypothesis:** Cross-defect vocabulary disparity: The complaints represent causally or geographically related infrastructure defects (e.g. blocked drain and water leak), but text descriptions share no common terms, causing unigram Jaccard similarity to fall below the related threshold.
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 22. Pair `P0219` [Actual: `related` $\rightarrow$ Predicted: `independent`]

- **Complaint A:** "Vehicles are struggling because of a pothole around Velachery Main Road." (Category: `Roads & Transport`)
- **Complaint B:** "Drain overflow reported close to Velachery Main Road after rainfall." (Category: `Drainage & Flooding`)
- **Model Score:** `0.1667` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **164m**, Time Difference = **152h**
- **Feature Breakdown:** Category=`0.40`, Geographic=`0.85`, Lexical=`0.11`, Semantic=`0.09`, Temporal=`0.81`
- **Directly Observed Evidence:** Observed score = 0.1667 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'related' but model predicted 'independent'. Geographic distance between complaints is 164 meters. Submission timestamps differ by 152 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=0.40, Geo=0.85, Lex=0.11, Sem=0.09, Time=0.81.
- **Likely Cause Hypothesis:** Cross-defect vocabulary disparity: The complaints represent causally or geographically related infrastructure defects (e.g. blocked drain and water leak), but text descriptions share no common terms, causing unigram Jaccard similarity to fall below the related threshold.
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 23. Pair `P0252` [Actual: `related` $\rightarrow$ Predicted: `independent`]

- **Complaint A:** "Road surface has broken badly close to Medavakkam Junction." (Category: `Roads & Transport`)
- **Complaint B:** "There is no working street lighting around Medavakkam Junction." (Category: `Street Infrastructure`)
- **Model Score:** `0.1250` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **192m**, Time Difference = **65h**
- **Feature Breakdown:** Category=`0.60`, Geographic=`0.83`, Lexical=`0.17`, Semantic=`0.13`, Temporal=`0.91`
- **Directly Observed Evidence:** Observed score = 0.1250 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'related' but model predicted 'independent'. Geographic distance between complaints is 192 meters. Submission timestamps differ by 65 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Street Infrastructure'. HISC scorer component affinities: Category=0.60, Geo=0.83, Lex=0.17, Sem=0.13, Time=0.91.
- **Likely Cause Hypothesis:** Cross-defect vocabulary disparity: The complaints represent causally or geographically related infrastructure defects (e.g. blocked drain and water leak), but text descriptions share no common terms, causing unigram Jaccard similarity to fall below the related threshold.
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 24. Pair `P0320` [Actual: `independent` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "A burst pipe is causing water loss near Chromepet Bus Stand." (Category: `Water & Utilities`)
- **Complaint B:** "Uncollected waste is causing a cleanliness issue near Medavakkam Junction." (Category: `Waste & Cleanliness`)
- **Model Score:** `0.2353` (Selected Thresholds: Duplicate=`0.35`, Related=`0.20`)
- **Physical Context:** Distance = **5977m**, Time Difference = **227h**
- **Feature Breakdown:** Category=`0.00`, Geographic=`0.00`, Lexical=`0.08`, Semantic=`0.07`, Temporal=`0.73`
- **Directly Observed Evidence:** Observed score = 0.2353 against tuned decision thresholds (duplicate: 0.35, related: 0.20). True label is 'independent' but model predicted 'related'. Geographic distance between complaints is 5977 meters. Submission timestamps differ by 227 hours. Complaint A category: 'Water & Utilities', Complaint B category: 'Waste & Cleanliness'. HISC scorer component affinities: Category=0.00, Geo=0.00, Lex=0.08, Sem=0.07, Time=0.73.
- **Likely Cause Hypothesis:** Spurious lexical token sharing: Unrelated complaints describe distinct problems in different areas, but coincidentally share generic vocabulary tokens, falsely elevating Jaccard similarity above the related threshold (0.20).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

## 4. Cross-Method Comparison of Recurring Error Patterns

Across all 6 evaluated methods on the identical 80-pair validation split, the error distributions reflect clear architectural trade-offs:

| Method ID | Method Name | Errors | Accuracy | Macro F1 | Primary Failure Pattern |
|---|---|:---:|:---:|:---:|---|
| **HISC** | HISC (Hybrid Incident Similarity and Clustering) | **0** / 80 | 100.00% | **1.0000** | None (zero validation errors) |
| **B1_jaccard** | B1: Text Jaccard Similarity | **24** / 80 | 70.00% | **0.6792** | Lexical paraphrasing gap; missed duplicates (14) & missed related (9) |
| **B2_distance** | B2: Distance-Only Similarity | **19** / 80 | 76.25% | **0.7563** | Spatial conflation; over-clusters related into duplicate (12) |
| **B3_cat_distance** | B3: Category Plus Distance | **0** / 80 | 100.00% | **1.0000** | None (zero validation errors) |
| **B4_tfidf** | B4: TF-IDF Cosine Similarity | **18** / 80 | 77.50% | **0.7499** | TF-IDF vocabulary sparsity; missed duplicates (14) & missed related (3) |
| **B5_tfidf_distance** | B5: TF-IDF Cosine + Geographic Distance | **14** / 80 | 82.50% | **0.7961** | Convex dilution; conservative threshold under-classifies duplicates to related (14) |

### Recurring Failure Modes

1. **Surface Lexical Brittleness (B1 & B4):**
   Unigram overlap and TF-IDF cosine fail when citizen complaints express identical issues using distinct synonyms (e.g. "crater" vs "pothole", "burst pipe" vs "water leakage"). Pure text baselines suffer significant false independence (B1 misses 13 pairs into independent).

2. **Spatial Conflation of Duplicate vs Related (B2):**
   Distance-only similarity cannot distinguish between two identical reports of the same pothole and two distinct related incidents (such as a tree fall and a power line) that occur within 100 meters of each other. This causes 12 related pairs to be falsely predicted as duplicates.

3. **Convex Combination Calibration Margin (B5):**
   Combining TF-IDF and distance ($0.6 \cdot S_{tfidf} + 0.4 \cdot S_{geo}$) eliminates false independence entirely (0 independent errors), but requires high values from both terms to cross the duplicate threshold (0.60), causing 14 duplicates to be under-classified as related.

4. **Multi-Attribute Synergy (HISC & B3):**
   Integrating category compatibility with spatial proximity provides sufficient separation on the standard municipal validation split to achieve zero classification errors.

## 5. Distinction Between Observed Facts and Hypotheses

- **Observed Facts:** All numerical scores, threshold bounds, confusion categories, Haversine distances in meters, time deltas in hours, and feature breakdown values reported in this analysis are strictly measured from authorized validation data and existing deterministic code without simulation or imputation.
- **Hypotheses:** Explanations regarding "lexical paraphrase gap", "spatial conflation", and "dilution" represent analytical failure hypotheses formulated from model architecture constraints, clearly distinguished from raw observed measurements.
