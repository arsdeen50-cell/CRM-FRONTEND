import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllAttendanceStart, getAllAttendanceSuccess, getAllAttendanceFailure } from "../redux/attendanceSlice";
import axios from "axios";
import { toast } from "sonner";
import { ATTENDANCE_API_END_POINT } from "@/constants/index";
import axiosInstance from "@/utils/axiosConfig";

const useGetAllAttendance = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchAllAttendance = async () => {
      try {
        dispatch(getAllAttendanceStart());

        if (!token) throw new Error("No authentication token found");

        const res = await axiosInstance.get(`${ATTENDANCE_API_END_POINT}/all`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true
        });

        dispatch(getAllAttendanceSuccess(res.data.attendance || res.data));
      } catch (error) {
        dispatch(getAllAttendanceFailure(error.response?.data?.message || error.message));
        toast.error(error.response?.data?.message || "Failed to load attendance records");
      }
    };

    fetchAllAttendance();
  }, [dispatch, token]);
};

export default useGetAllAttendance;
