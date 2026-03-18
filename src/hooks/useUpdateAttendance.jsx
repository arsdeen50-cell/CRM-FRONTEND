import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { ATTENDANCE_API_END_POINT } from "@/constants/index";
import axiosInstance from "@/utils/axiosConfig";

const useUpdateAttendance = () => {
  const { token } = useSelector((state) => state.auth);

  const updateAttendance = async (id, data) => {
    try {
      const res = await axiosInstance.put(
        `${ATTENDANCE_API_END_POINT}/update/${id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      toast.success("Attendance updated successfully");
      return res.data.attendance;
    } catch (err) {
      const msg = err.response?.data?.msg || err.message;
      toast.error(msg);
      throw new Error(msg);
    }
  };

  return { updateAttendance };
};

export default useUpdateAttendance;
