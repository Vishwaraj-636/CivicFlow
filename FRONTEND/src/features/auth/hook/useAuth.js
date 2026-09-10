import {
   setError,
   setLoading,
   setUser,
   setInitialized
} from "../state/auth.slice";
import {
   register,
   login,
   requestDeptStaff,
   getGoogleAuthUrl,
   completeGoogleProfile,
   getDepartments,
   logout,
   getCurrentUser,
   updateProfile
} from "../services/auth.api";
import { useDispatch, useSelector } from "react-redux";

export const useAuth = () => {
   const dispatch = useDispatch();
   const { user, loading, error, initialized } = useSelector((state) => state.auth);

   const isAuthenticated = Boolean(user);

   async function handleRegister({ email, contact, password, fullname }) {
      try {
         dispatch(setLoading(true));
         const data = await register({
            email,
            contact,
            password,
            fullname
         });
         dispatch(setUser(data.user));
         dispatch(setError(null));
         return data;
      }
      catch (error) {
         const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Registration failed";
         dispatch(setError(errorMessage));
         throw error;
      }
      finally {
         dispatch(setLoading(false));
      }
   }

   async function handleLogin({ email, password }) {
      try {
         dispatch(setLoading(true));
         const data = await login({ email, password });
         dispatch(setUser(data.user));
         dispatch(setError(null));
         return data;
      }
      catch (error) {
         const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Login failed";
         dispatch(setError(errorMessage));
         throw error;
      }
      finally {
         dispatch(setLoading(false));
      }
   }

   async function handleDeptStaffRequest({ email, contact, password, fullname, departmentId }) {
      try {
         dispatch(setLoading(true));
         const data = await requestDeptStaff({
            email,
            contact,
            password,
            fullname,
            departmentId
         });
         dispatch(setError(null));
         return data;
      }
      catch (error) {
         const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Request failed";
         dispatch(setError(errorMessage));
         throw error;
      }
      finally {
         dispatch(setLoading(false));
      }
   }

   async function handleGoogleAuth() {
      try {
         const data = await getGoogleAuthUrl();
         window.location.href = data.url;
      } catch (error) {
         const errorMessage = error.response?.data?.message || "Failed to initialize Google authentication";
         dispatch(setError(errorMessage));
         throw error;
      }
   }

   async function handleCompleteProfile({ role, contact, departmentId }) {
      try {
         dispatch(setLoading(true));
         const data = await completeGoogleProfile({ role, contact, departmentId });
         dispatch(setUser(data.user));
         dispatch(setError(null));
         return data;
      } catch (error) {
         const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Profile completion failed";
         dispatch(setError(errorMessage));
         throw error;
      } finally {
         dispatch(setLoading(false));
      }
   }

   async function handleLogout() {
      try {
         dispatch(setLoading(true));
         await logout();
         dispatch(setUser(null));
         dispatch(setError(null));
      } catch (error) {
         const errorMessage = error.response?.data?.message || "Logout failed";
         dispatch(setError(errorMessage));
         throw error;
      } finally {
         dispatch(setLoading(false));
      }
   }

   async function handleGetCurrentUser() {
      try {
         dispatch(setLoading(true));
         const data = await getCurrentUser();
         dispatch(setUser(data.user));
         dispatch(setError(null));
         return data;
      } catch (error) {
         dispatch(setUser(null));
         // Optional: Do not set error for failed session check to avoid UI noise
      } finally {
         dispatch(setInitialized(true));
         dispatch(setLoading(false));
      }
   }

   async function handleUpdateProfile(profileData) {
      try {
         dispatch(setLoading(true));
         const data = await updateProfile(profileData);
         dispatch(setUser(data.user));
         dispatch(setError(null));
         return data;
      } catch (error) {
         const errorMessage = error.response?.data?.message || "Failed to update profile";
         dispatch(setError(errorMessage));
         throw error;
      } finally {
         dispatch(setLoading(false));
      }
   }

   return {
      user,
      loading,
      error,
      initialized,
      isAuthenticated,
      handleRegister,
      handleLogin,
      handleDeptStaffRequest,
      handleGoogleAuth,
      handleCompleteProfile,
      getDepartments,
      handleLogout,
      handleGetCurrentUser,
      handleUpdateProfile
   }
}