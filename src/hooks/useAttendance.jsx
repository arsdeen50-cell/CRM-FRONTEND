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

// Device location for the punch-in geofence. Asked only when the geofence is on; resolves {} if it can't be had
// (the server then decides: flag the punch, or refuse it in "block" mode).
const punchLocation = async () => {
    let g;
    try {
        g = (await axiosInstance.get(`${ATTENDANCE_API_END_POINT}/geofence`)).data;
    } catch {
        return {};
    }
    if (!g?.enabled || g.punchRule === "wfh" || !navigator.geolocation) return {};
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
            (e) => {
                if (e.code === 1) toast.error("Location access is blocked - allow it for this site so your punch can be checked against the office");
                resolve({});
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        );
    });
};

const useAttendance = () => {
    const dispatch = useDispatch();
    const { token } = useSelector((state) => state.auth);

 const punchIn = async () => {
  try {
    dispatch(punchInStart());

    const res = await axiosInstance.post(
      `${ATTENDANCE_API_END_POINT}/punch-in`,
      await punchLocation(),
      {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      }
    );

    dispatch(punchInSuccess(res.data));

    // ✅ ADD THIS (VERY IMPORTANT)
    await getMyAttendance(); 

    const where = res.data?.punchInLocation?.status;
    const notice = where === "outside" ? "Punched in - you look to be outside the office, so HR will see this flagged" : where === "unknown" ? "Punched in without your location - HR will see this flagged" : "";
    if (notice) {
      toast.warning(notice, { id: "punch-notice", duration: 8000 });
    } else toast.success("Punched in successfully");

    return { success: true };
  } catch (error) {
    const msg = error.response?.data?.msg || error.response?.data?.message || error.message;
    dispatch(punchInFailure(msg));
    toast.error(msg, { duration: error.response?.data?.geofence ? 8000 : undefined });
    return { success: false };
  }
};

    const punchOut = async () => {
  try {
    dispatch(punchOutStart());

    const res = await axiosInstance.post(
      `${ATTENDANCE_API_END_POINT}/punch-out`,
      await punchLocation(),
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
    dispatch(punchOutFailure(error.response?.data?.msg || error.response?.data?.message || error.message));
    toast.error(error.response?.data?.msg || error.response?.data?.message || "Failed to punch out");
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
