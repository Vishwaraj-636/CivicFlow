const SLA_HOURS_BY_PRIORITY = {
   urgent: 24,
   high: 48,
   medium: 120,
   low: 168,
};

export const getSlaHours = (priority = "medium") => SLA_HOURS_BY_PRIORITY[priority] ?? SLA_HOURS_BY_PRIORITY.medium;

export const calculateResolutionDeadline = (priority, createdAt = new Date()) => (
   new Date(new Date(createdAt).getTime() + getSlaHours(priority) * 60 * 60 * 1000)
);

export const slaPolicy = { ...SLA_HOURS_BY_PRIORITY };
