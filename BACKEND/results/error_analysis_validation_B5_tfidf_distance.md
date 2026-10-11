# CivicFlow Error Analysis — Validation Split: B5: TF-IDF Cosine + Geographic Distance (`B5_tfidf_distance`)

## 1. Executive Summary & Evaluation Context

- **Method ID:** `B5_tfidf_distance`
- **Method Name:** B5: TF-IDF Cosine + Geographic Distance
- **Formula:** S = 0.6 * S_tfidf + 0.4 * exp(-d / 1000). Fixed 60/40 convex combination formula.
- **Split:** `validation` ($N = 80$ pairs)
- **Source Evaluation Artifact:** `BACKEND/results/t1_validation_baseline_comparison.json`
- **Source Git Commit:** `040d2e78a3c87b8ad31924d0a6d4b2e6115c59eb`
- **Generation Timestamp:** `2026-10-11T06:46:41.794Z`
- **Selected Decision Thresholds:** Duplicate = `0.60`, Related = `0.15`
- **Validation Accuracy:** 82.50%
- **Validation Macro F1:** **0.7961**
- **Misclassified Pairs:** **14** out of 80 pairs (17.5% error rate)

> [!NOTE]
> **Protocol Compliance:** This error analysis was conducted strictly on the **Validation split** ($N = 80$). No held-out test pairs or synthetic challenge set pairs were evaluated.

## 2. Confusion Matrix & Per-Class Performance

**Per-Class Metrics:**

| Class | Support | Precision | Recall | F1 Score |
|---|:---:|:---:|:---:|:---:|
| `duplicate` | 24 | 1.0000 | 0.4167 | **0.5882** |
| `related` | 28 | 0.6667 | 1.0000 | **0.8000** |
| `independent` | 28 | 1.0000 | 1.0000 | **1.0000** |

**Confusion Matrix (Actual Rows \ Predicted Columns):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 10 | 14 | 0 |
| **Actual `related`** | 0 | 28 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

## 3. Detailed Misclassified Pairs Analysis

Total misclassified items: **14**

| Pair ID | True Label | Pred Label | Score | Distance | Time | Confusion Category |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `P0005` | `duplicate` | `related` | `0.5070` | 127m | 24h | `actual_duplicate_pred_related` |
| `P0015` | `duplicate` | `related` | `0.5801` | 26m | 21h | `actual_duplicate_pred_related` |
| `P0016` | `duplicate` | `related` | `0.4871` | 114m | 34h | `actual_duplicate_pred_related` |
| `P0017` | `duplicate` | `related` | `0.5014` | 33m | 22h | `actual_duplicate_pred_related` |
| `P0018` | `duplicate` | `related` | `0.5434` | 138m | 48h | `actual_duplicate_pred_related` |
| `P0020` | `duplicate` | `related` | `0.5341` | 21m | 2h | `actual_duplicate_pred_related` |
| `P0038` | `duplicate` | `related` | `0.4790` | 176m | 27h | `actual_duplicate_pred_related` |
| `P0039` | `duplicate` | `related` | `0.5841` | 101m | 53h | `actual_duplicate_pred_related` |
| `P0043` | `duplicate` | `related` | `0.5211` | 176m | 24h | `actual_duplicate_pred_related` |
| `P0046` | `duplicate` | `related` | `0.5331` | 160m | 4h | `actual_duplicate_pred_related` |
| `P0049` | `duplicate` | `related` | `0.4854` | 148m | 25h | `actual_duplicate_pred_related` |
| `P0057` | `duplicate` | `related` | `0.5042` | 168m | 28h | `actual_duplicate_pred_related` |
| `P0075` | `duplicate` | `related` | `0.5191` | 174m | 30h | `actual_duplicate_pred_related` |
| `P0109` | `duplicate` | `related` | `0.4901` | 209m | 44h | `actual_duplicate_pred_related` |

### Itemized Evidence and Failure Hypotheses

