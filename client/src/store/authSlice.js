import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as api from '../api/mockApi.js';

const wrap = (fn) => async (payload, { rejectWithValue }) => {
  try {
    return await fn(payload);
  } catch (e) {
    return rejectWithValue(e.message);
  }
};

export const restoreSession = createAsyncThunk('auth/restore', wrap(() => api.me()));
export const login = createAsyncThunk('auth/login', wrap((p) => api.login(p)));
export const register = createAsyncThunk('auth/register', wrap((p) => api.register(p)));
export const logout = createAsyncThunk('auth/logout', wrap(() => api.logout()));

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, ready: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.ready = true;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.ready = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export default authSlice.reducer;
