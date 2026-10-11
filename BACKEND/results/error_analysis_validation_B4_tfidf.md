# CivicFlow Error Analysis — Validation Split: B4: TF-IDF Cosine Similarity (`B4_tfidf`)

## 1. Executive Summary & Evaluation Context

- **Method ID:** `B4_tfidf`
- **Method Name:** B4: TF-IDF Cosine Similarity
- **Formula:** S = Cosine(v_A, v_B) where term vectors v use smoothed IDF = ln((N+1)/(df+1)) + 1, fitted strictly on TRAIN texts.
- **Split:** `validation` ($N = 80$ pairs)
- **Source Evaluation Artifact:** `BACKEND/results/t1_validation_baseline_comparison.json`
- **Source Git Commit:** `040d2e78a3c87b8ad31924d0a6d4b2e6115c59eb`
- **Generation Timestamp:** `2026-10-11T06:46:41.780Z`
- **Selected Decision Thresholds:** Duplicate = `0.40`, Related = `0.20`
- **Validation Accuracy:** 77.50%
- **Validation Macro F1:** **0.7499**
- **Misclassified Pairs:** **18** out of 80 pairs (22.5% error rate)

> [!NOTE]
> **Protocol Compliance:** This error analysis was conducted strictly on the **Validation split** ($N = 80$). No held-out test pairs or synthetic challenge set pairs were evaluated.

## 2. Confusion Matrix & Per-Class Performance

**Per-Class Metrics:**

| Class | Support | Precision | Recall | F1 Score |
|---|:---:|:---:|:---:|:---:|
| `duplicate` | 24 | 1.0000 | 0.4167 | **0.5882** |
| `related` | 28 | 0.6410 | 0.8929 | **0.7463** |
| `independent` | 28 | 0.8710 | 0.9643 | **0.9153** |

**Confusion Matrix (Actual Rows \ Predicted Columns):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 10 | 13 | 1 |
| **Actual `related`** | 0 | 25 | 3 |
| **Actual `independent`** | 0 | 1 | 27 |

## 3. Detailed Misclassified Pairs Analysis

Total misclassified items: **18**

| Pair ID | True Label | Pred Label | Score | Distance | Time | Confusion Category |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `P0005` | `duplicate` | `related` | `0.2577` | 127m | 24h | `actual_duplicate_pred_related` |
| `P0015` | `duplicate` | `related` | `0.3176` | 26m | 21h | `actual_duplicate_pred_related` |
| `P0016` | `duplicate` | `related` | `0.2170` | 114m | 34h | `actual_duplicate_pred_related` |
| `P0017` | `duplicate` | `independent` | `0.1907` | 33m | 22h | `actual_duplicate_pred_independent` |
| `P0018` | `duplicate` | `related` | `0.3252` | 138m | 48h | `actual_duplicate_pred_related` |
| `P0020` | `duplicate` | `related` | `0.2377` | 21m | 2h | `actual_duplicate_pred_related` |
| `P0038` | `duplicate` | `related` | `0.2393` | 176m | 27h | `actual_duplicate_pred_related` |
| `P0039` | `duplicate` | `related` | `0.3709` | 101m | 53h | `actual_duplicate_pred_related` |
| `P0043` | `duplicate` | `related` | `0.3095` | 176m | 24h | `actual_duplicate_pred_related` |
| `P0046` | `duplicate` | `related` | `0.3204` | 160m | 4h | `actual_duplicate_pred_related` |
| `P0049` | `duplicate` | `related` | `0.2339` | 148m | 25h | `actual_duplicate_pred_related` |
| `P0057` | `duplicate` | `related` | `0.2769` | 168m | 28h | `actual_duplicate_pred_related` |
| `P0075` | `duplicate` | `related` | `0.3049` | 174m | 30h | `actual_duplicate_pred_related` |
| `P0109` | `duplicate` | `related` | `0.2758` | 209m | 44h | `actual_duplicate_pred_related` |
| `P0157` | `related` | `independent` | `0.1753` | 76m | 209h | `actual_related_pred_independent` |
| `P0215` | `related` | `independent` | `0.1990` | 187m | 116h | `actual_related_pred_independent` |
| `P0219` | `related` | `independent` | `0.1962` | 164m | 152h | `actual_related_pred_independent` |
| `P0381` | `independent` | `related` | `0.2084` | 10819m | 95h | `actual_independent_pred_related` |

