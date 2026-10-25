import { OutreachRoute } from "@/components/crm/AccessRoute";
import React, { useCallback, useEffect, useState } from "react";
import { Repeat, Plus, Trash2, Edit, CheckCircle2, SkipForward, StopCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/components/crm/CrmMemberRoute";
import PageHeader, { Pill } from "@/components/crm/PageHeader";
import { stepLabel } from "@/components/crm/EnrollSequenceDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosInstance from "@/utils/axiosConfig";
import { errMsg } from "@/lib/publicApi";
import { ACTIVITY_OUTCOMES, formatDay } from "@/lib/crmOutreach";
import { confirmDialog } from "@/components/ui/app-dialogs";

const CHANNELS = ["Email", "WhatsApp", "Call", "Visit", "Instagram DM"];
const STATUS_STYLE = { active: "bg-blue-100 text-brand", waiting: "bg-amber-100 text-amber-800", completed: "bg-green-100 text-green-700", stopped: "bg-gray-100 text-muted-foreground" };
const STARTER = {
  name: "New prospect - 3 touches",
  description: "Email, then WhatsApp, then a call.",
  stopOnReply: true,
  steps: [
    { dayOffset: 0, channel: "Email", mode: "auto", subject: "A quick idea for {{brandName}}", body: "Hi {{firstName}},\n\nI was looking at {{website}} and noticed {{gap}}.\n\n{{angle}}\n\nCould I send you a free one-page plan?\n\n{{myName}}\n{{company}}" },
    { dayOffset: 2, channel: "WhatsApp", mode: "manual", body: "Hi {{firstName}}, {{myName}} from {{company}} here - I emailed you a quick idea for {{brandName}}. Happy to share the 1-page plan here if easier?" },
    { dayOffset: 3, channel: "Call", mode: "manual", body: "Call {{firstName}}: mention the email + WhatsApp, offer a 15-minute walkthrough." },
  ],
};

const SequenceEditor = ({ open, onOpenChange, sequence, onSaved }) => {
  const [form, setForm] = useState(STARTER);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) setForm(sequence ? JSON.parse(JSON.stringify(sequence)) : JSON.parse(JSON.stringify(STARTER)));
  }, [open, sequence]);
  const setStep = (i, k, v) => setForm((f) => ({ ...f, steps: f.steps.map((s, j) => (j === i ? { ...s, [k]: v, ...(k === "channel" && !["Email", "WhatsApp"].includes(v) && { mode: "manual" }) } : s)) }));
  const save = async () => {
    if (!form.name?.trim()) return toast.error("Name the sequence");
    if (!form.steps.length) return toast.error("Add at least one step");
    setSaving(true);
    try {
      const payload = { name: form.name, description: form.description, stopOnReply: form.stopOnReply, isActive: form.isActive !== false, steps: form.steps };
      if (sequence) await axiosInstance.put(`/v1/sequence/${sequence._id}`, payload);
      else await axiosInstance.post("/v1/sequence", payload);
      toast.success("Sequence saved");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(errMsg(err, "Could not save"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sequence ? "Edit sequence" : "New sequence"}</DialogTitle>
          <DialogDescription>
            Day offset = days after the previous step. Auto email sends itself; auto WhatsApp needs a template approved by Meta. Placeholders: {"{{firstName}} {{brandName}} {{website}} {{gap}} {{angle}} {{myName}} {{company}}"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid gap-1"><Label>Description</Label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.stopOnReply !== false} onChange={(e) => setForm({ ...form, stopOnReply: e.target.checked })} /> Stop when the lead replies (WhatsApp/Instagram reply, or an outcome like Replied / Interested is logged)
          </label>
          {form.steps.map((s, i) => (
            <div key={i} className="border rounded-md p-3 grid gap-2">
              <div className="flex flex-wrap items-end gap-2">
                <span className="font-medium text-sm w-14">Step {i + 1}</span>
                <div className="grid gap-1 w-24"><Label className="text-xs">Day +</Label><Input type="number" min="0" max="90" value={s.dayOffset} onChange={(e) => setStep(i, "dayOffset", e.target.value)} /></div>
                <div className="grid gap-1 w-40">
                  <Label className="text-xs">Channel</Label>
                  <Select value={s.channel} onValueChange={(v) => setStep(i, "channel", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1 w-40">
                  <Label className="text-xs">Mode</Label>
                  <Select value={s.mode} onValueChange={(v) => setStep(i, "mode", v)} disabled={!["Email", "WhatsApp"].includes(s.channel)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual task</SelectItem>
                      <SelectItem value="auto">Send automatically</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="ml-auto flex gap-1">
                  <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => setForm((f) => { const st = [...f.steps]; [st[i - 1], st[i]] = [st[i], st[i - 1]]; return { ...f, steps: st }; })}>↑</Button>
                  <Button size="icon" variant="ghost" className="text-red-600" onClick={() => setForm((f) => ({ ...f, steps: f.steps.filter((_, j) => j !== i) }))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              {s.channel === "Email" && <Input placeholder="Subject" value={s.subject} onChange={(e) => setStep(i, "subject", e.target.value)} />}
              {s.channel === "WhatsApp" && s.mode === "auto" && (
                <div className="grid sm:grid-cols-3 gap-2">
                  <Input placeholder="Approved template name" value={s.waTemplateName || ""} onChange={(e) => setStep(i, "waTemplateName", e.target.value)} />
                  <Input placeholder="Language (en)" value={s.waTemplateLanguage || "en"} onChange={(e) => setStep(i, "waTemplateLanguage", e.target.value)} />
                  <Input placeholder="Variables: {{firstName}} | {{brandName}}" value={s.waTemplateParams || ""} onChange={(e) => setStep(i, "waTemplateParams", e.target.value)} />
                </div>
              )}
              <Textarea rows={s.channel === "Email" ? 5 : 3} placeholder={s.mode === "auto" ? "Message" : "What to do / script"} value={s.body} onChange={(e) => setStep(i, "body", e.target.value)} />
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-fit" onClick={() => setForm((f) => ({ ...f, steps: [...f.steps, { dayOffset: 2, channel: "Call", mode: "manual", subject: "", body: "" }] }))}>
            <Plus className="h-4 w-4 mr-1" /> Add step
          </Button>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="">{saving ? "Saving..." : "Save sequence"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CompleteDialog = ({ enrollment, onOpenChange, onDone }) => {
  const [outcome, setOutcome] = useState("No answer");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setOutcome(enrollment?.step?.channel === "Email" || enrollment?.step?.channel === "WhatsApp" ? "Sent" : "No answer");
    setNote("");
  }, [enrollment]);
  if (!enrollment) return null;
  const submit = async (skip) => {
    setSaving(true);
    try {
      await axiosInstance.post(`/v1/sequence/enrollments/${enrollment._id}/complete`, skip ? { skip: true } : { outcome, note });
      toast.success(skip ? "Step skipped" : "Step done");
      onDone();
      onOpenChange(false);
    } catch (err) {
      toast.error(errMsg(err, "Could not update"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{enrollment.clientName}: {enrollment.step?.channel}</DialogTitle>
          <DialogDescription>{enrollment.sequenceId?.name} · step {enrollment.stepIndex + 1} of {enrollment.sequenceId?.steps?.length}</DialogDescription>
        </DialogHeader>
        {enrollment.step?.body && <p className="text-sm whitespace-pre-wrap bg-muted/60 rounded-md p-3">{enrollment.step.body}</p>}
        <p className="text-xs text-muted-foreground">Use the Contact button on the lead to send it, then record the result here. Placeholders are filled in on the Contact screen.</p>
        <div className="grid gap-1">
          <Label>Outcome</Label>
          <Select value={outcome} onValueChange={setOutcome}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ACTIVITY_OUTCOMES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => submit(true)} disabled={saving}><SkipForward className="h-4 w-4 mr-1" /> Skip step</Button>
          <Button onClick={() => submit(false)} disabled={saving} className="bg-primary hover:bg-primary/90"><CheckCircle2 className="h-4 w-4 mr-1" /> Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Sequences = () => {
  const isAdmin = useIsAdmin();
  const [sequences, setSequences] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [editing, setEditing] = useState(undefined);
  const [completing, setCompleting] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, e] = await Promise.all([axiosInstance.get("/v1/sequence"), axiosInstance.get("/v1/sequence/enrollments")]);
      setSequences(s.data.sequences || []);
      setEnrollments(e.data.enrollments || []);
    } catch (err) {
      toast.error(errMsg(err, "Could not load sequences"));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const due = enrollments.filter((e) => e.status === "waiting");
  const running = enrollments.filter((e) => e.status === "active");
  const done = enrollments.filter((e) => ["completed", "stopped"].includes(e.status));

  const stop = async (e) => {
    if (!await confirmDialog(`Stop the sequence for ${e.clientName}?`)) return;
    try {
      await axiosInstance.post(`/v1/sequence/enrollments/${e._id}/stop`);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const toggle = async (s) => {
    try {
      await axiosInstance.put(`/v1/sequence/${s._id}`, { isActive: !s.isActive });
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const remove = async (s) => {
    if (!await confirmDialog(`Delete "${s.name}"? Leads in it stop.`)) return;
    try {
      await axiosInstance.delete(`/v1/sequence/${s._id}`);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const EnrollmentTable = ({ rows, empty, showDue }) => (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Sequence</TableHead>
              <TableHead>Step</TableHead>
              <TableHead>{showDue ? "Due since" : "Next / status"}</TableHead>
              <TableHead>By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{loading ? "Loading..." : empty}</TableCell></TableRow>}
            {rows.map((e) => (
              <TableRow key={e._id}>
                <TableCell className="font-medium">{e.clientName}</TableCell>
                <TableCell>{e.sequenceId?.name || "—"}</TableCell>
                <TableCell className="text-sm">{e.step ? `${e.stepIndex + 1}/${e.sequenceId?.steps?.length} · ${stepLabel(e.step)}` : "—"}<div className="text-xs text-muted-foreground">{e.log?.[e.log.length - 1]?.detail}</div></TableCell>
                <TableCell className="text-sm">
                  {showDue ? formatDay(e.dueSince) : e.status === "active" ? formatDay(e.nextRunAt) : <Pill className={STATUS_STYLE[e.status]}>{e.status}{e.stoppedReason ? `: ${e.stoppedReason}` : ""}</Pill>}
                </TableCell>
                <TableCell className="text-sm">{e.enrolledBy}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {showDue && <Button size="sm" onClick={() => setCompleting(e)} className="bg-primary hover:bg-primary/90"><CheckCircle2 className="h-3 w-3 mr-1" /> Done / skip</Button>}
                    {["active", "waiting"].includes(e.status) && <Button size="icon" variant="ghost" className="text-red-600" title="Stop" onClick={() => stop(e)}><StopCircle className="h-4 w-4" /></Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <OutreachRoute>
      <div className="p-4 md:p-6 space-y-4">
        <PageHeader icon={Repeat} title="Follow-up sequences" subtitle='Multi-step cadences. Add leads from the Leads page ("Add to sequence"). They stop when the lead replies or is Won/Lost.'>
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>
          {isAdmin && <Button onClick={() => setEditing(null)} className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" /> New sequence</Button>}
        </PageHeader>
        <Tabs defaultValue={due.length ? "due" : "sequences"} key={due.length ? "d" : "s"}>
          <TabsList>
            <TabsTrigger value="due">Steps due {due.length ? `(${due.length})` : ""}</TabsTrigger>
            <TabsTrigger value="running">Running ({running.length})</TabsTrigger>
            <TabsTrigger value="done">Finished</TabsTrigger>
            <TabsTrigger value="sequences">Sequences ({sequences.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="due"><EnrollmentTable rows={due} empty="No manual steps due. Nice." showDue /></TabsContent>
          <TabsContent value="running"><EnrollmentTable rows={running} empty="No leads waiting for their next step." /></TabsContent>
          <TabsContent value="done"><EnrollmentTable rows={done} empty="Nothing finished yet." /></TabsContent>
          <TabsContent value="sequences">
            <div className="grid md:grid-cols-2 gap-3">
              {sequences.length === 0 && <p className="text-sm text-muted-foreground">{isAdmin ? 'No sequences yet. Click "New sequence" - it starts with a 3-step example you can edit.' : "No sequences yet. Ask an admin to create one."}</p>}
              {sequences.map((s) => (
                <Card key={s._id} className={s.isActive ? "" : "opacity-60"}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{s.name} {!s.isActive && <Pill className="bg-gray-100 text-muted-foreground">Paused</Pill>}</p>
                        {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => toggle(s)}>{s.isActive ? "Pause" : "Resume"}</Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditing(s)}><Edit className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-red-600" onClick={() => remove(s)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </div>
                    <ol className="text-sm space-y-1">
                      {s.steps.map((st, i) => <li key={i} className="flex gap-2"><span className="text-muted-foreground/70 w-5">{i + 1}.</span>{stepLabel(st)}{st.subject ? <span className="text-muted-foreground truncate">· {st.subject}</span> : null}</li>)}
                    </ol>
                    <p className="text-xs text-muted-foreground">Running {s.stats?.active || 0} · due {s.stats?.waiting || 0} · finished {(s.stats?.completed || 0) + (s.stats?.stopped || 0)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        <SequenceEditor open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)} sequence={editing} onSaved={load} />
        <CompleteDialog enrollment={completing} onOpenChange={(o) => !o && setCompleting(null)} onDone={load} />
      </div>
    </OutreachRoute>
  );
};

export default Sequences;
