import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    getMyAttendanceStart,
    getMyAttendanceSuccess,
    getMyAttendanceFailure,
} from "../redux/attendanceSlice";
import axios from "axios";
import { toast } from "sonner";
import { ATTENDANCE_API_END_POINT } from "@/constants/index";
import axiosInstance from "@/utils/axiosConfig";

const useGetAttendance = () => {
    const dispatch = useDispatch();
    const { myAttendance, loading, error } = useSelector((state) => state.attendance);
    const { token } = useSelector((state) => state.auth);

    const refetch = useCallback(async () => {
        try {
            dispatch(getMyAttendanceStart());

            if (!token) throw new Error("No authentication token found");

            const res = await axiosInstance.get(`${ATTENDANCE_API_END_POINT}/user-all`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                withCredentials: true
            });

            dispatch(getMyAttendanceSuccess(res.data));
            return res.data;
        } catch (error) {
            dispatch(getMyAttendanceFailure(error.response?.data?.message || error.message));
            toast.error(error.response?.data?.message || "Failed to load attendance");
            throw error;
        }
    }, [dispatch, token]);

    useEffect(() => {
        refetch(); // Fetch on mount
    }, [refetch]);

    return { 
        refetch,
        data: myAttendance,
        loading,
        error 
    };
};

export default useGetAttendance;
