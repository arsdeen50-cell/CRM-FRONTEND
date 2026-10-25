import React, { useCallback, useEffect, useState } from "react";
import { Timer, Play, Square, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import CrmMemberRoute, { useIsAdmin } from "@/components/crm/CrmMemberRoute";
import PageHeader, { Stat } from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosInstance from "@/utils/axiosConfig";
import { errMsg } from "@/lib/publicApi";
import { toDateInput } from "@/lib/crmOutreach";
import { confirmDialog } from "@/components/ui/app-dialogs";

const TIMER_KEY = "crm.timer";
const readTimer = () => {
  try {
    return JSON.parse(localStorage.getItem(TIMER_KEY) || "null");
  } catch {
    return null;
  }
};
const hm = (min) => `${Math.floor(min / 60)}h ${String(Math.round(min % 60)).padStart(2, "0")}m`;

const TimeTracking = () => {
  const isAdmin = useIsAdmin();
  const [opts, setOpts] = useState({ clients: [], projects: [] });
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState(toDateInput(new Date(Date.now() - 6 * 86400000)));
  const [to, setTo] = useState(toDateInput(new Date()));
  const [entry, setEntry] = useState({ clientId: "", projectId: "", date: toDateInput(new Date()), hours: "", description: "", billable: true });
  const [timer, setTimer] = useState(readTimer());
  const [, tick] = useState(0);
  const load = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/v1/time", { params: { from, to } });
      setEntries(res.data.entries || []);
      setTotal(res.data.totalMinutes || 0);
    } catch (err) {
      toast.error(errMsg(err, "Could not load time"));
    }
  }, [from, to]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    axiosInstance.get("/v1/time/options").then((r) => setOpts(r.data)).catch(() => {});
  }, []);
  useEffect(() => {
    if (!timer) return;
    const id = setInterval(() => tick((x) => x + 1), 30000);
    return () => clearInterval(id);
  }, [timer]);
  const projectsFor = (clientId) => opts.projects.filter((p) => !clientId || String(p.clientId) === String(clientId));
  const save = async (minutes, data = entry) => {
    if (!data.clientId && !data.projectId) return toast.error("Pick a client or project");
    if (!(minutes > 0)) return toast.error("Enter the time spent");
    try {
      await axiosInstance.post("/v1/time", { clientId: data.clientId || undefined, projectId: data.projectId || undefined, minutes: Math.round(minutes), date: new Date(`${data.date || toDateInput(new Date())}T12:00:00`).toISOString(), description: data.description, billable: data.billable });
      toast.success(`Logged ${hm(minutes)}`);
      setEntry((e) => ({ ...e, hours: "", description: "" }));
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const start = () => {
    if (!entry.clientId && !entry.projectId) return toast.error("Pick a client or project first");
    const t = { ...entry, startedAt: Date.now() };
    try {
      localStorage.setItem(TIMER_KEY, JSON.stringify(t));
    } catch {
      /* private mode: timer lasts for this tab only */
    }
    setTimer(t);
  };
  const stop = async () => {
    const minutes = (Date.now() - timer.startedAt) / 60000;
    try {
      localStorage.removeItem(TIMER_KEY);
    } catch {
      /* ignore */
    }
    setTimer(null);
    if (minutes < 1) return toast.info("Timer under a minute - not logged");
    save(minutes, { ...timer, date: toDateInput(new Date()) });
  };
  const remove = async (e) => {
    if (!await confirmDialog("Delete this entry?")) return;
    await axiosInstance.delete(`/v1/time/${e._id}`).catch((err) => toast.error(errMsg(err)));
    load();
  };
  const byClient = Object.entries(entries.reduce((m, e) => ({ ...m, [e.clientName || "—"]: (m[e.clientName || "—"] || 0) + e.minutes }), {})).sort((a, b) => b[1] - a[1]);
  const running = timer ? (Date.now() - timer.startedAt) / 60000 : 0;
  const timerClient = timer && (opts.clients.find((c) => String(c._id) === String(timer.clientId))?.brandName || opts.projects.find((p) => String(p._id) === String(timer.projectId))?.name);

  return (
    <CrmMemberRoute>
      <div className="p-4 md:p-6 space-y-4">
        <PageHeader icon={Timer} title="Time tracking" subtitle={isAdmin ? "Everyone's logged hours. Profit per client is under Profitability." : "Log the hours you spend per client - it feeds profit per client."} />
        {timer && (
          <Card className="border-blue-300">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-sm text-muted-foreground">Timer running</p><p className="text-xl font-semibold">{hm(running)} · {timerClient}</p>{timer.description && <p className="text-sm">{timer.description}</p>}</div>
              <Button onClick={stop} className="bg-red-600 hover:bg-red-700"><Square className="h-4 w-4 mr-1" /> Stop & log</Button>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-4 grid gap-3">
            <div className="grid sm:grid-cols-4 gap-3">
              <div className="grid gap-1">
                <Label>Client</Label>
                <Select value={entry.clientId} onValueChange={(v) => setEntry({ ...entry, clientId: v, projectId: "" })}><SelectTrigger><SelectValue placeholder="Client" /></SelectTrigger><SelectContent>{opts.clients.map((c) => <SelectItem key={c._id} value={String(c._id)}>{c.brandName}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="grid gap-1">
                <Label>Project (optional)</Label>
                <Select value={entry.projectId} onValueChange={(v) => setEntry({ ...entry, projectId: v, clientId: entry.clientId || String(opts.projects.find((p) => String(p._id) === v)?.clientId || "") })}><SelectTrigger><SelectValue placeholder="Project" /></SelectTrigger><SelectContent>{projectsFor(entry.clientId).map((p) => <SelectItem key={p._id} value={String(p._id)}>{p.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="grid gap-1 sm:col-span-2"><Label>What did you work on?</Label><Input value={entry.description} onChange={(e) => setEntry({ ...entry, description: e.target.value })} placeholder="e.g. Edited 3 reels" /></div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="grid gap-1"><Label>Date</Label><Input type="date" value={entry.date} onChange={(e) => setEntry({ ...entry, date: e.target.value })} /></div>
              <div className="grid gap-1 w-28"><Label>Hours</Label><Input type="number" min="0" step="0.25" value={entry.hours} onChange={(e) => setEntry({ ...entry, hours: e.target.value })} placeholder="1.5" /></div>
              <label className="text-sm flex items-center gap-2 pb-2"><input type="checkbox" checked={entry.billable} onChange={(e) => setEntry({ ...entry, billable: e.target.checked })} /> Client work</label>
              <Button onClick={() => save(Number(entry.hours) * 60)} className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" /> Log time</Button>
              {!timer && <Button variant="outline" onClick={start}><Play className="h-4 w-4 mr-1" /> Start timer</Button>}
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid gap-1"><span className="text-xs text-muted-foreground">From</span><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="grid gap-1"><span className="text-xs text-muted-foreground">To</span><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Total" value={hm(total)} sub={`${entries.length} entries`} />
          {byClient.slice(0, 3).map(([c, m]) => <Stat key={c} label={c} value={hm(m)} />)}
        </div>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead>{isAdmin && <TableHead>Person</TableHead>}<TableHead>Client</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Time</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {entries.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No time logged in this range.</TableCell></TableRow>}
                {entries.map((e) => (
                  <TableRow key={e._id}>
                    <TableCell className="whitespace-nowrap text-sm">{new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" })}</TableCell>
                    {isAdmin && <TableCell className="text-sm">{e.userName}</TableCell>}
                    <TableCell>{e.clientName}</TableCell>
                    <TableCell className="text-sm">{e.description}{!e.billable && <span className="text-xs text-muted-foreground/70"> · internal</span>}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{hm(e.minutes)}</TableCell>
                    <TableCell><Button size="icon" variant="ghost" className="text-red-600" onClick={() => remove(e)}><Trash2 className="h-4 w-4" /></Button></TableCell>
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

export default TimeTracking;
