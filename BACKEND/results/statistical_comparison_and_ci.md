# CivicFlow Research Evaluation — Paired Statistical Comparisons and Accuracy Intervals

**Audit Timestamp:** 2026-10-11T10:03:38.413Z
**Source Predictions:** `final_held_out_evaluation.json`

---

## 1. Paired Exact McNemar Significance Tests ($N = 150$ Synthetic Challenge)

We evaluate whether differences in classification accuracy between HISC and comparator baselines are statistically significant across the 150 paired challenge scenarios.

### Summary Contingency Table and Exact Two-Sided p-Values:

| Comparator Method | Both Correct ($n_{11}$) | Both Incorrect ($n_{00}$) | HISC Correct, Comp Incorrect ($b$) | HISC Incorrect, Comp Correct ($c$) | Discordant Total ($b+c$) | Exact 2-Sided $p$-value | Significant ($alpha=0.05$)? | Significant (Bonferroni $alpha=0.0125$)? |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **HISC-embed (Local Embeddings)** | 120 | 24 | **6** | **0** | 6 | `0.03125` | **Yes** | No |
| **B3 (Category + Distance)** | 83 | 22 | **43** | **2** | 45 | `5.8890e-11` | **Yes** | **Yes** |
| **B4 (TF-IDF Cosine)** | 44 | 17 | **82** | **7** | 89 | `2.4284e-17` | **Yes** | **Yes** |
| **B2 (Distance-Only)** | 73 | 24 | **53** | **0** | 53 | `2.2204e-16` | **Yes** | **Yes** |

### Interpretation and Multiple-Comparison Caveats:
1. **HISC vs. Spatial and Lexical Baselines (B2, B3, B4):**
   - **B3 (Category + Distance):** HISC outperforms B3 with 43 positive discordances vs. 2 negative discordances ($p = 5.89 \times 10^{-11}$).
   - **B4 (TF-IDF Cosine):** HISC outperforms B4 with 82 positive discordances vs. 7 negative discordances ($p = 2.43 \times 10^{-17}$).
   - **B2 (Distance-Only):** HISC outperforms B2 with 53 positive discordances vs. 0 negative discordances ($p = 2.22 \times 10^{-16}$).
   - All three comparisons remain **overwhelmingly significant** even under the most conservative Bonferroni correction ($\alpha_{\text{adj}} = 0.0125$).

2. **HISC vs. HISC-embed:**
   - HISC correct / HISC-embed incorrect: **6 pairs**.
   - HISC incorrect / HISC-embed correct: **0 pairs**.
   - Unadjusted exact two-sided $p$-value: **$0.03125$** ($p < 0.05$).
   - Under Bonferroni family-wise adjustment for 4 comparisons ($\alpha_{\text{adj}} = 0.0125$), $p = 0.03125 > 0.0125$. Therefore, the observed 4.0% accuracy advantage of hand-tuned HISC (84.0%) over HISC-embed (80.0%) is suggestive but **not statistically significant** after adjusting for multiple comparisons.

---

## 2. Exact Clopper–Pearson 95% Binomial Confidence Intervals

Exact binomial confidence intervals for classification accuracy across all 11 evaluated methods on both evaluation partitions:

### Synthetic Challenge Set ($N = 150$):

