import { useCallback, useState } from "react";
import {
   acceptComplaint,
   rejectComplaint,
   resolveComplaint,
   updateComplaintStatus,
} from "../services/staff.api";

export const useComplaintActions = () => {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   const runAction = useCallback(async (action) => {
      setLoading(true);
      setError("");
      try {
         return await action();
      } catch (actionError) {
         const message = actionError.response?.data?.error ?? "Unable to update complaint.";
         setError(message);
         throw actionError;
      } finally {
         setLoading(false);
      }
   }, []);

   const accept = useCallback((complaintId) => (
      runAction(() => acceptComplaint(complaintId))
   ), [runAction]);

   const reject = useCallback((complaintId, reason) => (
      runAction(() => rejectComplaint(complaintId, reason))
   ), [runAction]);

   const updateStatus = useCallback((complaintId, newStatus, options = {}) => (
      runAction(() => updateComplaintStatus(complaintId, newStatus, options))
   ), [runAction]);

   const resolve = useCallback((complaintId, resolutionDescription, resolutionMedia = []) => (
      runAction(() => resolveComplaint(complaintId, resolutionDescription, resolutionMedia))
   ), [runAction]);

   return {
      accept,
      reject,
      updateStatus,
      resolve,
      loading,
      error,
      clearError: () => setError(""),
   };
};

export default useComplaintActions;
