import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  leaves: [],
  loading: false,
  error: null,
};

const leaveSlice = createSlice({
  name: "leave",
  initialState,
  reducers: {
    fetchLeavesStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchLeavesSuccess(state, action) {
      state.leaves = action.payload;
      state.loading = false;
    },
    fetchLeavesFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    createLeaveStart(state) {
      state.loading = true;
      state.error = null;
    },
    createLeaveSuccess(state, action) {
      state.leaves.unshift(action.payload);
      state.loading = false;
    },
    createLeaveFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    updateLeaveStart(state) {
      state.loading = true;
      state.error = null;
    },
    updateLeaveSuccess(state, action) {
      const index = state.leaves.findIndex((l) => l._id === action.payload._id);
      if (index !== -1) {
        state.leaves[index] = action.payload;
      }
      state.loading = false;
    },
    updateLeaveFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    deleteLeaveStart(state) {
      state.loading = true;
      state.error = null;
    },
    deleteLeaveSuccess(state, action) {
      state.leaves = state.leaves.filter((l) => l._id !== action.payload);
      state.loading = false;
    },
    deleteLeaveFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchLeavesStart,
  fetchLeavesSuccess,
  fetchLeavesFailure,
  createLeaveStart,
  createLeaveSuccess,
  createLeaveFailure,
  updateLeaveStart,
  updateLeaveSuccess,
  updateLeaveFailure,
  deleteLeaveStart,
  deleteLeaveSuccess,
  deleteLeaveFailure,
} = leaveSlice.actions;

export default leaveSlice.reducer;
