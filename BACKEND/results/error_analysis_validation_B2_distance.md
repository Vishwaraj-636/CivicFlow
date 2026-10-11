# CivicFlow Error Analysis — Validation Split: B2: Distance-Only Similarity (`B2_distance`)

## 1. Executive Summary & Evaluation Context

- **Method ID:** `B2_distance`
- **Method Name:** B2: Distance-Only Similarity
- **Formula:** S = exp(-d / 1000) where d is Haversine distance in meters.
- **Split:** `validation` ($N = 80$ pairs)
- **Source Evaluation Artifact:** `BACKEND/results/t1_validation_baseline_comparison.json`
- **Source Git Commit:** `040d2e78a3c87b8ad31924d0a6d4b2e6115c59eb`
- **Generation Timestamp:** `2026-10-11T06:46:41.754Z`
- **Selected Decision Thresholds:** Duplicate = `0.85`, Related = `0.20`
- **Validation Accuracy:** 76.25%
- **Validation Macro F1:** **0.7563**
- **Misclassified Pairs:** **19** out of 80 pairs (23.8% error rate)

> [!NOTE]
> **Protocol Compliance:** This error analysis was conducted strictly on the **Validation split** ($N = 80$). No held-out test pairs or synthetic challenge set pairs were evaluated.

## 2. Confusion Matrix & Per-Class Performance

**Per-Class Metrics:**

| Class | Support | Precision | Recall | F1 Score |
|---|:---:|:---:|:---:|:---:|
| `duplicate` | 24 | 0.5862 | 0.7083 | **0.6415** |
| `related` | 28 | 0.6957 | 0.5714 | **0.6275** |
| `independent` | 28 | 1.0000 | 1.0000 | **1.0000** |

**Confusion Matrix (Actual Rows \ Predicted Columns):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 17 | 7 | 0 |
| **Actual `related`** | 12 | 16 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

## 3. Detailed Misclassified Pairs Analysis

Total misclassified items: **19**

| Pair ID | True Label | Pred Label | Score | Distance | Time | Confusion Category |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `P0038` | `duplicate` | `related` | `0.8387` | 176m | 27h | `actual_duplicate_pred_related` |
| `P0043` | `duplicate` | `related` | `0.8385` | 176m | 24h | `actual_duplicate_pred_related` |
| `P0057` | `duplicate` | `related` | `0.8452` | 168m | 28h | `actual_duplicate_pred_related` |
| `P0075` | `duplicate` | `related` | `0.8404` | 174m | 30h | `actual_duplicate_pred_related` |
| `P0092` | `duplicate` | `related` | `0.8414` | 173m | 12h | `actual_duplicate_pred_related` |
| `P0099` | `duplicate` | `related` | `0.8228` | 195m | 17h | `actual_duplicate_pred_related` |
| `P0109` | `duplicate` | `related` | `0.8116` | 209m | 44h | `actual_duplicate_pred_related` |
| `P0139` | `related` | `duplicate` | `0.8544` | 157m | 30h | `actual_related_pred_duplicate` |
| `P0142` | `related` | `duplicate` | `0.9210` | 82m | 402h | `actual_related_pred_duplicate` |
| `P0151` | `related` | `duplicate` | `0.9769` | 23m | 52h | `actual_related_pred_duplicate` |
| `P0156` | `related` | `duplicate` | `0.9168` | 87m | 91h | `actual_related_pred_duplicate` |
| `P0157` | `related` | `duplicate` | `0.9271` | 76m | 209h | `actual_related_pred_duplicate` |
| `P0165` | `related` | `duplicate` | `0.9305` | 72m | 78h | `actual_related_pred_duplicate` |
| `P0173` | `related` | `duplicate` | `0.8561` | 155m | 2h | `actual_related_pred_duplicate` |
| `P0178` | `related` | `duplicate` | `0.8714` | 138m | 295h | `actual_related_pred_duplicate` |
| `P0197` | `related` | `duplicate` | `0.8842` | 123m | 153h | `actual_related_pred_duplicate` |
| `P0236` | `related` | `duplicate` | `0.8614` | 149m | 213h | `actual_related_pred_duplicate` |
| `P0244` | `related` | `duplicate` | `0.9012` | 104m | 333h | `actual_related_pred_duplicate` |
| `P0258` | `related` | `duplicate` | `0.9309` | 72m | 130h | `actual_related_pred_duplicate` |

