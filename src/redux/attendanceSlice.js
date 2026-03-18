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
      state.error = action.payload;
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
      state.error = action.payload;
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
          const today = new Date().setHours(0, 0, 0, 0);
          state.todayAttendance = state.myAttendance.find(record => 
            new Date(record.punchIn) >= today
          );
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