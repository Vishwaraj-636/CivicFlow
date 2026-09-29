import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const createModel = () => {
   if (process.env.LLM_PROVIDER !== "gemini" || !process.env.LLM_API_KEY) return null;
   return new ChatGoogleGenerativeAI({
      apiKey: process.env.LLM_API_KEY,
      model: process.env.LLM_MODEL || "gemini-2.0-flash",
      temperature: 0.1,
   });
};