### Itemized Evidence and Failure Hypotheses

#### 1. Pair `P0038` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "A burst pipe is causing water loss near GST Road." (Category: `Water & Utilities`)
- **Complaint B:** "Continuous water leakage reported close to GST Road." (Category: `Water & Utilities`)
- **Model Score:** `0.8387` (Selected Thresholds: Duplicate=`0.85`, Related=`0.20`)
- **Physical Context:** Distance = **176m**, Time Difference = **27h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.84`, Lexical=`0.25`, Semantic=`0.33`, Temporal=`0.96`
- **Directly Observed Evidence:** Observed score = 0.8387 against tuned decision thresholds (duplicate: 0.85, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 176 meters. Submission timestamps differ by 27 hours. Complaint A category: 'Water & Utilities', Complaint B category: 'Water & Utilities'. HISC scorer component affinities: Category=1.00, Geo=0.84, Lex=0.25, Sem=0.33, Time=0.96.
- **Likely Cause Hypothesis:** Spatial proximity margin: The complaints are close, but physical separation (distance > 160m) causes negative exponential proximity exp(-d/1000) to fall just below the stringent duplicate threshold of 0.85, classifying the duplicate as merely related.
- **Unmodeled Dimensions:** `lexical_similarity_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 2. Pair `P0043` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Waste is accumulating around Chromepet Bus Stand." (Category: `Waste & Cleanliness`)
- **Complaint B:** "A large pile of rubbish is present at Chromepet Bus Stand." (Category: `Waste & Cleanliness`)
- **Model Score:** `0.8385` (Selected Thresholds: Duplicate=`0.85`, Related=`0.20`)
- **Physical Context:** Distance = **176m**, Time Difference = **24h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.84`, Lexical=`0.33`, Semantic=`0.40`, Temporal=`0.97`
- **Directly Observed Evidence:** Observed score = 0.8385 against tuned decision thresholds (duplicate: 0.85, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 176 meters. Submission timestamps differ by 24 hours. Complaint A category: 'Waste & Cleanliness', Complaint B category: 'Waste & Cleanliness'. HISC scorer component affinities: Category=1.00, Geo=0.84, Lex=0.33, Sem=0.40, Time=0.97.
- **Likely Cause Hypothesis:** Spatial proximity margin: The complaints are close, but physical separation (distance > 160m) causes negative exponential proximity exp(-d/1000) to fall just below the stringent duplicate threshold of 0.85, classifying the duplicate as merely related.
- **Unmodeled Dimensions:** `lexical_similarity_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 3. Pair `P0057` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Deep road crater causing problems for vehicles at Sholinganallur Junction." (Category: `Roads & Transport`)
- **Complaint B:** "Vehicles are struggling because of a pothole around Sholinganallur Junction." (Category: `Roads & Transport`)
- **Model Score:** `0.8452` (Selected Thresholds: Duplicate=`0.85`, Related=`0.20`)
- **Physical Context:** Distance = **168m**, Time Difference = **28h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.85`, Lexical=`0.20`, Semantic=`0.27`, Temporal=`0.96`
- **Directly Observed Evidence:** Observed score = 0.8452 against tuned decision thresholds (duplicate: 0.85, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 168 meters. Submission timestamps differ by 28 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Roads & Transport'. HISC scorer component affinities: Category=1.00, Geo=0.85, Lex=0.20, Sem=0.27, Time=0.96.
- **Likely Cause Hypothesis:** Spatial proximity margin: The complaints are close, but physical separation (distance > 160m) causes negative exponential proximity exp(-d/1000) to fall just below the stringent duplicate threshold of 0.85, classifying the duplicate as merely related.
- **Unmodeled Dimensions:** `lexical_similarity_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 4. Pair `P0075` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Blocked drainage is causing waterlogging around Velachery Main Road." (Category: `Drainage & Flooding`)
- **Complaint B:** "Water is overflowing from the drain at Velachery Main Road." (Category: `Drainage & Flooding`)
- **Model Score:** `0.8404` (Selected Thresholds: Duplicate=`0.85`, Related=`0.20`)
- **Physical Context:** Distance = **174m**, Time Difference = **30h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.84`, Lexical=`0.13`, Semantic=`0.25`, Temporal=`0.96`
- **Directly Observed Evidence:** Observed score = 0.8404 against tuned decision thresholds (duplicate: 0.85, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 174 meters. Submission timestamps differ by 30 hours. Complaint A category: 'Drainage & Flooding', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=1.00, Geo=0.84, Lex=0.13, Sem=0.25, Time=0.96.
- **Likely Cause Hypothesis:** Spatial proximity margin: The complaints are close, but physical separation (distance > 160m) causes negative exponential proximity exp(-d/1000) to fall just below the stringent duplicate threshold of 0.85, classifying the duplicate as merely related.
- **Unmodeled Dimensions:** `lexical_similarity_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 5. Pair `P0092` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Deep road crater causing problems for vehicles at GST Road." (Category: `Roads & Transport`)
- **Complaint B:** "Deep road crater causing problems for vehicles at GST Road." (Category: `Roads & Transport`)
- **Model Score:** `0.8414` (Selected Thresholds: Duplicate=`0.85`, Related=`0.20`)
- **Physical Context:** Distance = **173m**, Time Difference = **12h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.84`, Lexical=`1.00`, Semantic=`1.00`, Temporal=`0.98`
- **Directly Observed Evidence:** Observed score = 0.8414 against tuned decision thresholds (duplicate: 0.85, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 173 meters. Submission timestamps differ by 12 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Roads & Transport'. HISC scorer component affinities: Category=1.00, Geo=0.84, Lex=1.00, Sem=1.00, Time=0.98.
- **Likely Cause Hypothesis:** Spatial proximity margin: The complaints are close, but physical separation (distance > 160m) causes negative exponential proximity exp(-d/1000) to fall just below the stringent duplicate threshold of 0.85, classifying the duplicate as merely related.
- **Unmodeled Dimensions:** `lexical_similarity_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 6. Pair `P0099` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "A burst pipe is causing water loss near Tambaram Railway Station." (Category: `Water & Utilities`)
- **Complaint B:** "Water is escaping onto the road from a damaged pipe at Tambaram Railway Station." (Category: `Water & Utilities`)
- **Model Score:** `0.8228` (Selected Thresholds: Duplicate=`0.85`, Related=`0.20`)
- **Physical Context:** Distance = **195m**, Time Difference = **17h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.82`, Lexical=`0.45`, Semantic=`0.42`, Temporal=`0.98`
- **Directly Observed Evidence:** Observed score = 0.8228 against tuned decision thresholds (duplicate: 0.85, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 195 meters. Submission timestamps differ by 17 hours. Complaint A category: 'Water & Utilities', Complaint B category: 'Water & Utilities'. HISC scorer component affinities: Category=1.00, Geo=0.82, Lex=0.45, Sem=0.42, Time=0.98.
- **Likely Cause Hypothesis:** Spatial proximity margin: The complaints are close, but physical separation (distance > 160m) causes negative exponential proximity exp(-d/1000) to fall just below the stringent duplicate threshold of 0.85, classifying the duplicate as merely related.
- **Unmodeled Dimensions:** `lexical_similarity_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 7. Pair `P0109` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Large pothole reported near Sholinganallur Junction." (Category: `Roads & Transport`)
- **Complaint B:** "Road surface has broken badly close to Sholinganallur Junction." (Category: `Roads & Transport`)
- **Model Score:** `0.8116` (Selected Thresholds: Duplicate=`0.85`, Related=`0.20`)
- **Physical Context:** Distance = **209m**, Time Difference = **44h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.81`, Lexical=`0.17`, Semantic=`0.29`, Temporal=`0.94`
- **Directly Observed Evidence:** Observed score = 0.8116 against tuned decision thresholds (duplicate: 0.85, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 209 meters. Submission timestamps differ by 44 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Roads & Transport'. HISC scorer component affinities: Category=1.00, Geo=0.81, Lex=0.17, Sem=0.29, Time=0.94.
- **Likely Cause Hypothesis:** Spatial proximity margin: The complaints are close, but physical separation (distance > 160m) causes negative exponential proximity exp(-d/1000) to fall just below the stringent duplicate threshold of 0.85, classifying the duplicate as merely related.
- **Unmodeled Dimensions:** `lexical_similarity_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 8. Pair `P0139` [Actual: `related` $\rightarrow$ Predicted: `duplicate`]

