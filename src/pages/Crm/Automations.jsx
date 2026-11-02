import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, History, Pencil, Play, Plus, Trash2, Workflow } from "lucide-react";
import { toast } from "sonner";
import CrmRoute from "@/components/crm/CrmRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { confirmDialog } from "@/components/ui/app-dialogs";
import axiosInstance from "@/utils/axiosConfig";
import { USER_API_END_POINT } from "@/constants";

const WHO = { owner: "the lead's owner", admins: "admins", user: "a specific person" };
const select = "h-9 rounded-md border border-input bg-background px-2 text-sm";
const blank = { name: "", active: true, trigger: { type: "lead_stuck", stage: "", days: 7 }, action: { createTask: true, taskTitle: "", taskDueDays: 1, notify: true, assignTo: "owner", userId: "" } };
const sentence = (r, triggers, people) => {
  const t = triggers.find((x) => x.key === r.trigger.type)?.label || r.trigger.type;
  const stage = r.trigger.type === "lead_stuck" ? ` in ${r.trigger.stage || "any open stage"}` : "";
  const who = r.action.assignTo === "user" ? people.find((p) => String(p._id) === String(r.action.userId))?.fullname || "someone" : WHO[r.action.assignTo];
  const what = [r.action.createTask && `create a task (due in ${r.action.taskDueDays} day${r.action.taskDueDays === 1 ? "" : "s"})`, r.action.notify && "notify"].filter(Boolean).join(" and ");
  return `${t}${stage} for ${r.trigger.days} days → ${what} for ${who}`;
};

