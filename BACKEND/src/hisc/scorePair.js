import { DEFAULT_HISC_CONFIG, loadConfig } from "./config.js";

export const CIVIC_CONCEPT_DICTIONARY = {
   road_defect: [
      "pothole", "crater", "road damage", "road defect", "damaged road", "broken road",
      "road surface", "asphalt", "tarmac", "bitumen", "rutting", "pavement damage",
      "median fence", "kerb stone", "median kerb"
   ],
   streetlight: [
      "streetlight", "street lamp", "lamp post", "light pole", "street light",
      "luminaire", "lighting", "dark stretch", "lantern", "sodium luminaire"
   ],
   traffic_signal: [
      "traffic signal", "traffic light", "signal pole", "signal box", "signal light",
      "signal failure", "signal controller", "pedestrian signal", "blinking signal"
   ],
   electrical_hazard: [
      "transformer", "power line", "electric wire", "power cable", "electrical line",
      "fuse box", "substation", "short circuit", "sparking wire", "power pole",
      "power outage", "live wire", "hanging wire"
   ],
   water_leak: [
      "leak", "leakage", "burst", "broken pipe", "water pipeline", "water main",
      "pipe burst", "pipeline leak", "water supply", "drinking water", "leaking pipe",
      "hydrant valve", "fire hydrant"
   ],
   drainage: [
      "drain", "drainage", "sewer", "sewerage", "manhole", "stormwater", "culvert",
      "gutter", "catch basin", "gully", "backflow", "waterlogging", "inundation",
      "flood", "flooding", "clogged drain", "blocked drain", "manhole cover", "canal",
      "drain overflow", "sewer overflow", "sewage overflow", "canal overflow",
      "stormwater overflow", "water overflow", "overflowing drain", "overflowing sewer",
      "overflowing canal"
   ],
   garbage: [
      "garbage", "waste", "trash", "rubbish", "debris", "refuse", "dumping",
      "litter", "uncollected waste", "dump yard", "construction scrap", "discarded",
      "dumper bin", "garbage bin", "public bin", "dustbin", "waste bin", "trash bin",
      "litter bin", "refuse bin", "overflowing bin", "bin overflow", "overflowing waste",
      "overflowing garbage", "bin"
   ],
   fallen_tree: [
      "fallen tree", "tree branch", "downed tree", "uprooted tree", "broken bough",
      "hanging branch", "fallen bough", "tree fall", "overhanging branch"
   ],
   ground_collapse: [
      "sinkhole", "cave in", "cave-in", "caved in", "ground collapse",
      "road collapse", "subsidence", "trench collapse", "deep crater"
   ],
   sidewalk_defect: [
      "sidewalk", "footpath", "pavement", "paver", "pedestrian walkway",
      "walkway", "curb", "kerb", "loose paver", "broken slab", "bus shelter"
   ],
};

export const CAUSAL_CONCEPT_PAIRS = new Set([
   "electrical_hazard <-> fallen_tree",
   "fallen_tree <-> traffic_signal",
   "fallen_tree <-> road_defect",
   "fallen_tree <-> streetlight",
   "ground_collapse <-> water_leak",
   "drainage <-> water_leak",
   "road_defect <-> water_leak",
   "drainage <-> garbage",
   "drainage <-> road_defect",
   "ground_collapse <-> road_defect",
   "electrical_hazard <-> streetlight",
   "electrical_hazard <-> traffic_signal",
]);

export const CIVIC_STOP_WORDS = new Set([
   "the", "and", "near", "close", "along", "around", "road", "street", "area",
   "junction", "corner", "stretch", "bypass", "lane", "main", "nagar", "salai",
   "issue", "problem", "reported", "complaint", "urgent", "needs", "repair",
   "due", "after", "with", "from", "for", "been", "has", "have", "this", "that",
   "there", "about", "front", "section", "block", "stretch", "place", "market", "signal"
]);

