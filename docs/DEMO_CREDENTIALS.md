# CivicFlow Demo Accounts & Credentials

> [!WARNING]
> **DEVELOPMENT & DEMONSTRATION USE ONLY**
> Never seed or use these demo accounts on a public production environment containing real citizen data. These credentials use shared, public passwords intended solely for local testing, evaluation demonstrations, and report screenshots.

---

## 1. Authentication Credentials

All demo accounts share the standard password:
- **Password:** `Demo@12345`

### Administrator Account
| Name | Role | Email | Purpose |
|---|---|---|---|
| **CivicFlow System Admin** | `admin` | `admin@demo.civicflow.local` | Citywide heatmap, department dispatch, SLA escalation board, system configuration |

### Department Staff Accounts
| Name | Department | Email | Purpose |
|---|---|---|---|
| **K. Raman** | Roads & Transport (`PUBLIC_WORKS`) | `staff.roads@demo.civicflow.local` | Road repair triage, crew dispatch, resolution proof submission |
| **M. Saravanan** | Water Supply (`WATER_SUPPLY`) | `staff.water@demo.civicflow.local` | Pipeline leakage dispatch, valve restoration |
| **S. Priya** | Sanitation (`SANITATION`) | `staff.sanitation@demo.civicflow.local` | Waste accumulation, public bin clearance, commercial dumping |

### Citizen Accounts
| Email | Name | Sample Activity |
|---|---|---|
| `citizen1@demo.civicflow.local` | Anitha R. | Reported Guindy road crater; supported Velachery garbage complaint |
| `citizen2@demo.civicflow.local` | Karthik S. | Reported Velachery waste overflow; verified drainage resolution |
| `citizen3@demo.civicflow.local` | Deepa V. | Reported VIT Chennai water main leak |
| `citizen4@demo.civicflow.local` | Rajesh K. | Reported Perungalathur clogged stormwater drain |
| `citizen5@demo.civicflow.local` | Meena N. | Reported Medavakkam fallen tree branch over power lines |
| `citizen6@demo.civicflow.local` | Suresh B. | Reported Tambaram road defect |
| `citizen7@demo.civicflow.local` | Lakshmi T. | Reported Chromepet broken sidewalk pavers |
| `citizen8@demo.civicflow.local` | Vignesh M. | Reported Sholinganallur traffic signal failure |
| `citizen9@demo.civicflow.local` | Revathi P. | Reported Thiruvanmiyur water main burst |
| `citizen10@demo.civicflow.local` | Dinesh C. | Reported T. Nagar stormwater cave-in |

---

## 2. Dataset Profile

- **Total Complaints:** 120
- **Time Horizon:** Past 60 days
- **Coverage Locations (Chennai Metro Area):**
  1. VIT Chennai / Kelambakkam
  2. Perungalathur (GST Road)
  3. Medavakkam (Velachery Main Road)
  4. Guindy (Industrial Estate / Metro)
  5. Velachery (100 Feet Bypass)
  6. Tambaram (Sanatorium)
  7. Chromepet (Radha Nagar)
  8. Sholinganallur (OMR Junction)
  9. Thiruvanmiyur (ECR)
  10. Adyar (Lattice Bridge Road)
  11. T. Nagar (Usman Road)
  12. Anna Nagar (Roundtana)
- **Status Distribution:**
  - `15%` Submitted (Initial triage queue)
  - `15%` Assigned (Pending crew dispatch)
  - `20%` In Progress (Field work active)
  - `20%` Resolved (Pending citizen verification with proof photos)
  - `15%` Closed (Citizen confirmed resolution)
  - `5%` Rejected / Reopened (Citizen disputed fix with remark)
  - `10%` Escalated (SLA overdue board)
- **Incident Intelligence:**
  - 11 genuine near-duplicate clusters generated through HISC pairwise scoring (`upsertIncidentCluster`).
  - Citizen community support votes and full chronological status timelines.

---

## 3. How to Seed Demo Data

Run from the `BACKEND` directory:
```bash
npm run seed:demo
```

### Safety Flags for Remote Databases
The seeder runs automatically against local MongoDB (`localhost` / `127.0.0.1`). If running against a remote database (e.g. MongoDB Atlas staging):
```bash
# Requires explicit opt-in
DEMO_SEED_ALLOW_REMOTE=1 npm run seed:demo -- --allow-remote
```
