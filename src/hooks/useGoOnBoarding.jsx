import { useState } from "react";
import axiosInstance from "@/utils/axiosConfig";
import { toast } from "sonner";
import { ONBOARDING_API_END_POINT } from "@/constants";

const useGoOnBoarding = () => {
  const [loading, setLoading] = useState(false);
  const [onboardings, setOnboardings] = useState([]);
  const [pagination, setPagination] = useState(null);

  // 🔹 Fetch all onboardings (with pagination + filters)
  const fetchOnboardings = async (params = {}) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(ONBOARDING_API_END_POINT, { params });
      setOnboardings(res.data?.onboardings || []);
      setPagination(res.data?.pagination || null);
    } catch (err) {
      toast.error("Failed to fetch onboarding data");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Get onboarding by ID
  const fetchOnboardingById = async (id) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`${ONBOARDING_API_END_POINT}/${id}`);
      return res.data?.onboarding;
    } catch (err) {
      toast.error("Failed to fetch onboarding details");
      console.error("Fetch by ID error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Create a new onboarding (supports file uploads)
  const createOnboarding = async (formData) => {
    try {
      setLoading(true);
      const res = await axiosInstance.post(ONBOARDING_API_END_POINT, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Onboarding created successfully");
      await fetchOnboardings();
      return res.data.onboarding;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create onboarding";
      toast.error(msg);
      console.error("Create error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Update onboarding (with file uploads)
  const updateOnboarding = async (id, formData) => {
    try {
      setLoading(true);
      const res = await axiosInstance.put(`${ONBOARDING_API_END_POINT}/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Onboarding updated successfully");
      await fetchOnboardings();
      return res.data.onboarding;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update onboarding";
      toast.error(msg);
      console.error("Update error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Delete onboarding
  const deleteOnboarding = async (id) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`${ONBOARDING_API_END_POINT}/${id}`);
      toast.success("Onboarding deleted successfully");
      await fetchOnboardings();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete onboarding";
      toast.error(msg);
      console.error("Delete error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Delete document (specific file type or index)
  const deleteDocument = async (onboardingId, docType, docIndex = 0) => {
    try {
      setLoading(true);
      await axiosInstance.delete(
        `${ONBOARDING_API_END_POINT}/${onboardingId}/documents/${docType}/${docIndex}`
      );
      toast.success("Document deleted successfully");
      await fetchOnboardings();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete document";
      toast.error(msg);
      console.error("Delete document error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const previewOfferLetter = async (id) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`${ONBOARDING_API_END_POINT}/${id}/preview-offer`);
      
      // Convert base64 to blob and create URL
      const byteCharacters = atob(res.data.pdfData.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(blob);
      
      return pdfUrl;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to generate offer letter preview";
      toast.error(msg);
      console.error("Preview offer letter error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    onboardings,
    loading,
    pagination,
    fetchOnboardings,
    fetchOnboardingById,
    createOnboarding,
    updateOnboarding,
    deleteOnboarding,
    deleteDocument,
    previewOfferLetter, 
  };
};

export default useGoOnBoarding;
