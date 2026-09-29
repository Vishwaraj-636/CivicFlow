import fs from "node:fs";
import path from "node:path";

const point = (longitude, latitude) => ({ type: "Point", coordinates: [longitude, latitude] });

export const evaluationDataset = [
   {
      label: "duplicate",
      first: { category: "Roads & Transport", title: "Large pothole near main gate", description: "Deep road crater outside entrance", location: point(77.5946, 12.9716), createdAt: "2026-01-01T09:00:00Z" },
      second: { category: "Roads & Transport", title: "Deep road damage at entrance", description: "Pothole by the main gate", location: point(77.5949, 12.9718), createdAt: "2026-01-01T11:00:00Z" },
   },
   {
      label: "related",
      first: { category: "Roads & Transport", title: "Road surface broken", description: "Several cracks on the road", location: point(77.5946, 12.9716), createdAt: "2026-01-01T09:00:00Z" },
      second: { category: "Street Infrastructure", title: "Roadside streetlight damage", description: "Road damage beside the lamp post", location: point(77.5950, 12.9720), createdAt: "2026-01-01T15:00:00Z" },
   },
   {
      label: "independent",
      first: { category: "Waste & Cleanliness", title: "Overflowing bins", description: "Garbage has not been collected", location: point(77.5946, 12.9716), createdAt: "2026-01-01T09:00:00Z" },
      second: { category: "Water & Utilities", title: "Water supply interruption", description: "No water since yesterday", location: point(77.6800, 13.0200), createdAt: "2026-01-10T09:00:00Z" },
   },
];

const parseCSV = (source) => {
   const rows = [];
   let row = [];
   let value = "";
   let quoted = false;
   for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (character === '"' && source[index + 1] === '"' && quoted) {
         value += '"';
         index += 1;
      } else if (character === '"') {
         quoted = !quoted;
      } else if (character === "," && !quoted) {
         row.push(value);
         value = "";
      } else if ((character === "\n" || character === "\r") && !quoted) {
         if (character === "\r" && source[index + 1] === "\n") index += 1;
         row.push(value);
         if (row.some((cell) => cell.trim())) rows.push(row);
         row = [];
         value = "";
      } else {
         value += character;
      }
   }
   if (value || row.length) {
      row.push(value);
      rows.push(row);
   }
   const [headers, ...data] = rows;
   return data.map((cells) => Object.fromEntries(headers.map((header, index) => [header.trim(), cells[index]?.trim() ?? ""])));
};

const csvComplaint = (row, suffix) => ({
   category: row[`category_${suffix}`],
   title: row[`complaint_${suffix}`],
   description: "",
   location: point(Number(row[`longitude_${suffix}`]), Number(row[`latitude_${suffix}`])),
   createdAt: `${row[`timestamp_${suffix}`]}Z`,
});

export const loadEvaluationDataset = (filePath = path.resolve(process.cwd(), "..", "civicflow_400_labeled_complaint_pairs.csv")) => {
   if (!fs.existsSync(filePath)) return evaluationDataset;
   return parseCSV(fs.readFileSync(filePath, "utf8")).map((row) => ({
      pairId: row.pair_id,
      incidentId: row.incident_id || null,
      label: row.label,
      first: csvComplaint(row, "a"),
      second: csvComplaint(row, "b"),
   }));
};