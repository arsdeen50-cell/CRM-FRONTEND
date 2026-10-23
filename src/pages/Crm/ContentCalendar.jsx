import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarRange, Plus, Trash2, Paperclip, Link as LinkIcon, List, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import CrmMemberRoute, { useIsAdmin } from "@/components/crm/CrmMemberRoute";
import PageHeader, { Pill } from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosInstance from "@/utils/axiosConfig";
import { errMsg } from "@/lib/publicApi";
import { toDateInput } from "@/lib/crmOutreach";

const TYPES = ["Post", "Reel", "Story", "Carousel", "Video", "Blog", "Ad", "Newsletter", "Other"];
const PLATFORMS = ["Instagram", "Facebook", "LinkedIn", "YouTube", "X", "Website", "Email", "Other"];
const STATUSES = ["Idea", "In Progress", "Internal Review", "Client Review", "Changes Requested", "Approved", "Scheduled", "Published"];
export const CONTENT_STYLE = {
  Idea: "bg-slate-100 text-slate-700 border-slate-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
  "Internal Review": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Client Review": "bg-purple-100 text-purple-700 border-purple-200",
  "Changes Requested": "bg-red-100 text-red-700 border-red-200",
  Approved: "bg-green-100 text-green-700 border-green-200",
  Scheduled: "bg-teal-100 text-teal-700 border-teal-200",
  Published: "bg-emerald-600 text-white border-emerald-700",
};
const thisMonth = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 7);
const shiftMonth = (m, n) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1 + n, 1)).toISOString().slice(0, 7);
};

