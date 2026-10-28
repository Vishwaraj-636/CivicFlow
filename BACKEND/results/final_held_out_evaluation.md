# CivicFlow Research Evaluation — Final Held-Out Evaluation Freeze Report

> **Document Notice:** Generated deterministically by the final evaluation freeze pipeline. Evaluates all 11 frozen incident similarity methods on the held-out test split ($N = 80$) and synthetic challenge set ($N = 150$). This is the official, one-time post-tuning evaluation freeze.

## 1. Evaluation Protocol and Dataset Verification

- **Execution Timestamp:** `2026-10-11T08:42:59.084Z`
- **Git Commit Hash:** `327a4fcdbbda3f44492304871bbfbd3b8ab3c366`
- **Dataset SHA-256:** `b4653ac507f422a3b6f5ffadb291d5440eab0cb07174f2398ad72739e86a33f2`
- **Splits Manifest:** `splits.json` (Seed: `42`)
- **Partition Counts:** Train = 240, Val = 80, Held-out Test = **80**, Synthetic Challenge = **150**
- **Bootstrap Specification:** 1000 iterations, 95% empirical percentile confidence intervals, seed: 42
- **Embedding Model:** `Xenova/all-MiniLM-L6-v2` (384 dimensions, provider: `local`)

## 2. Frozen Method Roster & Decision Boundaries

| Method ID | Method Name | Architecture / Role | Selected Thresholds (Dup / Rel) | Weights / Parameters |
|---|---|---|:---:|---|
| **HISC** | HISC (Hierarchical Incident Stream Clustering) | `production_baseline` | `0.60` / `0.10` | C=0.2, G=0.25, L=0.1, S=0.3, T=0.15 |
| **B1_jaccard** | B1: Text Jaccard Similarity | `baseline` | `0.35` / `0.20` | Zero-shot / Fixed |
| **B2_distance** | B2: Distance-Only Similarity | `baseline` | `0.85` / `0.20` | Zero-shot / Fixed |
| **B3_cat_distance** | B3: Category Plus Distance | `baseline` | `0.90` / `0.35` | Zero-shot / Fixed |
| **B4_tfidf** | B4: TF-IDF Cosine Similarity | `baseline` | `0.40` / `0.20` | Zero-shot / Fixed |
| **B5_tfidf_distance** | B5: TF-IDF Cosine + Geographic Distance | `baseline` | `0.60` / `0.15` | Zero-shot / Fixed |
| **B6_embedding** | B6: Embedding Cosine Similarity Only | `embedding_baseline` | `0.70` / `0.35` | Zero-shot / Fixed |
| **HISC_embed** | HISC-embed (Embedding-Backed Semantic Affinity) | `embedding_variant` | `0.75` / `0.10` | C=0.2, G=0.25, L=0.1, S=0.3, T=0.15 |
| **HISC_hybrid_mean** | HISC-hybrid-mean (Mean of Dictionary & Embedding) | `embedding_variant` | `0.70` / `0.10` | C=0.2, G=0.25, L=0.1, S=0.3, T=0.15 |
| **HISC_hybrid_max** | HISC-hybrid-max (Maximum of Dictionary & Embedding) | `embedding_preferred_hybrid` | `0.75` / `0.10` | C=0.2, G=0.25, L=0.1, S=0.3, T=0.15 |
| **HISC_learned_weights** | HISC-learned-weights (Train-Learned Simplex Weights) | `experimental_candidate` | `0.60` / `0.10` | C=0, G=0.3, L=0, S=0.4, T=0.3 |

## 3. Held-Out Test Split Results (N = 80)

| Method ID | Method Name | Accuracy | Macro Prec | Macro Rec | Macro F1 | 95% Bootstrap CI (Macro F1) | Per-Class F1 (dup / rel / ind) |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **HISC** | HISC (Hierarchical Incident Stream Clustering) | 100.00% | 1.0000 | 1.0000 | **1.0000** | [1.0000, 1.0000] | 1.0000 / 1.0000 / 1.0000 |
| **B1_jaccard** | B1: Text Jaccard Similarity | 60.00% | 0.6012 | 0.5893 | **0.5722** | [0.4618, 0.6769] | 0.4737 / 0.5000 / 0.7429 |
| **B2_distance** | B2: Distance-Only Similarity | 80.00% | 0.8083 | 0.8016 | **0.7937** | [0.7016, 0.8768] | 0.7143 / 0.6667 / 1.0000 |
| **B3_cat_distance** | B3: Category Plus Distance | 100.00% | 1.0000 | 1.0000 | **1.0000** | [1.0000, 1.0000] | 1.0000 / 1.0000 / 1.0000 |
| **B4_tfidf** | B4: TF-IDF Cosine Similarity | 70.00% | 0.7062 | 0.6865 | **0.6851** | [0.5849, 0.7732] | 0.5000 / 0.6462 / 0.9091 |
| **B5_tfidf_distance** | B5: TF-IDF Cosine + Geographic Distance | 72.50% | 0.7393 | 0.7083 | **0.7044** | [0.6057, 0.7910] | 0.4737 / 0.6765 / 0.9630 |
| **B6_embedding** | B6: Embedding Cosine Similarity Only | 78.75% | 0.8089 | 0.7877 | **0.7923** | [0.6967, 0.8755] | 0.7755 / 0.7213 / 0.8800 |
| **HISC_embed** | HISC-embed (Embedding-Backed Semantic Affinity) | 100.00% | 1.0000 | 1.0000 | **1.0000** | [1.0000, 1.0000] | 1.0000 / 1.0000 / 1.0000 |
| **HISC_hybrid_mean** | HISC-hybrid-mean (Mean of Dictionary & Embedding) | 100.00% | 1.0000 | 1.0000 | **1.0000** | [1.0000, 1.0000] | 1.0000 / 1.0000 / 1.0000 |
| **HISC_hybrid_max** | HISC-hybrid-max (Maximum of Dictionary & Embedding) | 100.00% | 1.0000 | 1.0000 | **1.0000** | [1.0000, 1.0000] | 1.0000 / 1.0000 / 1.0000 |
| **HISC_learned_weights** | HISC-learned-weights (Train-Learned Simplex Weights) | 100.00% | 1.0000 | 1.0000 | **1.0000** | [1.0000, 1.0000] | 1.0000 / 1.0000 / 1.0000 |

