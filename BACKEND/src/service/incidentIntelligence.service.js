import { randomUUID } from "node:crypto";
import Complaint from "../model/complaint.model.js";
import IncidentCluster from "../model/incidentCluster.model.js";

import {
   DEFAULT_HISC_CONFIG,
   loadConfig,
} from "../hisc/config.js";

import {
   CIVIC_CONCEPT_DICTIONARY,
   CAUSAL_CONCEPT_PAIRS,
   CIVIC_STOP_WORDS,
   normalizeCivicText,
   extractCivicConcepts,
   tokenize,
   intersectionRatio,
   hasOpposingDirections,
   hasCausalOrSharedConcept,
   distanceInMeters,
   categoryScore,
   classifyIncidentScore,
   scorePair,
} from "../hisc/scorePair.js";

export const HISC_CONFIG = DEFAULT_HISC_CONFIG;
export const resolveConfig = loadConfig;

export {
   CIVIC_CONCEPT_DICTIONARY,
   CAUSAL_CONCEPT_PAIRS,
   CIVIC_STOP_WORDS,
   normalizeCivicText,
   extractCivicConcepts,
   tokenize,
   intersectionRatio,
   hasOpposingDirections,
   hasCausalOrSharedConcept,
   distanceInMeters,
   categoryScore,
   classifyIncidentScore,
   scorePair,
};

export const extractIncidentFeatures = (complaint, candidate, rawConfig = HISC_CONFIG) => {
   const config = resolveConfig(rawConfig);
   const analysis = scorePair(complaint, candidate, config);
   return {
      score: analysis.score,
      features: analysis.features,
      distance: analysis.distance,
      hours: analysis.hours,
      explanation: analysis.explanation,
      context: analysis.context,
   };
};

export const retrieveIncidentCandidates = async (complaint, rawConfig = HISC_CONFIG) => {
   const config = resolveConfig(rawConfig);
   return Complaint.find({
      _id: { $ne: complaint._id },
      status: { $nin: ["deleted", "closed"] },
      createdAt: { $gte: new Date(new Date(complaint.createdAt).getTime() - config.temporalWindowHours * 3600000) },
      location: { $near: { $geometry: complaint.location, $maxDistance: config.radiusInMeters } },
   }).limit(40);
};

export const analyzeIncident = async (complaint, rawConfig = HISC_CONFIG) => {
   const config = resolveConfig(rawConfig);
   const candidates = await retrieveIncidentCandidates(complaint, config);
   return candidates.map((candidate) => {
      const result = scorePair(complaint, candidate, config);
      return {
         complaint: candidate,
         classification: result.label,
         score: result.score,
         features: result.features,
         distance: result.distance,
         hours: result.hours,
         explanation: result.explanation,
         context: result.context,
      };
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

export default { analyzeIncident, extractIncidentFeatures, upsertIncidentCluster, scorePair };