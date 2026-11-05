import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import walletReducer from './walletSlice.js';

const store = configureStore({
  reducer: { auth: authReducer, wallet: walletReducer },
});

export default store;
