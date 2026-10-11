# CivicFlow Research Evaluation — T5: Train-Only Learned HISC Weights

> **Document Notice:** Generated deterministically by the T5 weight optimization and validation comparison pipeline. Weights were learned strictly on the training partition ($N = 240$) and evaluated on the validation split ($N = 80$). Held-out test and synthetic challenge sets were strictly withheld and unexamined.

## 1. Experiment Overview & Simplex Optimization Specification

- **Search Space:** 5-feature weight simplex with step size $\Delta = 0.05$.
- **Simplex Constraints:** $w_i \in [0, 1]$, each $w_i$ multiple of 0.05$, $\sum_{i=1}^5 w_i = 1.00$.
- **Admissible Configurations Examined:** **10,626** candidate weight vectors.
- **Optimization Partition:** **TRAIN ONLY** ($N = 240$ complaint pairs, grouped split, zero incident leakage).
- **Optimization Objective:** Primary: Training Macro F1 across `duplicate`, `related`, `independent`.
- **Tie-Break Protocol:**
  1. Highest training Macro F1.
  2. Highest training overall Accuracy.
  3. Highest training duplicate F1.
  4. Highest training related F1.
  5. Deterministic canonical enumeration order (lexicographic index).
- **Execution Timestamp:** `2026-10-11T08:14:07.768Z`
- **Git Commit Hash:** `c1d091ce1f735976fb4580fa4299f365cfd131e1`
- **Dataset SHA-256:** `b4653ac507f422a3b6f5ffadb291d5440eab0cb07174f2398ad72739e86a33f2`

## 2. Weight Comparison: Hand-Set vs Train-Learned

| Feature | Hand-Set Weight | Train-Learned Weight | $\Delta$ (Learned - Hand-Set) |
|---|:---:|:---:|:---:|
| **Category** (`category`) | **0.20** | **0.00** | -0.20 |
| **Geographic** (`geographic`) | **0.25** | **0.30** | 0.05 |
| **Lexical** (`lexical`) | **0.10** | **0.00** | -0.10 |
| **Semantic** (`semantic`) | **0.30** | **0.40** | 0.10 |
| **Temporal** (`temporal`) | **0.15** | **0.30** | 0.15 |
| **Sum** | **1.00** | **1.00** | **0.00** |

## 3. Training Split Optimization Results ($N = 240$)

- **Candidates Achieving Perfect Training Macro F1 (1.0000):** **1,691** configurations.
- **Selected Learned Configuration Index:** `#1099`
- **Training Accuracy:** **100.00%**
- **Training Macro F1:** **1.0000**
- **Training Per-Class F1:** Duplicate: 1.0000, Related: 1.0000, Independent: 1.0000

## 4. Validation Split Comparison ($N = 80$, Frozen Learned Weights)

| Metric | Hand-Set Configuration | Train-Learned Configuration | Winner |
|---|:---:|:---:|:---:|
| **Accuracy** | 100.00% | 100.00% | Tie |
| **Macro F1** | **1.0000** | **1.0000** | **Tie** |
| **Duplicate F1** | 1.0000 | 1.0000 | Tie |
| **Related F1** | 1.0000 | 1.0000 | Tie |
| **Independent F1** | 1.0000 | 1.0000 | Tie |

### Final Configuration Selection Decision
- **Outcome:** **TIE**
- **Selected Configuration:** **Hand-Set Baseline (Retained)**
- **Decision Rationale:** Learned weights matched hand-set validation macro F1 exactly. Hand-set configuration retained by tie-break rule.
- **Production Status:** Production configuration remains strictly unchanged at validated domain defaults ($w_C=0.20, w_G=0.25, w_L=0.10, w_S=0.30, w_T=0.15$).

## 5. Methodological Observations & Limitations

1. **Context Rule Dominance:** HISC's contextual veto rules (Rule 1: $>3000\text{m}$, Rule 2: $>720\text{h}$, Rule 3: $>1000\text{m}$ without causal link, Rule 4: category mismatch without causal link) filter out independent pairs decisively before score thresholding.
2. **High Separability of Synthetic Pairs:** Across both train ($N=240$) and validation ($N=80$), municipal template categories and geographic clusters are cleanly separated, resulting in $1,691$ weight configurations achieving perfect classification.
3. **Strict Research Integrity Protocol:** No validation labels were used during simplex weight search. Held-out test ($N=80$) and synthetic challenge ($N=150$) sets remain completely unexamined and frozen.
4. **Deferred Embedding-Weight Search:** To preserve comparability with the 5-feature baseline and prevent scope expansion, learned weight search was performed on the standard 5-feature HISC model; embedding-weight search is documented as deferred.
