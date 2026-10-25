import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import CrmMemberRoute, { useIsAdmin } from "@/components/crm/CrmMemberRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/hooks/Pipelineconstants";
import axiosInstance from "@/utils/axiosConfig";
import { fromDateInput, realEmail, toDateInput } from "@/lib/crmOutreach";
import { confirmDialog } from "@/components/ui/app-dialogs";

const STATUS_STYLE = {
  Planning: "bg-slate-100 text-slate-700",
  "In Progress": "bg-blue-100 text-brand",
  "On Hold": "bg-amber-100 text-amber-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-gray-100 text-muted-foreground",
};

/* Delivery projects. Created automatically when a lead is marked Won or a proposal is accepted;
   each gets a kickoff task in the Task module, assigned to the lead's owner. */
const Projects = () => {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const [projects, setProjects] = useState([]);
  const [statuses, setStatuses] = useState(Object.keys(STATUS_STYLE));
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/v1/project");
      setProjects(res.data.projects || []);
      if (res.data.statuses) setStatuses(res.data.statuses);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load projects");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const update = async (p, patch) => {
    try {
      await axiosInstance.put(`/v1/project/${p._id}`, patch);
      setProjects((list) => list.map((x) => (x._id === p._id ? { ...x, ...patch } : x)));
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update project");
    }
  };

  const welcome = async (p) => {
    const email = realEmail(p.clientId);
    if (!email) return toast.error("This client has no real email address on file");
    if (!await confirmDialog(`Send the welcome email to ${email} from the CRM's mail account?`)) return;
    try {
      const res = await axiosInstance.post(`/v1/project/${p._id}/welcome-email`);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send email");
    }
  };

  const remove = async (p) => {
    if (!await confirmDialog(`Delete project ${p.projectNo}? The lead stays Won.`)) return;
    try {
      await axiosInstance.delete(`/v1/project/${p._id}`);
      toast.success("Project deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    }
  };

  const shown = filter === "all" ? projects : projects.filter((p) => p.status === filter);
  const activeValue = projects.filter((p) => ["Planning", "In Progress"].includes(p.status)).reduce((s, p) => s + (p.value || 0), 0);

  return (
    <CrmMemberRoute>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/crm")} title="Back to CRM">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-brand" /> Projects
              </h1>
              <p className="text-sm text-muted-foreground">Won deals turn into projects automatically, with a kickoff task for the account owner.</p>
            </div>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Projects</p><p className="text-2xl font-semibold">{projects.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-semibold">{projects.filter((p) => ["Planning", "In Progress"].includes(p.status)).length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Active value</p><p className="text-2xl font-semibold">{formatCurrency(activeValue)}</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">{loading ? "Loading..." : "No projects yet. Mark a lead as Won to create one."}</TableCell></TableRow>
                )}
                {shown.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.projectNo} · {p.leadId?.series}</div></TableCell>
                    <TableCell>{p.clientId?.brandName || p.clientName}</TableCell>
                    <TableCell className="text-sm">{(p.services || []).join(", ") || "—"}</TableCell>
                    <TableCell>
                      <Select value={p.status} onValueChange={(v) => update(p, { status: v })}>
                        <SelectTrigger className={`h-8 w-36 text-xs ${STATUS_STYLE[p.status] || ""}`}><SelectValue /></SelectTrigger>
                        <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm">{p.accountManager || "—"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.value)}</TableCell>
                    <TableCell>
                      <Input type="date" className="h-8 w-36" value={toDateInput(p.dueDate)} onChange={(e) => update(p, { dueDate: fromDateInput(e.target.value) })} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" title={realEmail(p.clientId) ? "Send welcome email" : "No client email on file"} disabled={!realEmail(p.clientId)} onClick={() => welcome(p)}>
                          <Mail className="h-4 w-4" />
                        </Button>
                        {isAdmin && <Button size="icon" variant="ghost" className="text-red-600" title="Delete project" onClick={() => remove(p)}><Trash2 className="h-4 w-4" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </CrmMemberRoute>
  );
};

export default Projects;
