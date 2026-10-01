const rules = {
   urgent: ["dangerous", "injury", "fire", "collapse", "exposed wire", "sewage overflow", "flooding"],
   high: ["blocked", "broken", "leak", "outage", "accident", "unsafe", "contamination", "overflow"],
   medium: ["damaged", "noise", "waste", "streetlight", "pothole"],
};

const textFor = (complaint) => `${complaint?.category ?? ""} ${complaint?.title ?? ""} ${complaint?.description ?? ""}`.toLowerCase();

export const scoreComplaintPriority = (complaint) => {
   const text = textFor(complaint);
   const matched = Object.entries(rules).find(([, terms]) => terms.some((term) => text.includes(term)));
   const hasEvidence = Array.isArray(complaint?.media) && complaint.media.length > 0;
   if (matched?.[0] === "urgent" || (matched?.[0] === "high" && hasEvidence)) return "urgent";
   if (matched?.[0] === "high") return "high";
   if (matched?.[0] === "medium" || hasEvidence) return "medium";
   return "low";
};

export const priorityExplanation = (complaint) => {
   const priority = scoreComplaintPriority(complaint);
   return `Automatic priority ${priority}: matched complaint category, title, description, and available evidence.`;
};
