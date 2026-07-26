import { createSlice } from '@reduxjs/toolkit';

interface AppState {
  systemName: string;
}

const initialState: AppState = {
  systemName: 'OmniTest Engine — Universal CBT System',
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {},
});

export default appSlice.reducer;
