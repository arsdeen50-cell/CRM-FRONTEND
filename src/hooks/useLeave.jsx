import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import axiosInstance from "@/utils/axiosConfig";
import {
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
} from "@/redux/leaveSlice";
import { LEAVE_API_END_POINT } from "@/constants";

export const useLeave = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

const getLeaves = async () => {
  try {
    dispatch(fetchLeavesStart());
    const res = await axiosInstance.get(`${LEAVE_API_END_POINT}/`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });
    dispatch(fetchLeavesSuccess(res.data.leaves));
    return res.data; // ✅ return for consistency
  } catch (err) {
    dispatch(fetchLeavesFailure(err.message));
    toast.error("Failed to fetch leaves");
    return null;
  }
};


  const createLeave = async (leaveData) => {
    try {
      dispatch(createLeaveStart());
      const res = await axiosInstance.post(`${LEAVE_API_END_POINT}/`, leaveData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      dispatch(createLeaveSuccess(res.data.leave));
      toast.success("Leave request submitted successfully");
      return true;
    } catch (err) {
      dispatch(createLeaveFailure(err.message));
      toast.error("Failed to create leave request");
      return false;
    }
  };
const getEmployeeLeaves = async () => {
  try {
    dispatch(fetchLeavesStart());
    const res = await axiosInstance.get(`${LEAVE_API_END_POINT}/employee`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });
    dispatch(fetchLeavesSuccess(res.data.leaves));
    return res.data; // ✅ return the response
  } catch (err) {
    dispatch(fetchLeavesFailure(err.message));
    toast.error("Failed to fetch your leaves");
    return null; // return null or false on error
  }
};


  const updateLeaveStatus = async (leaveId, statusData) => {
    try {
      dispatch(updateLeaveStart());
      const res = await axiosInstance.put(`${LEAVE_API_END_POINT}/${leaveId}/status`, statusData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      dispatch(updateLeaveSuccess(res.data.leave));
      toast.success("Leave status updated successfully");
      return true;
    } catch (err) {
      dispatch(updateLeaveFailure(err.message));
      toast.error("Failed to update leave status");
      return false;
    }
  };

  const deleteLeave = async (leaveId) => {
    try {
      dispatch(deleteLeaveStart());
      await axiosInstance.delete(`${LEAVE_API_END_POINT}/${leaveId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      dispatch(deleteLeaveSuccess(leaveId));
      toast.success("Leave deleted successfully");
      return true;
    } catch (err) {
      dispatch(deleteLeaveFailure(err.message));
      toast.error("Failed to delete leave");
      return false;
    }
  };

  return {
    getLeaves,
    createLeave,
    getEmployeeLeaves,
    updateLeaveStatus,
    deleteLeave,
  };
};
