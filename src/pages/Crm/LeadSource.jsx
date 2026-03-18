import React, { useEffect, useState } from "react";
import CrmRoute from "@/components/crm/CrmRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Edit, Plus, ArrowDown, AlertTriangle, Flame, Zap, Paperclip } from "lucide-react";
import AddLeadsDialog from "@/components/crm/AddLeadsDialog";
import useLeadSource from "@/hooks/useLeadSource";

const LeadSource = () => {
  const { leads, loading, fetchLeads, createLead, updateLead } = useLeadSource();

  const [assignTo, setAssignTo] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [filters, setFilters] = useState({ assignTo: "", createdBy: "" });

  const [openLeadModal, setOpenLeadModal] = useState(false);
  const [editData, setEditData] = useState(null);

  // 🔹 Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    const matchAssign = filters.assignTo ? lead.projectAccountHandledBy === filters.assignTo : true;
    const matchCreated = filters.createdBy ? lead.projectAccountHandledBy === filters.createdBy : true;
    return matchAssign && matchCreated;
  });

  // 🔹 Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 5;

  // 🔹 Calculate pagination values
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
  const startIndex = (currentPage - 1) * leadsPerPage;
  const currentLeads = filteredLeads.slice(startIndex, startIndex + leadsPerPage);

  // 🔹 Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };


  useEffect(() => {
    fetchLeads();
  }, []);

  // 🔹 Handle Create Lead
  const handleCreateLead = async (data) => {
    try {
      await createLead(data);
      setOpenLeadModal(false);
    } catch (error) {
      // handled in hook
    }
  };

  // 🔹 Handle Update Lead
  const handleUpdateLead = async (data) => {
    try {
      await updateLead(editData._id, data);
      setOpenLeadModal(false);
      setEditData(null);
    } catch (error) {
      // handled in hook
    }
  };

  // 🔹 Handle Edit Click
  const handleEditClick = (lead) => {
    setEditData(lead);
    setOpenLeadModal(true);
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Low":
        return (
          <div className="flex items-center gap-1 text-green-600 font-medium">
            <ArrowDown className="h-4 w-4" /> Low
          </div>
        );
      case "Medium":
        return (
          <div className="flex items-center gap-1 text-yellow-600 font-medium">
            <AlertTriangle className="h-4 w-4" /> Medium
          </div>
        );
      case "High":
        return (
          <div className="flex items-center gap-1 text-orange-600 font-medium">
            <Flame className="h-4 w-4" /> High
          </div>
        );
      case "Critical":
        return (
          <div className="flex items-center gap-1 text-red-600 font-semibold">
            <Zap className="h-4 w-4" /> Critical
          </div>
        );
      default:
        return <span className="text-gray-400">—</span>;
    }
  };


  return (
    <CrmRoute>
      <div className="flex flex-col gap-6 md:flex-row min-h-screen p-4">
        {/* LEFT FILTER PANEL */}
        <div className="md:w-1/4 w-full p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Assign To</label>
            <Select value={assignTo} onValueChange={setAssignTo}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fardeen">Fardeen</SelectItem>
                <SelectItem value="Arsalan">Arsalan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Created By</label>
            <Select value={createdBy} onValueChange={setCreatedBy}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Creator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fardeen">Fardeen</SelectItem>
                <SelectItem value="Arsalan">Arsalan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <Button className="w-1/2" onClick={() => setFilters({ assignTo, createdBy })}>
              Search
            </Button>
            <Button
              variant="destructive"
              className="w-1/2"
              onClick={() => {
                setAssignTo("");
                setCreatedBy("");
                setFilters({ assignTo: "", createdBy: "" });
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* RIGHT SIDE TABLE */}
        <div className="md:w-3/4 w-full bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center text-center justify-between mb-6">
            <h1 className="text-2xl font-semibold flex items-center gap-3">
              Lead Source -
              <span className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {currentLeads.length}
              </span>
            </h1>

            <Button
              onClick={() => {
                setEditData(null);
                setOpenLeadModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add Lead
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center p-8">
                  <p>Loading leads...</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Series</TableHead>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Handled By</TableHead>
                        <TableHead>Documents</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentLeads.map((lead) => (
                        <TableRow key={lead._id}>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => handleEditClick(lead)}
                            >
                              <Edit className="h-5 w-5" />
                            </Button>
                          </TableCell>
                          <TableCell>{lead.createdBy || "N/A"}</TableCell>
                          <TableCell>{lead.series || "—"}</TableCell>
                          <TableCell>
                            {Array.isArray(lead.serviceType)
                              ? lead.serviceType.join(", ")
                              : lead.serviceType || "—"}
                          </TableCell>
                          <TableCell>{getPriorityBadge(lead.priority)}</TableCell>
                          <TableCell>{lead.leadStatusType || "—"}</TableCell>
                          <TableCell>{lead.projectAccountHandledBy || "—"}</TableCell>
                          <TableCell>
                            {lead.documents && lead.documents.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {lead.documents.map((doc, index) => (
                                  <a
                                    key={index}
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    <Paperclip className="h-3 w-3 inline mr-1" />
                                    Doc {index + 1}
                                  </a>
                                ))}
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredLeads.length === 0 && (
                    <p className="text-center text-gray-500 p-4">
                      {leads.length === 0 ? "No leads found" : "No records match your filters"}
                    </p>
                  )}
                  {filteredLeads.length > 5 && (
                    <div className="flex justify-center items-center gap-3 py-4">
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>

                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>

                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}

                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 🔹 Modal used for both Add & Edit */}
        <AddLeadsDialog
          open={openLeadModal}
          onOpenChange={setOpenLeadModal}
          onCreate={editData ? handleUpdateLead : handleCreateLead}
          editData={editData}
        />
      </div>
    </CrmRoute>
  );
};

export default LeadSource;
