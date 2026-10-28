# CivicFlow Research Evaluation — T2: Local Embedding Validation Comparison

> **Document Notice:** Generated deterministically by the T2 evaluation pipeline. Compares local sentence embedding models against HISC and T1 baselines strictly on the validation set ($N = 80$).

## 1. Embedding Model & Execution Setup

- **Model ID:** `Xenova/all-MiniLM-L6-v2`
- **Vector Dimension:** `384`
- **Quantization:** `true (int8/quantized)`
- **Execution Mode:** Local in-process inference via `@huggingface/transformers`
- **Provider Config:** `EMBEDDING_PROVIDER=local`
- **Model Loaded Successfully:** `true`
- **Cache Location:** `BACKEND/data/embeddings.json`
- **Cache Statistics:** `115 hits, 0 misses, 225 cached vectors`

## 2. Experimental Embedding Methods Evaluated

| Method ID | Method Name | Architecture & Formula | Validation Tuning Status | Selected Thresholds (Dup / Rel) |
|---|---|---|---|:---:|
| **B6_embedding** | B6: Embedding Cosine Similarity Only | `S = Cosine(e_A, e_B) using Xenova/all-MiniLM-L6-v2 normalized mean-pooled vectors.` | Zero-shot neural semantic baseline; decision thresholds tuned strictly on validation. | `0.70` / `0.35` |
| **HISC_embed** | HISC-embed (Embedding-Backed Semantic Affinity) | `Weighted multi-attribute affinity: S = 0.20*Cat + 0.25*Geo + 0.10*Lex + 0.30*S_embed + 0.15*Time with contextual rules.` | Replaces lexical/synonym semantic component with embedding cosine; hand-fixed domain weights preserved. | `0.75` / `0.10` |
| **HISC_hybrid_mean** | HISC-hybrid-mean (Mean of Dictionary & Embedding) | `S_sem = 0.5 * S_dictionary + 0.5 * S_embedding in HISC multi-attribute scorer.` | Convex average of synonym-dictionary and neural embedding semantic affinities. | `0.70` / `0.10` |
| **HISC_hybrid_max** | HISC-hybrid-max (Maximum of Dictionary & Embedding) | `S_sem = max(S_dictionary, S_embedding) in HISC multi-attribute scorer.` | Maximum affinity selector uniting synonym coverage and semantic representation. | `0.75` / `0.10` |

## 3. Validation Comparison Table (N = 80)

| Method ID | Method Name | Thresholds | Accuracy | Macro Prec | Macro Rec | Macro F1 | Per-Class F1 (dup / rel / ind) | Fallback Used |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **B6_embedding** | B6: Embedding Cosine Similarity Only | `0.70` / `0.35` | 92.50% | 0.9313 | 0.9187 | **0.9212** | 0.8636 / 0.9000 / 1.0000 | `false` |
| **HISC_embed** | HISC-embed (Embedding-Backed Semantic Affinity) | `0.75` / `0.10` | 100.00% | 1.0000 | 1.0000 | **1.0000** | 1.0000 / 1.0000 / 1.0000 | `false` |
| **HISC_hybrid_mean** | HISC-hybrid-mean (Mean of Dictionary & Embedding) | `0.70` / `0.10` | 100.00% | 1.0000 | 1.0000 | **1.0000** | 1.0000 / 1.0000 / 1.0000 | `false` |
| **HISC_hybrid_max** | HISC-hybrid-max (Maximum of Dictionary & Embedding) | `0.75` / `0.10` | 100.00% | 1.0000 | 1.0000 | **1.0000** | 1.0000 / 1.0000 / 1.0000 | `false` |

### Comparison with T1 Baseline Roster

