import React, { useEffect, useMemo, useState } from "react";
import CrmRoute from "@/components/crm/CrmRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Edit,
  Plus,
  ArrowDown,
  AlertTriangle,
  Flame,
  Zap,
  Paperclip,
  LayoutGrid,
  List as ListIcon,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  Inbox,
  Search,
  Filter,
  X,
} from "lucide-react";
import { useSelector } from "react-redux";
import useLeadSource from "@/hooks/useLeadSource";
import AddLeadsDialog from "@/components/crm/AddLeadsDialog";
import ActivityLogDialog from "@/components/crm/Activitylogdialog";
import KanbanBoard from "@/components/crm/Kanbanboard";
import SummaryStats from "@/components/crm/SummaryStats";
import MultiSelectFilter from "@/components/crm/Multiselectfilter";
import { formatCurrency, isOverdue, PIPELINE_STAGES, STAGE_COLORS } from "@/hooks/Pipelineconstants";

const STATUS_OPTIONS = [
  "New Lead",
  "Hot Lead",
  "Contacted",
  "Discussion in Progress",
  "Proposal Sent",
  "Negotiation",
  "Converted to Project",
  "Lost",
  "On Hold",
];

const SERVICE_TYPE_OPTIONS = [
  "Website Development",
  "Mobile App Development",
  "Graphic designing",
  "Social Media Marketing",
  "Branding & Design",
  "Influencer Marketing",
  "Production / Shoot",
  "SEO",
  "PR",
  "performance marketing",
];

const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];

const emptyFilters = {
  assignTo: "",
  createdBy: "",
  stage: [],
  status: [],
  priority: [],
  serviceType: [],
  createdFrom: "",
  createdTo: "",
  closeFrom: "",
  closeTo: "",
  searchTerm: "",
};

