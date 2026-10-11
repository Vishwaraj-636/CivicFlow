import { z } from "zod";
import { supportedCategories } from "../config/complaintCategories.js";

export const registerSchema = z
   .object({
      email: z.string().email("Please provide a valid email address"),
      password: z.string().min(6, "Password must be at least 6 characters long"),
      fullname: z.string().min(3, "Full name must be at least 3 characters long"),
      contact: z.string().regex(/^[0-9]{10}$/, "Contact number must be 10 digits long"),
   })
   .passthrough();

export const loginSchema = z
   .object({
      email: z.string().email("Please provide a valid email address"),
      password: z.string().min(1, "Password is required"),
   })
   .passthrough();

export const createComplaintSchema = z
   .object({
      title: z
         .string()
         .min(5, "Title must be between 5 and 200 characters")
         .max(200, "Title must be between 5 and 200 characters"),
      description: z
         .string()
         .min(10, "Description must be between 10 and 5000 characters")
         .max(5000, "Description must be between 10 and 5000 characters"),
      category: z.enum(supportedCategories, {
         errorMap: () => ({ message: "Category is not supported" }),
      }),
      location: z.object({
         type: z.literal("Point").optional().default("Point"),
         coordinates: z
            .array(z.number())
            .length(2, "Coordinates must contain [longitude, latitude]")
            .refine(
               ([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
               { message: "Coordinates must be valid longitude (-180..180) and latitude (-90..90)" }
            ),
      }),
      address: z.string().optional(),
      submittedDespiteSimilar: z.boolean().optional().default(false),
   })
   .passthrough();

export const similarComplaintsQuerySchema = z
   .object({
      lat: z.coerce.number().min(-90).max(90),
      lng: z.coerce.number().min(-180).max(180),
      category: z.enum(supportedCategories, {
         errorMap: () => ({ message: "Category is not supported" }),
      }),
      text: z.string().min(1, "Text query is required"),
   })
   .passthrough();
