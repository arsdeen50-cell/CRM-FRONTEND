import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, History, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import CrmRoute from "@/components/crm/CrmRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosInstance from "@/utils/axiosConfig";

const ENTITIES = ["LeadClient", "LeadSource", "Proposal", "Project", "OutreachTemplate", "Sequence", "LeadForm", "Target", "Invoice", "Retainer", "ContentItem", "PortalAccess", "StaffRate"];
const ENTITY_LABEL = { LeadClient: "Client", LeadSource: "Lead", Proposal: "Proposal", Project: "Project", OutreachTemplate: "Template", Sequence: "Sequence", LeadForm: "Lead form", Target: "Target", Invoice: "Invoice", Retainer: "Retainer", ContentItem: "Content", PortalAccess: "Portal link", StaffRate: "Staff rate" };
const ACTIONS = ["create", "update", "delete", "stage", "activity", "followup", "import", "status"];
const ALL = "__all__";

const fmtValue = (v) => {
  if (v === null || v === undefined || v === "") return "∅";
  if (typeof v === "object") return JSON.stringify(v).slice(0, 80);
  return String(v).slice(0, 80);
};

// Who changed what and when (admin only). Field-level changes are shown for updates.
const AuditLog = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [entityType, setEntityType] = useState(ALL);
  const [action, setAction] = useState(ALL);
  const [user, setUser] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/v1/audit", {
        params: { limit: 300, ...(entityType !== ALL && { entityType }), ...(action !== ALL && { action }), ...(user && { user }) },
      });
      setLogs(res.data.logs || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the audit log");
    } finally {
      setLoading(false);
    }
  }, [entityType, action, user]);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, action]);

  return (
    <CrmRoute>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/crm")} title="Back to CRM"><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2"><History className="h-6 w-6 text-brand" /> Audit log</h1>
              <p className="text-sm text-muted-foreground">Every create, edit, stage change, contact and delete in the sales pipeline. Last 300 shown.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>All records</SelectItem>{ENTITIES.map((e) => <SelectItem key={e} value={e}>{ENTITY_LABEL[e]}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>All actions</SelectItem>{ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
            <Input className="w-40" placeholder="Filter by person" value={user} onChange={(e) => setUser(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
            <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Who</TableHead>
                  <TableHead>Record</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">{loading ? "Loading..." : "No entries."}</TableCell></TableRow>}
                {logs.map((l) => {
                  const changes = l.changes ? Object.entries(l.changes) : [];
                  return (
                    <TableRow key={l._id}>
                      <TableCell className="whitespace-nowrap text-sm">{new Date(l.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</TableCell>
                      <TableCell className="text-sm">{l.userName}</TableCell>
                      <TableCell className="text-sm"><span className="text-muted-foreground">{ENTITY_LABEL[l.entityType] || l.entityType}:</span> {l.entityLabel || "—"}</TableCell>
                      <TableCell><span className="text-xs bg-gray-100 dark:bg-slate-700 rounded px-2 py-0.5">{l.action}</span></TableCell>
                      <TableCell className="text-sm">
                        {l.summary}
                        {changes.length > 0 && (
                          <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                            {changes.slice(0, 6).map(([field, c]) => (
                              <li key={field}><span className="font-medium">{field}</span>: {fmtValue(c.from)} → {fmtValue(c.to)}</li>
                            ))}
                            {changes.length > 6 && <li>+{changes.length - 6} more fields</li>}
                          </ul>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </CrmRoute>
  );
};

export default AuditLog;