- **Complaint A:** "A damaged water pipeline is leaking around Camp Road." (Category: `Water & Utilities`)
- **Complaint B:** "Drain is blocked near Camp Road." (Category: `Drainage & Flooding`)
- **Model Score:** `0.8544` (Selected Thresholds: Duplicate=`0.85`, Related=`0.20`)
- **Physical Context:** Distance = **157m**, Time Difference = **30h**
- **Feature Breakdown:** Category=`0.60`, Geographic=`0.85`, Lexical=`0.14`, Semantic=`0.11`, Temporal=`0.96`
- **Directly Observed Evidence:** Observed score = 0.8544 against tuned decision thresholds (duplicate: 0.85, related: 0.20). True label is 'related' but model predicted 'duplicate'. Geographic distance between complaints is 157 meters. Submission timestamps differ by 30 hours. Complaint A category: 'Water & Utilities', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=0.60, Geo=0.85, Lex=0.14, Sem=0.11, Time=0.96.
- **Likely Cause Hypothesis:** Spatial conflation without semantic discrimination: The complaints are physically co-located (< 150m apart), producing a spatial score above the duplicate threshold (0.85). Because B2 models only distance and lacks text or category features, it cannot differentiate adjacent related incidents from true duplicates.
- **Unmodeled Dimensions:** `lexical_similarity_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 9. Pair `P0142` [Actual: `related` $\rightarrow$ Predicted: `duplicate`]

- **Complaint A:** "Vehicles are struggling because of a pothole around Medavakkam Junction." (Category: `Roads & Transport`)
- **Complaint B:** "Blocked drainage is causing waterlogging around Medavakkam Junction." (Category: `Drainage & Flooding`)
- **Model Score:** `0.9210` (Selected Thresholds: Duplicate=`0.85`, Related=`0.20`)
- **Physical Context:** Distance = **82m**, Time Difference = **402h**
- **Feature Breakdown:** Category=`0.40`, Geographic=`0.92`, Lexical=`0.10`, Semantic=`0.09`, Temporal=`0.57`
- **Directly Observed Evidence:** Observed score = 0.9210 against tuned decision thresholds (duplicate: 0.85, related: 0.20). True label is 'related' but model predicted 'duplicate'. Geographic distance between complaints is 82 meters. Submission timestamps differ by 402 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=0.40, Geo=0.92, Lex=0.10, Sem=0.09, Time=0.57.
- **Likely Cause Hypothesis:** Spatial conflation without semantic discrimination: The complaints are physically co-located (< 150m apart), producing a spatial score above the duplicate threshold (0.85). Because B2 models only distance and lacks text or category features, it cannot differentiate adjacent related incidents from true duplicates.
- **Unmodeled Dimensions:** `lexical_similarity_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 10. Pair `P0151` [Actual: `related` $\rightarrow$ Predicted: `duplicate`]

