import { createSlice } from "@reduxjs/toolkit";

const attendanceSlice = createSlice({
  name: "attendance",
  initialState: {
    myAttendance: [],
    allAttendance: [],
    todayAttendance: null,
    loading: false,
    error: null
  },
  reducers: {
    // Actions
    punchInStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    punchInSuccess: (state, action) => {
      state.loading = false;
      state.todayAttendance = action.payload;
    },
    punchInFailure: (state, action) => {
      state.loading = false;
      // Shown as a toast; kept apart from state.error so a refused punch doesn't replace the dashboard
      state.actionError = action.payload;
    },
    punchOutStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    punchOutSuccess: (state, action) => {
      state.loading = false;
      state.todayAttendance = action.payload;
    },
    punchOutFailure: (state, action) => {
      state.loading = false;
      // Shown as a toast; kept apart from state.error so a refused punch doesn't replace the dashboard
      state.actionError = action.payload;
    },
    getMyAttendanceStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getMyAttendanceSuccess: (state, action) => {
        state.loading = false;
        // Store just the attendance array, not the whole response
        state.myAttendance = action.payload.attendance;
        
        // Find today's attendance if needed
        if (Array.isArray(state.myAttendance)) {
          // An open shift (overnight ones run past midnight), otherwise the one that started today
          const today = new Date().setHours(0, 0, 0, 0);
          const since = Date.now() - 20 * 60 * 60 * 1000;
          state.todayAttendance =
            state.myAttendance.find((record) => !record.punchOut && new Date(record.punchIn) >= since) ||
            state.myAttendance.find((record) => new Date(record.punchIn) >= today);
        }
      },
    getMyAttendanceFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    getAllAttendanceStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getAllAttendanceSuccess: (state, action) => {
      state.loading = false;
      state.allAttendance = action.payload;
    },
    getAllAttendanceFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
     deleteAttendanceStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    deleteAttendanceSuccess: (state, action) => {
      state.loading = false;
      state.attendanceList = state.attendanceList.filter(
        (record) => record._id !== action.payload
      );
    },
    deleteAttendanceFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  }
});

export const {
  punchInStart,
  punchInSuccess,
  punchInFailure,
  punchOutStart,
  punchOutSuccess,
  punchOutFailure,
  getMyAttendanceStart,
  getMyAttendanceSuccess,
  getMyAttendanceFailure,
  getAllAttendanceStart,
  getAllAttendanceSuccess,
  getAllAttendanceFailure,
  deleteAttendanceStart,
  deleteAttendanceSuccess,
  deleteAttendanceFailure,
} = attendanceSlice.actions;

export default attendanceSlice.reducer;