## 4. Synthetic Challenge Set Results (N = 150)

| Method ID | Method Name | Accuracy | Macro Prec | Macro Rec | Macro F1 | 95% Bootstrap CI (Macro F1) | Indep Recall | Per-Class F1 (dup / rel / ind) |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **HISC** | HISC (Hierarchical Incident Stream Clustering) | 84.00% | 0.8330 | 0.8387 | **0.8343** | [0.7724, 0.8926] | 77.19% | 0.9524 / 0.7356 / 0.8148 |
| **B1_jaccard** | B1: Text Jaccard Similarity | 23.33% | 0.2215 | 0.2469 | **0.2296** | [0.1698, 0.2909] | 17.54% | 0.1064 / 0.3883 / 0.1942 |
| **B2_distance** | B2: Distance-Only Similarity | 48.67% | 0.4456 | 0.4678 | **0.3831** | [0.3239, 0.4389] | 40.35% | 0.5882 / 0.0000 / 0.5610 |
| **B3_cat_distance** | B3: Category Plus Distance | 56.67% | 0.7183 | 0.6027 | **0.4768** | [0.4208, 0.5288] | 1.75% | 0.8475 / 0.5484 / 0.0345 |
| **B4_tfidf** | B4: TF-IDF Cosine Similarity | 34.00% | 0.3364 | 0.3353 | **0.3153** | [0.2428, 0.3891] | 26.32% | 0.4234 / 0.2000 / 0.3226 |
| **B5_tfidf_distance** | B5: TF-IDF Cosine + Geographic Distance | 35.33% | 0.5416 | 0.3639 | **0.3259** | [0.2502, 0.3931] | 12.28% | 0.4733 / 0.2857 / 0.2188 |
| **B6_embedding** | B6: Embedding Cosine Similarity Only | 28.67% | 0.4538 | 0.3092 | **0.2661** | [0.1921, 0.3359] | 12.28% | 0.2062 / 0.3768 / 0.2154 |
| **HISC_embed** | HISC-embed (Embedding-Backed Semantic Affinity) | 80.00% | 0.8000 | 0.7995 | **0.7973** | [0.7335, 0.8587] | 75.44% | 0.9000 / 0.6882 / 0.8037 |
| **HISC_hybrid_mean** | HISC-hybrid-mean (Mean of Dictionary & Embedding) | 80.00% | 0.8000 | 0.7995 | **0.7973** | [0.7343, 0.8583] | 75.44% | 0.9000 / 0.6882 / 0.8037 |
| **HISC_hybrid_max** | HISC-hybrid-max (Maximum of Dictionary & Embedding) | 80.00% | 0.8000 | 0.7995 | **0.7973** | [0.7335, 0.8587] | 75.44% | 0.9000 / 0.6882 / 0.8037 |
| **HISC_learned_weights** | HISC-learned-weights (Train-Learned Simplex Weights) | 84.00% | 0.8330 | 0.8387 | **0.8343** | [0.7724, 0.8926] | 77.19% | 0.9524 / 0.7356 / 0.8148 |

## 5. Confusion Matrices

### HISC: HISC (Hierarchical Incident Stream Clustering)

