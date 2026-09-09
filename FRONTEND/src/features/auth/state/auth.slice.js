import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
   name: "auth",
   initialState: {
      user: null,
      loading: false,
      error: null,
      initialized: false,
   },
   reducers: {
      setUser: (state, action) => {
         state.user = action.payload;
      },
      setLoading: (state, action) => {
         state.loading = action.payload;
      },
      setError: (state, action) => {
         state.error = action.payload;
      },
      setInitialized: (state, action) => {
         state.initialized = action.payload;
      }
   }
})

export const { setError, setLoading, setUser, setInitialized } = authSlice.actions;
export default authSlice.reducer;