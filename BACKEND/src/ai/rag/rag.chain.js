import fs from "node:fs/promises";
import path from "node:path";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createModel } from "../llm/model.provider.js";

const knowledgeDirectory = path.resolve(process.cwd(), "knowledge");

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

export const answerWithKnowledge = async ({ query, incidentContext = "", documents }) => {
   const sources = documents.map((document) => document.name);
   const model = createModel();
   if (!model) {
      return {
         answer: incidentContext
            ? `Based on the live incident record: ${incidentContext} Review the project-created procedure before acting.`
            : "No configured model is available. Review the retrieved CivicFlow procedure documents.",
         sources,
         provider: "grounded-fallback",
      };
   }
   const prompt = ChatPromptTemplate.fromMessages([
      ["system", "Answer only from the live incident context and supplied project-created documents. Say when information is unavailable. Do not present project-created documents as official policy. Cite document names in a Sources line."],
      ["human", "Question: {query}\nLive incident context: {incidentContext}\nDocuments:\n{documents}"],
   ]);
   const answer = await prompt.pipe(model).pipe(new StringOutputParser()).invoke({
      query,
      incidentContext,
      documents: documents.map((document) => `${document.name}\n${document.content}`).join("\n\n"),
   });
   return { answer, sources, provider: process.env.LLM_PROVIDER };
};