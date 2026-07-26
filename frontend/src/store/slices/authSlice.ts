import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, TokenResponse } from '../../types/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  sessionInvalidated: boolean;
}

const savedAccessToken = localStorage.getItem('access_token');
const savedRefreshToken = localStorage.getItem('refresh_token');
const savedUser = localStorage.getItem('user_profile')
  ? JSON.parse(localStorage.getItem('user_profile')!)
  : null;

const initialState: AuthState = {
  user: savedUser,
  accessToken: savedAccessToken,
  refreshToken: savedRefreshToken,
  isAuthenticated: Boolean(savedAccessToken && savedUser),
  loading: false,
  error: null,
  sessionInvalidated: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<TokenResponse>) => {
      const { accessToken, refreshToken, userId, username, email, firstName, lastName, roles, sessionId } = action.payload;
      
      const user: User = { id: userId, username, email, firstName, lastName, roles, sessionId };
      
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.user = user;
      state.isAuthenticated = true;
      state.error = null;
      state.sessionInvalidated = false;

      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user_profile', JSON.stringify(user));
    },
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      localStorage.setItem('access_token', action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_profile');
    },
    setSessionInvalidated: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.sessionInvalidated = true;
      state.error = "Session invalidated. You logged in from another device.";

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_profile');
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setCredentials, updateAccessToken, logout, setSessionInvalidated, setError } = authSlice.actions;
export default authSlice.reducer;
