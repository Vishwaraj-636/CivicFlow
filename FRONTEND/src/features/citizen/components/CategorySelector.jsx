import React from "react";

const CATEGORIES = [
   { id: "pothole", label: "Pothole", icon: "🕳️" },
   { id: "road_damage", label: "Road Damage", icon: "🛣️" },
   { id: "garbage", label: "Garbage", icon: "🗑️" },
   { id: "water_leakage", label: "Water Leakage", icon: "💧" },
   { id: "streetlight", label: "Streetlight", icon: "💡" },
   { id: "drainage", label: "Drainage", icon: "🌊" },
];

const CategorySelector = ({ value, onChange }) => {
   return (
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
         <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
               Category <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400">
               {value || "Select one"}
            </span>
         </div>

         <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => {
               const isSelected = value === cat.label;
               return (
                  <button
                     key={cat.id}
                     type="button"
                     onClick={() => onChange(cat.label)}
                     className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-2.5 text-center transition-all min-h-[80px] ${isSelected
                           ? "border-2 border-emerald-600 bg-emerald-50/50 font-bold text-emerald-900 shadow-sm"
                           : "border border-slate-200 hover:border-emerald-500 text-slate-700"
                        }`}
                  >
                     <span className="text-2xl">{cat.icon}</span>
                     <span className="text-[11px] leading-tight">{cat.label}</span>
                  </button>
               );
            })}
         </div>
         <p className="mt-2 text-[10px] text-slate-400 text-center">
            Your request will be automatically routed to the correct department based on the selected category.
         </p>
      </div>
   );
};

export default CategorySelector;

