import { createSlice } from '@reduxjs/toolkit';
import { authApi } from '../../services/authApi';

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  accessToken: localStorage.getItem('accessToken') || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logoutLocally: (state) => {
      state.user = null;
      state.accessToken = null;
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      authApi.endpoints.login.matchFulfilled,
      (state, { payload }) => {
        state.user = payload.data.user;
        state.accessToken = payload.data.accessToken;
        localStorage.setItem('user', JSON.stringify(payload.data.user));
        localStorage.setItem('accessToken', payload.data.accessToken);
      }
    );
    builder.addMatcher(
      authApi.endpoints.switchRole.matchFulfilled,
      (state, { payload }) => {
        state.user = payload.data;
        localStorage.setItem('user', JSON.stringify(payload.data));
      }
    );
  },
});

export const { logoutLocally } = authSlice.actions;
export default authSlice.reducer;