| Method Category | Method ID | Method Name | Validation Macro F1 | Validation Accuracy |
|---|---|---|:---:|:---:|
| T1 Baseline | **HISC** | HISC (Hybrid Incident Similarity and Clustering) | **1.0000** | 100.00% |
| T1 Baseline | **B1_jaccard** | B1: Text Jaccard Similarity | **0.6792** | 70.00% |
| T1 Baseline | **B2_distance** | B2: Distance-Only Similarity | **0.7563** | 76.25% |
| T1 Baseline | **B3_cat_distance** | B3: Category Plus Distance | **1.0000** | 100.00% |
| T1 Baseline | **B4_tfidf** | B4: TF-IDF Cosine Similarity | **0.7499** | 77.50% |
| T1 Baseline | **B5_tfidf_distance** | B5: TF-IDF Cosine + Geographic Distance | **0.7961** | 82.50% |
| T2 Embedding | **B6_embedding** | B6: Embedding Cosine Similarity Only | **0.9212** | 92.50% |
| T2 Embedding | **HISC_embed** | HISC-embed (Embedding-Backed Semantic Affinity) | **1.0000** | 100.00% |
| T2 Embedding | **HISC_hybrid_mean** | HISC-hybrid-mean (Mean of Dictionary & Embedding) | **1.0000** | 100.00% |
| T2 Embedding | **HISC_hybrid_max** | HISC-hybrid-max (Maximum of Dictionary & Embedding) | **1.0000** | 100.00% |

## 4. Hybrid Candidate Selection (HISC-hybrid-mean vs HISC-hybrid-max)

- **Candidate A (Mean):** `S_sem = 0.5 * S_dictionary + 0.5 * S_embedding in HISC multi-attribute scorer.` -> Macro F1 = `1.0000` (thresholds: `0.7 / 0.1`, margin: `0.60`)
- **Candidate B (Max):** `S_sem = max(S_dictionary, S_embedding) in HISC multi-attribute scorer.` -> Macro F1 = `1.0000` (thresholds: `0.75 / 0.1`, margin: `0.65`)
- **Tie-Break Protocol:** `1. Highest validation macro F1 -> 2. Highest overall accuracy -> 3. Highest duplicate F1 -> 4. Highest related F1 -> 5. Highest threshold margin (dt - rt) -> 6. Descending (dt, rt) lexicographical order.`
- **Preferred Hybrid Candidate:** **`HISC_hybrid_max`** (Both candidates achieved 1.0000 Macro F1 and 1.0000 Accuracy; HISC_hybrid_max selected via Rule 5 (larger threshold margin: 0.65 vs 0.60).)

## 5. Confusion Matrices for Embedding Methods

#### B6_embedding: B6: Embedding Cosine Similarity Only

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 19 | 5 | 0 |
| **Actual `related`** | 1 | 27 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

#### HISC_embed: HISC-embed (Embedding-Backed Semantic Affinity)

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 24 | 0 | 0 |
| **Actual `related`** | 0 | 28 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

#### HISC_hybrid_mean: HISC-hybrid-mean (Mean of Dictionary & Embedding)

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 24 | 0 | 0 |
| **Actual `related`** | 0 | 28 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

#### HISC_hybrid_max: HISC-hybrid-max (Maximum of Dictionary & Embedding)

| Actual \ Predicted | Pred `duplicate` | Pred `related` | Pred `independent` |
|---|:---:|:---:|:---:|
| **Actual `duplicate`** | 24 | 0 | 0 |
| **Actual `related`** | 0 | 28 | 0 |
| **Actual `independent`** | 0 | 0 | 28 |

## 6. Research Integrity and Evaluation Freeze Confirmation

- **Held-Out Test Set (N = 80):** **NOT EVALUATED**. Retained strictly frozen for final evaluation freeze.
- **Synthetic Challenge Set (N = 150):** **NOT EVALUATED**. Retained strictly frozen for final evaluation freeze.
- **Tuning Scope:** All threshold sweeps and hybrid selections performed strictly on the validation partition ($N = 80$).
- **Zero Data Leakage:** Preprocessing and embedding vectorizations are strictly self-contained.
