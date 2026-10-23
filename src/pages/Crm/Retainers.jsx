import React, { useCallback, useEffect, useState } from "react";
import { Repeat2, Plus, Edit, Trash2, Receipt, CalendarRange, RotateCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import CrmRoute from "@/components/crm/CrmRoute";
import PageHeader, { Stat, Pill } from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosInstance from "@/utils/axiosConfig";
import { money, day, errMsg } from "@/lib/publicApi";
import { toDateInput } from "@/lib/crmOutreach";

const TYPES = ["Post", "Reel", "Story", "Carousel", "Video", "Blog", "Ad", "Newsletter", "Other"];
const PLATFORMS = ["Instagram", "Facebook", "LinkedIn", "YouTube", "X", "Website", "Email", "Other"];
const STATUS_STYLE = { Active: "bg-green-100 text-green-700", Paused: "bg-amber-100 text-amber-800", Ended: "bg-gray-100 text-gray-500" };
const thisMonth = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 7);

const RetainerEditor = ({ open, onOpenChange, retainer, clients, onSaved }) => {
  const [f, setF] = useState(null);
  useEffect(() => {
    if (!open) return;
    const yearOut = new Date();
    yearOut.setFullYear(yearOut.getFullYear() + 1);
    setF(
      retainer
        ? { ...retainer, startDate: toDateInput(retainer.startDate), endDate: toDateInput(retainer.endDate), services: (retainer.services || []).join(", ") }
        : { name: "Social media retainer", clientId: "", services: "Social Media Marketing", monthlyFee: 0, taxPercent: 18, billingDay: 1, paymentTermsDays: 7, startDate: toDateInput(new Date()), endDate: toDateInput(yearOut), autoRenew: false, renewalMonths: 12, noticeDays: 30, status: "Active", autoInvoice: true, autoSendInvoice: false, deliverables: [{ type: "Reel", platform: "Instagram", perMonth: 8 }, { type: "Post", platform: "Instagram", perMonth: 8 }], accountManager: "", notes: "" }
    );
  }, [open, retainer]);
  if (!f) return null;
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const setD = (i, k, v) => set("deliverables", f.deliverables.map((d, j) => (j === i ? { ...d, [k]: v } : d)));
  const save = async () => {
    if (!f.clientId) return toast.error("Pick a client");
    if (!(Number(f.monthlyFee) > 0)) return toast.error("Enter the monthly fee");
    const payload = { ...f, services: f.services.split(",").map((s) => s.trim()).filter(Boolean), monthlyFee: Number(f.monthlyFee), billingDay: Number(f.billingDay), deliverables: f.deliverables.map((d) => ({ ...d, perMonth: Number(d.perMonth) || 0 })), startDate: new Date(`${f.startDate}T00:00:00`).toISOString(), endDate: f.endDate ? new Date(`${f.endDate}T23:59:00`).toISOString() : null };
    delete payload.clientName;
    try {
      if (retainer) await axiosInstance.put(`/v1/retainer/${retainer._id}`, payload);
      else await axiosInstance.post("/v1/retainer", payload);
      toast.success("Retainer saved");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(errMsg(err, "Could not save"));
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{retainer ? "Edit retainer" : "New retainer"}</DialogTitle>
          <DialogDescription>Drives MRR, renewal alerts, the monthly invoice and the content calendar slots.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Client</Label>
              <Select value={f.clientId?._id || f.clientId || ""} onValueChange={(v) => set("clientId", v)}>
                <SelectTrigger><SelectValue placeholder="Pick a client" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c._id} value={c._id}>{c.brandName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1"><Label>Name</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
          </div>
          <div className="grid gap-1"><Label>Services (comma separated)</Label><Input value={f.services} onChange={(e) => set("services", e.target.value)} /></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="grid gap-1"><Label>Monthly fee (₹, before GST)</Label><Input type="number" min="0" value={f.monthlyFee} onChange={(e) => set("monthlyFee", e.target.value)} /></div>
            <div className="grid gap-1"><Label>GST %</Label><Input type="number" value={f.taxPercent} onChange={(e) => set("taxPercent", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Billing day (1-28)</Label><Input type="number" min="1" max="28" value={f.billingDay} onChange={(e) => set("billingDay", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Payment terms (days)</Label><Input type="number" min="0" value={f.paymentTermsDays} onChange={(e) => set("paymentTermsDays", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="grid gap-1"><Label>Start</Label><Input type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Contract end</Label><Input type="date" value={f.endDate || ""} onChange={(e) => set("endDate", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Notice (days)</Label><Input type="number" value={f.noticeDays} onChange={(e) => set("noticeDays", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Renew for (months)</Label><Input type="number" value={f.renewalMonths} onChange={(e) => set("renewalMonths", e.target.value)} /></div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={f.autoRenew} onChange={(e) => set("autoRenew", e.target.checked)} /> Auto-renew at end date</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={f.autoInvoice} onChange={(e) => set("autoInvoice", e.target.checked)} /> Create the invoice each billing day</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={f.autoSendInvoice} disabled={!f.autoInvoice} onChange={(e) => set("autoSendInvoice", e.target.checked)} /> ...and email it automatically</label>
          </div>
          <div className="grid gap-2">
            <Label>Deliverables per month</Label>
            {f.deliverables.map((d, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input className="w-20" type="number" min="0" value={d.perMonth} onChange={(e) => setD(i, "perMonth", e.target.value)} />
                <Select value={d.platform} onValueChange={(v) => setD(i, "platform", v)}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
                <Select value={d.type} onValueChange={(v) => setD(i, "type", v)}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((p) => <SelectItem key={p} value={p}>{p}s</SelectItem>)}</SelectContent></Select>
                <Button size="icon" variant="ghost" className="text-red-600" onClick={() => set("deliverables", f.deliverables.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-fit" onClick={() => set("deliverables", [...f.deliverables, { type: "Post", platform: "Instagram", perMonth: 4 }])}><Plus className="h-4 w-4 mr-1" /> Add deliverable</Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1"><Label>Account manager</Label><Input value={f.accountManager} onChange={(e) => set("accountManager", e.target.value)} /></div>
            <div className="grid gap-1">
              <Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => set("status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Active", "Paused", "Ended"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <div className="grid gap-1"><Label>Notes</Label><Textarea rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save} className="bg-blue-600 hover:bg-blue-700">Save retainer</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Retainers = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [clients, setClients] = useState([]);
  const [editing, setEditing] = useState(undefined);
  const load = useCallback(async () => {
    try {
      setData((await axiosInstance.get("/v1/retainer")).data);
    } catch (err) {
      toast.error(errMsg(err, "Could not load retainers"));
    }
  }, []);
  useEffect(() => {
    load();
    axiosInstance.get("/v1/time/options").then((r) => setClients(r.data.clients || [])).catch(() => {});
  }, [load]);
  const invoiceNow = async (r) => {
    try {
      const res = await axiosInstance.post(`/v1/invoice/from-retainer/${r._id}`, { period: thisMonth() });
      toast.success(res.data.created ? `Draft ${res.data.invoice.invoiceNo} created` : `${res.data.invoice.invoiceNo} already exists for this month`);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const plan = async (r) => {
    try {
      const res = await axiosInstance.post("/v1/content/generate", { retainerId: r._id, month: thisMonth() });
      toast.success(`${res.data.created} content slots added to this month's calendar`);
      navigate("/crm/content");
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const renew = async (r) => {
    const months = window.prompt(`Renew "${r.name}" for how many months?`, String(r.renewalMonths || 12));
    if (!months) return;
    try {
      await axiosInstance.post(`/v1/retainer/${r._id}/renew`, { months: Number(months) });
      toast.success("Renewed");
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const remove = async (r) => {
    if (!window.confirm(`Delete "${r.name}"? Invoices already raised are kept.`)) return;
    await axiosInstance.delete(`/v1/retainer/${r._id}`).catch(() => {});
    load();
  };
  const s = data?.summary || {};
  return (
    <CrmRoute>
      <div className="p-4 md:p-6 space-y-4">
        <PageHeader icon={Repeat2} title="Retainers & renewals" subtitle="Monthly contracts: recurring revenue, upcoming renewals and automatic monthly invoices.">
          <Button onClick={() => setEditing(null)} className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-1" /> New retainer</Button>
        </PageHeader>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="MRR (monthly recurring)" value={money(s.mrr).replace(/\.00$/, "")} sub={`${s.active || 0} active retainers`} />
          <Stat label="ARR" value={money(s.arr).replace(/\.00$/, "")} />
          <Stat label="Clients on retainer" value={s.clients ?? "–"} />
          <Stat label="Renewals due (30 days / notice)" value={s.renewalsDue ?? "–"} sub={s.renewalsDue ? `${money(s.renewalValue).replace(/\.00$/, "")} at stake` : undefined} tone={s.renewalsDue ? "bad" : undefined} />
        </div>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Monthly</TableHead>
                  <TableHead>Deliverables</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.retainers || []).length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-500">{data ? "No retainers yet." : "Loading..."}</TableCell></TableRow>}
                {(data?.retainers || []).map((r) => (
                  <TableRow key={r._id} className={r.renewalDue ? "bg-amber-50 dark:bg-amber-950" : ""}>
                    <TableCell><p className="font-medium">{r.clientName}</p><p className="text-xs text-gray-500">{r.name}{r.accountManager ? ` · ${r.accountManager}` : ""}</p></TableCell>
                    <TableCell className="text-right whitespace-nowrap">{money(r.monthlyFee).replace(/\.00$/, "")}{r.unpaid > 0 && <div className="text-xs text-red-600">{money(r.unpaid).replace(/\.00$/, "")} unpaid</div>}</TableCell>
                    <TableCell className="text-xs">{(r.deliverables || []).filter((d) => d.perMonth).map((d) => `${d.perMonth} ${d.platform} ${d.type}s`).join(", ") || "—"}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {day(r.startDate)} → {r.endDate ? day(r.endDate) : "open"}
                      {r.daysToEnd !== null && r.status === "Active" && <div className={`text-xs ${r.renewalDue ? "text-amber-700 font-medium" : "text-gray-500"}`}>{r.daysToEnd < 0 ? "ended" : `${r.daysToEnd} days left`}{r.autoRenew ? " · auto-renews" : ""}</div>}
                    </TableCell>
                    <TableCell className="text-xs">Day {r.billingDay}{r.autoInvoice ? (r.autoSendInvoice ? " · auto-send" : " · auto draft") : " · manual"}<div className="text-gray-500">{r.lastInvoicedPeriod ? `last: ${r.lastInvoicedPeriod}` : "not invoiced yet"}</div></TableCell>
                    <TableCell><Pill className={STATUS_STYLE[r.status]}>{r.status}</Pill></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" title="Create this month's invoice" className="text-emerald-600" onClick={() => invoiceNow(r)}><Receipt className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title="Add this month's deliverables to the content calendar" className="text-blue-600" onClick={() => plan(r)}><CalendarRange className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title="Renew now" onClick={() => renew(r)}><RotateCw className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title="Edit" onClick={() => setEditing(r)}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title="Delete" className="text-red-600" onClick={() => remove(r)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <RetainerEditor open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)} retainer={editing} clients={clients} onSaved={load} />
      </div>
    </CrmRoute>
  );
};

export default Retainers;
