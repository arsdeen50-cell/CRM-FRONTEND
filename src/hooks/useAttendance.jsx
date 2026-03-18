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
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                },
            );

            dispatch(punchInSuccess(res.data));
            toast.success("Punched in successfully");
        } catch (error) {
            dispatch(punchInFailure(error.message));
            toast.error(error.message);
        }
    };

    const punchOut = async () => {
        try {
            dispatch(punchOutStart());

            const res = await axiosInstance.post(
                `${ATTENDANCE_API_END_POINT}/punch-out`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                },
            );

            dispatch(punchOutSuccess(res.data));
            toast.success("Punched out successfully");
        } catch (error) {
            dispatch(punchOutFailure(error.response?.data?.message || error.message));
            toast.error(error.response?.data?.message || "Failed to punch out");
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

    return { punchIn, punchOut, getMyAttendance, deleteAttendance };
};

export default useAttendance;
