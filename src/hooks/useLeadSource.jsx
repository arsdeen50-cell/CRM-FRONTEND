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
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Lead created successfully");
      await fetchLeads();
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
        headers: { "Content-Type": "multipart/form-data" },
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

  // 🔹 Move a lead between pipeline stages (Kanban drag, dropdown, Won/Lost action)
  const updateLeadStage = async (id, stage, changedBy, reason) => {
    try {
      // Optimistic update so Kanban drag feels instant
      setLeads((prev) =>
        prev.map((lead) => (lead._id === id ? { ...lead, pipelineStage: stage } : lead))
      );
      const res = await axiosInstance.patch(`${LEAD_SOURCE_API}/${id}/stage`, {
        stage,
        changedBy,
        reason,
      });
      toast.success(`Moved to "${stage}"`);
      await fetchLeads();
      return res.data.lead;
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to update stage";
      toast.error(errorMessage);
      console.error("Stage update error:", err);
      await fetchLeads(); // revert optimistic update
      throw err;
    }
  };

  // 🔹 Log a quick activity (call / email / meeting / note)
  const logActivity = async (id, { type, note, loggedBy }) => {
    try {
      setLoading(true);
      const res = await axiosInstance.post(`${LEAD_SOURCE_API}/${id}/activity`, {
        type,
        note,
        loggedBy,
      });
      toast.success("Activity logged");
      await fetchLeads();
      return res.data.lead;
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to log activity";
      toast.error(errorMessage);
      console.error("Log activity error:", err);
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
    updateLeadStage,
    logActivity,
    deleteLead,
    deleteDocument,
  };
};

export default useLeadSource;