const LeadSource = () => {
  const { user } = useSelector((state) => state.auth);
  const currentUser = user?.fullname || "Unknown";

  const { leads, loading, fetchLeads, createLead, updateLead, updateLeadStage, logActivity } =
    useLeadSource();

  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);

  const [view, setView] = useState("list");
  const [openLeadModal, setOpenLeadModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [activityLead, setActivityLead] = useState(null);
  const [openActivityModal, setOpenActivityModal] = useState(false);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  useEffect(() => {
    fetchLeads();
  }, []);

  // Filter logic
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const stage = lead.pipelineStage || "Lead";

      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const searchFields = [
          lead.series || "",
          lead.leadStatusType || "",
          lead.priority || "",
          lead.projectAccountHandledBy || "",
          lead.createdBy || "",
          lead.pipelineStage || "",
          lead.notes || "",
          lead.companyName || "",
          lead.contactName || "",
          lead.email || "",
          lead.phone || "",
          ...(Array.isArray(lead.serviceType) ? lead.serviceType : [lead.serviceType]),
        ];
        
        const matchFound = searchFields.some(field => 
          String(field).toLowerCase().includes(searchLower)
        );
        if (!matchFound) return false;
      }

      if (filters.assignTo && lead.projectAccountHandledBy !== filters.assignTo) return false;
      if (filters.createdBy && lead.createdBy !== filters.createdBy) return false;
      if (filters.stage.length && !filters.stage.includes(stage)) return false;
      if (filters.status.length && !filters.status.includes(lead.leadStatusType)) return false;
      if (filters.priority.length && !filters.priority.includes(lead.priority)) return false;
      if (
        filters.serviceType.length &&
        !(Array.isArray(lead.serviceType) ? lead.serviceType : [lead.serviceType]).some((s) =>
          filters.serviceType.includes(s)
        )
      )
        return false;

      if (filters.createdFrom && new Date(lead.createdAt) < new Date(filters.createdFrom))
        return false;
      if (filters.createdTo && new Date(lead.createdAt) > new Date(filters.createdTo)) return false;

      if (filters.closeFrom && lead.expectedCloseDate) {
        if (new Date(lead.expectedCloseDate) < new Date(filters.closeFrom)) return false;
      }
      if (filters.closeTo && lead.expectedCloseDate) {
        if (new Date(lead.expectedCloseDate) > new Date(filters.closeTo)) return false;
      }

      return true;
    });
  }, [leads, filters]);

  // Sorting
  const sortedLeads = useMemo(() => {
    if (!sortBy) return filteredLeads;
    const sorted = [...filteredLeads].sort((a, b) => {
      let valA, valB;
      if (sortBy === "dealValue") {
        valA = Number(a.dealValue) || 0;
        valB = Number(b.dealValue) || 0;
      } else {
        valA = a.nextFollowUpDate ? new Date(a.nextFollowUpDate).getTime() : Infinity;
        valB = b.nextFollowUpDate ? new Date(b.nextFollowUpDate).getTime() : Infinity;
      }
      return sortDir === "asc" ? valA - valB : valB - valA;
    });
    return sorted;
  }, [filteredLeads, sortBy, sortDir]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 8;
  const totalPages = Math.ceil(sortedLeads.length / leadsPerPage);
  const startIndex = (currentPage - 1) * leadsPerPage;
  const currentLeads = sortedLeads.slice(startIndex, startIndex + leadsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  const handleCreateLead = async (data) => {
    try {
      await createLead(data);
      setOpenLeadModal(false);
    } catch (error) {}
  };

  const handleUpdateLead = async (data) => {
    try {
      await updateLead(editData._id, data);
      setOpenLeadModal(false);
      setEditData(null);
    } catch (error) {}
  };

  const handleEditClick = (lead) => {
    setEditData(lead);
    setOpenLeadModal(true);
  };

  const handleStageChange = (id, stage, changedBy, reason) => {
    updateLeadStage(id, stage, changedBy, reason);
  };

  const handleOpenActivity = (lead) => {
    setActivityLead(lead);
    setOpenActivityModal(true);
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const handleSearchChange = (e) => {
    setDraftFilters((prev) => ({ ...prev, searchTerm: e.target.value }));
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  };

  const handleExport = () => {
    const headers = [
      "Series",
      "Stage",
      "Status",
      "Priority",
      "Deal Value",
      "Currency",
      "Expected Close Date",
      "Next Follow-up",
      "Handled By",
      "Created By",
      "Created At",
    ];

    const rows = sortedLeads.map((lead) => [
      lead.series || "",
      lead.pipelineStage || "Lead",
      lead.leadStatusType || "",
      lead.priority || "",
      lead.dealValue ?? 0,
      lead.currency || "INR",
      lead.expectedCloseDate ? new Date(lead.expectedCloseDate).toLocaleDateString() : "",
      lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString() : "",
      lead.projectAccountHandledBy || "",
      lead.createdBy || "",
      lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-pipeline-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Low":
        return <div className="flex items-center gap-1 text-green-600 font-medium"><ArrowDown className="h-4 w-4" /> Low</div>;
      case "Medium":
        return <div className="flex items-center gap-1 text-yellow-600 font-medium"><AlertTriangle className="h-4 w-4" /> Medium</div>;
      case "High":
        return <div className="flex items-center gap-1 text-orange-600 font-medium"><Flame className="h-4 w-4" /> High</div>;
      case "Critical":
        return <div className="flex items-center gap-1 text-red-600 font-semibold"><Zap className="h-4 w-4" /> Critical</div>;
      default:
        return <span className="text-gray-400">—</span>;
    }
  };

  const getStageBadge = (lead) => {
    const stage = lead.pipelineStage || "Lead";
    return (
      <Select
        value={stage}
        onValueChange={(newStage) => {
          if (newStage === "Lost") {
            const reason = window.prompt("Reason for marking this lead as Lost (optional):") || "";
            handleStageChange(lead._id, newStage, currentUser, reason);
          } else {
            handleStageChange(lead._id, newStage, currentUser);
          }
        }}
      >
        <SelectTrigger className={`h-7 w-[150px] text-xs border ${STAGE_COLORS[stage]}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PIPELINE_STAGES.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const overdueCount = leads.filter(isOverdue).length;

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.assignTo) count++;
    if (filters.createdBy) count++;
    if (filters.stage.length) count++;
    if (filters.status.length) count++;
    if (filters.priority.length) count++;
    if (filters.serviceType.length) count++;
    if (filters.createdFrom) count++;
    if (filters.createdTo) count++;
    if (filters.closeFrom) count++;
    if (filters.closeTo) count++;
    return count;
  }, [filters]);

  return (
    <CrmRoute>
      <div className="min-h-screen p-4">
        {/* Top Filter Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search leads..."
                value={draftFilters.searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                className="pl-9"
              />
            </div>

            {/* Filter Toggle Button */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 ml-auto">
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={view === "list" ? "default" : "ghost"}
                  className="rounded-none h-9"
                  onClick={() => setView("list")}
                >
                  <ListIcon className="h-4 w-4 mr-1" /> List
                </Button>
                <Button
                  variant={view === "kanban" ? "default" : "ghost"}
                  className="rounded-none h-9"
                  onClick={() => setView("kanban")}
                >
                  <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
                </Button>
              </div>

              <Button variant="outline" onClick={handleExport} disabled={sortedLeads.length === 0}>
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>

              <Button
                onClick={() => {
                  setEditData(null);
                  setOpenLeadModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Lead
              </Button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Assign To</label>
                  <Select
                    value={draftFilters.assignTo}
                    onValueChange={(v) => setDraftFilters((p) => ({ ...p, assignTo: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fardeen">Fardeen</SelectItem>
                      <SelectItem value="Arsalan">Arsalan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Created By</label>
                  <Select
                    value={draftFilters.createdBy}
                    onValueChange={(v) => setDraftFilters((p) => ({ ...p, createdBy: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Creator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fardeen">Fardeen</SelectItem>
                      <SelectItem value="Arsalan">Arsalan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <MultiSelectFilter
                    label="Pipeline Stage"
                    options={PIPELINE_STAGES}
                    selected={draftFilters.stage}
                    onChange={(v) => setDraftFilters((p) => ({ ...p, stage: v }))}
                  />
                </div>

                <div>
                  <MultiSelectFilter
                    label="Status"
                    options={STATUS_OPTIONS}
                    selected={draftFilters.status}
                    onChange={(v) => setDraftFilters((p) => ({ ...p, status: v }))}
                  />
                </div>

                <div>
                  <MultiSelectFilter
                    label="Priority"
                    options={PRIORITY_OPTIONS}
                    selected={draftFilters.priority}
                    onChange={(v) => setDraftFilters((p) => ({ ...p, priority: v }))}
                  />
                </div>

                <div>
                  <MultiSelectFilter
                    label="Service Type"
                    options={SERVICE_TYPE_OPTIONS}
                    selected={draftFilters.serviceType}
                    onChange={(v) => setDraftFilters((p) => ({ ...p, serviceType: v }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Created Date</label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={draftFilters.createdFrom}
                      onChange={(e) => setDraftFilters((p) => ({ ...p, createdFrom: e.target.value }))}
                    />
                    <Input
                      type="date"
                      value={draftFilters.createdTo}
                      onChange={(e) => setDraftFilters((p) => ({ ...p, createdTo: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Expected Close Date</label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={draftFilters.closeFrom}
                      onChange={(e) => setDraftFilters((p) => ({ ...p, closeFrom: e.target.value }))}
                    />
                    <Input
                      type="date"
                      value={draftFilters.closeTo}
                      onChange={(e) => setDraftFilters((p) => ({ ...p, closeTo: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Button onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700">
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={resetFilters}>
                  Reset All
                </Button>
                <Button variant="ghost" onClick={() => setShowFilters(false)}>
                  <X className="h-4 w-4 mr-2" /> Close
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h1 className="text-2xl font-semibold flex items-center gap-3">
              Sales Pipeline
              <span className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {sortedLeads.length}
              </span>
              {overdueCount > 0 && (
                <span className="text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                  {overdueCount} overdue
                </span>
              )}
            </h1>
          </div>

          <SummaryStats leads={sortedLeads} />

          {loading ? (
            <div className="text-center p-12">
              <p>Loading leads...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 border rounded-lg bg-gray-50">
              <Inbox className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">No leads yet. Add your first lead to get started.</p>
              <Button
                onClick={() => {
                  setEditData(null);
                  setOpenLeadModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Lead
              </Button>
            </div>
          ) : view === "kanban" ? (
            <KanbanBoard
              leads={sortedLeads}
              currentUser={currentUser}
              onStageChange={handleStageChange}
              onEdit={handleEditClick}
              onLogActivity={handleOpenActivity}
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Series</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("dealValue")}>
                        Deal Value {sortBy === "dealValue" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                      </TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Handled By</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("nextFollowUpDate")}>
                        Next Follow-up {sortBy === "nextFollowUpDate" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                      </TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentLeads.map((lead) => {
                      const overdue = isOverdue(lead);
                      const stage = lead.pipelineStage || "Lead";
                      return (
                        <TableRow key={lead._id}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-blue-600 hover:text-blue-800 h-7 w-7"
                                title="Edit"
                                onClick={() => handleEditClick(lead)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-600 hover:text-gray-800 h-7 w-7"
                                title="Log Activity"
                                onClick={() => handleOpenActivity(lead)}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                              {!["Won", "Lost"].includes(stage) && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-600 hover:text-green-800 h-7 w-7"
                                    title="Mark Won"
                                    onClick={() => handleStageChange(lead._id, "Won", currentUser)}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 hover:text-red-800 h-7 w-7"
                                    title="Mark Lost"
                                    onClick={() => {
                                      const reason = window.prompt("Reason for marking this lead as Lost (optional):") || "";
                                      handleStageChange(lead._id, "Lost", currentUser, reason);
                                    }}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{lead.series || "—"}</TableCell>
                          <TableCell>{getStageBadge(lead)}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(lead.dealValue, lead.currency)}
                          </TableCell>
                          <TableCell>
                            {Array.isArray(lead.serviceType) ? lead.serviceType.join(", ") : lead.serviceType || "—"}
                          </TableCell>
                          <TableCell>{getPriorityBadge(lead.priority)}</TableCell>
                          <TableCell>{lead.leadStatusType || "—"}</TableCell>
                          <TableCell>{lead.projectAccountHandledBy || "—"}</TableCell>
                          <TableCell>
                            {lead.nextFollowUpDate ? (
                              <span className={overdue ? "text-red-600 font-semibold flex items-center gap-1" : "text-gray-700"}>
                                {overdue && (
                                  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                                    Overdue
                                  </span>
                                )}
                                {new Date(lead.nextFollowUpDate).toLocaleDateString()}
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
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
                      );
                    })}
                  </TableBody>
                </Table>

                {sortedLeads.length === 0 && (
                  <p className="text-center text-gray-500 p-4">No records match your filters</p>
                )}

                {sortedLeads.length > leadsPerPage && (
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
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modals */}
        <AddLeadsDialog
          open={openLeadModal}
          onOpenChange={setOpenLeadModal}
          onCreate={editData ? handleUpdateLead : handleCreateLead}
          editData={editData}
        />

        <ActivityLogDialog
          open={openActivityModal}
          onOpenChange={setOpenActivityModal}
          lead={activityLead}
          currentUser={currentUser}
          onSubmit={logActivity}
        />
      </div>
    </CrmRoute>
  );
};

export default LeadSource;