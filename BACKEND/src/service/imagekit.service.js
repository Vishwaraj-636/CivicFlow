import ImageKit, { toFile } from "@imagekit/nodejs";
import { config } from "../config/config.js";

export const MEDIA_RULES = {
   image: {
      types: new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]),
      maxBytes: 10 * 1024 * 1024,
   },
   video: {
      types: new Set(["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"]),
      maxBytes: 50 * 1024 * 1024,
   },
};

const client = new ImageKit({
   privateKey: config.IMAGE_KIT_PRIVATE_KEY,
});

export const validateMediaFile = (file) => {
   const kind = file.mimetype.startsWith("image/") ? "image" : "video";
   const rules = MEDIA_RULES[kind];

   if (!rules.types.has(file.mimetype)) {
      return `Unsupported ${kind} format`;
   }
   if (file.size > rules.maxBytes) {
      return `${kind === "image" ? "Image" : "Video"} exceeds the ${rules.maxBytes / (1024 * 1024)} MB limit`;
   }
   return null;
};

export const uploadMedia = async ({ buffer, fileName, type, folder = "CivicFlow" }) => {
   const result = await client.files.upload({
      file: await toFile(buffer, fileName),
      fileName,
      folder,
   });

   return {
      fileId: result.fileId,
      url: result.url,
      type,
      metadata: {
         originalName: fileName,
         mimeType: type,
         size: buffer.length,
      },
   };
};

export const deleteMedia = async (fileId) => {
   if (!fileId) {
      throw new Error("fileId is required");
   }

   return client.files.delete(fileId);
};

export const getMediaUrl = (media) => {
   if (typeof media === "string") {
      return media;
   }

   return media?.url ?? null;
};

export default {
   uploadMedia,
   deleteMedia,
   getMediaUrl,
};
