import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as api from '../api/mockApi.js';
import { logout } from './authSlice.js';

const initialState = { data: null, loading: false };

export const loadWallet = createAsyncThunk('wallet/load', async (_, { getState, rejectWithValue }) => {
  try {
    return await api.getWallet(getState().auth.user.id);
  } catch (e) {
    return rejectWithValue(e.message);
  }
});

/* Every action calls the API, then refreshes the wallet snapshot. Errors surface via .unwrap(). */
const action = (name, fn) =>
  createAsyncThunk(`wallet/${name}`, async (payload, { getState, dispatch, rejectWithValue }) => {
    try {
      await fn(getState().auth.user.id, payload);
      await dispatch(loadWallet()).unwrap();
    } catch (e) {
      return rejectWithValue(typeof e === 'string' ? e : e.message);
    }
  });

export const createBucket = action('createBucket', api.createBucket);
export const updateBucket = action('updateBucket', api.updateBucket);
export const deleteBucket = action('deleteBucket', api.deleteBucket);
export const addIncome = action('addIncome', api.addIncome);
export const saveRules = action('saveRules', api.saveRules);
export const addExpense = action('addExpense', api.addExpense);
export const transfer = action('transfer', api.transfer);
export const returnLoan = action('returnLoan', api.returnLoan);
export const createSharedBucket = action('createSharedBucket', api.createSharedBucket);
export const contribute = action('contribute', api.contribute);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadWallet.pending, (state) => {
        state.loading = state.data === null;
      })
      .addCase(loadWallet.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(loadWallet.rejected, (state) => {
        state.loading = false;
      })
      .addCase(logout.fulfilled, () => initialState);
  },
});

export default walletSlice.reducer;

/* ---- Selectors ---- */
export const selectWallet = (state) => state.wallet.data;

export function selectTotals(state) {
  const data = state.wallet.data;
  if (!data) return null;
  const personal = data.buckets.filter((b) => !b.shared);
  const shared = data.buckets.filter((b) => b.shared);
  const personalTotal = personal.reduce((s, b) => s + b.balance, 0);
  const sharedMine = shared.reduce(
    (s, b) => s + (b.contributions.find((c) => c.isMe)?.total || 0),
    0
  );
  return {
    unallocated: data.unallocated,
    personalTotal,
    sharedMine,
    total: data.unallocated + personalTotal + sharedMine,
  };
}