const ItemDialog = ({ item, clients, onOpenChange, onSaved }) => {
  const isAdmin = useIsAdmin();
  const { user } = useSelector((s) => s.auth);
  const [f, setF] = useState(null);
  const [comment, setComment] = useState("");
  const [link, setLink] = useState("");
  useEffect(() => {
    if (item) setF({ ...item, scheduledDate: toDateInput(item.scheduledDate) });
  }, [item]);
  if (!item || !f) return null;
  const isNew = !item._id;
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    if (!f.title?.trim()) return toast.error("Add a title");
    if (isNew && !f.clientId) return toast.error("Pick a client");
    const payload = { title: f.title, type: f.type, platform: f.platform, status: f.status, assignee: f.assignee, caption: f.caption, brief: f.brief, publishedUrl: f.publishedUrl, scheduledDate: f.scheduledDate ? new Date(`${f.scheduledDate}T11:00:00`).toISOString() : null, ...(isNew && { clientId: f.clientId }) };
    try {
      const res = isNew ? await axiosInstance.post("/v1/content", payload) : await axiosInstance.put(`/v1/content/${item._id}`, payload);
      toast.success("Saved");
      onSaved(res.data.item);
      if (isNew) onOpenChange(false);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const addComment = async () => {
    if (!comment.trim()) return;
    const res = await axiosInstance.post(`/v1/content/${item._id}/comments`, { text: comment }).catch((e) => toast.error(errMsg(e)));
    if (res) {
      setComment("");
      setF((x) => ({ ...x, comments: res.data.item.comments }));
      onSaved(res.data.item);
    }
  };
  const upload = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const t = toast.loading("Uploading...");
    try {
      const res = await axiosInstance.post(`/v1/content/${item._id}/assets`, fd);
      setF((x) => ({ ...x, assets: res.data.item.assets }));
      onSaved(res.data.item);
      toast.success("Uploaded", { id: t });
    } catch (err) {
      toast.error(errMsg(err, "Upload failed"), { id: t });
    }
  };
  const addLink = async () => {
    if (!/^https?:\/\//.test(link)) return toast.error("Paste a full link (https://...)");
    const res = await axiosInstance.post(`/v1/content/${item._id}/assets`, { url: link, name: link.split("/").pop() || link }).catch((e) => toast.error(errMsg(e)));
    if (res) {
      setLink("");
      setF((x) => ({ ...x, assets: res.data.item.assets }));
      onSaved(res.data.item);
    }
  };
  const removeAsset = async (i) => {
    const res = await axiosInstance.delete(`/v1/content/${item._id}/assets/${i}`).catch((e) => toast.error(errMsg(e)));
    if (res) setF((x) => ({ ...x, assets: res.data.item.assets }));
  };
  const remove = async () => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    await axiosInstance.delete(`/v1/content/${item._id}`).then(() => { onSaved(null); onOpenChange(false); }).catch((e) => toast.error(errMsg(e)));
  };
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "New content item" : `${item.clientName}: ${item.title}`}</DialogTitle>
          <DialogDescription>Set status to "Client Review" to show it in the client's portal for approval.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {isNew && (
            <div className="grid gap-1">
              <Label>Client</Label>
              <Select value={f.clientId || ""} onValueChange={(v) => set("clientId", v)}><SelectTrigger><SelectValue placeholder="Pick a client" /></SelectTrigger><SelectContent>{clients.map((c) => <SelectItem key={c._id} value={c._id}>{c.brandName}</SelectItem>)}</SelectContent></Select>
            </div>
          )}
          <div className="grid gap-1"><Label>Title</Label><Input value={f.title} onChange={(e) => set("title", e.target.value)} /></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="grid gap-1"><Label>Type</Label><Select value={f.type} onValueChange={(v) => set("type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-1"><Label>Platform</Label><Select value={f.platform} onValueChange={(v) => set("platform", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PLATFORMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-1"><Label>Date</Label><Input type="date" value={f.scheduledDate} onChange={(e) => set("scheduledDate", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Assignee</Label><Input value={f.assignee} onChange={(e) => set("assignee", e.target.value)} placeholder={user?.fullname?.split(" ")[0]} /></div>
          </div>
          <div className="grid gap-1">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-1">{STATUSES.map((s) => <button key={s} type="button" onClick={() => set("status", s)} className={`text-xs border rounded-full px-2 py-1 ${f.status === s ? CONTENT_STYLE[s] + " ring-2 ring-offset-1 ring-blue-500" : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300"}`}>{s}</button>)}</div>
          </div>
          <div className="grid gap-1"><Label>Brief (internal)</Label><Textarea rows={2} value={f.brief} onChange={(e) => set("brief", e.target.value)} /></div>
          <div className="grid gap-1"><Label>Caption (client sees this)</Label><Textarea rows={3} value={f.caption} onChange={(e) => set("caption", e.target.value)} /></div>
          {["Published", "Scheduled"].includes(f.status) && <div className="grid gap-1"><Label>Post link</Label><Input value={f.publishedUrl} onChange={(e) => set("publishedUrl", e.target.value)} /></div>}
          <div className="flex justify-between gap-2">
            {!isNew && (isAdmin || item.createdBy === user?.fullname) ? <Button variant="ghost" className="text-red-600" onClick={remove}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button> : <span />}
            <Button onClick={save} className="bg-blue-600 hover:bg-blue-700">{isNew ? "Create" : "Save changes"}</Button>
          </div>
          {!isNew && (
            <>
              <div className="border-t pt-3 grid gap-2">
                <Label>Files</Label>
                {(f.assets || []).map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-sm"><a href={a.url} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate">{a.name}</a><Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => removeAsset(i)}><Trash2 className="h-3 w-3" /></Button></div>
                ))}
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-1 text-sm border rounded-md px-3 py-1.5 cursor-pointer"><Paperclip className="h-4 w-4" /> Upload<input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /></label>
                  <Input className="flex-1 min-w-[200px]" placeholder="or paste a Drive / Canva / Frame.io link" value={link} onChange={(e) => setLink(e.target.value)} />
                  <Button variant="outline" onClick={addLink}><LinkIcon className="h-4 w-4 mr-1" /> Add link</Button>
                </div>
              </div>
              <div className="border-t pt-3 grid gap-2">
                <Label>Comments</Label>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {(f.comments || []).map((c, i) => (
                    <p key={i} className={`text-sm ${c.fromClient ? "bg-purple-50 dark:bg-purple-950 rounded p-1" : ""}`}><b>{c.by}</b>{c.fromClient ? " (client)" : ""}: {c.text} <span className="text-xs text-gray-400">{new Date(c.at).toLocaleString("en-IN")}</span></p>
                  ))}
                </div>
                <div className="flex gap-2"><Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment" onKeyDown={(e) => e.key === "Enter" && addComment()} /><Button variant="outline" onClick={addComment}>Post</Button></div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ContentCalendar = () => {
  const [month, setMonth] = useState(thisMonth());
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientFilter, setClientFilter] = useState("all");
  const [view, setView] = useState("calendar");
  const [open, setOpen] = useState(null);
  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([axiosInstance.get("/v1/content", { params: { month } }), axiosInstance.get("/v1/content/summary", { params: { month } })]);
      setItems(a.data.items || []);
      setSummary(b.data.rows || []);
    } catch (err) {
      toast.error(errMsg(err, "Could not load calendar"));
    }
  }, [month]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    axiosInstance.get("/v1/time/options").then((r) => setClients(r.data.clients || [])).catch(() => {});
  }, []);
  const shown = items.filter((i) => clientFilter === "all" || String(i.clientId) === clientFilter);
  const grid = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const days = new Date(y, m, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // Monday first
    const cells = Array.from({ length: lead }, () => null).concat(Array.from({ length: days }, (_, i) => i + 1));
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [month]);
  const onDay = (d) => shown.filter((i) => i.scheduledDate && new Date(i.scheduledDate).getDate() === d && toDateInput(i.scheduledDate).slice(0, 7) === month);
  const today = toDateInput(new Date());
  const label = new Date(`${month}-15`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const saved = () => load();

  return (
    <CrmMemberRoute>
      <div className="p-4 md:p-6 space-y-4">
        <PageHeader icon={CalendarRange} title="Content calendar" subtitle="Every promised post, reel and blog per client. Clients approve items in their portal.">
          <Button variant="outline" onClick={() => setMonth(shiftMonth(month, -1))}>‹</Button>
          <span className="self-center font-medium w-36 text-center">{label}</span>
          <Button variant="outline" onClick={() => setMonth(shiftMonth(month, 1))}>›</Button>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All clients</SelectItem>{clients.map((c) => <SelectItem key={c._id} value={String(c._id)}>{c.brandName}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setView(view === "calendar" ? "list" : "calendar")} title="Switch view">{view === "calendar" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}</Button>
          <Button onClick={() => setOpen({ title: "", type: "Post", platform: "Instagram", status: "Idea", scheduledDate: `${month}-${month === today.slice(0, 7) ? today.slice(8) : "01"}`, clientId: clientFilter !== "all" ? clientFilter : "", caption: "", brief: "", assignee: "" })} className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-1" /> Add item</Button>
        </PageHeader>

        {summary.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {summary.filter((r) => (r.promised || r.planned) && (clientFilter === "all" || String(r.clientId) === clientFilter)).map((r) => (
              <Card key={String(r.clientId || r.clientName)}>
                <CardContent className="p-3">
                  <p className="font-medium text-sm truncate">{r.clientName}</p>
                  <p className="text-xs text-gray-500">{r.done} done of {r.promised || r.planned} {r.promised ? "promised" : "planned"}{r.promised && r.planned < r.promised ? ` · ${r.promised - r.planned} not planned yet` : ""}</p>
                  <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full mt-2 overflow-hidden"><div className="h-full bg-green-600" style={{ width: `${Math.min(100, Math.round((r.done / Math.max(1, r.promised || r.planned)) * 100))}%` }} /></div>
                  {(r.clientReview > 0 || r.changes > 0) && <p className="text-xs mt-1">{r.clientReview > 0 && <span className="text-purple-700">{r.clientReview} awaiting client </span>}{r.changes > 0 && <span className="text-red-600">· {r.changes} changes requested</span>}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {view === "calendar" ? (
          <div className="grid grid-cols-7 gap-1 text-xs">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="text-center font-medium text-gray-500 py-1">{d}</div>)}
            {grid.map((d, i) => (
              <div key={i} className={`min-h-[96px] border rounded-md p-1 ${d ? "bg-white dark:bg-slate-900" : "bg-transparent border-transparent"} ${d && `${month}-${String(d).padStart(2, "0")}` === today ? "ring-2 ring-blue-500" : ""}`}>
                {d && (
                  <>
                    <div className="text-gray-500 mb-1">{d}</div>
                    <div className="space-y-1">
                      {onDay(d).map((it) => (
                        <button key={it._id} onClick={() => setOpen(it)} className={`block w-full text-left border rounded px-1 py-0.5 truncate ${CONTENT_STYLE[it.status]}`} title={`${it.clientName}: ${it.title} (${it.status})`}>
                          {clientFilter === "all" ? `${it.clientName?.split(" ")[0]} · ` : ""}{it.title}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Client</TableHead><TableHead>Item</TableHead><TableHead>Assignee</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {shown.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-500">Nothing planned for {label}. Use "Add item", or Retainers → plan month.</TableCell></TableRow>}
                  {shown.map((it) => (
                    <TableRow key={it._id} className="cursor-pointer" onClick={() => setOpen(it)}>
                      <TableCell className="whitespace-nowrap text-sm">{it.scheduledDate ? new Date(it.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" }) : "—"}</TableCell>
                      <TableCell>{it.clientName}</TableCell>
                      <TableCell>{it.title}<div className="text-xs text-gray-500">{it.platform} {it.type}{it.assets?.length ? ` · ${it.assets.length} file${it.assets.length > 1 ? "s" : ""}` : ""}</div></TableCell>
                      <TableCell className="text-sm">{it.assignee || "—"}</TableCell>
                      <TableCell><Pill className={`border ${CONTENT_STYLE[it.status]}`}>{it.status}</Pill></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        <div className="flex flex-wrap gap-2">{STATUSES.map((s) => <Pill key={s} className={`border ${CONTENT_STYLE[s]}`}>{s}</Pill>)}</div>
        {open && <ItemDialog item={open} clients={clients} onOpenChange={(o) => !o && setOpen(null)} onSaved={(it) => { saved(); if (it && open._id) setOpen(it); }} />}
      </div>
    </CrmMemberRoute>
  );
};

export default ContentCalendar;