- **Complaint A:** "Vehicles are struggling because of a pothole around Velachery Main Road." (Category: `Roads & Transport`)
- **Complaint B:** "The roadside drain is clogged near Velachery Main Road." (Category: `Drainage & Flooding`)
- **Model Score:** `0.9769` (Selected Thresholds: Duplicate=`0.85`, Related=`0.20`)
- **Physical Context:** Distance = **23m**, Time Difference = **52h**
- **Feature Breakdown:** Category=`0.40`, Geographic=`0.98`, Lexical=`0.11`, Semantic=`0.09`, Temporal=`0.93`
- **Directly Observed Evidence:** Observed score = 0.9769 against tuned decision thresholds (duplicate: 0.85, related: 0.20). True label is 'related' but model predicted 'duplicate'. Geographic distance between complaints is 23 meters. Submission timestamps differ by 52 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=0.40, Geo=0.98, Lex=0.11, Sem=0.09, Time=0.93.
- **Likely Cause Hypothesis:** Spatial conflation without semantic discrimination: The complaints are physically co-located (< 150m apart), producing a spatial score above the duplicate threshold (0.85). Because B2 models only distance and lacks text or category features, it cannot differentiate adjacent related incidents from true duplicates.
- **Unmodeled Dimensions:** `lexical_similarity_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 11. Pair `P0156` [Actual: `related` $\rightarrow$ Predicted: `duplicate`]

- **Complaint A:** "Road surface has broken badly close to Medavakkam Junction." (Category: `Roads & Transport`)
- **Complaint B:** "The roadside drain is clogged near Medavakkam Junction." (Category: `Drainage & Flooding`)
- **Model Score:** `0.9168` (Selected Thresholds: Duplicate=`0.85`, Related=`0.20`)
- **Physical Context:** Distance = **87m**, Time Difference = **91h**
- **Feature Breakdown:** Category=`0.40`, Geographic=`0.92`, Lexical=`0.14`, Semantic=`0.11`, Temporal=`0.88`
- **Directly Observed Evidence:** Observed score = 0.9168 against tuned decision thresholds (duplicate: 0.85, related: 0.20). True label is 'related' but model predicted 'duplicate'. Geographic distance between complaints is 87 meters. Submission timestamps differ by 91 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=0.40, Geo=0.92, Lex=0.14, Sem=0.11, Time=0.88.
- **Likely Cause Hypothesis:** Spatial conflation without semantic discrimination: The complaints are physically co-located (< 150m apart), producing a spatial score above the duplicate threshold (0.85). Because B2 models only distance and lacks text or category features, it cannot differentiate adjacent related incidents from true duplicates.
- **Unmodeled Dimensions:** `lexical_similarity_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 12. Pair `P0157` [Actual: `related` $\rightarrow$ Predicted: `duplicate`]

