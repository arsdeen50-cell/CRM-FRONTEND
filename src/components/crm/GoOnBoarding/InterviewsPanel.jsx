import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, ClipboardCheck, MessagesSquare, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { confirmDialog } from "@/components/ui/app-dialogs";
import axiosInstance from "@/utils/axiosConfig";
import { USER_API_END_POINT } from "@/constants";

const ROUNDS = ["Screening call", "Portfolio review", "Practical task", "Final interview"];
const REC_STYLE = { "Strong yes": "bg-green-100 text-green-800", Yes: "bg-green-50 text-green-700", Maybe: "bg-amber-100 text-amber-800", No: "bg-red-100 text-red-700" };
const STATUS_STYLE = { Scheduled: "bg-blue-100 text-blue-800", Done: "bg-slate-100 text-slate-700", "No-show": "bg-red-100 text-red-700", Cancelled: "bg-gray-100 text-gray-500 line-through" };
const pad = (n) => String(n).padStart(2, "0");
const toLocalInput = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
};
const nextHour = () => {
  const d = new Date(Date.now() + 86400000);
  d.setMinutes(0, 0, 0);
  d.setHours(11);
  return d;
};
const fmt = (d) => new Date(d).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const Stars = ({ value, onChange }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" onClick={() => onChange?.(value === n ? null : n)} disabled={!onChange} title={`${n} of 5`}>
        <Star className={`h-5 w-5 ${n <= (value || 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
      </button>
    ))}
  </div>
);

const InterviewDialog = ({ onboardingId, interview, meta, people, onClose, onSaved }) => {
  const editing = !!interview?._id;
  const [f, setF] = useState(() => ({
    round: interview?.round || ROUNDS[0],
    scheduledAt: toLocalInput(interview?.scheduledAt || nextHour()),
    durationMinutes: interview?.durationMinutes || 30,
    mode: interview?.mode || "Video call",
    location: interview?.location || "",
    interviewerIds: (interview?.interviewerIds || []).map(String),
    status: interview?.status || "Scheduled",
    rating: interview?.rating || null,
    recommendation: interview?.recommendation || "",
    feedback: interview?.feedback || "",
  }));
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    const body = { ...f, scheduledAt: new Date(f.scheduledAt).toISOString() };
    try {
      if (editing) await axiosInstance.put(`/v1/onboarding/${onboardingId}/interviews/${interview._id}`, body);
      else await axiosInstance.post(`/v1/onboarding/${onboardingId}/interviews`, body);
      toast.success(editing ? "Interview saved" : "Interview scheduled");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the interview");
    }
  };
  const toggle = (id) => set("interviewerIds", f.interviewerIds.includes(id) ? f.interviewerIds.filter((x) => x !== id) : [...f.interviewerIds, id]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? interview.round : "Schedule an interview"}</DialogTitle>
          <DialogDescription>{editing ? "Reschedule, or record how it went." : "Interviewers get a notification."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label>Round</Label>
            <Input list="interview-rounds" value={f.round} onChange={(e) => set("round", e.target.value)} />
            <datalist id="interview-rounds">{ROUNDS.map((r) => <option key={r} value={r} />)}</datalist>
          </div>
          <div className="grid grid-cols-[1fr_110px] gap-3">
            <div className="grid gap-1"><Label>When</Label><Input type="datetime-local" value={f.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Minutes</Label><Input type="number" min="5" step="5" value={f.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-3">
            <div className="grid gap-1"><Label>How</Label><select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={f.mode} onChange={(e) => set("mode", e.target.value)}>{meta.modes.map((m) => <option key={m}>{m}</option>)}</select></div>
            <div className="grid gap-1"><Label>{f.mode === "In person" ? "Address" : f.mode === "Phone" ? "Number" : "Meeting link"}</Label><Input value={f.location} onChange={(e) => set("location", e.target.value)} /></div>
          </div>
          <div className="grid gap-1">
            <Label>Interviewers</Label>
            <div className="flex max-h-28 flex-wrap gap-1 overflow-y-auto">
              {people.map((p) => (
                <button key={p._id} type="button" onClick={() => toggle(String(p._id))} className={`rounded-full border px-2.5 py-1 text-xs ${f.interviewerIds.includes(String(p._id)) ? "border-brand bg-brand-soft text-brand" : "border-border text-muted-foreground"}`}>{p.fullname}</button>
              ))}
            </div>
          </div>
          {editing && (
            <div className="space-y-3 rounded-md border border-border p-3">
              <div className="grid gap-1"><Label>Status</Label><select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={f.status} onChange={(e) => set("status", e.target.value)}>{meta.statuses.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div className="flex flex-wrap items-center justify-between gap-2"><Label>Rating</Label><Stars value={f.rating} onChange={(v) => set("rating", v)} /></div>
              <div className="grid gap-1">
                <Label>Recommendation</Label>
                <div className="flex flex-wrap gap-1">
                  {meta.recommendations.map((r) => <button key={r} type="button" onClick={() => set("recommendation", f.recommendation === r ? "" : r)} className={`rounded-full border px-2.5 py-1 text-xs ${f.recommendation === r ? `${REC_STYLE[r]} border-transparent` : "border-border text-muted-foreground"}`}>{r}</button>)}
                </div>
              </div>
              <div className="grid gap-1"><Label>Feedback</Label><Textarea rows={4} value={f.feedback} onChange={(e) => set("feedback", e.target.value)} placeholder="Strengths, concerns, what to check in the next round" /></div>
            </div>
          )}
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>{editing ? "Save" : "Schedule"}</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* On a candidate's onboarding record: their interview rounds - schedule, add to calendar, and record rating,
   recommendation and feedback so the hiring decision has its reasons written down. */
const InterviewsPanel = ({ onboardingId }) => {
  const [data, setData] = useState(null);
  const [people, setPeople] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await axiosInstance.get(`/v1/onboarding/${onboardingId}/interviews`);
      setData(r.data);
    } catch {
      setData({ interviews: [], summary: {}, modes: ["Video call"], statuses: ["Scheduled"], recommendations: [] });
    }
  }, [onboardingId]);
  useEffect(() => {
    load();
    axiosInstance.get(`${USER_API_END_POINT}/admin/users`).then((r) => setPeople((r.data.users || []).filter((u) => u.isActive !== false).sort((a, b) => a.fullname.localeCompare(b.fullname)))).catch(() => {});
  }, [load]);

  const remove = async (i) => {
    if (!(await confirmDialog(`Delete the "${i.round}" interview?`))) return;
    await axiosInstance.delete(`/v1/onboarding/${onboardingId}/interviews/${i._id}`).catch(() => toast.error("Could not delete"));
    load();
  };
  const addToCalendar = async (i) => {
    try {
      const r = await axiosInstance.get(`/v1/onboarding/${onboardingId}/interviews/${i._id}/ics`, { responseType: "blob" });
      const url = URL.createObjectURL(r.data);
      const a = Object.assign(document.createElement("a"), { href: url, download: `interview-${i.candidateName || "candidate"}.ics` });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error("Could not create the calendar invite");
    }
  };

  if (!data) return null;
  const { interviews, summary } = data;
  return (
    <div className="mt-6 space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="flex items-center gap-2 font-semibold"><MessagesSquare className="h-4 w-4 text-brand" /> Interviews</h4>
          <p className="text-sm text-muted-foreground">
            {summary.rounds ? `${summary.done} of ${summary.rounds} round${summary.rounds === 1 ? "" : "s"} done${summary.averageRating ? ` · average ${summary.averageRating}/5` : ""}` : "Schedule rounds and write down how each one went."}
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setEditing({})}><Plus className="mr-1 h-4 w-4" /> Schedule</Button>
      </div>
      {interviews.map((i) => (
        <div key={i._id} className="rounded-md border border-border p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium">{i.round} <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-normal ${STATUS_STYLE[i.status] || ""}`}>{i.status}</span></p>
              <p className="text-sm text-muted-foreground">{fmt(i.scheduledAt)} · {i.durationMinutes} min · {i.mode}{i.interviewerNames?.length ? ` · ${i.interviewerNames.join(", ")}` : ""}</p>
              {i.location && (/^https?:\/\//.test(i.location) ? <a href={i.location} target="_blank" rel="noreferrer" className="text-sm text-brand hover:underline">{i.location}</a> : <p className="text-sm text-muted-foreground">{i.location}</p>)}
            </div>
            <div className="flex gap-1">
              {i.status === "Scheduled" && <Button type="button" variant="ghost" size="icon" title="Add to calendar" onClick={() => addToCalendar(i)}><CalendarPlus className="h-4 w-4" /></Button>}
              <Button type="button" variant="ghost" size="icon" title={i.status === "Scheduled" ? "Record outcome / edit" : "Edit"} onClick={() => setEditing(i)}>{i.status === "Scheduled" ? <ClipboardCheck className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}</Button>
              <Button type="button" variant="ghost" size="icon" title="Delete" onClick={() => remove(i)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          {(i.rating || i.recommendation || i.feedback) && (
            <div className="mt-2 space-y-1 border-t border-border pt-2">
              <div className="flex flex-wrap items-center gap-2">
                {i.rating && <Stars value={i.rating} />}
                {i.recommendation && <span className={`rounded-full px-2 py-0.5 text-xs ${REC_STYLE[i.recommendation]}`}>{i.recommendation}</span>}
                {i.feedbackBy && <span className="text-xs text-muted-foreground">by {i.feedbackBy}</span>}
              </div>
              {i.feedback && <p className="whitespace-pre-wrap text-sm">{i.feedback}</p>}
            </div>
          )}
        </div>
      ))}
      {editing && <InterviewDialog onboardingId={onboardingId} interview={editing} meta={data} people={people} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
};

export default InterviewsPanel;
