import { body, validationResult } from "express-validator";
import { supportedCategories } from "../config/complaintCategories.js";

const protectedFields = [
   "citizenId",
   "status",
   "assignedDepartment",
   "assignedStaff",
   "similarityScore",
   "groupId",
   "duplicateOf",
   "resolutionDescription",
   "resolutionMedia",
];

const supportedMediaTypePattern = /^(image\/(jpeg|png|webp|gif)|video\/(mp4|quicktime|x-msvideo|webm))$/i;
function validateRequest(req, res, next) {
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
   }
   next();
}

function validateProtectedFields() {
   return body().custom((requestBody) => {
      const submittedFields = protectedFields.filter((field) => field in requestBody);
      if (submittedFields.length > 0) {
         throw new Error(`The following fields are backend-controlled: ${submittedFields.join(", ")}`);
      }
      return true;
   });
}

function createLocationValidation() {
   return body("location")
      .isObject().withMessage("Location must be a GeoJSON object")
      .custom((location) => {
         if (location.type !== "Point") {
            throw new Error('Location type must be "Point"');
         }

         if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
            throw new Error("Location coordinates must be [longitude, latitude]");
         }

         const [longitude, latitude] = location.coordinates;
         if (
            typeof longitude !== "number" ||
            typeof latitude !== "number" ||
            longitude < -180 ||
            longitude > 180 ||
            latitude < -90 ||
            latitude > 90
         ) {
            throw new Error("Location coordinates must contain valid longitude and latitude values");
         }

         return true;
      });
}

function createMediaValidation() {
   return body("media")
      .optional()
      .isArray().withMessage("Media must be an array")
      .bail()
      .custom((media) => media.every((item) => (
         item &&
         typeof item === "object" &&
         typeof item.fileId === "string" &&
         typeof item.url === "string" &&
         supportedMediaTypePattern.test(item.type) &&
         (item.metadata === undefined || (
            item.metadata &&
            typeof item.metadata === "object" &&
            (item.metadata.originalName === undefined || typeof item.metadata.originalName === "string") &&
            (item.metadata.mimeType === undefined || typeof item.metadata.mimeType === "string") &&
            (item.metadata.size === undefined || (
               typeof item.metadata.size === "number" && item.metadata.size >= 0
            ))
         ))
      ))).withMessage("Media must contain { fileId, url, type } with a supported image or video type");
}

function createComplaintFields() {
   return [
      body("title")
         .isString().withMessage("Title must be a string")
         .trim()
         .notEmpty().withMessage("Title is required"),
      body("description")
         .isString().withMessage("Description must be a string")
         .trim()
         .notEmpty().withMessage("Description is required"),
      body("category")
         .isString().withMessage("Category must be a string")
         .trim()
         .notEmpty().withMessage("Category is required")
         .isIn(supportedCategories).withMessage("Category is not supported"),
      createLocationValidation(),
      body("address")
         .isString().withMessage("Address must be a string")
         .trim()
         .notEmpty().withMessage("Address is required"),
      createMediaValidation(),
   ];
}

export const validateCreateComplaint = [
   validateProtectedFields(),
   ...createComplaintFields(),
   validateRequest,
];

export const validateUpdateComplaint = [
   validateProtectedFields(),
   ...createComplaintFields().map((field) => field.optional()),
   body().custom((requestBody) => {
      const editableFields = ["title", "description", "category", "location", "address", "media"];
      if (!editableFields.some((field) => field in requestBody)) {
         throw new Error("At least one complaint field is required");
      }
      return true;
   }),
   validateRequest,
];

export const validateUpdateComplaintStatus = [
   body("status")
      .isIn(["submitted", "in_review", "assigned", "resolved", "rejected", "closed"])
      .withMessage("Invalid complaint status"),
   validateRequest,
];

export const validateComplaintAssignment = [
   body("assignedDepartment").isMongoId().withMessage("A valid department ID is required"),
   body("assignedStaff").optional().isMongoId().withMessage("Assigned staff must be a valid user ID"),
   validateRequest,
];

export const validateComplaintCreation = validateCreateComplaint;
export const validateComplaintUpdate = validateUpdateComplaint;