const RuleDialog = ({ rule, meta, people, onClose, onSaved }) => {
  const editing = !!rule._id;
  const [f, setF] = useState(() => JSON.parse(JSON.stringify({ ...blank, ...rule, trigger: { ...blank.trigger, ...rule.trigger }, action: { ...blank.action, ...rule.action, userId: rule.action?.userId || "" } })));
  const [actOnExisting, setActOnExisting] = useState(false);
  const [preview, setPreview] = useState(null);
  const setT = (k, v) => { setF((x) => ({ ...x, trigger: { ...x.trigger, [k]: v } })); setPreview(null); };
  const setA = (k, v) => setF((x) => ({ ...x, action: { ...x.action, [k]: v } }));
  const trig = meta.triggers.find((t) => t.key === f.trigger.type);
  const isLead = ["lead_stuck", "lead_no_contact", "proposal_no_reply"].includes(f.trigger.type);

  const body = () => ({ ...f, trigger: { ...f.trigger, days: Number(f.trigger.days) }, action: { ...f.action, taskDueDays: Number(f.action.taskDueDays) } });
  const runPreview = async () => {
    try {
      const r = await axiosInstance.post("/v1/automations/preview", body());
      setPreview(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not check");
    }
  };
  const save = async () => {
    try {
      const r = editing ? await axiosInstance.put(`/v1/automations/${rule._id}`, body()) : await axiosInstance.post("/v1/automations", { ...body(), actOnExisting });
      toast.success(r.data.skipped ? `Saved. ${r.data.skipped} already-matching record${r.data.skipped === 1 ? " was" : "s were"} skipped - the rule acts on new ones from now.` : "Rule saved");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the rule");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit rule" : "New automation rule"}</DialogTitle>
          <DialogDescription>Checked every hour. Each record triggers a rule once per situation, so nobody gets a task every day.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1"><Label>Rule name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Nudge stuck negotiations" /></div>

          <div className="grid gap-2 rounded-md border border-border p-3">
            <p className="text-sm font-medium">When</p>
            <select className={select} value={f.trigger.type} onChange={(e) => setT("type", e.target.value)}>{meta.triggers.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select>
            {f.trigger.type === "lead_stuck" && (
              <select className={select} value={f.trigger.stage} onChange={(e) => setT("stage", e.target.value)}>
                <option value="">in any open stage</option>
                {meta.stages.map((s) => <option key={s} value={s}>in {s}</option>)}
              </select>
            )}
            <label className="flex items-center gap-2 text-sm">for <Input type="number" min="1" max="365" className="h-9 w-20" value={f.trigger.days} onChange={(e) => setT("days", e.target.value)} /> days {f.trigger.type === "invoice_overdue" ? "after the due date" : ""}</label>
          </div>

          <div className="grid gap-2 rounded-md border border-border p-3">
            <p className="text-sm font-medium">Then</p>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.action.createTask} onChange={(e) => setA("createTask", e.target.checked)} /> Create a task, due in <Input type="number" min="0" max="60" className="h-8 w-16" value={f.action.taskDueDays} onChange={(e) => setA("taskDueDays", e.target.value)} disabled={!f.action.createTask} /> days</label>
            {f.action.createTask && (
              <div className="grid gap-1">
                <Label className="text-xs">Task title (blank = default)</Label>
                <Input value={f.action.taskTitle} onChange={(e) => setA("taskTitle", e.target.value)} placeholder={trig?.defaultTitle} />
                <p className="text-xs text-muted-foreground">You can use {"{{client}}"}, {"{{days}}"}{isLead ? ", {{stage}}" : ""}{["proposal_no_reply", "invoice_overdue"].includes(f.trigger.type) ? ", {{ref}}" : ""}{f.trigger.type === "invoice_overdue" ? ", {{amount}}" : ""}.</p>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.action.notify} onChange={(e) => setA("notify", e.target.checked)} /> Send a notification</label>
            <div className="grid gap-1">
              <Label className="text-xs">For</Label>
              <select className={select} value={f.action.assignTo} onChange={(e) => setA("assignTo", e.target.value)}>
                {isLead && <option value="owner">The lead&apos;s owner (admins if none)</option>}
                <option value="admins">All admins</option>
                <option value="user">A specific person</option>
              </select>
              {f.action.assignTo === "user" && (
                <select className={select} value={f.action.userId} onChange={(e) => setA("userId", e.target.value)}>
                  <option value="">Pick a person</option>
                  {people.map((p) => <option key={p._id} value={p._id}>{p.fullname}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="space-y-2 rounded-md bg-muted p-3 text-sm">
            <Button type="button" variant="outline" size="sm" onClick={runPreview}>Check what it matches now</Button>
            {preview && (
              <div>
                <p>{preview.matching} record{preview.matching === 1 ? "" : "s"} match right now{editing ? `; ${preview.wouldAct} not acted on yet` : ""}.</p>
                {preview.examples.length > 0 && <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">{preview.examples.map((e) => <li key={e}>{e}</li>)}</ul>}
              </div>
            )}
            {!editing && (
              <label className="flex items-start gap-2 text-xs"><input type="checkbox" className="mt-0.5" checked={actOnExisting} onChange={(e) => setActOnExisting(e.target.checked)} /> <span>Also act on what already matches today (otherwise the rule only acts on new cases from now on)</span></label>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Rule is on</label>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Save rule</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const HistoryDialog = ({ rule, onClose }) => {
  const [fires, setFires] = useState(null);
  useEffect(() => {
    axiosInstance.get(`/v1/automations/${rule._id}/history`).then((r) => setFires(r.data.fires)).catch(() => setFires([]));
  }, [rule._id]);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>{rule.name}</DialogTitle><DialogDescription>The latest records this rule acted on.</DialogDescription></DialogHeader>
        {!fires ? <p className="text-sm text-muted-foreground">Loading...</p> : fires.length === 0 ? <p className="text-sm text-muted-foreground">Nothing yet.</p> : (
          <ul className="divide-y divide-border text-sm">
            {fires.map((f) => <li key={f._id} className="py-2"><p>{f.label}</p><p className="text-xs text-muted-foreground">{new Date(f.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}{f.taskId ? " · task created" : ""}</p></li>)}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* Admin > Automations: simple "when this, then that" rules - nudge stuck leads, chase silent proposals and late
   invoices - without code. */
const Automations = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [people, setPeople] = useState([]);
  const [editing, setEditing] = useState(null);
  const [history, setHistory] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await axiosInstance.get("/v1/automations");
      setData(r.data);
    } catch {
      toast.error("Could not load automation rules");
    }
  }, []);
  useEffect(() => {
    load();
    axiosInstance.get(`${USER_API_END_POINT}/admin/users`).then((r) => setPeople((r.data.users || []).filter((u) => u.isActive !== false))).catch(() => {});
  }, [load]);

  const toggle = async (r) => {
    try {
      const res = await axiosInstance.put(`/v1/automations/${r._id}`, { ...r, active: !r.active });
      toast.success(r.active ? "Rule switched off" : res.data.skipped ? `Rule on - ${res.data.skipped} existing match${res.data.skipped === 1 ? "" : "es"} skipped` : "Rule switched on");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update");
    }
  };
  const runNow = async (r) => {
    try {
      const res = await axiosInstance.post(`/v1/automations/${r._id}/run`);
      toast.success(res.data.acted ? `Acted on ${res.data.acted} record${res.data.acted === 1 ? "" : "s"}` : "Nothing new to act on");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not run");
    }
  };
  const remove = async (r) => {
    if (!(await confirmDialog(`Delete the rule "${r.name}"? Tasks it already created stay.`))) return;
    await axiosInstance.delete(`/v1/automations/${r._id}`).catch(() => toast.error("Could not delete"));
    load();
  };

  const examples = [
    { name: "Nudge negotiations that stall", trigger: { type: "lead_stuck", stage: "Negotiation", days: 7 }, action: { ...blank.action } },
    { name: "Re-contact quiet leads", trigger: { type: "lead_no_contact", stage: "", days: 14 }, action: { ...blank.action } },
    { name: "Follow up unanswered proposals", trigger: { type: "proposal_no_reply", stage: "", days: 5 }, action: { ...blank.action } },
    { name: "Chase invoices a week late", trigger: { type: "invoice_overdue", stage: "", days: 7 }, action: { ...blank.action, assignTo: "admins" } },
  ];

  return (
    <CrmRoute>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/crm")} title="Back to CRM"><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <h1 className="flex items-center gap-2 text-xl font-semibold md:text-2xl"><Workflow className="h-6 w-6 text-brand" /> Automations</h1>
              <p className="text-sm text-muted-foreground">&quot;When this happens, do that&quot; - so stuck leads, silent proposals and late invoices don&apos;t slip.</p>
            </div>
          </div>
          <Button onClick={() => setEditing({})}><Plus className="mr-1 h-4 w-4" /> New rule</Button>
        </div>

        {data && data.rules.length === 0 && (
          <Card><CardContent className="space-y-3 p-4">
            <p className="text-sm">No rules yet. Start from one of these:</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {examples.map((e) => <button key={e.name} onClick={() => setEditing(e)} className="rounded-md border border-border p-3 text-left text-sm hover:bg-accent"><p className="font-medium">{e.name}</p><p className="text-xs text-muted-foreground">{sentence(e, data.triggers, people)}</p></button>)}
            </div>
          </CardContent></Card>
        )}

        {data?.rules.map((r) => (
          <Card key={r._id} className={r.active ? "" : "opacity-70"}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium">{r.name} {!r.active && <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal">off</span>}</p>
                <p className="text-sm text-muted-foreground">{sentence(r, data.triggers, people)}</p>
                <p className="text-xs text-muted-foreground">Acted {r.fired} time{r.fired === 1 ? "" : "s"}{r.lastRunAt ? ` · last checked ${new Date(r.lastRunAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}` : ""}</p>
              </div>
              <div className="flex items-center gap-1">
                <label className="mr-2 flex items-center gap-1 text-xs"><input type="checkbox" checked={r.active} onChange={() => toggle(r)} /> On</label>
                <Button variant="ghost" size="icon" title="Run now" onClick={() => runNow(r)} disabled={!r.active}><Play className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="History" onClick={() => setHistory(r)}><History className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Edit" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Delete" onClick={() => remove(r)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {editing && data && <RuleDialog rule={editing} meta={data} people={people} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
        {history && <HistoryDialog rule={history} onClose={() => setHistory(null)} />}
      </div>
    </CrmRoute>
  );
};

export default Automations;
