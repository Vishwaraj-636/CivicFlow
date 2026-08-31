import { setError, setLoading, setUser } from "../state/auth.slice";
import { register } from "../services/auth.api";
import { useDispatch } from "react-redux";

export const useAuth = () => {
   const dispatch = useDispatch();

   async function handleRegister({ email, contactNumber, password, fullName, isCitizen = true }) {
      try {
         dispatch(setLoading(true));
         const data = await register({
            email,
            contact: contactNumber,
            password,
            fullname: fullName,
            isCitizen
         });
         dispatch(setUser(data.user));
         dispatch(setError(null));
      }
      catch (error) {
         const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Registration failed";
         dispatch(setError(errorMessage));
      }
      finally {
         dispatch(setLoading(false));
      }
   }

   async function handleLogin({email,password}) {
      try{
         dispatch(setLoading(true));
         const data = await login({email,password});
         dispatch(setUser(data.user));
         dispatch(setError(null));
      }
      catch (error) {
         const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Login failed";
         dispatch(setError(errorMessage));
      }
      finally {
         dispatch(setLoading(false));
      }
   }



   return {
      handleRegister,
      handleLogin,
   }
}