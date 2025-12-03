import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  authReady: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
    },
    setAuthReady: (state) => {
      state.authReady = true;
    },
  },
});

export const { login, logout, setAuthReady } = authSlice.actions;
export default authSlice.reducer;