- **Complaint A:** "Deep road crater causing problems for vehicles at Medavakkam Junction." (Category: `Roads & Transport`)
- **Complaint B:** "Drain overflow reported close to Medavakkam Junction after rainfall." (Category: `Drainage & Flooding`)
- **Model Score:** `0.9271` (Selected Thresholds: Duplicate=`0.85`, Related=`0.20`)
- **Physical Context:** Distance = **76m**, Time Difference = **209h**
- **Feature Breakdown:** Category=`0.40`, Geographic=`0.93`, Lexical=`0.11`, Semantic=`0.09`, Temporal=`0.75`
- **Directly Observed Evidence:** Observed score = 0.9271 against tuned decision thresholds (duplicate: 0.85, related: 0.20). True label is 'related' but model predicted 'duplicate'. Geographic distance between complaints is 76 meters. Submission timestamps differ by 209 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=0.40, Geo=0.93, Lex=0.11, Sem=0.09, Time=0.75.
- **Likely Cause Hypothesis:** Spatial conflation without semantic discrimination: The complaints are physically co-located (< 150m apart), producing a spatial score above the duplicate threshold (0.85). Because B2 models only distance and lacks text or category features, it cannot differentiate adjacent related incidents from true duplicates.
- **Unmodeled Dimensions:** `lexical_similarity_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 13. Pair `P0165` [Actual: `related` $\rightarrow$ Predicted: `duplicate`]

- **Complaint A:** "Road surface has broken badly close to Sholinganallur Junction." (Category: `Roads & Transport`)
- **Complaint B:** "Water is overflowing from the drain at Sholinganallur Junction." (Category: `Drainage & Flooding`)
- **Model Score:** `0.9305` (Selected Thresholds: Duplicate=`0.85`, Related=`0.20`)
- **Physical Context:** Distance = **72m**, Time Difference = **78h**
- **Feature Breakdown:** Category=`0.40`, Geographic=`0.93`, Lexical=`0.14`, Semantic=`0.11`, Temporal=`0.90`
- **Directly Observed Evidence:** Observed score = 0.9305 against tuned decision thresholds (duplicate: 0.85, related: 0.20). True label is 'related' but model predicted 'duplicate'. Geographic distance between complaints is 72 meters. Submission timestamps differ by 78 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=0.40, Geo=0.93, Lex=0.14, Sem=0.11, Time=0.90.
- **Likely Cause Hypothesis:** Spatial conflation without semantic discrimination: The complaints are physically co-located (< 150m apart), producing a spatial score above the duplicate threshold (0.85). Because B2 models only distance and lacks text or category features, it cannot differentiate adjacent related incidents from true duplicates.
- **Unmodeled Dimensions:** `lexical_similarity_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 14. Pair `P0173` [Actual: `related` $\rightarrow$ Predicted: `duplicate`]

