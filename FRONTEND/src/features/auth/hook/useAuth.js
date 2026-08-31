import { setError, setLoading, setUser } from "../state/auth.slice";
import { register, login, requestDeptStaff } from "../services/auth.api";
import { useDispatch } from "react-redux";

export const useAuth = () => {
   const dispatch = useDispatch();

   async function handleRegister({ email, contact, password, fullname, role }) {
      try {
         dispatch(setLoading(true));
         const data = await register({
            email,
            contact,
            password,
            fullname,
            role
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

   async function handleDeptStaffRequest({ email, contact, password, fullname, department }) {
      try {
         dispatch(setLoading(true));
         const data = await requestDeptStaff({
            email,
            contact,
            password,
            fullname,
            department
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

   return {
      handleRegister,
      handleLogin,
      handleDeptStaffRequest
   }
}