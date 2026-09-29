const DEFAULT_COST_RULE = {
   dispatchCost: 150,
   travelCostPerKm: 25,
   laborCostPerHour: 300,
   inspectionCost: 100,
   materialCost: 500,
   averageHours: 2,
   averageTravelKm: 5,
};

export const compareIncidentCosts = (complaintCount = 1, rule = {}) => {
   const costs = { ...DEFAULT_COST_RULE, ...rule };
   const individualCost = complaintCount * (
      costs.dispatchCost
      + costs.averageTravelKm * costs.travelCostPerKm
      + costs.averageHours * costs.laborCostPerHour
      + costs.inspectionCost
      + costs.materialCost
   );
   const clusteredCost = costs.dispatchCost
      + costs.averageTravelKm * costs.travelCostPerKm
      + (costs.averageHours * costs.laborCostPerHour * Math.max(1, Math.min(complaintCount, 3)))
      + costs.inspectionCost
      + costs.materialCost;
   const estimatedSavings = Math.max(0, individualCost - clusteredCost);
   return {
      complaintCount,
      individualCost: Math.round(individualCost),
      clusteredCost: Math.round(clusteredCost),
      estimatedSavings: Math.round(estimatedSavings),
      savingsPercentage: individualCost ? Math.round((estimatedSavings / individualCost) * 100) : 0,
      basis: "Configurable estimated operational cost; not actual government expenditure",
      rule: costs,
   };
};

export default { compareIncidentCosts };