### Itemized Evidence and Failure Hypotheses

#### 1. Pair `P0005` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Water is escaping onto the road from a damaged pipe at Medavakkam Junction." (Category: `Water & Utilities`)
- **Complaint B:** "Continuous water leakage reported close to Medavakkam Junction." (Category: `Water & Utilities`)
- **Model Score:** `0.2577` (Selected Thresholds: Duplicate=`0.40`, Related=`0.20`)
- **Physical Context:** Distance = **127m**, Time Difference = **24h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.88`, Lexical=`0.25`, Semantic=`0.22`, Temporal=`0.97`
- **Directly Observed Evidence:** Observed score = 0.2577 against tuned decision thresholds (duplicate: 0.40, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 127 meters. Submission timestamps differ by 24 hours. Complaint A category: 'Water & Utilities', Complaint B category: 'Water & Utilities'. HISC scorer component affinities: Category=1.00, Geo=0.88, Lex=0.25, Sem=0.22, Time=0.97.
- **Likely Cause Hypothesis:** TF-IDF sub-threshold overlap: Terms shared between complaints receive moderate TF-IDF weights, placing cosine similarity in the related range [0.20, 0.40) rather than reaching the duplicate threshold (0.40).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 2. Pair `P0015` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Water is leaking from a pipe near Medavakkam Junction." (Category: `Water & Utilities`)
- **Complaint B:** "Continuous water leakage reported close to Medavakkam Junction." (Category: `Water & Utilities`)
- **Model Score:** `0.3176` (Selected Thresholds: Duplicate=`0.40`, Related=`0.20`)
- **Physical Context:** Distance = **26m**, Time Difference = **21h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.97`, Lexical=`0.33`, Semantic=`0.43`, Temporal=`0.97`
- **Directly Observed Evidence:** Observed score = 0.3176 against tuned decision thresholds (duplicate: 0.40, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 26 meters. Submission timestamps differ by 21 hours. Complaint A category: 'Water & Utilities', Complaint B category: 'Water & Utilities'. HISC scorer component affinities: Category=1.00, Geo=0.97, Lex=0.33, Sem=0.43, Time=0.97.
- **Likely Cause Hypothesis:** TF-IDF sub-threshold overlap: Terms shared between complaints receive moderate TF-IDF weights, placing cosine similarity in the related range [0.20, 0.40) rather than reaching the duplicate threshold (0.40).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 3. Pair `P0016` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Garbage has been dumped near GST Road." (Category: `Waste & Cleanliness`)
- **Complaint B:** "The public bin is overflowing near GST Road." (Category: `Waste & Cleanliness`)
- **Model Score:** `0.2170` (Selected Thresholds: Duplicate=`0.40`, Related=`0.20`)
- **Physical Context:** Distance = **114m**, Time Difference = **34h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.89`, Lexical=`0.17`, Semantic=`0.33`, Temporal=`0.95`
- **Directly Observed Evidence:** Observed score = 0.2170 against tuned decision thresholds (duplicate: 0.40, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 114 meters. Submission timestamps differ by 34 hours. Complaint A category: 'Waste & Cleanliness', Complaint B category: 'Waste & Cleanliness'. HISC scorer component affinities: Category=1.00, Geo=0.89, Lex=0.17, Sem=0.33, Time=0.95.
- **Likely Cause Hypothesis:** TF-IDF sub-threshold overlap: Terms shared between complaints receive moderate TF-IDF weights, placing cosine similarity in the related range [0.20, 0.40) rather than reaching the duplicate threshold (0.40).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 4. Pair `P0017` [Actual: `duplicate` $\rightarrow$ Predicted: `independent`]

- **Complaint A:** "Uncollected waste is causing a cleanliness issue near GST Road." (Category: `Waste & Cleanliness`)
- **Complaint B:** "Garbage has been dumped near GST Road." (Category: `Waste & Cleanliness`)
- **Model Score:** `0.1907` (Selected Thresholds: Duplicate=`0.40`, Related=`0.20`)
- **Physical Context:** Distance = **33m**, Time Difference = **22h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.97`, Lexical=`0.14`, Semantic=`0.29`, Temporal=`0.97`
- **Directly Observed Evidence:** Observed score = 0.1907 against tuned decision thresholds (duplicate: 0.40, related: 0.20). True label is 'duplicate' but model predicted 'independent'. Geographic distance between complaints is 33 meters. Submission timestamps differ by 22 hours. Complaint A category: 'Waste & Cleanliness', Complaint B category: 'Waste & Cleanliness'. HISC scorer component affinities: Category=1.00, Geo=0.97, Lex=0.14, Sem=0.29, Time=0.97.
- **Likely Cause Hypothesis:** Vocabulary mismatch in train-fitted TF-IDF: Duplicate complaints utilize distinct synonyms not linked in the training vocabulary. Without semantic embeddings or geographic features, the cosine similarity between term vectors remains near zero.
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 5. Pair `P0018` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Road surface has broken badly close to Pallavaram Market." (Category: `Roads & Transport`)
- **Complaint B:** "Large pothole reported near Pallavaram Market." (Category: `Roads & Transport`)
- **Model Score:** `0.3252` (Selected Thresholds: Duplicate=`0.40`, Related=`0.20`)
- **Physical Context:** Distance = **138m**, Time Difference = **48h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.87`, Lexical=`0.17`, Semantic=`0.29`, Temporal=`0.94`
- **Directly Observed Evidence:** Observed score = 0.3252 against tuned decision thresholds (duplicate: 0.40, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 138 meters. Submission timestamps differ by 48 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Roads & Transport'. HISC scorer component affinities: Category=1.00, Geo=0.87, Lex=0.17, Sem=0.29, Time=0.94.
- **Likely Cause Hypothesis:** TF-IDF sub-threshold overlap: Terms shared between complaints receive moderate TF-IDF weights, placing cosine similarity in the related range [0.20, 0.40) rather than reaching the duplicate threshold (0.40).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 6. Pair `P0020` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "A large pile of rubbish is present at Velachery Main Road." (Category: `Waste & Cleanliness`)
- **Complaint B:** "The public bin is overflowing near Velachery Main Road." (Category: `Waste & Cleanliness`)
- **Model Score:** `0.2377` (Selected Thresholds: Duplicate=`0.40`, Related=`0.20`)
- **Physical Context:** Distance = **21m**, Time Difference = **2h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.98`, Lexical=`0.13`, Semantic=`0.22`, Temporal=`1.00`
- **Directly Observed Evidence:** Observed score = 0.2377 against tuned decision thresholds (duplicate: 0.40, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 21 meters. Submission timestamps differ by 2 hours. Complaint A category: 'Waste & Cleanliness', Complaint B category: 'Waste & Cleanliness'. HISC scorer component affinities: Category=1.00, Geo=0.98, Lex=0.13, Sem=0.22, Time=1.00.
- **Likely Cause Hypothesis:** TF-IDF sub-threshold overlap: Terms shared between complaints receive moderate TF-IDF weights, placing cosine similarity in the related range [0.20, 0.40) rather than reaching the duplicate threshold (0.40).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 7. Pair `P0038` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "A burst pipe is causing water loss near GST Road." (Category: `Water & Utilities`)
- **Complaint B:** "Continuous water leakage reported close to GST Road." (Category: `Water & Utilities`)
- **Model Score:** `0.2393` (Selected Thresholds: Duplicate=`0.40`, Related=`0.20`)
- **Physical Context:** Distance = **176m**, Time Difference = **27h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.84`, Lexical=`0.25`, Semantic=`0.33`, Temporal=`0.96`
- **Directly Observed Evidence:** Observed score = 0.2393 against tuned decision thresholds (duplicate: 0.40, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 176 meters. Submission timestamps differ by 27 hours. Complaint A category: 'Water & Utilities', Complaint B category: 'Water & Utilities'. HISC scorer component affinities: Category=1.00, Geo=0.84, Lex=0.25, Sem=0.33, Time=0.96.
- **Likely Cause Hypothesis:** TF-IDF sub-threshold overlap: Terms shared between complaints receive moderate TF-IDF weights, placing cosine similarity in the related range [0.20, 0.40) rather than reaching the duplicate threshold (0.40).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 8. Pair `P0039` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Water is leaking from a pipe near VIT Main Gate." (Category: `Water & Utilities`)
- **Complaint B:** "Continuous water leakage reported close to VIT Main Gate." (Category: `Water & Utilities`)
- **Model Score:** `0.3709` (Selected Thresholds: Duplicate=`0.40`, Related=`0.20`)
- **Physical Context:** Distance = **101m**, Time Difference = **53h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.90`, Lexical=`0.43`, Semantic=`0.50`, Temporal=`0.93`
- **Directly Observed Evidence:** Observed score = 0.3709 against tuned decision thresholds (duplicate: 0.40, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 101 meters. Submission timestamps differ by 53 hours. Complaint A category: 'Water & Utilities', Complaint B category: 'Water & Utilities'. HISC scorer component affinities: Category=1.00, Geo=0.90, Lex=0.43, Sem=0.50, Time=0.93.
- **Likely Cause Hypothesis:** TF-IDF sub-threshold overlap: Terms shared between complaints receive moderate TF-IDF weights, placing cosine similarity in the related range [0.20, 0.40) rather than reaching the duplicate threshold (0.40).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 9. Pair `P0043` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Waste is accumulating around Chromepet Bus Stand." (Category: `Waste & Cleanliness`)
- **Complaint B:** "A large pile of rubbish is present at Chromepet Bus Stand." (Category: `Waste & Cleanliness`)
- **Model Score:** `0.3095` (Selected Thresholds: Duplicate=`0.40`, Related=`0.20`)
- **Physical Context:** Distance = **176m**, Time Difference = **24h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.84`, Lexical=`0.33`, Semantic=`0.40`, Temporal=`0.97`
- **Directly Observed Evidence:** Observed score = 0.3095 against tuned decision thresholds (duplicate: 0.40, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 176 meters. Submission timestamps differ by 24 hours. Complaint A category: 'Waste & Cleanliness', Complaint B category: 'Waste & Cleanliness'. HISC scorer component affinities: Category=1.00, Geo=0.84, Lex=0.33, Sem=0.40, Time=0.97.
- **Likely Cause Hypothesis:** TF-IDF sub-threshold overlap: Terms shared between complaints receive moderate TF-IDF weights, placing cosine similarity in the related range [0.20, 0.40) rather than reaching the duplicate threshold (0.40).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 10. Pair `P0046` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Damaged section of road near Velachery Main Road needs repair." (Category: `Roads & Transport`)
- **Complaint B:** "Road surface has broken badly close to Velachery Main Road." (Category: `Roads & Transport`)
- **Model Score:** `0.3204` (Selected Thresholds: Duplicate=`0.40`, Related=`0.20`)
- **Physical Context:** Distance = **160m**, Time Difference = **4h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.85`, Lexical=`0.20`, Semantic=`0.17`, Temporal=`0.99`
- **Directly Observed Evidence:** Observed score = 0.3204 against tuned decision thresholds (duplicate: 0.40, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 160 meters. Submission timestamps differ by 4 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Roads & Transport'. HISC scorer component affinities: Category=1.00, Geo=0.85, Lex=0.20, Sem=0.17, Time=0.99.
- **Likely Cause Hypothesis:** TF-IDF sub-threshold overlap: Terms shared between complaints receive moderate TF-IDF weights, placing cosine similarity in the related range [0.20, 0.40) rather than reaching the duplicate threshold (0.40).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 11. Pair `P0049` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Water is overflowing from the drain at GST Road." (Category: `Drainage & Flooding`)
- **Complaint B:** "Blocked drainage is causing waterlogging around GST Road." (Category: `Drainage & Flooding`)
- **Model Score:** `0.2339` (Selected Thresholds: Duplicate=`0.40`, Related=`0.20`)
- **Physical Context:** Distance = **148m**, Time Difference = **25h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.86`, Lexical=`0.13`, Semantic=`0.25`, Temporal=`0.97`
- **Directly Observed Evidence:** Observed score = 0.2339 against tuned decision thresholds (duplicate: 0.40, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 148 meters. Submission timestamps differ by 25 hours. Complaint A category: 'Drainage & Flooding', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=1.00, Geo=0.86, Lex=0.13, Sem=0.25, Time=0.97.
- **Likely Cause Hypothesis:** TF-IDF sub-threshold overlap: Terms shared between complaints receive moderate TF-IDF weights, placing cosine similarity in the related range [0.20, 0.40) rather than reaching the duplicate threshold (0.40).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 12. Pair `P0057` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Deep road crater causing problems for vehicles at Sholinganallur Junction." (Category: `Roads & Transport`)
- **Complaint B:** "Vehicles are struggling because of a pothole around Sholinganallur Junction." (Category: `Roads & Transport`)
- **Model Score:** `0.2769` (Selected Thresholds: Duplicate=`0.40`, Related=`0.20`)
- **Physical Context:** Distance = **168m**, Time Difference = **28h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.85`, Lexical=`0.20`, Semantic=`0.27`, Temporal=`0.96`
- **Directly Observed Evidence:** Observed score = 0.2769 against tuned decision thresholds (duplicate: 0.40, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 168 meters. Submission timestamps differ by 28 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Roads & Transport'. HISC scorer component affinities: Category=1.00, Geo=0.85, Lex=0.20, Sem=0.27, Time=0.96.
- **Likely Cause Hypothesis:** TF-IDF sub-threshold overlap: Terms shared between complaints receive moderate TF-IDF weights, placing cosine similarity in the related range [0.20, 0.40) rather than reaching the duplicate threshold (0.40).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 13. Pair `P0075` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Blocked drainage is causing waterlogging around Velachery Main Road." (Category: `Drainage & Flooding`)
- **Complaint B:** "Water is overflowing from the drain at Velachery Main Road." (Category: `Drainage & Flooding`)
- **Model Score:** `0.3049` (Selected Thresholds: Duplicate=`0.40`, Related=`0.20`)
- **Physical Context:** Distance = **174m**, Time Difference = **30h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.84`, Lexical=`0.13`, Semantic=`0.25`, Temporal=`0.96`
- **Directly Observed Evidence:** Observed score = 0.3049 against tuned decision thresholds (duplicate: 0.40, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 174 meters. Submission timestamps differ by 30 hours. Complaint A category: 'Drainage & Flooding', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=1.00, Geo=0.84, Lex=0.13, Sem=0.25, Time=0.96.
- **Likely Cause Hypothesis:** TF-IDF sub-threshold overlap: Terms shared between complaints receive moderate TF-IDF weights, placing cosine similarity in the related range [0.20, 0.40) rather than reaching the duplicate threshold (0.40).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 14. Pair `P0109` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Large pothole reported near Sholinganallur Junction." (Category: `Roads & Transport`)
- **Complaint B:** "Road surface has broken badly close to Sholinganallur Junction." (Category: `Roads & Transport`)
- **Model Score:** `0.2758` (Selected Thresholds: Duplicate=`0.40`, Related=`0.20`)
- **Physical Context:** Distance = **209m**, Time Difference = **44h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.81`, Lexical=`0.17`, Semantic=`0.29`, Temporal=`0.94`
- **Directly Observed Evidence:** Observed score = 0.2758 against tuned decision thresholds (duplicate: 0.40, related: 0.20). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 209 meters. Submission timestamps differ by 44 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Roads & Transport'. HISC scorer component affinities: Category=1.00, Geo=0.81, Lex=0.17, Sem=0.29, Time=0.94.
- **Likely Cause Hypothesis:** TF-IDF sub-threshold overlap: Terms shared between complaints receive moderate TF-IDF weights, placing cosine similarity in the related range [0.20, 0.40) rather than reaching the duplicate threshold (0.40).
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 15. Pair `P0157` [Actual: `related` $\rightarrow$ Predicted: `independent`]

- **Complaint A:** "Deep road crater causing problems for vehicles at Medavakkam Junction." (Category: `Roads & Transport`)
- **Complaint B:** "Drain overflow reported close to Medavakkam Junction after rainfall." (Category: `Drainage & Flooding`)
- **Model Score:** `0.1753` (Selected Thresholds: Duplicate=`0.40`, Related=`0.20`)
- **Physical Context:** Distance = **76m**, Time Difference = **209h**
- **Feature Breakdown:** Category=`0.40`, Geographic=`0.93`, Lexical=`0.11`, Semantic=`0.09`, Temporal=`0.75`
- **Directly Observed Evidence:** Observed score = 0.1753 against tuned decision thresholds (duplicate: 0.40, related: 0.20). True label is 'related' but model predicted 'independent'. Geographic distance between complaints is 76 meters. Submission timestamps differ by 209 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=0.40, Geo=0.93, Lex=0.11, Sem=0.09, Time=0.75.
- **Likely Cause Hypothesis:** Semantic concept gap without embedding support: Related multi-department incidents do not share identical vocabulary in their short titles, resulting in near-zero term vector cosine similarity.
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 16. Pair `P0215` [Actual: `related` $\rightarrow$ Predicted: `independent`]

- **Complaint A:** "Road surface has broken badly close to Medavakkam Junction." (Category: `Roads & Transport`)
- **Complaint B:** "A faulty streetlight is causing poor visibility near Medavakkam Junction." (Category: `Street Infrastructure`)
- **Model Score:** `0.1990` (Selected Thresholds: Duplicate=`0.40`, Related=`0.20`)
- **Physical Context:** Distance = **187m**, Time Difference = **116h**
- **Feature Breakdown:** Category=`0.60`, Geographic=`0.83`, Lexical=`0.11`, Semantic=`0.10`, Temporal=`0.85`
- **Directly Observed Evidence:** Observed score = 0.1990 against tuned decision thresholds (duplicate: 0.40, related: 0.20). True label is 'related' but model predicted 'independent'. Geographic distance between complaints is 187 meters. Submission timestamps differ by 116 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Street Infrastructure'. HISC scorer component affinities: Category=0.60, Geo=0.83, Lex=0.11, Sem=0.10, Time=0.85.
- **Likely Cause Hypothesis:** Semantic concept gap without embedding support: Related multi-department incidents do not share identical vocabulary in their short titles, resulting in near-zero term vector cosine similarity.
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 17. Pair `P0219` [Actual: `related` $\rightarrow$ Predicted: `independent`]

- **Complaint A:** "Vehicles are struggling because of a pothole around Velachery Main Road." (Category: `Roads & Transport`)
- **Complaint B:** "Drain overflow reported close to Velachery Main Road after rainfall." (Category: `Drainage & Flooding`)
- **Model Score:** `0.1962` (Selected Thresholds: Duplicate=`0.40`, Related=`0.20`)
- **Physical Context:** Distance = **164m**, Time Difference = **152h**
- **Feature Breakdown:** Category=`0.40`, Geographic=`0.85`, Lexical=`0.11`, Semantic=`0.09`, Temporal=`0.81`
- **Directly Observed Evidence:** Observed score = 0.1962 against tuned decision thresholds (duplicate: 0.40, related: 0.20). True label is 'related' but model predicted 'independent'. Geographic distance between complaints is 164 meters. Submission timestamps differ by 152 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=0.40, Geo=0.85, Lex=0.11, Sem=0.09, Time=0.81.
- **Likely Cause Hypothesis:** Semantic concept gap without embedding support: Related multi-department incidents do not share identical vocabulary in their short titles, resulting in near-zero term vector cosine similarity.
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 18. Pair `P0381` [Actual: `independent` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Continuous water leakage reported close to Sholinganallur Junction." (Category: `Water & Utilities`)
- **Complaint B:** "Road surface has broken badly close to GST Road." (Category: `Roads & Transport`)
- **Model Score:** `0.2084` (Selected Thresholds: Duplicate=`0.40`, Related=`0.20`)
- **Physical Context:** Distance = **10819m**, Time Difference = **95h**
- **Feature Breakdown:** Category=`0.20`, Geographic=`0.00`, Lexical=`0.00`, Semantic=`0.00`, Temporal=`0.88`
- **Directly Observed Evidence:** Observed score = 0.2084 against tuned decision thresholds (duplicate: 0.40, related: 0.20). True label is 'independent' but model predicted 'related'. Geographic distance between complaints is 10819 meters. Submission timestamps differ by 95 hours. Complaint A category: 'Water & Utilities', Complaint B category: 'Roads & Transport'. HISC scorer component affinities: Category=0.20, Geo=0.00, Lex=0.00, Sem=0.00, Time=0.88.
- **Likely Cause Hypothesis:** High IDF common term coincidence: Two distant complaints happen to share a specific descriptive word that has high IDF weight in the training set, falsely boosting cosine similarity above 0.20.
- **Unmodeled Dimensions:** `geographic_distance_unmodeled, temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

## 4. Cross-Method Comparison of Recurring Error Patterns

Across all 6 evaluated methods on the identical 80-pair validation split, the error distributions reflect clear architectural trade-offs:

| Method ID | Method Name | Errors | Accuracy | Macro F1 | Primary Failure Pattern |
|---|---|:---:|:---:|:---:|---|
| **HISC** | HISC (Hierarchical Incident Stream Clustering) | **0** / 80 | 100.00% | **1.0000** | None (zero validation errors) |
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
