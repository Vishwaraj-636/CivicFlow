import test, { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
   HISC_CONFIG,
   CIVIC_CONCEPT_DICTIONARY,
   CAUSAL_CONCEPT_PAIRS,
   extractCivicConcepts,
   hasCausalOrSharedConcept,
   hasOpposingDirections,
   categoryScore,
   distanceInMeters,
   extractIncidentFeatures,
   classifyIncidentScore,
   resolveConfig,
} from "../src/service/incidentIntelligence.service.js";

describe("CIVICFLOW Phase A4 — HISC Vocabulary & Cross-Asset Regression Tests", () => {
   describe("1. Vocabulary and Domain Concepts", () => {
      it("extracts civic concepts across all 10 domain infrastructure categories", () => {
         const testCases = [
            { text: "Huge crater and road damage on main road", expected: "road_defect" },
            { text: "Street lamp sodium luminaire dark", expected: "streetlight" },
            { text: "Traffic signal head not blinking", expected: "traffic_signal" },
            { text: "High voltage transformer sparking wire", expected: "electrical_hazard" },
            { text: "Drinking water pipeline leak burst", expected: "water_leak" },
            { text: "Stormwater culvert drain clogged and overflow", expected: "drainage" },
            { text: "Uncollected waste debris dump yard", expected: "garbage" },
            { text: "Uprooted tree branch overhanging road", expected: "fallen_tree" },
            { text: "Deep ground collapse sinkhole on carriageway", expected: "ground_collapse" },
            { text: "Loose paver block on pedestrian sidewalk", expected: "sidewalk_defect" },
         ];

         for (const tc of testCases) {
            const concepts = extractCivicConcepts(tc.text.toLowerCase());
            assert.ok(concepts.has(tc.expected), `Expected concept '${tc.expected}' in: '${tc.text}', got: ${[...concepts]}`);
         }
      });

      it("identifies documented causal concept pairs", () => {
         const tree = new Set(["fallen_tree"]);
         const power = new Set(["electrical_hazard"]);
         assert.ok(hasCausalOrSharedConcept(tree, power), "Fallen tree and electrical hazard must be causally compatible");

         const leak = new Set(["water_leak"]);
         const sinkhole = new Set(["ground_collapse"]);
         assert.ok(hasCausalOrSharedConcept(leak, sinkhole), "Water leak and ground collapse must be causally compatible");

         const garbage = new Set(["garbage"]);
         const drainage = new Set(["drainage"]);
         assert.ok(hasCausalOrSharedConcept(garbage, drainage), "Garbage dumping and drainage must be causally compatible");

         const light = new Set(["streetlight"]);
         assert.ok(!hasCausalOrSharedConcept(light, garbage), "Streetlight and garbage must NOT be causally compatible");
      });

      it("detects opposing cardinal and directional transit modifiers", () => {
         assert.ok(hasOpposingDirections("bus stop northbound", "bus stop southbound"));
         assert.ok(hasOpposingDirections("eastern service lane", "western carriageway"));
         assert.ok(!hasOpposingDirections("near north gate", "near north gate"));
         assert.ok(!hasOpposingDirections("camp road stretch", "camp road junction"));
      });
   });

   describe("2. General Failure Pattern Regression Fixtures", () => {
      // Pattern 1: Same asset and same underlying event
      it("Pattern 1: Same asset and same underlying event classifies as duplicate", () => {
         const baseTime = new Date("2026-03-15T10:00:00Z");
         const compA = {
            category: "Roads & Transport",
            title: "Dangerous pothole crater breaking car suspension",
            description: "Deep asphalt cavity in middle of lane near Camp Road",
            location: { coordinates: [80.1382, 12.9231] },
            createdAt: baseTime,
         };
         const compB = {
            category: "Roads & Transport",
            title: "Severe road damage crater on main carriageway",
            description: "Pothole road defect near Camp Road junction",
            location: { coordinates: [80.1384, 12.9233] }, // ~30m apart
            createdAt: new Date("2026-03-15T11:30:00Z"), // 1.5 hours later
         };

         const analysis = extractIncidentFeatures(compA, compB, HISC_CONFIG);
         const classification = classifyIncidentScore(analysis, HISC_CONFIG);

         assert.equal(classification, "duplicate");
         assert.ok(analysis.score >= HISC_CONFIG.duplicateThreshold);
         assert.ok(analysis.distance <= 100);
      });

      // Pattern 2: Nearby but incompatible assets
      it("Pattern 2: Nearby but incompatible assets classify as independent", () => {
         const baseTime = new Date("2026-03-15T10:00:00Z");
         const compA = {
            category: "Street Infrastructure",
            title: "Sodium luminaire fixture dark along bypass",
            description: "Street lamp out near Porur junction",
            location: { coordinates: [80.1582, 13.0331] },
            createdAt: baseTime,
         };
         const compB = {
            category: "Waste & Cleanliness",
            title: "Debris and construction scrap dumping along bypass",
            description: "Uncollected trash pile near Porur junction",
            location: { coordinates: [80.1584, 13.0333] }, // ~30m apart
            createdAt: new Date("2026-03-15T10:20:00Z"), // 20 mins later
         };

         const analysis = extractIncidentFeatures(compA, compB, HISC_CONFIG);
         const classification = classifyIncidentScore(analysis, HISC_CONFIG);

         assert.equal(classification, "independent", "Incompatible assets 30m apart must remain independent without causal link");
      });

      // Pattern 3: Similar wording describing independent events (opposing directions / corridors)
      it("Pattern 3: Similar wording describing independent events on opposing corridors", () => {
         const baseTime = new Date("2026-03-15T10:00:00Z");
         const compA = {
            category: "Street Infrastructure",
            title: "Broken bus shelter glass panel at Medavakkam southbound bus stop",
            description: "Vandalized glass paver at shelter",
            location: { coordinates: [80.1882, 12.9131] },
            createdAt: baseTime,
         };
         const compB = {
            category: "Street Infrastructure",
            title: "Broken bus shelter glass panel at Medavakkam northbound bus stop",
            description: "Vandalized glass paver at shelter",
            location: { coordinates: [80.1890, 12.9135] }, // ~100m apart on opposing side
            createdAt: new Date("2026-03-15T11:00:00Z"),
         };

         const analysis = extractIncidentFeatures(compA, compB, HISC_CONFIG);
         const classification = classifyIncidentScore(analysis, HISC_CONFIG);

         assert.equal(classification, "independent", "Opposing transit directional stops must not be merged as duplicates");
      });

      // Pattern 4: Distinct events in the same place at different times
      it("Pattern 4: Distinct events in the same place at different times classify as independent", () => {
         const compA = {
            category: "Drainage & Flooding",
            title: "Waterlogging during southwest monsoon rain at Saidapet bridge",
            description: "Clogged drain overflow under bridge",
            location: { coordinates: [80.2225, 13.0210] },
            createdAt: new Date("2026-06-18T10:00:00Z"),
         };
         const compB = {
            category: "Drainage & Flooding",
            title: "Waterlogging during northeast cyclone at Saidapet bridge",
            description: "Drain overflow under bridge",
            location: { coordinates: [80.2226, 13.0211] }, // ~15m apart
            createdAt: new Date("2026-11-25T10:00:00Z"), // >5 months later (3800+ hours)
         };

         const analysis = extractIncidentFeatures(compA, compB, HISC_CONFIG);
         const classification = classifyIncidentScore(analysis, HISC_CONFIG);

         assert.equal(classification, "independent", "Events separated by 5 months must be classified independent");
         assert.ok(analysis.hours > 720);
      });

      // Pattern 5: Missing or unknown categories
      it("Pattern 5: Missing or unknown categories are handled gracefully with neutral compatibility", () => {
         const baseTime = new Date("2026-03-15T10:00:00Z");
         const compA = {
            category: "Unknown",
            title: "Severe water leak gushing on street",
            description: "Drinking water pipe burst flooding road",
            location: { coordinates: [80.2000, 13.0000] },
            createdAt: baseTime,
         };
         const compB = {
            category: "",
            title: "Water pipeline burst flooding the road",
            description: "Clean water supply leaking",
            location: { coordinates: [80.2002, 13.0001] },
            createdAt: new Date("2026-03-15T11:00:00Z"),
         };

         const analysis = extractIncidentFeatures(compA, compB, HISC_CONFIG);
         const classification = classifyIncidentScore(analysis, HISC_CONFIG);

         assert.equal(analysis.features.category, 0.3, "Unknown categories must default to 0.3 neutral compatibility");
         assert.ok(Number.isFinite(analysis.score));
         assert.ok(["duplicate", "related"].includes(classification), "Strong semantic and spatial evidence should resolve relatedness despite unknown categories");
      });

      // Pattern 6: Missing coordinates or timestamps
      it("Pattern 6: Missing coordinates or timestamps do not crash the engine", () => {
         const compA = {
            category: "Roads & Transport",
            title: "Pothole on street",
            location: null, // missing
            createdAt: "invalid-date",
         };
         const compB = {
            category: "Roads & Transport",
            title: "Pothole on street",
            location: { coordinates: [] }, // empty
            createdAt: null,
         };

         assert.doesNotThrow(() => {
            const analysis = extractIncidentFeatures(compA, compB, HISC_CONFIG);
            const classification = classifyIncidentScore(analysis, HISC_CONFIG);
            assert.equal(analysis.distance, Infinity);
            assert.equal(analysis.hours, Infinity);
            assert.equal(analysis.features.geographic, 0);
            assert.equal(analysis.features.temporal, 0);
            assert.equal(classification, "independent");
         });
      });

      // Pattern 7: Cases with strong semantic evidence but weak spatial evidence
      it("Pattern 7: Strong semantic evidence but distant spatial separation classifies as independent", () => {
         const baseTime = new Date("2026-03-15T10:00:00Z");
         const compA = {
            category: "Roads & Transport",
            title: "Large pothole crater on main carriageway",
            description: "Damaged asphalt surface near Medavakkam junction",
            location: { coordinates: [80.1882, 12.9131] },
            createdAt: baseTime,
         };
         const compB = {
            category: "Roads & Transport",
            title: "Large pothole crater on main carriageway",
            description: "Damaged asphalt surface near Anna Nagar roundtana",
            location: { coordinates: [80.2182, 13.0850] }, // ~19 km apart in another zone
            createdAt: new Date("2026-03-15T10:15:00Z"),
         };

         const analysis = extractIncidentFeatures(compA, compB, HISC_CONFIG);
         const classification = classifyIncidentScore(analysis, HISC_CONFIG);

         assert.ok(analysis.distance > 15000, "Distance should be ~19km");
         assert.equal(classification, "independent", "19km distance must suppress spatial linkage regardless of identical text wording");
      });

      // Pattern 8: Cases with strong spatial/temporal evidence but no defensible event relationship
      it("Pattern 8: Strong spatial/temporal proximity without causal relationship classifies as independent", () => {
         const baseTime = new Date("2026-03-15T10:00:00Z");
         const compA = {
            category: "Water & Utilities",
            title: "Water supply pipeline valve leaking",
            description: "Potable water trickling from connection valve",
            location: { coordinates: [80.2100, 13.0100] },
            createdAt: baseTime,
         };
         const compB = {
            category: "Street Infrastructure",
            title: "Streetlight luminaire bulb fused",
            description: "Lamp post light off at night",
            location: { coordinates: [80.2101, 13.0101] }, // ~15m away
            createdAt: new Date("2026-03-15T10:08:00Z"), // 8 mins later
         };

         const analysis = extractIncidentFeatures(compA, compB, HISC_CONFIG);
         const classification = classifyIncidentScore(analysis, HISC_CONFIG);

         assert.equal(classification, "independent", "Water valve leak and street light outage 15m apart are independent municipal events");
      });

      // Extra verification: Causal multi-infrastructure incident
      it("Verifies causally connected infrastructure failure classifies as related", () => {
         const baseTime = new Date("2026-03-15T10:00:00Z");
         const compA = {
            category: "Roads & Transport",
            title: "Heavy fallen tree branch crushing road carriageway",
            description: "Large bough snapped and hanging over road wires",
            location: { coordinates: [80.2100, 13.0100] },
            createdAt: baseTime,
         };
         const compB = {
            category: "Street Infrastructure",
            title: "Transformer sparking with downed tree branch",
            description: "Short circuit and blackout caused by fallen tree",
            location: { coordinates: [80.2103, 13.0102] }, // ~40m away
            createdAt: new Date("2026-03-15T10:25:00Z"),
         };

         const analysis = extractIncidentFeatures(compA, compB, HISC_CONFIG);
         const classification = classifyIncidentScore(analysis, HISC_CONFIG);

         assert.equal(classification, "related", "Causal interaction between fallen tree and electrical hazard must be related");
         assert.ok(analysis.context.causallyConnected);
      });
   });

   describe("3. Phase A4.2 Defensive Configuration and Waste-Overflow Alignment", () => {
      describe("C1: Defensive Configuration Resolution", () => {
         it("preserves explicitly supplied valid configuration values", () => {
            const custom = {
               radiusInMeters: 500,
               temporalWindowHours: 48,
               duplicateThreshold: 0.75,
               relatedThreshold: 0.40,
               weights: { category: 0.30, geographic: 0.30, lexical: 0.10, semantic: 0.20, temporal: 0.10 },
            };
            const resolved = resolveConfig(custom);
            assert.equal(resolved.radiusInMeters, 500);
            assert.equal(resolved.temporalWindowHours, 48);
            assert.equal(resolved.duplicateThreshold, 0.75);
            assert.equal(resolved.relatedThreshold, 0.40);
            assert.equal(resolved.weights.category, 0.30);
         });

         it("safely falls back to production defaults for partial configuration objects", () => {
            const partial = { duplicateThreshold: 0.55 };
            const resolved = resolveConfig(partial);
            assert.equal(resolved.duplicateThreshold, 0.55);
            assert.equal(resolved.radiusInMeters, HISC_CONFIG.radiusInMeters);
            assert.equal(resolved.temporalWindowHours, HISC_CONFIG.temporalWindowHours);
            assert.equal(resolved.relatedThreshold, HISC_CONFIG.relatedThreshold);
            assert.deepEqual(resolved.weights, HISC_CONFIG.weights);
         });

         it("gracefully falls back for invalid, negative, or NaN numeric configuration values", () => {
            const invalidConfigs = [
               { radiusInMeters: -500, temporalWindowHours: 0 },
               { radiusInMeters: NaN, temporalWindowHours: "invalid" },
               { duplicateThreshold: -0.5, relatedThreshold: 1.5 },
               null,
               undefined,
            ];

            for (const cfg of invalidConfigs) {
               const resolved = resolveConfig(cfg);
               assert.ok(Number.isFinite(resolved.radiusInMeters) && resolved.radiusInMeters > 0);
               assert.ok(Number.isFinite(resolved.temporalWindowHours) && resolved.temporalWindowHours > 0);
               assert.ok(resolved.duplicateThreshold >= 0 && resolved.duplicateThreshold <= 1);
               assert.ok(resolved.relatedThreshold >= 0 && resolved.relatedThreshold <= 1);
            }
         });

         it("prevents NaN score propagation when extractIncidentFeatures is called with partial or empty config", () => {
            const compA = {
               category: "Roads & Transport",
               title: "Pothole on main road",
               description: "Road damage",
               location: { coordinates: [80.12, 12.92] },
               createdAt: "2026-03-15T10:00:00Z",
            };
            const compB = {
               category: "Roads & Transport",
               title: "Deep pothole defect",
               description: "Crater on asphalt",
               location: { coordinates: [80.121, 12.921] },
               createdAt: "2026-03-15T11:00:00Z",
            };

            const partialConfig = { duplicateThreshold: 0.65 };
            const analysis = extractIncidentFeatures(compA, compB, partialConfig);
            assert.ok(Number.isFinite(analysis.score), "Score must be a finite number, not NaN");
            assert.ok(!Number.isNaN(analysis.features.geographic), "Geographic feature must not be NaN");
            assert.ok(!Number.isNaN(analysis.features.temporal), "Temporal feature must not be NaN");

            const classification = classifyIncidentScore(analysis, partialConfig);
            assert.ok(["duplicate", "related", "independent"].includes(classification));
         });
      });

      describe("C2: Waste-Overflow and Cross-Domain Vocabulary Alignment", () => {
         it("aligns waste and public bin overflow with garbage domain", () => {
            const wastePhrases = [
               "The public bin is overflowing near Pallavaram Market",
               "Rotting municipal refuse bin overflowing outside bus stand",
               "Uncollected waste overflowing from bin onto pavement",
               "Stench from overflowing dustbin on road",
               "Decaying green waste overflowing outside market entrance",
            ];

            for (const phrase of wastePhrases) {
               const concepts = extractCivicConcepts(phrase.toLowerCase());
               assert.ok(concepts.has("garbage"), `Expected 'garbage' concept for phrase: '${phrase}', got: ${[...concepts]}`);
               assert.ok(!concepts.has("drainage"), `Did NOT expect 'drainage' concept for waste phrase: '${phrase}', got: ${[...concepts]}`);
            }
         });

         it("preserves drainage overflow distinctions for stormwater, sewer, and canal incidents", () => {
            const drainagePhrases = [
               "Water is overflowing from the drain at Camp Road",
               "Drain overflow reported close to junction after heavy rainfall",
               "Stormwater canal overflowing into road carriageway",
               "Sewage overflow from manhole outside industrial estate",
               "Blocked culvert drain overflowing dirty water",
            ];

            for (const phrase of drainagePhrases) {
               const concepts = extractCivicConcepts(phrase.toLowerCase());
               assert.ok(concepts.has("drainage"), `Expected 'drainage' concept for phrase: '${phrase}', got: ${[...concepts]}`);
               assert.ok(!concepts.has("garbage"), `Did NOT expect 'garbage' concept for drainage phrase: '${phrase}', got: ${[...concepts]}`);
            }
         });

         it("preserves water-leak pipeline failure concepts distinct from drainage or garbage", () => {
            const waterLeakPhrases = [
               "Water supply pipeline valve leaking clean drinking water",
               "High pressure water main burst flooding street",
               "Broken potable water pipe leaking near gate",
            ];

            for (const phrase of waterLeakPhrases) {
               const concepts = extractCivicConcepts(phrase.toLowerCase());
               assert.ok(concepts.has("water_leak"), `Expected 'water_leak' concept for phrase: '${phrase}', got: ${[...concepts]}`);
            }
         });

         it("evaluates waste-bin overflow duplicate pair (e.g. rubbish pile vs overflowing public bin)", () => {
            const compA = {
               category: "Waste & Cleanliness",
               title: "A large pile of rubbish is present at Pallavaram Market.",
               description: "",
               location: { coordinates: [80.1491, 12.9675] },
               createdAt: "2026-09-17T16:00:00Z",
            };
            const compB = {
               category: "Waste & Cleanliness",
               title: "The public bin is overflowing near Pallavaram Market.",
               description: "",
               location: { coordinates: [80.15053, 12.96817] }, // 172m away
               createdAt: "2026-09-18T08:00:00Z", // 16h later
            };

            const analysis = extractIncidentFeatures(compA, compB, HISC_CONFIG);
            const classification = classifyIncidentScore(analysis, HISC_CONFIG);

            assert.ok(analysis.score >= HISC_CONFIG.duplicateThreshold, `Score ${analysis.score} must reach duplicate threshold ${HISC_CONFIG.duplicateThreshold}`);
            assert.equal(classification, "duplicate", "Rubbish pile and overflowing public bin 172m / 16h apart should be duplicate");
         });

         it("prevents cross-domain ambiguity between waste-bin overflow and drainage overflow", () => {
            const wasteComp = {
               category: "Waste & Cleanliness",
               title: "The public bin is overflowing near Chromepet Bus Stand",
               description: "Trash spilling onto walkway",
               location: { coordinates: [80.1420, 12.9510] },
               createdAt: "2026-09-15T10:00:00Z",
            };
            const drainageComp = {
               category: "Drainage & Flooding",
               title: "Water is overflowing from the drain at Chromepet Bus Stand",
               description: "Stormwater sewer backed up after monsoon rain",
               location: { coordinates: [80.1421, 12.9511] }, // ~15m away
               createdAt: "2026-09-15T10:15:00Z", // 15 mins later
            };

            const analysis = extractIncidentFeatures(wasteComp, drainageComp, HISC_CONFIG);
            const classification = classifyIncidentScore(analysis, HISC_CONFIG);

            assert.notEqual(classification, "duplicate", "Waste bin overflow and drain overflow must NOT merge as a duplicate");
         });
      });
   });
});
