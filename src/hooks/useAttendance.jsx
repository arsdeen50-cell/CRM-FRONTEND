import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
    punchInStart,
    punchInSuccess,
    punchInFailure,
    punchOutStart,
    punchOutSuccess,
    punchOutFailure,
    getMyAttendanceStart,
    getMyAttendanceSuccess,
    getMyAttendanceFailure,
    deleteAttendanceStart,
    deleteAttendanceSuccess,
    deleteAttendanceFailure,
} from "../redux/attendanceSlice";
import axios from "axios";
import { ATTENDANCE_API_END_POINT } from "@/constants/index";
import axiosInstance from "@/utils/axiosConfig";

const useAttendance = () => {
    const dispatch = useDispatch();
    const { token } = useSelector((state) => state.auth);

 const punchIn = async () => {
  try {
    dispatch(punchInStart());

    const res = await axiosInstance.post(
      `${ATTENDANCE_API_END_POINT}/punch-in`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      }
    );

    dispatch(punchInSuccess(res.data));

    // ✅ ADD THIS (VERY IMPORTANT)
    await getMyAttendance(); 

    toast.success("Punched in successfully");

    return { success: true };
  } catch (error) {
    dispatch(punchInFailure(error.message));
    toast.error(error.message);
    return { success: false };
  }
};

    const punchOut = async () => {
  try {
    dispatch(punchOutStart());

    const res = await axiosInstance.post(
      `${ATTENDANCE_API_END_POINT}/punch-out`,
      {}, // ✅ FIX 2 also here (explained below)
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    dispatch(punchOutSuccess(res.data));

    // ✅ VERY IMPORTANT (same as punchIn)
    await getMyAttendance();

    toast.success("Punched out successfully");

    return { success: true }; // ✅ also return success
  } catch (error) {
    dispatch(punchOutFailure(error.response?.data?.message || error.message));
    toast.error(error.response?.data?.message || "Failed to punch out");
    return { success: false };
  }
};

    const getMyAttendance = async () => {
        try {
            dispatch(getMyAttendanceStart());
            // const token = localStorage.getItem("token");
            const res = await axiosInstance.get(`${ATTENDANCE_API_END_POINT}/user-all`, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            dispatch(getMyAttendanceSuccess(res.data));
        } catch (error) {
            dispatch(getMyAttendanceFailure(error.response?.data?.message || error.message));
        }
    };

    const deleteAttendance = async (id) => {
        try {
            dispatch(deleteAttendanceStart());

            await axiosInstance.delete(`${ATTENDANCE_API_END_POINT}/delete/${id}`);

            dispatch(deleteAttendanceSuccess(id));
            toast.success("Attendance record deleted successfully");
            return true;
        } catch (error) {
            dispatch(deleteAttendanceFailure(error.response?.data?.message || error.message));
            toast.error(error.response?.data?.message || "Failed to delete attendance record");
            return false;
        }
    };

const startBreak = async () => {
  try {
    const response = await axiosInstance.post(`${ATTENDANCE_API_END_POINT}/break-start`, {}, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    toast.success("Break started");
    return { success: true, data: response.data };
  } catch (error) {
    toast.error(error.response?.data?.msg || "Failed to start break");
    return { success: false, error: error.response?.data?.msg };
  }
};

const endBreak = async () => {
  try {
    const response = await axiosInstance.post(`${ATTENDANCE_API_END_POINT}/break-end`, {}, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    toast.success("Break ended");
    return { success: true, data: response.data };
  } catch (error) {
    toast.error(error.response?.data?.msg || "Failed to end break");
    return { success: false, error: error.response?.data?.msg };
  }
};

    return { punchIn, punchOut, getMyAttendance, deleteAttendance, startBreak, endBreak };
};

export default useAttendance;
