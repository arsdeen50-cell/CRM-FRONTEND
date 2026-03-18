// hooks/useUser.js
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  fetchUsersStart,
  fetchUsersSuccess,
  fetchUsersFailure,
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFailure,
} from "../redux/userSlice";
import axiosInstance from "@/utils/axiosConfig";
import { USER_API_END_POINT } from "@/constants/index";

const useUser = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  const fetchUsers = async () => {
    try {
      dispatch(fetchUsersStart());
      const res = await axiosInstance.get(`${USER_API_END_POINT}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      dispatch(fetchUsersSuccess(res.data.users));
    } catch (error) {
      dispatch(fetchUsersFailure(error.message));
      toast.error("Failed to fetch users");
    }
  };

  const updateUser = async (id, userData) => {
    try {
      dispatch(updateUserStart());
      const res = await axiosInstance.put(
        `${USER_API_END_POINT}/admin/users/${id}`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      dispatch(updateUserSuccess(res.data.user));
      toast.success("User updated successfully");
      return true;
    } catch (error) {
      dispatch(updateUserFailure(error.message));
      toast.error("Failed to update user");
      return false;
    }
  };

  const deleteUser = async (id) => {
    try {
      dispatch(deleteUserStart());
      await axiosInstance.delete(`${USER_API_END_POINT}/admin/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      dispatch(deleteUserSuccess(id));
      toast.success("User deleted successfully");
      return true;
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
      toast.error("Failed to delete user");
      return false;
    }
  };

  return {
    fetchUsers,
    updateUser,
    deleteUser,
  };
};

export default useUser;