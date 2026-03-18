// useLeadSource.js
import { useState } from "react";
import axiosInstance from "@/utils/axiosConfig";
import { toast } from "sonner";

const LEAD_SOURCE_API = "/v1/leadsource";

const useLeadSource = () => {
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);

  // 🔹 Fetch all leads
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(LEAD_SOURCE_API);
      setLeads(res.data?.leads || []);
    } catch (err) {
      toast.error("Failed to fetch leads");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Create a new lead (with file upload support)
  const createLead = async (formData) => {
    try {
      setLoading(true);
      const res = await axiosInstance.post(LEAD_SOURCE_API, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Lead created successfully");
      await fetchLeads(); // Refresh list
      return res.data.lead;
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to create lead";
      toast.error(errorMessage);
      console.error("Create error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Update a lead (with file upload support)
  const updateLead = async (id, formData) => {
    try {
      setLoading(true);
      const res = await axiosInstance.put(`${LEAD_SOURCE_API}/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Lead updated successfully");
      await fetchLeads();
      return res.data.lead;
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to update lead";
      toast.error(errorMessage);
      console.error("Update error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Delete a document from lead
  const deleteDocument = async (leadId, docIndex) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`${LEAD_SOURCE_API}/${leadId}/documents/${docIndex}`);
      toast.success("Document deleted successfully");
      await fetchLeads();
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to delete document";
      toast.error(errorMessage);
      console.error("Delete document error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Delete a lead
  const deleteLead = async (id) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`${LEAD_SOURCE_API}/${id}`);
      toast.success("Lead deleted successfully");
      await fetchLeads();
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to delete lead";
      toast.error(errorMessage);
      console.error("Delete error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    leads,
    loading,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    deleteDocument
  };
};

export default useLeadSource;