- **Complaint A:** "The light pole near VIT Main Gate is damaged and the light is off." (Category: `Street Infrastructure`)
- **Complaint B:** "Road surface has broken badly close to VIT Main Gate." (Category: `Roads & Transport`)
- **Model Score:** `0.8561` (Selected Thresholds: Duplicate=`0.85`, Related=`0.20`)
- **Physical Context:** Distance = **155m**, Time Difference = **2h**
- **Feature Breakdown:** Category=`0.60`, Geographic=`0.86`, Lexical=`0.22`, Semantic=`0.18`, Temporal=`1.00`
- **Directly Observed Evidence:** Observed score = 0.8561 against tuned decision thresholds (duplicate: 0.85, related: 0.20). True label is 'related' but model predicted 'duplicate'. Geographic distance between complaints is 155 meters. Submission timestamps differ by 2 hours. Complaint A category: 'Street Infrastructure', Complaint B category: 'Roads & Transport'. HISC scorer component affinities: Category=0.60, Geo=0.86, Lex=0.22, Sem=0.18, Time=1.00.
- **Likely Cause Hypothesis:** Spatial conflation without semantic discrimination: The complaints are physically co-located (< 150m apart), producing a spatial score above the duplicate threshold (0.85). Because B2 models only distance and lacks text or category features, it cannot differentiate adjacent related incidents from true duplicates.
- **Unmodeled Dimensions:** `lexical_similarity_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 15. Pair `P0178` [Actual: `related` $\rightarrow$ Predicted: `duplicate`]

- **Complaint A:** "The light pole near Tambaram Railway Station is damaged and the light is off." (Category: `Street Infrastructure`)
- **Complaint B:** "Large pothole reported near Tambaram Railway Station." (Category: `Roads & Transport`)
- **Model Score:** `0.8714` (Selected Thresholds: Duplicate=`0.85`, Related=`0.20`)
- **Physical Context:** Distance = **138m**, Time Difference = **295h**
- **Feature Breakdown:** Category=`0.60`, Geographic=`0.87`, Lexical=`0.33`, Semantic=`0.27`, Temporal=`0.66`
- **Directly Observed Evidence:** Observed score = 0.8714 against tuned decision thresholds (duplicate: 0.85, related: 0.20). True label is 'related' but model predicted 'duplicate'. Geographic distance between complaints is 138 meters. Submission timestamps differ by 295 hours. Complaint A category: 'Street Infrastructure', Complaint B category: 'Roads & Transport'. HISC scorer component affinities: Category=0.60, Geo=0.87, Lex=0.33, Sem=0.27, Time=0.66.
- **Likely Cause Hypothesis:** Spatial conflation without semantic discrimination: The complaints are physically co-located (< 150m apart), producing a spatial score above the duplicate threshold (0.85). Because B2 models only distance and lacks text or category features, it cannot differentiate adjacent related incidents from true duplicates.
- **Unmodeled Dimensions:** `lexical_similarity_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 16. Pair `P0197` [Actual: `related` $\rightarrow$ Predicted: `duplicate`]

