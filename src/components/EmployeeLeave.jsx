// EmployeeLeave.js
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PencilLine, Trash, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { useLeave } from "@/hooks/useLeave";
import { useSelector } from "react-redux";
import { Badge } from "@/components/ui/badge";
import { formatDateSafe } from "@/utils/data";
import CreateLeaveDialog from "./CreateLeaveDialog";
import LeaveTabs from "./LeaveTabs";
import DatePickerField from "@/components/DatePickerField";
import { useMyTeams } from "@/hooks/useTeams";
import axiosInstance from "@/utils/axiosConfig";

const EmployeeLeave = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [expandedLeaveId, setExpandedLeaveId] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const { isTeamLead } = useMyTeams();
  // Team Leads switch between their own requests and their team's requests (which they approve)
  const [scope, setScope] = useState("mine");
  const isAdmin = user.role === "admin";
  const reviewing = isAdmin || scope === "team";
  const { 
    loading, 
    error,
    createLeave, 
    getLeaves, 
    getEmployeeLeaves,
    updateLeaveStatus,
    deleteLeave 
  } = useLeave();
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  useEffect(() => {
    if (!isAdmin) axiosInstance.get("/v1/leave/balance").then((r) => setBalance(r.data.balance)).catch(() => {});
  }, [isAdmin, leaves.length]);
  const [counts, setCounts] = useState({
    Pending: 0,
    Approved: 0,
    Rejected: 0,
    total: 0
  });

  useEffect(() => {
    fetchLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const fetchLeaves = async () => {
    const response = isAdmin
      ? await getLeaves()
      : scope === "team"
        ? await axiosInstance.get("/v1/leave/team").then((r) => r.data).catch(() => null)
        : await getEmployeeLeaves();
      
    if (response) {
      const list = response.leaves || [];
      setLeaves(list);
      // The employee endpoint doesn't return counts, so work them out from the list
      setCounts(
        response.counts || {
          Pending: list.filter((l) => l.status === "Pending").length,
          Approved: list.filter((l) => l.status === "Approved").length,
          Rejected: list.filter((l) => l.status === "Rejected").length,
          total: list.length,
        }
      );
    }
  };

  const handleCreateLeave = async (leaveData) => {
    const success = await createLeave(leaveData);
    if (success) {
      setIsDialogOpen(false);
      fetchLeaves();
    }
  };

  const handleStatusUpdate = async (leaveId, status, comment = "") => {
    const success = await updateLeaveStatus(leaveId, { status, adminComment: comment });
    if (success) {
      fetchLeaves();
    }
  };

  const handleDeleteLeave = async (leaveId) => {
    const success = await deleteLeave(leaveId);
    if (success) {
      fetchLeaves();
    }
  };

  const toggleLeaveExpansion = (leaveId) => {
    setExpandedLeaveId(expandedLeaveId === leaveId ? null : leaveId);
  };

  const getStatusBadge = (status) => {
    const variants = {
      Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      Approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return variants[status] || "";
  };

  const normalize = (str) => str.toLowerCase().replace(/\s+/g, "-");

  const filteredLeaves = leaves.filter((leave) => {
    if (statusFilter === "all") return true;
    return normalize(leave.status) === statusFilter;
  });

  const filteredByDateLeaves = selectedDate
    ? filteredLeaves.filter((leave) => {
        const leaveDate = new Date(leave.startDate).toDateString();
        return leaveDate === new Date(selectedDate).toDateString();
      })
    : filteredLeaves;

  const handleResetFilters = () => {
    setSelectedDate("");
  };

  return (
    <div className="py-8">
      <div className="card">
        <div className="card-body flex lg:flex-row lg:justify-between">
          <h1 className="text-2xl font-semibold">
            {isAdmin ? "All Leave Requests" : scope === "team" ? "Team Leave Requests" : "My Leave Requests"}
          </h1>
          <div className="">
            <LeaveTabs 
              value={statusFilter} 
              onChange={setStatusFilter} 
              counts={counts} 
            />
          </div>
        </div>
        {balance && scope === "mine" && (
          <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-4">
            {Object.entries(balance.types).map(([t, b]) => (
              <div key={t} className="rounded-lg border p-3">
                <p className="text-xs text-gray-500">{t}{b.unpaid ? " (unpaid)" : ""}</p>
                <p className="text-lg font-semibold">{b.available === null ? `${b.used} used` : `${b.available} left`}</p>
                {b.quota !== null && <p className="text-xs text-gray-500">of {b.quota}{b.pending ? ` · ${b.pending} pending` : ""}</p>}
              </div>
            ))}
          </div>
        )}
        <div className="flex w-full justify-start bg-slate-100 p-4 transition-colors dark:bg-slate-950">
          <div className="w-full">
            <div className="flex flex-col gap-5">
              {!isAdmin && isTeamLead && (
                <div className="flex gap-2">
                  <Button variant={scope === "mine" ? "default" : "outline"} size="sm" onClick={() => setScope("mine")}>My requests</Button>
                  <Button variant={scope === "team" ? "default" : "outline"} size="sm" onClick={() => setScope("team")}>Team requests (to approve)</Button>
                </div>
              )}
              {!isAdmin && scope === "mine" && (
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Request Leave
                  </Button>
                </div>
              )}

              <div className="mb-4 flex items-center justify-end gap-2">
                <DatePickerField
                  name="filterDate"
                  placeholder="Filter by start date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value || "")}
                />
                <Button
                  variant="destructive"
                  onClick={handleResetFilters}
                  disabled={!selectedDate}
                  className="h-10"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only md:not-sr-only">Reset</span>
                </Button>
              </div>

              {filteredByDateLeaves.length === 0 ? (
                <div className="mt-6 text-center text-slate-500 dark:text-slate-300">
                  No leave requests found for the selected filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5">
                  {filteredByDateLeaves.map((leave) => (
                    <div 
                      key={leave._id} 
                      className="rounded-lg border p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Badge className={`${getStatusBadge(leave.status)} capitalize`}>
                              {leave.status}
                            </Badge>
                            {reviewing && (
                              <div className="mt-1 text-sm font-medium">
                                Employee: {leave.employee?.fullname || leave.employee?.email}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {reviewing && leave.status === "Pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusUpdate(leave._id, "Approved")}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const comment = prompt("Enter rejection reason:");
                                    if (comment !== null) {
                                      handleStatusUpdate(leave._id, "Rejected", comment);
                                    }
                                  }}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {scope !== "team" && (isAdmin || leave.status === "Pending") && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteLeave(leave._id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleLeaveExpansion(leave._id)}
                            >
                              {expandedLeaveId === leave._id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Leave Type
                            </h3>
                            <p className="text-sm">{leave.leaveType}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Start Date
                            </h3>
                            <p className="text-sm">{formatDateSafe(leave.startDate, "dd MMM yyyy")}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              End Date
                            </h3>
                            <p className="text-sm">{formatDateSafe(leave.endDate, "dd MMM yyyy")}</p>
                            {leave.days ? <p className="text-xs text-gray-500">{leave.halfDay ? `Half day (${leave.halfDaySession || "first half"})` : `${leave.days} working day${leave.days === 1 ? "" : "s"}`}</p> : null}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Reason
                          </h3>
                          <p className="text-sm">{leave.reason}</p>
                        </div>

                        {expandedLeaveId === leave._id && (
                          <div className="mt-4 border-t pt-4">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                              Activity Log
                            </h3>
                            <div className="space-y-3">
                              {leave.logs?.map((log, index) => (
                                <div key={index} className="flex items-start gap-3">
                                  <div className="flex-shrink-0 mt-1">
                                    <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{log.action}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      By: {log.by} • {formatDateSafe(leave.createdAt, "dd MMM yyyy HH:mm")}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {leave.adminComment && (
                          <div className="rounded bg-gray-100 p-3 dark:bg-gray-800">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Admin Comment
                            </h3>
                            <p className="text-sm">{leave.adminComment}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CreateLeaveDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCreate={handleCreateLeave}
      />
    </div>
  );
};

export default EmployeeLeave;