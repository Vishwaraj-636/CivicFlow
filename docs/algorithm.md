# CivicFlow Incident Intelligence

## Baseline

The existing detector is retained as the baseline: exact category match, geographic proximity, and lexical Jaccard similarity with weights `0.35`, `0.25`, and `0.40`. It only searches nearby complaints in the same category, so it misses related infrastructure reports with different wording or compatible categories.

## Proposed HISC algorithm

HISC (Hybrid Incident Similarity and Clustering) uses two stages. Candidate retrieval first uses the MongoDB `2dsphere` index and a 30-day window, limiting expensive feature scoring to at most 40 nearby active reports. Ranking then combines:

`H(i,j) = 0.20C + 0.20G + 0.15L + 0.30S + 0.15T`

`C` is category compatibility, `G = exp(-distance / radius)`, `L` is lexical overlap, `S` is semantic overlap using civic-incident synonym groups (with a provider seam available for embeddings), and `T = exp(-hours / temporalWindow)`. The result is classified as duplicate at `0.78`, related at `0.40`, otherwise independent. Every match returns its feature vector, distance, time gap, and human-readable explanation.

When a match exists, the complaint is added to an `IncidentCluster` representing the real-world problem. The cluster stores complaint membership, participating departments, confidence, affected radius, priority, and lifecycle status. This makes the incident, rather than an individual report, the coordination unit.

## Evaluation

`node src/evaluation/incidentAlgorithmEvaluation.js` runs the supplied 400-pair labeled dataset and prints actual baseline and HISC metrics, including macro precision, recall, F1, accuracy, processing time, and confusion matrices. See [algorithm-evaluation.md](algorithm-evaluation.md) for the recorded run. The dataset is a project evaluation set, not government data or a production accuracy guarantee.

The implementation is incremental: candidate retrieval is indexed and bounded, feature extraction is linear in text size, and cluster updates touch only the matched incident membership.