| Method ID | Method Name | Correct / 150 | Accuracy | 95% Clopper–Pearson CI |
| :--- | :--- | :---: | :---: | :---: |
| `HISC` | HISC (Hierarchical Incident Stream Clustering) | 126 / 150 | 84.0% | `[0.7714, 0.8947]` |
| `B1_jaccard` | B1: Text Jaccard Similarity | 35 / 150 | 23.3% | `[0.1682, 0.3093]` |
| `B2_distance` | B2: Distance-Only Similarity | 73 / 150 | 48.7% | `[0.4043, 0.5695]` |
| `B3_cat_distance` | B3: Category Plus Distance | 85 / 150 | 56.7% | `[0.4834, 0.6473]` |
| `B4_tfidf` | B4: TF-IDF Cosine Similarity | 51 / 150 | 34.0% | `[0.2647, 0.4217]` |
| `B5_tfidf_distance` | B5: TF-IDF Cosine + Geographic Distance | 53 / 150 | 35.3% | `[0.2771, 0.4355]` |
| `B6_embedding` | B6: Embedding Cosine Similarity Only | 43 / 150 | 28.7% | `[0.2159, 0.3661]` |
| `HISC_embed` | HISC-embed (Embedding-Backed Semantic Affinity) | 120 / 150 | 80.0% | `[0.7270, 0.8608]` |
| `HISC_hybrid_mean` | HISC-hybrid-mean (Mean of Dictionary & Embedding) | 120 / 150 | 80.0% | `[0.7270, 0.8608]` |
| `HISC_hybrid_max` | HISC-hybrid-max (Maximum of Dictionary & Embedding) | 120 / 150 | 80.0% | `[0.7270, 0.8608]` |
| `HISC_learned_weights` | HISC-learned-weights (Train-Learned Simplex Weights) | 126 / 150 | 84.0% | `[0.7714, 0.8947]` |

### Held-Out Test Split ($N = 80$):

| Method ID | Method Name | Correct / 80 | Accuracy | 95% Clopper–Pearson CI |
| :--- | :--- | :---: | :---: | :---: |
| `HISC` | HISC (Hierarchical Incident Stream Clustering) | 80 / 80 | 100.0% | `[0.9549, 1.0000]` |
| `B1_jaccard` | B1: Text Jaccard Similarity | 48 / 80 | 60.0% | `[0.4844, 0.7080]` |
| `B2_distance` | B2: Distance-Only Similarity | 64 / 80 | 80.0% | `[0.6956, 0.8811]` |
| `B3_cat_distance` | B3: Category Plus Distance | 80 / 80 | 100.0% | `[0.9549, 1.0000]` |
| `B4_tfidf` | B4: TF-IDF Cosine Similarity | 56 / 80 | 70.0% | `[0.5872, 0.7974]` |
| `B5_tfidf_distance` | B5: TF-IDF Cosine + Geographic Distance | 58 / 80 | 72.5% | `[0.6138, 0.8190]` |
| `B6_embedding` | B6: Embedding Cosine Similarity Only | 63 / 80 | 78.8% | `[0.6817, 0.8711]` |
| `HISC_embed` | HISC-embed (Embedding-Backed Semantic Affinity) | 80 / 80 | 100.0% | `[0.9549, 1.0000]` |
| `HISC_hybrid_mean` | HISC-hybrid-mean (Mean of Dictionary & Embedding) | 80 / 80 | 100.0% | `[0.9549, 1.0000]` |
| `HISC_hybrid_max` | HISC-hybrid-max (Maximum of Dictionary & Embedding) | 80 / 80 | 100.0% | `[0.9549, 1.0000]` |
| `HISC_learned_weights` | HISC-learned-weights (Train-Learned Simplex Weights) | 80 / 80 | 100.0% | `[0.9549, 1.0000]` |

---

## 3. Sampling Design and Group Structure Nuance

- **Challenge Set Equivalence:**
  In the synthetic challenge set ($N = 150$), every complaint pair has a distinct incident ID (`CH_INC0001` through `CH_INC0150`). Because cluster sizes are strictly $M_i = 1$, pair-level binomial intervals and incident-clustered bootstrap intervals are mathematically identical.
- **Held-Out Test Set Intra-Cluster Correlation:**
  In the 400-pair development dataset, duplicate pairs share incident IDs and complaint text templates are heavily duplicated (84.6% overlap with train). The apparent $100.0\%$ test accuracy of HISC, B3, and HISC-embed produces an exact binomial interval of $[0.9549, 1.0000]$, but this interval treats observations as independent trials. In reality, intra-cluster template correlation inflates precision.
