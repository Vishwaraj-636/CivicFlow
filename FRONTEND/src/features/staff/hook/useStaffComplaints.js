import { useCallback, useEffect, useMemo, useState } from "react";
import { getStaffComplaints } from "../services/staff.api";

const initialFilters = { status: "", priority: "", category: "", date: "" };

const matchesDate = (complaint, date) => {
   if (!date) return true;
   return complaint.createdAt?.slice(0, 10) === date;
};

const useStaffComplaints = (initialFilterValues = {}) => {
   const [complaints, setComplaints] = useState([]);
   const [filters, setFilters] = useState({ ...initialFilters, ...initialFilterValues });
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   const fetchComplaints = useCallback(async () => {
      setLoading(true);
      setError("");
      try {
         setComplaints(await getStaffComplaints());
      } catch (fetchError) {
         setError(fetchError.response?.data?.error ?? "Unable to load staff complaints.");
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => {
      fetchComplaints();
   }, [fetchComplaints]);

   const filteredComplaints = useMemo(() => complaints.filter((complaint) => (
      (!filters.status || complaint.status === filters.status) &&
      (!filters.priority || complaint.priority === filters.priority) &&
      (!filters.category || complaint.category === filters.category) &&
      matchesDate(complaint, filters.date)
   )), [complaints, filters]);

   return {
      complaints: filteredComplaints,
      allComplaints: complaints,
      filters,
      setFilters,
      loading,
      error,
      refresh: fetchComplaints,
   };
};

export default useStaffComplaints;