- **Complaint A:** "Large pothole reported near Chromepet Bus Stand." (Category: `Roads & Transport`)
- **Complaint B:** "Water is overflowing from the drain at Chromepet Bus Stand." (Category: `Drainage & Flooding`)
- **Model Score:** `0.8842` (Selected Thresholds: Duplicate=`0.85`, Related=`0.20`)
- **Physical Context:** Distance = **123m**, Time Difference = **153h**
- **Feature Breakdown:** Category=`0.40`, Geographic=`0.88`, Lexical=`0.38`, Semantic=`0.30`, Temporal=`0.81`
- **Directly Observed Evidence:** Observed score = 0.8842 against tuned decision thresholds (duplicate: 0.85, related: 0.20). True label is 'related' but model predicted 'duplicate'. Geographic distance between complaints is 123 meters. Submission timestamps differ by 153 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=0.40, Geo=0.88, Lex=0.38, Sem=0.30, Time=0.81.
- **Likely Cause Hypothesis:** Spatial conflation without semantic discrimination: The complaints are physically co-located (< 150m apart), producing a spatial score above the duplicate threshold (0.85). Because B2 models only distance and lacks text or category features, it cannot differentiate adjacent related incidents from true duplicates.
- **Unmodeled Dimensions:** `lexical_similarity_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 17. Pair `P0236` [Actual: `related` $\rightarrow$ Predicted: `duplicate`]

- **Complaint A:** "Vehicles are struggling because of a pothole around Medavakkam Junction." (Category: `Roads & Transport`)
- **Complaint B:** "Blocked drainage is causing waterlogging around Medavakkam Junction." (Category: `Drainage & Flooding`)
- **Model Score:** `0.8614` (Selected Thresholds: Duplicate=`0.85`, Related=`0.20`)
- **Physical Context:** Distance = **149m**, Time Difference = **213h**
- **Feature Breakdown:** Category=`0.40`, Geographic=`0.86`, Lexical=`0.10`, Semantic=`0.09`, Temporal=`0.74`
- **Directly Observed Evidence:** Observed score = 0.8614 against tuned decision thresholds (duplicate: 0.85, related: 0.20). True label is 'related' but model predicted 'duplicate'. Geographic distance between complaints is 149 meters. Submission timestamps differ by 213 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=0.40, Geo=0.86, Lex=0.10, Sem=0.09, Time=0.74.
- **Likely Cause Hypothesis:** Spatial conflation without semantic discrimination: The complaints are physically co-located (< 150m apart), producing a spatial score above the duplicate threshold (0.85). Because B2 models only distance and lacks text or category features, it cannot differentiate adjacent related incidents from true duplicates.
- **Unmodeled Dimensions:** `lexical_similarity_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 18. Pair `P0244` [Actual: `related` $\rightarrow$ Predicted: `duplicate`]

- **Complaint A:** "Damaged section of road near VIT Main Gate needs repair." (Category: `Roads & Transport`)
- **Complaint B:** "The light pole near VIT Main Gate is damaged and the light is off." (Category: `Street Infrastructure`)
- **Model Score:** `0.9012` (Selected Thresholds: Duplicate=`0.85`, Related=`0.20`)
- **Physical Context:** Distance = **104m**, Time Difference = **333h**
- **Feature Breakdown:** Category=`0.60`, Geographic=`0.90`, Lexical=`0.50`, Semantic=`0.43`, Temporal=`0.63`
- **Directly Observed Evidence:** Observed score = 0.9012 against tuned decision thresholds (duplicate: 0.85, related: 0.20). True label is 'related' but model predicted 'duplicate'. Geographic distance between complaints is 104 meters. Submission timestamps differ by 333 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Street Infrastructure'. HISC scorer component affinities: Category=0.60, Geo=0.90, Lex=0.50, Sem=0.43, Time=0.63.
- **Likely Cause Hypothesis:** Spatial conflation without semantic discrimination: The complaints are physically co-located (< 150m apart), producing a spatial score above the duplicate threshold (0.85). Because B2 models only distance and lacks text or category features, it cannot differentiate adjacent related incidents from true duplicates.
- **Unmodeled Dimensions:** `lexical_similarity_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 19. Pair `P0258` [Actual: `related` $\rightarrow$ Predicted: `duplicate`]

- **Complaint A:** "Damaged section of road near VIT Main Gate needs repair." (Category: `Roads & Transport`)
- **Complaint B:** "The roadside drain is clogged near VIT Main Gate." (Category: `Drainage & Flooding`)
- **Model Score:** `0.9309` (Selected Thresholds: Duplicate=`0.85`, Related=`0.20`)
- **Physical Context:** Distance = **72m**, Time Difference = **130h**
- **Feature Breakdown:** Category=`0.40`, Geographic=`0.93`, Lexical=`0.33`, Semantic=`0.29`, Temporal=`0.83`
- **Directly Observed Evidence:** Observed score = 0.9309 against tuned decision thresholds (duplicate: 0.85, related: 0.20). True label is 'related' but model predicted 'duplicate'. Geographic distance between complaints is 72 meters. Submission timestamps differ by 130 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=0.40, Geo=0.93, Lex=0.33, Sem=0.29, Time=0.83.
- **Likely Cause Hypothesis:** Spatial conflation without semantic discrimination: The complaints are physically co-located (< 150m apart), producing a spatial score above the duplicate threshold (0.85). Because B2 models only distance and lacks text or category features, it cannot differentiate adjacent related incidents from true duplicates.
- **Unmodeled Dimensions:** `lexical_similarity_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

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
