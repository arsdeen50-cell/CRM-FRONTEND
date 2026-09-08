// hooks/useDesignation.js
import { useState } from "react";
import axiosInstance from "@/utils/axiosConfig";
import { toast } from "sonner";
import { DESIGNATION_API_END_POINT } from "@/constants";

const useDesignation = () => {
  const [loading, setLoading] = useState(false);
  const [designations, setDesignations] = useState([]);

  // Fetch all designations
  const fetchDesignations = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(DESIGNATION_API_END_POINT);
      setDesignations(res.data?.designations || []);
      return res.data?.designations || [];
    } catch (err) {
      toast.error("Failed to fetch designations");
      console.error("Fetch designations error:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create new designation
  const createDesignation = async (name) => {
    try {
      setLoading(true);
      const res = await axiosInstance.post(DESIGNATION_API_END_POINT, { name });
      toast.success("Designation created successfully");
      await fetchDesignations();
      return res.data.designation;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create designation";
      toast.error(msg);
      console.error("Create designation error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete designation
  const deleteDesignation = async (id) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`${DESIGNATION_API_END_POINT}/${id}`);
      toast.success("Designation deleted successfully");
      await fetchDesignations();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete designation";
      toast.error(msg);
      console.error("Delete designation error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    designations,
    loading,
    fetchDesignations,
    createDesignation,
    deleteDesignation,
  };
};

export default useDesignation;