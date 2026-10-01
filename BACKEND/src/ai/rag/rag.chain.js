import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createModel } from "../llm/model.provider.js";

const knowledgeDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../knowledge");

const loadKnowledge = async () => {
   const files = await fs.readdir(knowledgeDirectory);
   return Promise.all(files.filter((file) => file.endsWith(".md")).map(async (file) => ({
      name: file,
      content: await fs.readFile(path.join(knowledgeDirectory, file), "utf8"),
   })));
};

export const retrieveKnowledge = async (query) => {
   const terms = String(query).toLowerCase().split(/\W+/).filter((term) => term.length > 3);
   const documents = await loadKnowledge();
   return documents.map((document) => ({
      ...document,
      score: terms.filter((term) => document.content.toLowerCase().includes(term)).length,
   })).filter((document) => document.score > 0).sort((first, second) => second.score - first.score).slice(0, 3);
};

const groundedFallback = ({ query, incidentContext = "", documents = [] }) => {
   if (documents.length === 0) {
      return incidentContext
         ? `Live incident context: ${incidentContext} No matching procedure was found in the CivicFlow knowledge base. Confirm local rules before acting.`
         : `I could not find a matching CivicFlow procedure for "${query}". Please contact the responsible department for confirmation.`;
   }
   const excerpts = documents.map((document) => {
      const sentences = document.content.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 2).join(" ");
      return `${document.name}: ${sentences}`;
   }).join("\n");
   return `${incidentContext ? `Live incident context: ${incidentContext}\n\n` : ""}${excerpts}\n\nThese are project-created guidance documents, not official policy. Confirm local rules before field action.`;
};

export const answerWithKnowledge = async ({ query, incidentContext = "", documents }) => {
   const sources = documents.map((document) => document.name);
   const model = createModel();
   if (!model) {
      return { answer: groundedFallback({ query, incidentContext, documents }), sources, provider: "grounded-fallback" };
   }
   const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are the CivicFlow AI assistant. Answer the user's question naturally and helpfully. Use the live incident context and supplied project-created documents when relevant, but you may answer general civic-service questions from your general knowledge. Never present project-created documents as official policy. Say clearly when live CivicFlow data is unavailable. Cite supplied document names in a Sources line when you use them."],
      ["human", "Question: {query}\nLive incident context: {incidentContext}\nDocuments:\n{documents}"],
   ]);
   try {
      const answer = await prompt.pipe(model).pipe(new StringOutputParser()).invoke({
         query,
         incidentContext,
         documents: documents.map((document) => `${document.name}\n${document.content}`).join("\n\n"),
      });
      return { answer, sources, provider: process.env.LLM_PROVIDER };
   } catch (error) {
      console.error("LLM provider failed; using grounded fallback:", error.message);
      return { answer: groundedFallback({ query, incidentContext, documents }), sources, provider: "grounded-fallback" };
   }
};