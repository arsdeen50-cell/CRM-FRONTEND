import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { UserCircle, Download, Trash2, Upload, Save, Crown } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosInstance from "@/utils/axiosConfig";
import { downloadFile } from "@/lib/crmOutreach";
import { HrHeader, fmtDate, toInput, inr, monthLabel, LEAVE_TYPES } from "./hrShared";
import { confirmDialog } from "@/components/ui/app-dialogs";

const PUNCH_RULES = { office: "Office only (geofenced)", wfh: "Anywhere - work from home", field: "Anywhere - field staff" };

const DOC_TYPES = ["ID proof", "PAN", "Offer letter", "Contract", "Certificate", "Previous employment", "Bank", "Relieving letter", "Other"];
const Field = ({ label, children }) => <div className="grid gap-1"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;

const EmployeeProfile = () => {
  const { userId } = useParams();
  const { user: me } = useSelector((s) => s.auth);
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [people, setPeople] = useState([]);
  const [hr, setHr] = useState(null);
  const [balance, setBalance] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [upload, setUpload] = useState({ type: "Other", file: null });
  const self = String(userId) === String(me?._id);
  const admin = me?.role === "admin";

  const load = useCallback(async () => {
    try {
      const r = await axiosInstance.get(`/v1/hr/employees/${userId}`);
      setData(r.data);
      const p = r.data.profile || {};
      setForm({
        ...p,
        dob: toInput(p.dob),
        dateOfJoining: toInput(p.dateOfJoining),
        probationEndDate: toInput(p.probationEndDate),
        dateOfExit: toInput(p.dateOfExit),
        reportingManager: p.reportingManager?._id || p.reportingManager || "",
        emergencyContact: p.emergencyContact || { name: "", relation: "", phone: "" },
        bank: p.bank || { name: "", accountNo: "", ifsc: "", branch: "" },
      });
      if (r.data.canEdit !== "none") {
        axiosInstance.get("/v1/hr/leave-balances", { params: { userId } }).then((b) => setBalance(b.data.rows?.[0] || null)).catch(() => {});
      }
      if (self) axiosInstance.get("/v1/hr/payroll/my").then((x) => setPayslips(x.data.payslips || [])).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load profile");
    }
  }, [userId, self]);
  useEffect(() => {
    load();
    if (admin) axiosInstance.get("/v1/hr/employees").then((r) => setPeople(r.data.people || [])).catch(() => {});
    axiosInstance.get("/v1/hr/settings").then((r) => setHr(r.data.settings || null)).catch(() => {});
  }, [load, admin]);

  if (!data || !form) return <div className="p-6 text-muted-foreground">Loading...</div>;
  const { user, profile, canEdit } = data;
  const editAll = canEdit === "all", editPersonal = canEdit !== "none";
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setNested = (k, sub, v) => setForm((f) => ({ ...f, [k]: { ...(f[k] || {}), [sub]: v } }));

  const save = async () => {
    const personal = ["dob", "gender", "personalEmail", "personalPhone", "currentAddress", "permanentAddress", "bloodGroup", "emergencyContact"];
    const work = ["designation", "employmentType", "status", "dateOfJoining", "probationEndDate", "dateOfExit", "reportingManager", "workLocation", "punchRule", "shiftId", "bank", "pan", "uan", "esic", "notes"];
    const keys = editAll ? [...personal, ...work] : personal;
    try {
      await axiosInstance.put(`/v1/hr/employees/${userId}`, Object.fromEntries(keys.map((k) => [k, form[k]])));
      toast.success("Profile saved");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    }
  };
  const doUpload = async () => {
    if (!upload.file) return toast.error("Choose a file");
    const fd = new FormData();
    fd.append("file", upload.file);
    fd.append("type", upload.type);
    try {
      await axiosInstance.post(`/v1/hr/employees/${userId}/documents`, fd);
      toast.success("Uploaded");
      setUpload({ type: "Other", file: null });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    }
  };
  const download = async (d) => {
    try {
      const r = await axiosInstance.get(`/v1/hr/employees/${userId}/documents/${d._id}`, { responseType: d.externalUrl ? "json" : "blob" });
      if (d.externalUrl) window.open(r.data.url, "_blank", "noopener");
      else downloadFile(d.name, r.data);
    } catch {
      toast.error("Could not download");
    }
  };
  const removeDoc = async (d) => {
    if (!await confirmDialog(`Delete ${d.name}?`)) return;
    await axiosInstance.delete(`/v1/hr/employees/${userId}/documents/${d._id}`).catch(() => toast.error("Could not delete"));
    load();
  };
  const payslipPdf = async (p) => {
    try {
      const r = await axiosInstance.get(`/v1/hr/payroll/payslips/${p._id}/pdf`, { responseType: "blob" });
      downloadFile(`Payslip-${p.month}.pdf`, r.data);
    } catch {
      toast.error("Could not download");
    }
  };

  const ro = (v) => <p className="text-sm py-2">{v || "—"}</p>;
  return (
    <div className="p-4 md:p-6 space-y-4">
      <HrHeader icon={UserCircle} title={user.fullname} subtitle={[profile.designation || user.designation, user.email].filter(Boolean).join(" · ")} back="/hr/people">
        {admin && !self && <Button variant="outline" onClick={() => (window.location.href = `/hr/exits/${userId}`)}>{profile.status === "Exited" || profile.status === "Notice Period" ? "Exit details" : "Start exit"}</Button>}
        {editPersonal && <Button onClick={save} className=""><Save className="h-4 w-4 mr-1" /> Save</Button>}
      </HrHeader>
      <div className="flex flex-wrap gap-1">{(user.teams || []).map((t) => <span key={t.teamName} className="text-xs border rounded-full px-2 py-0.5 flex items-center gap-1">{t.isLead && <Crown className="h-3 w-3 text-amber-600" />}{t.teamName}{t.subRole ? ` · ${t.subRole}` : ""}</span>)}</div>
      <Tabs defaultValue="work">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="work">Work</TabsTrigger>
          {editPersonal && <TabsTrigger value="personal">Personal</TabsTrigger>}
          {editPersonal && <TabsTrigger value="bank">Bank & IDs</TabsTrigger>}
          {editPersonal && <TabsTrigger value="docs">Documents ({profile.documents?.length || 0})</TabsTrigger>}
          {balance && <TabsTrigger value="leave">Leave balance</TabsTrigger>}
          {self && <TabsTrigger value="pay">Payslips</TabsTrigger>}
        </TabsList>

        <TabsContent value="work">
          <Card><CardContent className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Designation">{editAll ? <Input value={form.designation || ""} onChange={(e) => set("designation", e.target.value)} /> : ro(profile.designation || user.designation)}</Field>
            <Field label="Employment type">{editAll ? <Select value={form.employmentType || "Full Time"} onValueChange={(v) => set("employmentType", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Full Time", "Part Time", "Internship", "Contract"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select> : ro(profile.employmentType)}</Field>
            <Field label="Status">{editAll ? <Select value={form.status || "Active"} onValueChange={(v) => set("status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Active", "Probation", "Notice Period", "Exited"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select> : ro(profile.status || "Active")}</Field>
            <Field label="Date of joining">{editAll ? <Input type="date" value={form.dateOfJoining} onChange={(e) => set("dateOfJoining", e.target.value)} /> : ro(fmtDate(profile.dateOfJoining))}</Field>
            <Field label="Probation ends">{editAll ? <Input type="date" value={form.probationEndDate} onChange={(e) => set("probationEndDate", e.target.value)} /> : ro(fmtDate(profile.probationEndDate))}</Field>
            {(editAll || profile.dateOfExit) && <Field label="Exit date">{editAll ? <Input type="date" value={form.dateOfExit} onChange={(e) => set("dateOfExit", e.target.value)} /> : ro(fmtDate(profile.dateOfExit))}</Field>}
            <Field label="Reporting manager">{editAll ? <Select value={form.reportingManager || "none"} onValueChange={(v) => set("reportingManager", v === "none" ? "" : v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{people.filter((p) => String(p._id) !== String(userId)).map((p) => <SelectItem key={p._id} value={String(p._id)}>{p.fullname}</SelectItem>)}</SelectContent></Select> : ro(profile.reportingManager?.fullname)}</Field>
            <Field label="Work location">{editAll ? <Input value={form.workLocation || ""} onChange={(e) => set("workLocation", e.target.value)} /> : ro(profile.workLocation)}</Field>
            <Field label="Shift">{(() => {
              const shifts = hr?.shifts || [];
              const label = (id) => { const x = shifts.find((y) => String(y._id) === String(id)); return x ? `${x.name} · from ${x.start}, ${x.fullDayHours}h` : `Regular${hr ? ` · from ${hr.officeStart}, ${hr.fullDayHours}h` : ""}`; };
              return editAll ? <Select value={form.shiftId ? String(form.shiftId) : "regular"} onValueChange={(v) => set("shiftId", v === "regular" ? "" : v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="regular">{label("")}</SelectItem>{shifts.map((x) => <SelectItem key={x._id} value={String(x._id)}>{label(x._id)}</SelectItem>)}</SelectContent></Select> : ro(label(profile.shiftId));
            })()}</Field>
            <Field label="Punch-in from">{editAll ? <Select value={form.punchRule || "office"} onValueChange={(v) => set("punchRule", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PUNCH_RULES).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select> : ro(PUNCH_RULES[profile.punchRule || "office"])}</Field>
            <Field label="Work email">{ro(user.email)}</Field>
            {editAll && <div className="sm:col-span-2 lg:col-span-3"><Field label="HR notes (only admins see this)"><Textarea rows={2} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} /></Field></div>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="personal">
          <Card><CardContent className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Date of birth"><Input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} /></Field>
            <Field label="Gender"><Input value={form.gender || ""} onChange={(e) => set("gender", e.target.value)} /></Field>
            <Field label="Blood group"><Input value={form.bloodGroup || ""} onChange={(e) => set("bloodGroup", e.target.value)} /></Field>
            <Field label="Personal email"><Input value={form.personalEmail || ""} onChange={(e) => set("personalEmail", e.target.value)} /></Field>
            <Field label="Personal phone"><Input value={form.personalPhone || ""} onChange={(e) => set("personalPhone", e.target.value)} /></Field>
            <div />
            <div className="sm:col-span-2 lg:col-span-3 grid sm:grid-cols-2 gap-4">
              <Field label="Current address"><Textarea rows={2} value={form.currentAddress || ""} onChange={(e) => set("currentAddress", e.target.value)} /></Field>
              <Field label="Permanent address"><Textarea rows={2} value={form.permanentAddress || ""} onChange={(e) => set("permanentAddress", e.target.value)} /></Field>
            </div>
            <Field label="Emergency contact name"><Input value={form.emergencyContact?.name || ""} onChange={(e) => setNested("emergencyContact", "name", e.target.value)} /></Field>
            <Field label="Relation"><Input value={form.emergencyContact?.relation || ""} onChange={(e) => setNested("emergencyContact", "relation", e.target.value)} /></Field>
            <Field label="Emergency phone"><Input value={form.emergencyContact?.phone || ""} onChange={(e) => setNested("emergencyContact", "phone", e.target.value)} /></Field>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="bank">
          <Card><CardContent className="p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {["name", "accountNo", "ifsc", "branch"].map((k) => <Field key={k} label={{ name: "Bank", accountNo: "Account number", ifsc: "IFSC", branch: "Branch" }[k]}>{editAll ? <Input value={form.bank?.[k] || ""} onChange={(e) => setNested("bank", k, e.target.value)} /> : ro(profile.bank?.[k])}</Field>)}
            {["pan", "uan", "esic"].map((k) => <Field key={k} label={k.toUpperCase()}>{editAll ? <Input value={form[k] || ""} onChange={(e) => set(k, e.target.value.toUpperCase())} /> : ro(profile[k])}</Field>)}
            {!editAll && <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-4">Only HR can change bank and statutory details - ask an admin if anything is wrong.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card><CardContent className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground">Documents are stored privately on the CRM server and only you and HR can open them.</p>
            {(profile.documents || []).length === 0 && <p className="text-sm text-muted-foreground">No documents yet.</p>}
            {(profile.documents || []).map((d) => (
              <div key={d._id} className="flex items-center justify-between border rounded-md p-2">
                <div className="min-w-0"><p className="text-sm font-medium truncate">{d.name}</p><p className="text-xs text-muted-foreground">{d.type} · {fmtDate(d.uploadedAt)} · {d.uploadedBy}{d.externalUrl ? " · from onboarding" : ""}</p></div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => download(d)} title="Download"><Download className="h-4 w-4" /></Button>
                  {admin && <Button size="icon" variant="ghost" className="text-red-600" onClick={() => removeDoc(d)} title="Delete"><Trash2 className="h-4 w-4" /></Button>}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-end gap-2 border-t pt-3">
              <Field label="Type"><Select value={upload.type} onValueChange={(v) => setUpload((u) => ({ ...u, type: v }))}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent>{DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></Field>
              <Input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" className="w-72" onChange={(e) => setUpload((u) => ({ ...u, file: e.target.files?.[0] || null }))} />
              <Button variant="outline" onClick={doUpload}><Upload className="h-4 w-4 mr-1" /> Upload</Button>
            </div>
          </CardContent></Card>
        </TabsContent>

        {balance && (
          <TabsContent value="leave">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {LEAVE_TYPES.map((t) => {
                const b = balance.types[t];
                return (
                  <Card key={t}><CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{t}{b.unpaid ? " (unpaid)" : ""}</p>
                    <p className="text-2xl font-semibold">{b.available === null ? "No limit" : `${b.available} left`}</p>
                    <p className="text-xs text-muted-foreground">{b.quota === null ? "" : `${b.quota} a year${b.adjustments ? ` (incl. ${b.adjustments > 0 ? "+" : ""}${b.adjustments} adjusted)` : ""} · `}{b.used} used{b.pending ? ` · ${b.pending} pending` : ""}</p>
                  </CardContent></Card>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Leave year {fmtDate(balance.from)} – {fmtDate(balance.to)}</p>
          </TabsContent>
        )}

        {self && (
          <TabsContent value="pay">
            <Card><CardContent className="p-4 space-y-2">
              {payslips.length === 0 && <p className="text-sm text-muted-foreground">No payslips yet.</p>}
              {payslips.map((p) => (
                <div key={p._id} className="flex items-center justify-between border rounded-md p-2">
                  <div><p className="font-medium text-sm">{monthLabel(p.month)}</p><p className="text-xs text-muted-foreground">Net {inr(p.netPay)} · paid days {p.paidDays}/{p.daysInMonth}</p></div>
                  <Button size="sm" variant="outline" onClick={() => payslipPdf(p)}><Download className="h-4 w-4 mr-1" /> PDF</Button>
                </div>
              ))}
            </CardContent></Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default EmployeeProfile;
