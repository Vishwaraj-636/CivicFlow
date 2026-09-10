import ImageKit, { toFile } from "@imagekit/nodejs";
import { config } from "../config/config.js";

const client = new ImageKit({
   privateKey: config.IMAGE_KIT_PRIVATE_KEY,
});

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