export const normalizeCivicText = (value = "") => String(value).toLowerCase()
   .replace(/[^a-z0-9\s]/g, " ")
   .replace(/\s+/g, " ")
   .trim();

export const extractCivicConcepts = (normText) => {
   const concepts = new Set();
   const words = new Set(normText.split(/\s+/));
   for (const [conceptKey, phrases] of Object.entries(CIVIC_CONCEPT_DICTIONARY)) {
      for (const phrase of phrases) {
         if (phrase.includes(" ") || phrase.length > 3) {
            if (normText.includes(phrase)) {
               concepts.add(conceptKey);
               break;
            }
         } else if (words.has(phrase)) {
            concepts.add(conceptKey);
            break;
         }
      }
   }
   return concepts;
};

export const tokenize = (normText = "") => {
   const normalized = typeof normText === "string" && !normText.includes(" ") && normText.length > 2
      ? normText.toLowerCase()
      : normalizeCivicText(normText);
   return normalized
      .split(/\s+/)
      .filter((word) => word.length > 2 && !CIVIC_STOP_WORDS.has(word));
};

export const intersectionRatio = (first, second) => {
   const union = new Set([...first, ...second]);
   if (!union.size) return 0;
   return [...first].filter((token) => second.has(token)).length / union.size;
};

export const hasOpposingDirections = (textA, textB) => {
   const north = /\b(north|northbound|northern)\b/;
   const south = /\b(south|southbound|southern)\b/;
   const east = /\b(east|eastbound|eastern)\b/;
   const west = /\b(west|westbound|western)\b/;

   if ((north.test(textA) && south.test(textB)) || (south.test(textA) && north.test(textB))) return true;
   if ((east.test(textA) && west.test(textB)) || (west.test(textA) && east.test(textB))) return true;
   return false;
};

export const hasCausalOrSharedConcept = (conceptsA, conceptsB) => {
   for (const c of conceptsA) {
      if (conceptsB.has(c)) return true;
   }
   for (const cA of conceptsA) {
      for (const cB of conceptsB) {
         const key = [cA, cB].sort().join(" <-> ");
         if (CAUSAL_CONCEPT_PAIRS.has(key)) return true;
      }
   }
   return false;
};

