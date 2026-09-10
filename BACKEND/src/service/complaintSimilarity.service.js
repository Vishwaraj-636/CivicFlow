import Complaint from "../model/complaint.model.js";

const SIMILARITY_CLASSIFICATIONS = {
   DUPLICATE: "duplicate",
   RELATED: "related",
   INDEPENDENT: "independent",
};

const tokenize = (value = "") => new Set(
   String(value)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
);

const jaccardSimilarity = (source, target) => {
   const union = new Set([...source, ...target]);
   if (union.size === 0) return 0;
   return [...source].filter((word) => target.has(word)).length / union.size;
};

const distanceInMeters = (first, second) => {
   const [firstLng, firstLat] = first;
   const [secondLng, secondLat] = second;
   const earthRadius = 6371000;
   const latitudeDelta = (secondLat - firstLat) * Math.PI / 180;
   const longitudeDelta = (secondLng - firstLng) * Math.PI / 180;
   const a = Math.sin(latitudeDelta / 2) ** 2
      + Math.cos(firstLat * Math.PI / 180)
      * Math.cos(secondLat * Math.PI / 180)
      * Math.sin(longitudeDelta / 2) ** 2;
   return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const findNearbyComplaints = async ({
   location,
   category,
   radiusInMeters = 1000,
   excludeComplaintId = null,
   limit = 20,
} = {}) => {
   if (!location?.coordinates || !category) return [];

   const query = {
      category,
      status: { $nin: ["deleted", "closed"] },
      location: {
         $near: {
            $geometry: location,
            $maxDistance: radiusInMeters,
         },
      },
   };
   if (excludeComplaintId) query._id = { $ne: excludeComplaintId };

   return Complaint.find(query).limit(limit);
};

export const calculateTextSimilarity = (sourceText = "", targetText = "") => {
   return jaccardSimilarity(tokenize(sourceText), tokenize(targetText));
};

export const calculateSimilarityScore = ({
   categoryScore = 0,
   locationScore = 0,
   textScore = 0,
} = {}) => {
   return Math.min(1, Math.max(0,
      categoryScore * 0.35 + locationScore * 0.25 + textScore * 0.4
   ));
};

export const classifySimilarity = (similarityScore = 0) => {
   if (similarityScore >= 0.8) {
      return SIMILARITY_CLASSIFICATIONS.DUPLICATE;
   }

   if (similarityScore >= 0.5) {
      return SIMILARITY_CLASSIFICATIONS.RELATED;
   }

   return SIMILARITY_CLASSIFICATIONS.INDEPENDENT;
};

export const findSimilarComplaints = async (complaint, options = {}) => {
   const nearbyComplaints = await findNearbyComplaints({
      location: complaint.location,
      category: complaint.category,
      excludeComplaintId: complaint._id,
      ...options,
   });

   return nearbyComplaints
      .map((candidate) => {
         const locationDistance = distanceInMeters(
            complaint.location.coordinates,
            candidate.location.coordinates
         );
         const locationScore = Math.max(0, 1 - locationDistance / (options.radiusInMeters ?? 1000));
         const textScore = calculateTextSimilarity(
            `${complaint.title} ${complaint.description}`,
            `${candidate.title} ${candidate.description}`
         );
         const similarityScore = calculateSimilarityScore({
            categoryScore: complaint.category === candidate.category ? 1 : 0,
            locationScore,
            textScore,
         });

         return {
            complaint: candidate,
            similarityScore,
            classification: classifySimilarity(similarityScore),
         };
      })
      .filter((match) => match.similarityScore >= 0.5)
      .sort((first, second) => second.similarityScore - first.similarityScore);
};

export default {
   findNearbyComplaints,
   calculateTextSimilarity,
   calculateSimilarityScore,
   classifySimilarity,
   findSimilarComplaints,
};
