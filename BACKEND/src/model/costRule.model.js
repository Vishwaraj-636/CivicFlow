import mongoose from "mongoose";

const costRuleSchema = new mongoose.Schema({
   name: { type: String, required: true, unique: true },
   dispatchCost: { type: Number, default: 150 },
   travelCostPerKm: { type: Number, default: 25 },
   laborCostPerHour: { type: Number, default: 300 },
   inspectionCost: { type: Number, default: 100 },
   materialCost: { type: Number, default: 500 },
   averageHours: { type: Number, default: 2 },
   averageTravelKm: { type: Number, default: 5 },
   isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("CostRule", costRuleSchema);