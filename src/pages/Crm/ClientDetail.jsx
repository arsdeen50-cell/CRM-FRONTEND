import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowLeft, Briefcase, CalendarCheck, CircleCheck, CircleX, ExternalLink, FileText, Globe, Instagram, Mail, MessageCircle,
  MessageSquareText, Phone, Pin, PinOff, Receipt, Repeat2, Send, Sparkles, StickyNote, Trash2, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { confirmDialog } from "@/components/ui/app-dialogs";
import axiosInstance from "@/utils/axiosConfig";
import CustomFieldsCard from "@/components/crm/CustomFieldsCard";

const KINDS = {
  note: { label: "Notes", icon: StickyNote, tone: "text-amber-600" },
  activity: { label: "Calls & meetings", icon: Phone, tone: "text-sky-600" },
  email: { label: "Emails", icon: Mail, tone: "text-sky-600" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, tone: "text-green-600" },
  proposal: { label: "Proposals", icon: FileText, tone: "text-violet-600" },
  won: { label: "Proposals", icon: CircleCheck, tone: "text-green-600" },
  lost: { label: "Proposals", icon: CircleX, tone: "text-red-600" },
  invoice: { label: "Billing", icon: Receipt, tone: "text-slate-600" },
  payment: { label: "Billing", icon: Wallet, tone: "text-green-600" },
  retainer: { label: "Billing", icon: Repeat2, tone: "text-slate-600" },
  project: { label: "Projects & content", icon: Briefcase, tone: "text-indigo-600" },
  content: { label: "Projects & content", icon: Sparkles, tone: "text-indigo-600" },
  lead: { label: "Calls & meetings", icon: CalendarCheck, tone: "text-sky-600" },
};
const FILTERS = ["All", ...new Set(Object.values(KINDS).map((k) => k.label))];
const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const dayLabel = (d) => {
  const day = new Date(d);
  const today = new Date();
  const diff = Math.round((new Date(today.toDateString()) - new Date(day.toDateString())) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return day.toLocaleDateString("en-IN", { weekday: diff < 7 ? "long" : undefined, day: "numeric", month: "short", year: day.getFullYear() === today.getFullYear() ? undefined : "numeric" });
};
const timeOf = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

// Note text with @mentions highlighted
const NoteText = ({ text, names }) => {
  if (!names.length || !text.includes("@")) return <p className="whitespace-pre-wrap text-sm">{text}</p>;
  const rx = new RegExp(`(@(?:${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")}))`, "gi");
  return <p className="whitespace-pre-wrap text-sm">{text.split(rx).map((part, i) => (i % 2 ? <span key={i} className="rounded bg-brand-soft px-1 font-medium text-brand">{part}</span> : part))}</p>;
};

/* Note box: typing "@" and a few letters suggests teammates; picking one inserts "@Full Name ", which notifies them. */
const NoteComposer = ({ people, onSave }) => {
  const [text, setText] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState(null);
  const ref = useRef(null);
  const matches = useMemo(() => (query === null ? [] : people.filter((p) => p.fullname.toLowerCase().includes(query.toLowerCase())).slice(0, 6)), [people, query]);

  const onChange = (e) => {
    const value = e.target.value;
    setText(value);
    const before = value.slice(0, e.target.selectionStart);
    const m = before.match(/(?:^|\s)@([\p{L} .'-]{0,30})$/u);
    setQuery(m ? m[1] : null);
  };
  const pick = (p) => {
    const el = ref.current;
    const caret = el.selectionStart;
    const before = text.slice(0, caret).replace(/@([\p{L} .'-]{0,30})$/u, `@${p.fullname} `);
    const next = before + text.slice(caret);
    setText(next);
    setQuery(null);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(before.length, before.length);
    });
  };
  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const ok = await onSave(text.trim(), pinned);
    setSaving(false);
    if (ok) {
      setText("");
      setPinned(false);
    }
  };

  return (
    <div className="relative space-y-2">
      <Textarea
        ref={ref}
        rows={3}
        value={text}
        onChange={onChange}
        onKeyDown={(e) => {
          if (matches.length && (e.key === "Enter" || e.key === "Tab")) {
            e.preventDefault();
            pick(matches[0]);
          } else if (e.key === "Escape") setQuery(null);
          else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
        }}
        placeholder="Add a note for the team. Type @ to mention someone - they'll be notified."
      />
      {matches.length > 0 && (
        <div className="absolute left-2 top-full z-20 mt-1 w-64 rounded-md border border-border bg-popover p-1 shadow-lg">
          {matches.map((p) => (
            <button key={p._id} type="button" onMouseDown={(e) => { e.preventDefault(); pick(p); }} className="flex w-full flex-col rounded px-2 py-1.5 text-left text-sm hover:bg-accent">
              <span>{p.fullname}</span>
              {p.designation && <span className="text-xs text-muted-foreground">{p.designation}</span>}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pin to the top</label>
        <Button size="sm" onClick={save} disabled={saving || !text.trim()}><Send className="mr-1 h-4 w-4" /> {saving ? "Saving..." : "Add note"}</Button>
      </div>
    </div>
  );
};

/* Client page: who they are, the numbers that matter, and one timeline of everything that happened with them -
   calls, emails, WhatsApp, proposals, invoices, payments, projects, published content and the team's notes. */
const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [data, setData] = useState(null);
  const [people, setPeople] = useState([]);
  const [filter, setFilter] = useState("All");

  const load = useCallback(async () => {
    try {
      const r = await axiosInstance.get(`/v1/leadclient/${id}/timeline`);
      setData(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the client");
      if (err.response?.status === 404) navigate("/crm/lead-list");
    }
  }, [id, navigate]);
  useEffect(() => {
    load();
    axiosInstance.get("/v1/leadclient/people").then((r) => setPeople(r.data.people || [])).catch(() => {});
  }, [load]);

  const addNote = async (body, pinned) => {
    try {
      const r = await axiosInstance.post(`/v1/leadclient/${id}/notes`, { body, pinned });
      toast.success(r.data.mentioned ? `Note added - ${r.data.mentioned} ${r.data.mentioned === 1 ? "person" : "people"} notified` : "Note added");
      load();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add the note");
      return false;
    }
  };
  const pin = async (noteId, pinned) => {
    await axiosInstance.patch(`/v1/leadclient/${id}/notes/${noteId}`, { pinned }).catch(() => toast.error("Could not update the note"));
    load();
  };
  const removeNote = async (noteId) => {
    if (!(await confirmDialog("Delete this note?"))) return;
    await axiosInstance.delete(`/v1/leadclient/${id}/notes/${noteId}`).catch((err) => toast.error(err.response?.data?.message || "Could not delete"));
    load();
  };

  const names = useMemo(() => people.map((p) => p.fullname), [people]);
  const groups = useMemo(() => {
    const list = (data?.events || []).filter((e) => filter === "All" || KINDS[e.kind]?.label === filter);
    const out = [];
    for (const e of list) {
      const label = dayLabel(e.at);
      if (!out.length || out[out.length - 1].label !== label) out.push({ label, items: [] });
      out[out.length - 1].items.push(e);
    }
    return out;
  }, [data, filter]);

  if (!data) return <p className="p-6 text-sm text-muted-foreground">Loading client...</p>;
  const { client, stats, pinned } = data;
  const tiles = [
    ["Billed", inr(stats.billed)],
    ["Paid", inr(stats.paid)],
    ["Outstanding", inr(stats.outstanding), stats.outstanding > 0],
    ["Retainer / month", inr(stats.monthlyRetainer)],
    ["Open projects", stats.openProjects],
    ["Hours logged", stats.hours],
  ];
  const canDelete = (e) => user?.role === "admin" || e.authorId === String(user?._id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/crm/lead-list")} title="Back to clients"><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-xl font-semibold md:text-2xl">{client.brandName}</h1>
            <p className="text-sm text-muted-foreground">{[client.contactPerson, client.role, client.industry, client.location].filter(Boolean).join(" · ")}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              {client.email && <a href={`mailto:${client.email}`} className="flex items-center gap-1 text-brand hover:underline"><Mail className="h-3.5 w-3.5" /> {client.email}</a>}
              {client.phone && <a href={`tel:${client.phone}`} className="flex items-center gap-1 text-brand hover:underline"><Phone className="h-3.5 w-3.5" /> {client.phone}</a>}
              {client.websiteLink && <a href={client.websiteLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand hover:underline"><Globe className="h-3.5 w-3.5" /> Website</a>}
              {client.instagramLink && <a href={client.instagramLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand hover:underline"><Instagram className="h-3.5 w-3.5" /> Instagram</a>}
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{client.leadId}{stats.lastContact ? ` · last contact ${dayLabel(stats.lastContact).toLowerCase()}` : ""}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map(([label, value, warn]) => (
          <Card key={label}><CardContent className="p-3"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-lg font-semibold ${warn ? "text-amber-600" : ""}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="order-2 space-y-3 lg:order-1">
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1 text-xs ${filter === f ? "border-brand bg-brand-soft text-brand" : "border-border text-muted-foreground hover:text-foreground"}`}>{f}</button>
            ))}
          </div>
          {groups.length === 0 && <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nothing here yet. Calls, emails, proposals, invoices and notes for {client.brandName} show up here as they happen.</CardContent></Card>}
          {groups.map((g) => (
            <div key={g.label}>
              <p className="sticky top-[60px] z-10 bg-background/95 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground backdrop-blur">{g.label}</p>
              <Card><CardContent className="divide-y divide-border p-0">
                {g.items.map((e, i) => {
                  const K = KINDS[e.kind] || KINDS.note;
                  return (
                    <div key={`${e.kind}-${e.noteId || i}-${e.at}`} className="flex gap-3 p-3">
                      <K.icon className={`mt-0.5 h-4 w-4 shrink-0 ${K.tone}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                          <p className="text-sm font-medium">{e.title}</p>
                          <span className="text-xs text-muted-foreground">{timeOf(e.at)}{e.by ? ` · ${e.by}` : ""}</span>
                        </div>
                        {e.kind === "note" ? <NoteText text={e.detail} names={names} /> : e.detail && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{e.detail}</p>}
                        {(e.link || e.url || e.kind === "note") && (
                          <div className="mt-1 flex flex-wrap gap-3 text-xs">
                            {e.link && <Link to={e.link} className="text-brand hover:underline">Open</Link>}
                            {e.url && <a href={e.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand hover:underline">View post <ExternalLink className="h-3 w-3" /></a>}
                            {e.kind === "note" && <button onClick={() => pin(e.noteId, !e.pinned)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">{e.pinned ? <><PinOff className="h-3 w-3" /> Unpin</> : <><Pin className="h-3 w-3" /> Pin</>}</button>}
                            {e.kind === "note" && canDelete(e) && <button onClick={() => removeNote(e.noteId)} className="flex items-center gap-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /> Delete</button>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent></Card>
            </div>
          ))}
          {data.total > data.events.length && <p className="text-center text-xs text-muted-foreground">Showing the latest {data.events.length} of {data.total} events.</p>}
        </div>

        <div className="order-1 space-y-3 lg:order-2">
          <Card><CardContent className="space-y-2 p-3">
            <p className="flex items-center gap-2 text-sm font-medium"><MessageSquareText className="h-4 w-4 text-brand" /> Add a note</p>
            <NoteComposer people={people} onSave={addNote} />
          </CardContent></Card>
          {pinned.length > 0 && (
            <Card><CardContent className="space-y-3 p-3">
              <p className="flex items-center gap-2 text-sm font-medium"><Pin className="h-4 w-4 text-amber-600" /> Pinned</p>
              {pinned.map((n) => (
                <div key={n._id} className="rounded-md bg-amber-50 p-2 dark:bg-amber-500/10">
                  <NoteText text={n.body} names={names} />
                  <p className="mt-1 text-xs text-muted-foreground">{n.authorName} · {dayLabel(n.createdAt)}</p>
                </div>
              ))}
            </CardContent></Card>
          )}
          <CustomFieldsCard entity="client" recordId={client._id} initial={client.custom} className="bg-card" />
          {client.leadInformation && (
            <Card><CardContent className="p-3"><p className="mb-1 text-sm font-medium">About</p><p className="whitespace-pre-wrap text-sm text-muted-foreground">{client.leadInformation}</p></CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