#### 1. Pair `P0005` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Water is escaping onto the road from a damaged pipe at Medavakkam Junction." (Category: `Water & Utilities`)
- **Complaint B:** "Continuous water leakage reported close to Medavakkam Junction." (Category: `Water & Utilities`)
- **Model Score:** `0.5070` (Selected Thresholds: Duplicate=`0.60`, Related=`0.15`)
- **Physical Context:** Distance = **127m**, Time Difference = **24h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.88`, Lexical=`0.25`, Semantic=`0.22`, Temporal=`0.97`
- **Directly Observed Evidence:** Observed score = 0.5070 against tuned decision thresholds (duplicate: 0.60, related: 0.15). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 127 meters. Submission timestamps differ by 24 hours. Complaint A category: 'Water & Utilities', Complaint B category: 'Water & Utilities'. HISC scorer component affinities: Category=1.00, Geo=0.88, Lex=0.25, Sem=0.22, Time=0.97.
- **Likely Cause Hypothesis:** Convex combination dilution / threshold conservatism: Spatial proximity is high (distance < 200m), providing a strong distance component (0.4 * exp(-d/1000) ≈ 0.33), but modest TF-IDF score (0.6 * S_tfidf < 0.27) keeps the combined affinity below the duplicate threshold (0.60), classifying the pair as related.
- **Unmodeled Dimensions:** `temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 2. Pair `P0015` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Water is leaking from a pipe near Medavakkam Junction." (Category: `Water & Utilities`)
- **Complaint B:** "Continuous water leakage reported close to Medavakkam Junction." (Category: `Water & Utilities`)
- **Model Score:** `0.5801` (Selected Thresholds: Duplicate=`0.60`, Related=`0.15`)
- **Physical Context:** Distance = **26m**, Time Difference = **21h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.97`, Lexical=`0.33`, Semantic=`0.43`, Temporal=`0.97`
- **Directly Observed Evidence:** Observed score = 0.5801 against tuned decision thresholds (duplicate: 0.60, related: 0.15). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 26 meters. Submission timestamps differ by 21 hours. Complaint A category: 'Water & Utilities', Complaint B category: 'Water & Utilities'. HISC scorer component affinities: Category=1.00, Geo=0.97, Lex=0.33, Sem=0.43, Time=0.97.
- **Likely Cause Hypothesis:** Convex combination dilution / threshold conservatism: Spatial proximity is high (distance < 200m), providing a strong distance component (0.4 * exp(-d/1000) ≈ 0.33), but modest TF-IDF score (0.6 * S_tfidf < 0.27) keeps the combined affinity below the duplicate threshold (0.60), classifying the pair as related.
- **Unmodeled Dimensions:** `temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 3. Pair `P0016` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Garbage has been dumped near GST Road." (Category: `Waste & Cleanliness`)
- **Complaint B:** "The public bin is overflowing near GST Road." (Category: `Waste & Cleanliness`)
- **Model Score:** `0.4871` (Selected Thresholds: Duplicate=`0.60`, Related=`0.15`)
- **Physical Context:** Distance = **114m**, Time Difference = **34h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.89`, Lexical=`0.17`, Semantic=`0.33`, Temporal=`0.95`
- **Directly Observed Evidence:** Observed score = 0.4871 against tuned decision thresholds (duplicate: 0.60, related: 0.15). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 114 meters. Submission timestamps differ by 34 hours. Complaint A category: 'Waste & Cleanliness', Complaint B category: 'Waste & Cleanliness'. HISC scorer component affinities: Category=1.00, Geo=0.89, Lex=0.17, Sem=0.33, Time=0.95.
- **Likely Cause Hypothesis:** Convex combination dilution / threshold conservatism: Spatial proximity is high (distance < 200m), providing a strong distance component (0.4 * exp(-d/1000) ≈ 0.33), but modest TF-IDF score (0.6 * S_tfidf < 0.27) keeps the combined affinity below the duplicate threshold (0.60), classifying the pair as related.
- **Unmodeled Dimensions:** `temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 4. Pair `P0017` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Uncollected waste is causing a cleanliness issue near GST Road." (Category: `Waste & Cleanliness`)
- **Complaint B:** "Garbage has been dumped near GST Road." (Category: `Waste & Cleanliness`)
- **Model Score:** `0.5014` (Selected Thresholds: Duplicate=`0.60`, Related=`0.15`)
- **Physical Context:** Distance = **33m**, Time Difference = **22h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.97`, Lexical=`0.14`, Semantic=`0.29`, Temporal=`0.97`
- **Directly Observed Evidence:** Observed score = 0.5014 against tuned decision thresholds (duplicate: 0.60, related: 0.15). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 33 meters. Submission timestamps differ by 22 hours. Complaint A category: 'Waste & Cleanliness', Complaint B category: 'Waste & Cleanliness'. HISC scorer component affinities: Category=1.00, Geo=0.97, Lex=0.14, Sem=0.29, Time=0.97.
- **Likely Cause Hypothesis:** Convex combination dilution / threshold conservatism: Spatial proximity is high (distance < 200m), providing a strong distance component (0.4 * exp(-d/1000) ≈ 0.33), but modest TF-IDF score (0.6 * S_tfidf < 0.27) keeps the combined affinity below the duplicate threshold (0.60), classifying the pair as related.
- **Unmodeled Dimensions:** `temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 5. Pair `P0018` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Road surface has broken badly close to Pallavaram Market." (Category: `Roads & Transport`)
- **Complaint B:** "Large pothole reported near Pallavaram Market." (Category: `Roads & Transport`)
- **Model Score:** `0.5434` (Selected Thresholds: Duplicate=`0.60`, Related=`0.15`)
- **Physical Context:** Distance = **138m**, Time Difference = **48h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.87`, Lexical=`0.17`, Semantic=`0.29`, Temporal=`0.94`
- **Directly Observed Evidence:** Observed score = 0.5434 against tuned decision thresholds (duplicate: 0.60, related: 0.15). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 138 meters. Submission timestamps differ by 48 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Roads & Transport'. HISC scorer component affinities: Category=1.00, Geo=0.87, Lex=0.17, Sem=0.29, Time=0.94.
- **Likely Cause Hypothesis:** Convex combination dilution / threshold conservatism: Spatial proximity is high (distance < 200m), providing a strong distance component (0.4 * exp(-d/1000) ≈ 0.33), but modest TF-IDF score (0.6 * S_tfidf < 0.27) keeps the combined affinity below the duplicate threshold (0.60), classifying the pair as related.
- **Unmodeled Dimensions:** `temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 6. Pair `P0020` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "A large pile of rubbish is present at Velachery Main Road." (Category: `Waste & Cleanliness`)
- **Complaint B:** "The public bin is overflowing near Velachery Main Road." (Category: `Waste & Cleanliness`)
- **Model Score:** `0.5341` (Selected Thresholds: Duplicate=`0.60`, Related=`0.15`)
- **Physical Context:** Distance = **21m**, Time Difference = **2h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.98`, Lexical=`0.13`, Semantic=`0.22`, Temporal=`1.00`
- **Directly Observed Evidence:** Observed score = 0.5341 against tuned decision thresholds (duplicate: 0.60, related: 0.15). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 21 meters. Submission timestamps differ by 2 hours. Complaint A category: 'Waste & Cleanliness', Complaint B category: 'Waste & Cleanliness'. HISC scorer component affinities: Category=1.00, Geo=0.98, Lex=0.13, Sem=0.22, Time=1.00.
- **Likely Cause Hypothesis:** Convex combination dilution / threshold conservatism: Spatial proximity is high (distance < 200m), providing a strong distance component (0.4 * exp(-d/1000) ≈ 0.33), but modest TF-IDF score (0.6 * S_tfidf < 0.27) keeps the combined affinity below the duplicate threshold (0.60), classifying the pair as related.
- **Unmodeled Dimensions:** `temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 7. Pair `P0038` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "A burst pipe is causing water loss near GST Road." (Category: `Water & Utilities`)
- **Complaint B:** "Continuous water leakage reported close to GST Road." (Category: `Water & Utilities`)
- **Model Score:** `0.4790` (Selected Thresholds: Duplicate=`0.60`, Related=`0.15`)
- **Physical Context:** Distance = **176m**, Time Difference = **27h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.84`, Lexical=`0.25`, Semantic=`0.33`, Temporal=`0.96`
- **Directly Observed Evidence:** Observed score = 0.4790 against tuned decision thresholds (duplicate: 0.60, related: 0.15). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 176 meters. Submission timestamps differ by 27 hours. Complaint A category: 'Water & Utilities', Complaint B category: 'Water & Utilities'. HISC scorer component affinities: Category=1.00, Geo=0.84, Lex=0.25, Sem=0.33, Time=0.96.
- **Likely Cause Hypothesis:** Convex combination dilution / threshold conservatism: Spatial proximity is high (distance < 200m), providing a strong distance component (0.4 * exp(-d/1000) ≈ 0.33), but modest TF-IDF score (0.6 * S_tfidf < 0.27) keeps the combined affinity below the duplicate threshold (0.60), classifying the pair as related.
- **Unmodeled Dimensions:** `temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 8. Pair `P0039` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Water is leaking from a pipe near VIT Main Gate." (Category: `Water & Utilities`)
- **Complaint B:** "Continuous water leakage reported close to VIT Main Gate." (Category: `Water & Utilities`)
- **Model Score:** `0.5841` (Selected Thresholds: Duplicate=`0.60`, Related=`0.15`)
- **Physical Context:** Distance = **101m**, Time Difference = **53h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.90`, Lexical=`0.43`, Semantic=`0.50`, Temporal=`0.93`
- **Directly Observed Evidence:** Observed score = 0.5841 against tuned decision thresholds (duplicate: 0.60, related: 0.15). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 101 meters. Submission timestamps differ by 53 hours. Complaint A category: 'Water & Utilities', Complaint B category: 'Water & Utilities'. HISC scorer component affinities: Category=1.00, Geo=0.90, Lex=0.43, Sem=0.50, Time=0.93.
- **Likely Cause Hypothesis:** Convex combination dilution / threshold conservatism: Spatial proximity is high (distance < 200m), providing a strong distance component (0.4 * exp(-d/1000) ≈ 0.33), but modest TF-IDF score (0.6 * S_tfidf < 0.27) keeps the combined affinity below the duplicate threshold (0.60), classifying the pair as related.
- **Unmodeled Dimensions:** `temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 9. Pair `P0043` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Waste is accumulating around Chromepet Bus Stand." (Category: `Waste & Cleanliness`)
- **Complaint B:** "A large pile of rubbish is present at Chromepet Bus Stand." (Category: `Waste & Cleanliness`)
- **Model Score:** `0.5211` (Selected Thresholds: Duplicate=`0.60`, Related=`0.15`)
- **Physical Context:** Distance = **176m**, Time Difference = **24h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.84`, Lexical=`0.33`, Semantic=`0.40`, Temporal=`0.97`
- **Directly Observed Evidence:** Observed score = 0.5211 against tuned decision thresholds (duplicate: 0.60, related: 0.15). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 176 meters. Submission timestamps differ by 24 hours. Complaint A category: 'Waste & Cleanliness', Complaint B category: 'Waste & Cleanliness'. HISC scorer component affinities: Category=1.00, Geo=0.84, Lex=0.33, Sem=0.40, Time=0.97.
- **Likely Cause Hypothesis:** Convex combination dilution / threshold conservatism: Spatial proximity is high (distance < 200m), providing a strong distance component (0.4 * exp(-d/1000) ≈ 0.33), but modest TF-IDF score (0.6 * S_tfidf < 0.27) keeps the combined affinity below the duplicate threshold (0.60), classifying the pair as related.
- **Unmodeled Dimensions:** `temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 10. Pair `P0046` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Damaged section of road near Velachery Main Road needs repair." (Category: `Roads & Transport`)
- **Complaint B:** "Road surface has broken badly close to Velachery Main Road." (Category: `Roads & Transport`)
- **Model Score:** `0.5331` (Selected Thresholds: Duplicate=`0.60`, Related=`0.15`)
- **Physical Context:** Distance = **160m**, Time Difference = **4h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.85`, Lexical=`0.20`, Semantic=`0.17`, Temporal=`0.99`
- **Directly Observed Evidence:** Observed score = 0.5331 against tuned decision thresholds (duplicate: 0.60, related: 0.15). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 160 meters. Submission timestamps differ by 4 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Roads & Transport'. HISC scorer component affinities: Category=1.00, Geo=0.85, Lex=0.20, Sem=0.17, Time=0.99.
- **Likely Cause Hypothesis:** Convex combination dilution / threshold conservatism: Spatial proximity is high (distance < 200m), providing a strong distance component (0.4 * exp(-d/1000) ≈ 0.33), but modest TF-IDF score (0.6 * S_tfidf < 0.27) keeps the combined affinity below the duplicate threshold (0.60), classifying the pair as related.
- **Unmodeled Dimensions:** `temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 11. Pair `P0049` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Water is overflowing from the drain at GST Road." (Category: `Drainage & Flooding`)
- **Complaint B:** "Blocked drainage is causing waterlogging around GST Road." (Category: `Drainage & Flooding`)
- **Model Score:** `0.4854` (Selected Thresholds: Duplicate=`0.60`, Related=`0.15`)
- **Physical Context:** Distance = **148m**, Time Difference = **25h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.86`, Lexical=`0.13`, Semantic=`0.25`, Temporal=`0.97`
- **Directly Observed Evidence:** Observed score = 0.4854 against tuned decision thresholds (duplicate: 0.60, related: 0.15). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 148 meters. Submission timestamps differ by 25 hours. Complaint A category: 'Drainage & Flooding', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=1.00, Geo=0.86, Lex=0.13, Sem=0.25, Time=0.97.
- **Likely Cause Hypothesis:** Convex combination dilution / threshold conservatism: Spatial proximity is high (distance < 200m), providing a strong distance component (0.4 * exp(-d/1000) ≈ 0.33), but modest TF-IDF score (0.6 * S_tfidf < 0.27) keeps the combined affinity below the duplicate threshold (0.60), classifying the pair as related.
- **Unmodeled Dimensions:** `temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 12. Pair `P0057` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Deep road crater causing problems for vehicles at Sholinganallur Junction." (Category: `Roads & Transport`)
- **Complaint B:** "Vehicles are struggling because of a pothole around Sholinganallur Junction." (Category: `Roads & Transport`)
- **Model Score:** `0.5042` (Selected Thresholds: Duplicate=`0.60`, Related=`0.15`)
- **Physical Context:** Distance = **168m**, Time Difference = **28h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.85`, Lexical=`0.20`, Semantic=`0.27`, Temporal=`0.96`
- **Directly Observed Evidence:** Observed score = 0.5042 against tuned decision thresholds (duplicate: 0.60, related: 0.15). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 168 meters. Submission timestamps differ by 28 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Roads & Transport'. HISC scorer component affinities: Category=1.00, Geo=0.85, Lex=0.20, Sem=0.27, Time=0.96.
- **Likely Cause Hypothesis:** Convex combination dilution / threshold conservatism: Spatial proximity is high (distance < 200m), providing a strong distance component (0.4 * exp(-d/1000) ≈ 0.33), but modest TF-IDF score (0.6 * S_tfidf < 0.27) keeps the combined affinity below the duplicate threshold (0.60), classifying the pair as related.
- **Unmodeled Dimensions:** `temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 13. Pair `P0075` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Blocked drainage is causing waterlogging around Velachery Main Road." (Category: `Drainage & Flooding`)
- **Complaint B:** "Water is overflowing from the drain at Velachery Main Road." (Category: `Drainage & Flooding`)
- **Model Score:** `0.5191` (Selected Thresholds: Duplicate=`0.60`, Related=`0.15`)
- **Physical Context:** Distance = **174m**, Time Difference = **30h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.84`, Lexical=`0.13`, Semantic=`0.25`, Temporal=`0.96`
- **Directly Observed Evidence:** Observed score = 0.5191 against tuned decision thresholds (duplicate: 0.60, related: 0.15). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 174 meters. Submission timestamps differ by 30 hours. Complaint A category: 'Drainage & Flooding', Complaint B category: 'Drainage & Flooding'. HISC scorer component affinities: Category=1.00, Geo=0.84, Lex=0.13, Sem=0.25, Time=0.96.
- **Likely Cause Hypothesis:** Convex combination dilution / threshold conservatism: Spatial proximity is high (distance < 200m), providing a strong distance component (0.4 * exp(-d/1000) ≈ 0.33), but modest TF-IDF score (0.6 * S_tfidf < 0.27) keeps the combined affinity below the duplicate threshold (0.60), classifying the pair as related.
- **Unmodeled Dimensions:** `temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