**Test Split ($N = 80$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 24 | 0 | 0 |
| **Actual `related`** | 0 | 28 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

**Challenge Set ($N = 150$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 50 | 0 | 0 |
| **Actual `related`** | 4 | 32 | 7 |
| **Actual `independent`** | 1 | 12 | 44 |

### B1_jaccard: B1: Text Jaccard Similarity

**Test Split ($N = 80$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 9 | 10 | 5 |
| **Actual `related`** | 4 | 13 | 11 |
| **Actual `independent`** | 1 | 1 | 26 |

**Challenge Set ($N = 150$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 5 | 20 | 25 |
| **Actual `related`** | 12 | 20 | 11 |
| **Actual `independent`** | 27 | 20 | 10 |

### B2_distance: B2: Distance-Only Similarity

**Test Split ($N = 80$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 20 | 4 | 0 |
| **Actual `related`** | 12 | 16 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

**Challenge Set ($N = 150$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 50 | 0 | 0 |
| **Actual `related`** | 41 | 0 | 2 |
| **Actual `independent`** | 29 | 5 | 23 |

### B3_cat_distance: B3: Category Plus Distance

**Test Split ($N = 80$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 24 | 0 | 0 |
| **Actual `related`** | 0 | 28 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

**Challenge Set ($N = 150$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 50 | 0 | 0 |
| **Actual `related`** | 9 | 34 | 0 |
| **Actual `independent`** | 9 | 47 | 1 |

### B4_tfidf: B4: TF-IDF Cosine Similarity

**Test Split ($N = 80$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 10 | 14 | 0 |
| **Actual `related`** | 5 | 21 | 2 |
| **Actual `independent`** | 1 | 2 | 25 |

**Challenge Set ($N = 150$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 29 | 11 | 10 |
| **Actual `related`** | 25 | 7 | 11 |
| **Actual `independent`** | 33 | 9 | 15 |

### B5_tfidf_distance: B5: TF-IDF Cosine + Geographic Distance

**Test Split ($N = 80$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 9 | 15 | 0 |
| **Actual `related`** | 5 | 23 | 0 |
| **Actual `independent`** | 0 | 2 | 26 |

**Challenge Set ($N = 150$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 31 | 19 | 0 |
| **Actual `related`** | 28 | 15 | 0 |
| **Actual `independent`** | 22 | 28 | 7 |

### B6_embedding: B6: Embedding Cosine Similarity Only

**Test Split ($N = 80$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 19 | 5 | 0 |
| **Actual `related`** | 6 | 22 | 0 |
| **Actual `independent`** | 0 | 6 | 22 |

**Challenge Set ($N = 150$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 10 | 40 | 0 |
| **Actual `related`** | 16 | 26 | 1 |
| **Actual `independent`** | 21 | 29 | 7 |

### HISC_embed: HISC-embed (Embedding-Backed Semantic Affinity)

**Test Split ($N = 80$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 24 | 0 | 0 |
| **Actual `related`** | 0 | 28 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

**Challenge Set ($N = 150$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 45 | 5 | 0 |
| **Actual `related`** | 4 | 32 | 7 |
| **Actual `independent`** | 1 | 13 | 43 |

### HISC_hybrid_mean: HISC-hybrid-mean (Mean of Dictionary & Embedding)

**Test Split ($N = 80$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 24 | 0 | 0 |
| **Actual `related`** | 0 | 28 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

**Challenge Set ($N = 150$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 45 | 5 | 0 |
| **Actual `related`** | 4 | 32 | 7 |
| **Actual `independent`** | 1 | 13 | 43 |

### HISC_hybrid_max: HISC-hybrid-max (Maximum of Dictionary & Embedding)

**Test Split ($N = 80$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 24 | 0 | 0 |
| **Actual `related`** | 0 | 28 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

**Challenge Set ($N = 150$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 45 | 5 | 0 |
| **Actual `related`** | 4 | 32 | 7 |
| **Actual `independent`** | 1 | 13 | 43 |

### HISC_learned_weights: HISC-learned-weights (Train-Learned Simplex Weights)

**Test Split ($N = 80$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 24 | 0 | 0 |
| **Actual `related`** | 0 | 28 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

**Challenge Set ($N = 150$):**

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 50 | 0 | 0 |
| **Actual `related`** | 4 | 32 | 7 |
| **Actual `independent`** | 1 | 12 | 44 |

## 6. Synthetic Challenge Category Breakdown

| Challenge Category | N | HISC Acc | B1 Acc | B2 Acc | B3 Acc | B4 Acc | B5 Acc | B6 Acc | HISC-hybrid-max Acc |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `cross_infrastructure_cascade` | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| `spatial_boundary_edge` | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| `temporal_decay_edge` | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| `synonym_paraphrase` | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| `same_location_different_defect` | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| `co_occurring_independent` | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| `negation_and_false_lexical` | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| `multi_lingual_mixed` | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| `typo_and_ocr_noise` | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| `adversarial_distractor` | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |

## 7. Limitations, Parity Finding, and Conclusion

1. **Production Parity Enforcement:** All final predictions were generated strictly via the production pipeline (`scorePair.js` and `classifyIncidentScore`). The medium-severity discrepancy in the simplex optimization heuristic (`evaluateFastWeights`) was completely bypassed.
2. **Production Baseline Retention:** The hand-set HISC model remains the production baseline ($w_C=0.20, w_G=0.25, w_L=0.10, w_S=0.30, w_T=0.15$). The train-learned weights and local embedding variants are documented for research comparison.
3. **Empirical Generalization Gap:** The performance on the synthetic challenge set ($N = 150$) demonstrates the impact of adversarial noise, cross-infrastructure cascades, and negation on lexical and spatial baselines.