export const distanceInMeters = (first, second) => {
   if (!first || !second || !Array.isArray(first) || !Array.isArray(second)
      || first.length < 2 || second.length < 2
      || Number.isNaN(Number(first[0])) || Number.isNaN(Number(second[0]))
      || Number.isNaN(Number(first[1])) || Number.isNaN(Number(second[1]))) {
      return Infinity;
   }
   const [firstLng, firstLat] = first;
   const [secondLng, secondLat] = second;
   const earthRadius = 6371000;
   const latitudeDelta = (secondLat - firstLat) * Math.PI / 180;
   const longitudeDelta = (secondLng - firstLng) * Math.PI / 180;
   const a = Math.sin(latitudeDelta / 2) ** 2
      + Math.cos(firstLat * Math.PI / 180) * Math.cos(secondLat * Math.PI / 180)
      * Math.sin(longitudeDelta / 2) ** 2;
   return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const categoryScore = (first, second) => {
   if (!first || !second || first === "Unknown" || second === "Unknown") return 0.3;
   if (first === second) return 1.0;

   const pair = [first, second].sort().join(" <-> ");
   const compatibleFamilies = {
      "Roads & Transport <-> Street Infrastructure": 0.6,
      "Drainage & Flooding <-> Water & Utilities": 0.6,
      "Drainage & Flooding <-> Roads & Transport": 0.4,
      "Drainage & Flooding <-> Waste & Cleanliness": 0.4,
      "Roads & Transport <-> Water & Utilities": 0.2,
   };
   return compatibleFamilies[pair] ?? 0.0;
};

export const featureExplanation = (features, distance, hours) => [
   features.category >= 1 ? "Same civic category" : features.category > 0 ? "Compatible civic categories" : null,
   Number.isFinite(distance) ? `Complaints are ${Math.round(distance)} meters apart` : "Coordinates unavailable",
   Number.isFinite(hours)
      ? `Submitted ${hours < 1 ? "within an hour" : `within ${Math.round(hours)} hours`}`
      : "Timestamps unavailable",
   features.semantic >= 0.7 ? "High semantic similarity" : features.lexical >= 0.5 ? "Shared descriptive terms" : null,
].filter(Boolean);

export const classifyIncidentScore = (scoreOrAnalysis, rawConfig = DEFAULT_HISC_CONFIG, context = null) => {
   const config = loadConfig(rawConfig);
   const score = typeof scoreOrAnalysis === "object" ? scoreOrAnalysis.score : scoreOrAnalysis;
   const ctx = (typeof scoreOrAnalysis === "object" ? scoreOrAnalysis.context : null)
      ?? context?.analysis?.context ?? context;

   if (ctx) {
      const {
         distance = 0,
         hours = 0,
         catSim = 1,
         causallyConnected = false,
         opposingDir = false,
         semantic = 0,
         lexical = 0,
      } = ctx;

      // Rule 1: Distant boundary (>3000m is never local incident)
      if (distance > 3000) return "independent";
      // Rule 2: Temporal boundary (>720h is independent weather/temporal cycle)
      if (hours > 720) return "independent";
      // Rule 3: Operational radius (>1000m requires substantive causal/defect connection)
      if (distance > config.radiusInMeters && (!causallyConnected || semantic < 0.20)) return "independent";
      // Rule 4: Incompatible categories without causal connection
      if (catSim === 0.0 && !causallyConnected) return "independent";

      // Rule 5: Duplicate requirements
      if (score >= config.duplicateThreshold) {
         if (catSim >= 0.9 && distance <= 250 && hours <= 168 && !opposingDir && (semantic > 0 || lexical > 0 || score >= 0.70)) {
            return "duplicate";
         }
         return opposingDir ? "independent" : "related";
      }
      if (score >= config.relatedThreshold) {
         return opposingDir && catSim < 0.9 ? "independent" : "related";
      }
      return "independent";
   }

   // Pure threshold fallback
   if (score >= config.duplicateThreshold) return "duplicate";
   if (score >= config.relatedThreshold) return "related";
   return "independent";
};

const extractCoordinates = (item) => {
   if (Array.isArray(item?.location?.coordinates)) return item.location.coordinates;
   if (Array.isArray(item?.coordinates)) return item.coordinates;
   if (Array.isArray(item?.location)) return item.location;
   return null;
};

const extractText = (item) => {
   if (typeof item?.text === "string" && item.text.trim()) return item.text;
   const title = item?.title ?? "";
   const desc = item?.description ?? "";
   const combined = `${title} ${desc}`.trim();
   return combined || (typeof item?.text === "string" ? item.text : "");
};

/**
 * Pure HISC pairwise scoring function.
 * Evaluates multi-attribute affinity between two civic complaints without side effects.
 *
 * @param {object} a - First complaint object { text, category, location: { coordinates: [lng, lat] }, createdAt }
 * @param {object} b - Second complaint object { text, category, location: { coordinates: [lng, lat] }, createdAt }
 * @param {object} [opts={}] - Scoring options { weights, thresholds, radiusMeters, windowHours, enabledFeatures, semanticMode, embeddings }
 * @returns {{ score: number, label: 'duplicate'|'related'|'independent', features: { category: number, geographic: number, lexical: number, semantic: number, temporal: number }, explanation: string[] }}
 */
export const scorePair = (a, b, opts = {}) => {
   const config = loadConfig(opts);

   const coordsA = extractCoordinates(a);
   const coordsB = extractCoordinates(b);
   const distance = distanceInMeters(coordsA, coordsB);

   const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : NaN;
   const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : NaN;
   const hours = (!Number.isNaN(dateA) && !Number.isNaN(dateB))
      ? Math.abs(dateA - dateB) / 3600000
      : Infinity;

   const textA = normalizeCivicText(extractText(a));
   const textB = normalizeCivicText(extractText(b));

   const tokensA = new Set(tokenize(textA));
   const tokensB = new Set(tokenize(textB));

   const conceptsA = extractCivicConcepts(textA);
   const conceptsB = extractCivicConcepts(textB);

   const lexical = intersectionRatio(tokensA, tokensB);
   const semanticTokensA = new Set([...tokensA, ...conceptsA]);
   const semanticTokensB = new Set([...tokensB, ...conceptsB]);
   const dictSemantic = intersectionRatio(semanticTokensA, semanticTokensB);

   let semantic = dictSemantic;
   let usedFallback = false;

   if (typeof opts.semanticScore === "number" && Number.isFinite(opts.semanticScore)) {
      semantic = Math.min(1, Math.max(0, opts.semanticScore));
   } else if (typeof opts.embeddingCosine === "number" && Number.isFinite(opts.embeddingCosine)) {
      const mode = opts.semanticMode ?? config.semanticMode ?? "synonym";
      if (mode === "embedding") {
         semantic = Math.min(1, Math.max(0, opts.embeddingCosine));
      } else if (mode === "hybrid_mean") {
         semantic = Math.min(1, Math.max(0, 0.5 * dictSemantic + 0.5 * opts.embeddingCosine));
      } else if (mode === "hybrid_max") {
         semantic = Math.min(1, Math.max(0, Math.max(dictSemantic, opts.embeddingCosine)));
      }
   } else if ((opts.semanticMode ?? config.semanticMode) && (opts.semanticMode ?? config.semanticMode) !== "synonym") {
      // Embedding was requested by semanticMode, but no valid embedding cosine was supplied -> fallback to dictionary
      usedFallback = true;
   }

   const catSim = categoryScore(a?.category, b?.category);
   const causallyConnected = hasCausalOrSharedConcept(conceptsA, conceptsB);
   const opposingDir = hasOpposingDirections(textA, textB);

   const features = {
      category: catSim,
      geographic: Number.isFinite(distance) ? Math.exp(-distance / config.radiusInMeters) : 0,
      lexical,
      semantic,
      temporal: Number.isFinite(hours) ? Math.exp(-hours / config.temporalWindowHours) : 0,
   };

   const enabledFeatures = config.enabledFeatures ?? {};
   const activeWeights = Object.entries(config.weights)
      .filter(([feature]) => enabledFeatures[feature] !== false);
   const totalWeight = activeWeights.reduce((total, [, weight]) => total + weight, 0) || 1;
   const score = Math.min(1, Math.max(0,
      activeWeights.reduce((total, [feature, weight]) => total + features[feature] * weight, 0) / totalWeight
   ));

   const context = {
      distance,
      hours,
      catSim,
      causallyConnected,
      opposingDir,
      semantic,
      lexical,
   };

   const label = classifyIncidentScore({ score, context }, config);
   const explanation = featureExplanation(features, distance, hours);

   const result = {
      score,
      label,
      features,
      explanation,
   };

   // Non-enumerable metadata preserving internal compatibility without altering the required public contract shape
   Object.defineProperties(result, {
      distance: { value: distance, enumerable: false, writable: true, configurable: true },
      hours: { value: hours, enumerable: false, writable: true, configurable: true },
      context: { value: context, enumerable: false, writable: true, configurable: true },
      usedFallback: { value: usedFallback, enumerable: false, writable: true, configurable: true },
   });

   return result;
};

export default {
   scorePair,
   loadConfig,
   classifyIncidentScore,
   distanceInMeters,
   categoryScore,
   extractCivicConcepts,
   CIVIC_CONCEPT_DICTIONARY,
   CAUSAL_CONCEPT_PAIRS,
   CIVIC_STOP_WORDS,
};
