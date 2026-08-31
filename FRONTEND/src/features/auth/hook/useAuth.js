import { setError,setLoading,setUser } from "../state/auth.slice";
import { register } from "../services/auth.api";
import { useDispatch } from "react-redux";

export const useAuth = () => {
   const dispatch = useDispatch();

   async function handleRegister({email, contact, password, fullName, isCitizen=true}) {
      const data = await register({email, contact, password, fullName, isCitizen});
      dispatch(setUser(data.user));
   }

   return {
      handleRegister,
   }
}