#### 14. Pair `P0109` [Actual: `duplicate` $\rightarrow$ Predicted: `related`]

- **Complaint A:** "Large pothole reported near Sholinganallur Junction." (Category: `Roads & Transport`)
- **Complaint B:** "Road surface has broken badly close to Sholinganallur Junction." (Category: `Roads & Transport`)
- **Model Score:** `0.4901` (Selected Thresholds: Duplicate=`0.60`, Related=`0.15`)
- **Physical Context:** Distance = **209m**, Time Difference = **44h**
- **Feature Breakdown:** Category=`1.00`, Geographic=`0.81`, Lexical=`0.17`, Semantic=`0.29`, Temporal=`0.94`
- **Directly Observed Evidence:** Observed score = 0.4901 against tuned decision thresholds (duplicate: 0.60, related: 0.15). True label is 'duplicate' but model predicted 'related'. Geographic distance between complaints is 209 meters. Submission timestamps differ by 44 hours. Complaint A category: 'Roads & Transport', Complaint B category: 'Roads & Transport'. HISC scorer component affinities: Category=1.00, Geo=0.81, Lex=0.17, Sem=0.29, Time=0.94.
- **Likely Cause Hypothesis:** Convex combination dilution / threshold conservatism: Spatial proximity is high (distance < 200m), providing a strong distance component (0.4 * exp(-d/1000) ≈ 0.33), but modest TF-IDF score (0.6 * S_tfidf < 0.27) keeps the combined affinity below the duplicate threshold (0.60), classifying the pair as related.
- **Unmodeled Dimensions:** `temporal_proximity_unmodeled, category_compatibility_unmodeled, semantic_expansion_embeddings_unmodeled`

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
