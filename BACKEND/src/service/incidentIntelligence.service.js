import { randomUUID } from "node:crypto";
import Complaint from "../model/complaint.model.js";
import IncidentCluster from "../model/incidentCluster.model.js";

export const HISC_CONFIG = {
   radiusInMeters: 1000,
   temporalWindowHours: 24 * 30,
   duplicateThreshold: 0.78,
   relatedThreshold: 0.4,
   weights: {
      category: 0.2,
      geographic: 0.2,
      lexical: 0.15,
      semantic: 0.3,
      temporal: 0.15,
   },
};

const synonymGroups = [
   ["pothole", "crater", "road damage", "road defect"],
   ["streetlight", "street lamp", "lamp post", "light pole"],
   ["garbage", "waste", "trash", "rubbish"],
   ["leak", "leakage", "burst", "broken pipe"],
   ["flood", "flooding", "waterlogging", "inundation"],
];

const tokenize = (value = "") => String(value).toLowerCase()
   .replace(/[^a-z0-9\s]/g, " ")
   .split(/\s+/)
   .filter((word) => word.length > 2);

const expandedTokens = (value) => new Set(tokenize(value).flatMap((token) => {
   const group = synonymGroups.find((items) => items.includes(token));
   return group ? [...group, token] : [token];
}));

const intersectionRatio = (first, second) => {
   const union = new Set([...first, ...second]);
   if (!union.size) return 0;
   return [...first].filter((token) => second.has(token)).length / union.size;
};

export const distanceInMeters = (first, second) => {
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

const categoryScore = (first, second) => {
   if (first === second) return 1;
   const families = [
      ["Roads & Transport", "Street Infrastructure"],
      ["Water & Utilities", "Drainage & Flooding"],
      ["Waste & Cleanliness"],
   ];
   return families.some((family) => family.includes(first) && family.includes(second)) ? 0.6 : 0;
};

const featureExplanation = (features, distance, hours) => [
   features.category >= 1 ? "Same civic category" : features.category > 0 ? "Compatible civic categories" : null,
   `Complaints are ${Math.round(distance)} meters apart`,
   `Submitted ${hours < 1 ? "within an hour" : `within ${Math.round(hours)} hours`}`,
   features.semantic >= 0.7 ? "High semantic similarity" : features.lexical >= 0.5 ? "Shared descriptive terms" : null,
].filter(Boolean);

export const extractIncidentFeatures = (complaint, candidate, config = HISC_CONFIG) => {
   const distance = distanceInMeters(complaint.location.coordinates, candidate.location.coordinates);
   const hours = Math.abs(new Date(complaint.createdAt) - new Date(candidate.createdAt)) / 3600000;
   const textA = `${complaint.title} ${complaint.description}`;
   const textB = `${candidate.title} ${candidate.description}`;
   const lexical = intersectionRatio(new Set(tokenize(textA)), new Set(tokenize(textB)));
   const semantic = intersectionRatio(expandedTokens(textA), expandedTokens(textB));
   const features = {
      category: categoryScore(complaint.category, candidate.category),
      geographic: Math.exp(-distance / config.radiusInMeters),
      lexical,
      semantic,
      temporal: Math.exp(-hours / config.temporalWindowHours),
   };
   const enabledFeatures = config.enabledFeatures ?? {};
   const activeWeights = Object.entries(config.weights ?? HISC_CONFIG.weights)
      .filter(([feature]) => enabledFeatures[feature] !== false);
   const totalWeight = activeWeights.reduce((total, [, weight]) => total + weight, 0) || 1;
   const score = Math.min(1, Math.max(0,
      activeWeights.reduce((total, [feature, weight]) => total + features[feature] * weight, 0) / totalWeight
   ));
   return {
      score,
      features,
      distance,
      hours,
      explanation: featureExplanation(features, distance, hours),
   };
};

export const classifyIncidentScore = (score, config = HISC_CONFIG) => {
   if (score >= config.duplicateThreshold) return "duplicate";
   if (score >= config.relatedThreshold) return "related";
   return "independent";
};

export const retrieveIncidentCandidates = async (complaint, config = HISC_CONFIG) => Complaint.find({
   _id: { $ne: complaint._id },
   status: { $nin: ["deleted", "closed"] },
   createdAt: { $gte: new Date(new Date(complaint.createdAt).getTime() - config.temporalWindowHours * 3600000) },
   location: { $near: { $geometry: complaint.location, $maxDistance: config.radiusInMeters } },
}).limit(40);

export const analyzeIncident = async (complaint, config = HISC_CONFIG) => {
   const candidates = await retrieveIncidentCandidates(complaint, config);
   return candidates.map((candidate) => {
      const analysis = extractIncidentFeatures(complaint, candidate, config);
      return { complaint: candidate, classification: classifyIncidentScore(analysis.score, config), ...analysis };
   }).filter((match) => match.classification !== "independent")
      .sort((first, second) => second.score - first.score);
};

const clusterPriority = (complaintCount, priority) => Math.min(1,
   complaintCount / 10 + ({ low: 0.05, medium: 0.15, high: 0.3, urgent: 0.5 }[priority] ?? 0.15));

export const upsertIncidentCluster = async (complaint) => {
   const matches = await analyzeIncident(complaint);
   const strongest = matches[0];
   if (!strongest) return { complaint, incident: null, matches: [] };

   const incident = await IncidentCluster.findOne({ complaintIds: strongest.complaint._id });
   const cluster = incident ?? await IncidentCluster.create({
      clusterId: `INC-${randomUUID().slice(0, 8).toUpperCase()}`,
      primaryComplaint: strongest.complaint._id,
      complaintIds: [strongest.complaint._id],
      category: strongest.complaint.category,
      departmentIds: strongest.complaint.assignedDepartment ? [strongest.complaint.assignedDepartment] : [],
      centroid: strongest.complaint.location,
      complaintCount: 1,
   });

   const complaintIds = [...new Set([...cluster.complaintIds.map(String), String(complaint._id)])];
   const departmentIds = [...new Set([
      ...cluster.departmentIds.map(String),
      ...(complaint.assignedDepartment ? [String(complaint.assignedDepartment)] : []),
   ])];
   cluster.complaintIds = complaintIds;
   cluster.departmentIds = departmentIds;
   cluster.complaintCount = complaintIds.length;
   cluster.similarityConfidence = strongest.score;
   cluster.priorityScore = clusterPriority(cluster.complaintCount, complaint.priority);
   cluster.affectedRadius = Math.max(cluster.affectedRadius, strongest.distance);
   await cluster.save();

   await Complaint.updateMany(
      { _id: { $in: complaintIds } },
      { $set: { groupId: cluster._id, similarityScore: strongest.score } }
   );
   return { complaint, incident: cluster, matches };
};

export default { analyzeIncident, extractIncidentFeatures, upsertIncidentCluster };