import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DoorOpen, Download, Mail, Power, RotateCcw, ArrowRightLeft, Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import CrmRoute from "@/components/crm/CrmRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosInstance from "@/utils/axiosConfig";
import { downloadFile } from "@/lib/crmOutreach";
import { HrHeader, fmtDate, toInput, inr } from "./hrShared";
import { EXIT_TYPES, StartExitDialog } from "./Exits";
import { confirmDialog, promptDialog } from "@/components/ui/app-dialogs";

const Box = ({ title, children, action }) => (
  <Card><CardContent className="p-4 space-y-3">
    <div className="flex items-center justify-between gap-2"><p className="font-medium">{title}</p>{action}</div>
    {children}
  </CardContent></Card>
);

const ExitDetail = () => {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [people, setPeople] = useState([]);
  const [form, setForm] = useState(null);
  const [handTo, setHandTo] = useState("");
  const [preview, setPreview] = useState(null);
  const [lines, setLines] = useState([]);
  const [interview, setInterview] = useState({ notes: "", rating: "", wouldRehire: "" });
  const [letterNote, setLetterNote] = useState("");
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([axiosInstance.get(`/v1/hr/exits/${userId}`), axiosInstance.get("/v1/hr/employees")]);
      setData(r.data);
      const e = r.data.profile?.exit;
      setForm(e ? { type: e.type, reason: e.reason || "", noticeDate: toInput(e.noticeDate), lastWorkingDay: toInput(e.lastWorkingDay) } : null);
      setLines(e?.settlement?.lines || []);
      setInterview({ notes: e?.interview?.notes || "", rating: e?.interview?.rating ?? "", wouldRehire: e?.interview?.wouldRehire === undefined ? "" : String(e.interview.wouldRehire) });
      setPeople((p.data.people || []).filter((x) => x.loginActive && String(x._id) !== String(userId)));
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load");
    }
  }, [userId]);
  useEffect(() => {
    load();
  }, [load]);
  if (!data) return <div className="p-6 text-muted-foreground">Loading...</div>;
  const { user, profile } = data;
  const exit = profile?.exit;
  const s = exit?.settlement;
  const call = async (fn, ok) => {
    try {
      const r = await fn();
      if (ok) toast.success(typeof ok === "function" ? ok(r) : ok);
      load();
      return r;
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };
  const saveDetails = () => call(() => axiosInstance.put(`/v1/hr/exits/${userId}`, { ...form, noticeDate: form.noticeDate && `${form.noticeDate}T12:00:00`, lastWorkingDay: form.lastWorkingDay && `${form.lastWorkingDay}T12:00:00` }), "Saved");
  const toggle = (c) => call(() => axiosInstance.put(`/v1/hr/exits/${userId}`, { checklist: [{ key: c.key, done: !c.done }] }));
  const addItem = async () => {
    const label = await promptDialog("Checklist item");
    if (label) call(() => axiosInstance.put(`/v1/hr/exits/${userId}`, { checklist: [{ key: `custom-${Date.now()}`, label }] }));
  };
  const previewHandover = async () => {
    if (!handTo) return toast.error("Pick who takes over");
    const r = await axiosInstance.post(`/v1/hr/exits/${userId}/handover`, { toUserId: handTo }).catch((e) => toast.error(e.response?.data?.message || "Could not preview"));
    if (r) setPreview(r.data);
  };
  const runHandover = async () => {
    await call(() => axiosInstance.post(`/v1/hr/exits/${userId}/handover`, { toUserId: handTo, commit: true }), `Work handed over to ${preview.toName}`);
    setPreview(null);
  };
  const pdf = async (path, name) => {
    const r = await axiosInstance.get(path, { responseType: "blob", params: letterNote ? { note: letterNote } : {} }).catch(() => null);
    if (r) downloadFile(name, r.data);
    else toast.error("Could not create the PDF");
  };
  const emailLetter = async (type) => {
    const to = await promptDialog(`Email the ${type} letter to:`, profile.personalEmail || user.email);
    if (to) call(() => axiosInstance.post(`/v1/hr/exits/${userId}/letters/${type}`, { to, note: letterNote }), (r) => `Sent to ${r.data.emailedTo}`);
  };
  const saveSettlement = (patch) => call(() => axiosInstance.put(`/v1/hr/exits/${userId}/settlement`, patch), "Settlement saved");
  const countsText = (c) => Object.entries(c || {}).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(", ") || "nothing open";

  return (
    <CrmRoute>
      <div className="p-4 md:p-6 space-y-4">
        <HrHeader icon={DoorOpen} title={user.fullname} subtitle={`${profile?.designation || user.email} · joined ${fmtDate(profile?.dateOfJoining)}`} back="/hr/exits">
          {user.isActive === false ? (
            <Button variant="outline" onClick={async () => await confirmDialog(`Switch ${user.fullname}'s login back on?`) && call(() => axiosInstance.post(`/v1/hr/exits/${userId}/reactivate`), "Login switched back on")}><RotateCcw className="h-4 w-4 mr-1" /> Reactivate login</Button>
          ) : (
            <Button variant="outline" className="text-red-600" onClick={async () => await confirmDialog(`Switch off ${user.fullname}'s CRM login now? They're signed out everywhere, removed from teams, and pending requests are closed.`) && call(() => axiosInstance.post(`/v1/hr/exits/${userId}/deactivate`), "Login switched off")}><Power className="h-4 w-4 mr-1" /> Switch off login now</Button>
          )}
          {exit && exit.status !== "Completed" && <Button onClick={() => call(() => axiosInstance.put(`/v1/hr/exits/${userId}`, { status: "Completed" }), "Exit completed")} className="bg-primary hover:bg-primary/90"><Check className="h-4 w-4 mr-1" /> Mark exit complete</Button>}
        </HrHeader>
        <p className="text-sm">CRM login: {user.isActive === false ? <b className="text-muted-foreground">off since {fmtDate(user.deactivatedAt)}</b> : <b className="text-green-700">active</b>}{exit?.lastWorkingDay && user.isActive !== false ? ` · switches off automatically after ${fmtDate(exit.lastWorkingDay)}` : ""}</p>

        {!exit ? (
          <Card><CardContent className="p-6 text-center space-y-2"><p className="text-muted-foreground">No exit started for {user.fullname}.</p><Button onClick={() => setStarting(true)}>Start exit</Button></CardContent></Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            <Box title="Exit details" action={<Button size="sm" variant="outline" onClick={saveDetails}>Save</Button>}>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1"><Label className="text-xs">Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EXIT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                <div />
                <div className="grid gap-1"><Label className="text-xs">Notice given on</Label><Input type="date" value={form.noticeDate} onChange={(e) => setForm({ ...form, noticeDate: e.target.value })} /></div>
                <div className="grid gap-1"><Label className="text-xs">Last working day</Label><Input type="date" value={form.lastWorkingDay} onChange={(e) => setForm({ ...form, lastWorkingDay: e.target.value })} /></div>
              </div>
              <div className="grid gap-1"><Label className="text-xs">Reason (internal)</Label><Textarea rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            </Box>

            <Box title={`Checklist (${exit.checklist.filter((c) => c.done).length}/${exit.checklist.length})`} action={<Button size="sm" variant="ghost" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Item</Button>}>
              <div className="space-y-1">
                {exit.checklist.map((c) => (
                  <label key={c.key} className="flex items-start gap-2 text-sm cursor-pointer">
                    <input type="checkbox" className="mt-1" checked={!!c.done} onChange={() => toggle(c)} />
                    <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.label}{c.done && <span className="no-underline text-xs text-muted-foreground/70"> · {c.doneBy}{c.note ? ` (${c.note})` : ""}</span>}</span>
                  </label>
                ))}
              </div>
            </Box>

            <Box title="Hand over their work">
              {exit.handover?.at && <p className="text-sm text-green-700">Handed over to {exit.handover.toName} on {fmtDate(exit.handover.at)}: {countsText(exit.handover.counts)}</p>}
              <div className="flex flex-wrap gap-2">
                <Select value={handTo} onValueChange={(v) => { setHandTo(v); setPreview(null); }}><SelectTrigger className="w-56"><SelectValue placeholder="Who takes over?" /></SelectTrigger><SelectContent>{people.map((p) => <SelectItem key={p._id} value={String(p._id)}>{p.fullname}</SelectItem>)}</SelectContent></Select>
                <Button variant="outline" onClick={previewHandover}><ArrowRightLeft className="h-4 w-4 mr-1" /> Preview</Button>
              </div>
              {preview && (
                <div className="text-sm bg-muted/60 rounded-md p-3 space-y-2">
                  <p>Moves to <b>{preview.toName}</b>: {countsText(preview.counts)} (open leads, unfinished tasks and content, active projects, retainers, lead forms, running sequences).</p>
                  <Button size="sm" onClick={runHandover} className="">Hand over now</Button>
                </div>
              )}
            </Box>

            <Box title="Exit interview" action={<Button size="sm" variant="outline" onClick={() => call(() => axiosInstance.put(`/v1/hr/exits/${userId}`, { interview: { notes: interview.notes, rating: interview.rating === "" ? undefined : Number(interview.rating), wouldRehire: interview.wouldRehire === "" ? undefined : interview.wouldRehire === "true" } }), "Saved")}>Save</Button>}>
              <Textarea rows={3} placeholder="Why they're leaving, what we could do better, feedback about their manager..." value={interview.notes} onChange={(e) => setInterview({ ...interview, notes: e.target.value })} />
              <div className="flex flex-wrap gap-3">
                <div className="grid gap-1"><Label className="text-xs">Overall rating (1-5)</Label><Input type="number" min="1" max="5" className="w-24" value={interview.rating} onChange={(e) => setInterview({ ...interview, rating: e.target.value })} /></div>
                <div className="grid gap-1"><Label className="text-xs">Would rehire?</Label><Select value={interview.wouldRehire || "unset"} onValueChange={(v) => setInterview({ ...interview, wouldRehire: v === "unset" ? "" : v })}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unset">—</SelectItem><SelectItem value="true">Yes</SelectItem><SelectItem value="false">No</SelectItem></SelectContent></Select></div>
              </div>
            </Box>

            <div className="lg:col-span-2">
              <Box title="Full & final settlement" action={
                <div className="flex gap-1">
                  {(!s || s.status === "Draft") && <Button size="sm" variant="outline" onClick={async () => (!s || await confirmDialog("Recalculate from salary, attendance and leave? Manual changes are replaced.")) && call(() => axiosInstance.post(`/v1/hr/exits/${userId}/settlement`), "Settlement calculated")}>{s ? "Recalculate" : "Calculate"}</Button>}
                  {s && <Button size="sm" variant="outline" onClick={() => pdf(`/v1/hr/exits/${userId}/settlement/pdf`, `Full-and-final-${user.fullname}.pdf`)}><Download className="h-4 w-4 mr-1" /> PDF</Button>}
                </div>
              }>
                {!s && <p className="text-sm text-muted-foreground">Calculates salary for the days worked in the last month, unused vacation leave encashment and pro-rated deductions from their salary structure. You can edit every line. Payroll then leaves them out of that month.</p>}
                {s && (
                  <>
                    <p className="text-xs text-muted-foreground">{s.month} · {s.daysWorked} of {s.daysInMonth} days worked · daily rate {inr(s.dailyRate)} · {s.encashDays || 0} leave days encashable · status <b>{s.status}</b>{s.paidAt ? ` · paid ${fmtDate(s.paidAt)} ${s.paymentRef || ""}` : ""}</p>
                    <div className="space-y-2">
                      {lines.map((l, i) => (
                        <div key={i} className="flex gap-2">
                          <Select value={l.kind} disabled={s.status !== "Draft"} onValueChange={(v) => setLines(lines.map((x, j) => (j === i ? { ...x, kind: v } : x)))}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="earning">Earning</SelectItem><SelectItem value="deduction">Deduction</SelectItem></SelectContent></Select>
                          <Input value={l.name} disabled={s.status !== "Draft"} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                          <Input type="number" className="w-36" value={l.amount} disabled={s.status !== "Draft"} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} />
                          {s.status === "Draft" && <Button size="icon" variant="ghost" className="text-red-600" onClick={() => setLines(lines.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>}
                        </div>
                      ))}
                    </div>
                    {s.status === "Draft" && <Button size="sm" variant="outline" onClick={() => setLines([...lines, { kind: "deduction", name: "Notice period shortfall / recovery", amount: 0 }])}><Plus className="h-4 w-4 mr-1" /> Add line</Button>}
                    <p className="text-sm">Earnings {inr(s.totalEarnings)} − deductions {inr(s.totalDeductions)} = <b>{s.netPayable >= 0 ? `${inr(s.netPayable)} payable` : `${inr(-s.netPayable)} to recover`}</b></p>
                    <div className="flex flex-wrap gap-2">
                      {s.status === "Draft" && <Button size="sm" variant="outline" onClick={() => saveSettlement({ lines })}>Save lines</Button>}
                      {s.status === "Draft" && <Button size="sm" onClick={() => saveSettlement({ lines, status: "Final" })} className="bg-primary hover:bg-primary/90">Finalise</Button>}
                      {s.status === "Final" && <Button size="sm" variant="outline" onClick={() => saveSettlement({ status: "Draft" })}>Back to draft</Button>}
                      {s.status === "Final" && <Button size="sm" onClick={async () => { const ref = await promptDialog("Payment reference (UTR / cheque no.)"); if (ref !== null) saveSettlement({ status: "Paid", paymentRef: ref }); }} className="bg-primary hover:bg-primary/90">Mark as paid</Button>}
                    </div>
                  </>
                )}
              </Box>
            </div>

            <div className="lg:col-span-2">
              <Box title="Relieving & experience letters">
                <Textarea rows={2} placeholder="Optional: replace the closing paragraph (e.g. specific achievements)" value={letterNote} onChange={(e) => setLetterNote(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  {[["relieving", "Relieving letter"], ["experience", "Experience certificate"]].map(([t, label]) => (
                    <div key={t} className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => pdf(`/v1/hr/exits/${userId}/letters/${t}`, `${label}-${user.fullname}.pdf`)}><Download className="h-4 w-4 mr-1" /> {label}</Button>
                      <Button size="sm" variant="outline" onClick={() => emailLetter(t)} title={`Email the ${label.toLowerCase()}`}><Mail className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
                {(exit.letters || []).length > 0 && <p className="text-xs text-muted-foreground">{exit.letters.map((l) => `${l.type} sent to ${l.emailedTo} on ${fmtDate(l.issuedAt)}`).join(" · ")}</p>}
                {["Terminated", "Absconded"].includes(exit.type) && <p className="text-xs text-amber-700">This exit is "{exit.type}" - check the wording before issuing an experience certificate.</p>}
              </Box>
            </div>
          </div>
        )}
        {starting && <StartExitDialog people={[]} userId={userId} onClose={() => setStarting(false)} onStarted={() => { setStarting(false); load(); }} />}
      </div>
    </CrmRoute>
  );
};

export default ExitDetail;
