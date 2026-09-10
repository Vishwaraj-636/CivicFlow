import { useMemo } from "react";

const useStaffDashboard = (complaints = []) => useMemo(() => ({
   total: complaints.length,
   pending: complaints.filter(({ status }) => ["submitted", "in_review"].includes(status)).length,
   assigned: complaints.filter(({ status }) => status === "assigned").length,
   inProgress: complaints.filter(({ status }) => ["assigned", "in_progress"].includes(status)).length,
   resolved: complaints.filter(({ status }) => status === "resolved").length,
   rejected: complaints.filter(({ status }) => status === "rejected").length,
}), [complaints]);

export default useStaffDashboard;
