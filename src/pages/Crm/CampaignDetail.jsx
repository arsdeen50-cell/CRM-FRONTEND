import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Papa from "papaparse";
import { Copy, Download, Edit, ExternalLink, FileUp, Link2, Megaphone, Plus, Search, Star, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import PageHeader, { Stat, Pill } from "@/components/crm/PageHeader";
import { CampaignEditor } from "@/pages/Crm/Campaigns";
import { useAccess } from "@/components/crm/AccessRoute";
import RowActions from "@/components/ui/row-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { confirmDialog } from "@/components/ui/app-dialogs";
import axiosInstance from "@/utils/axiosConfig";
import { errMsg } from "@/lib/publicApi";
import { downloadFile, toDateInput } from "@/lib/crmOutreach";
import { CAMPAIGN_STATUS_STYLE, ENTRY_STATUS_STYLE, METRICS, compactNum, dateRange, entryEngagement, inr } from "@/lib/campaigns";

const ENTRY_STATUSES = ["Shortlisted", "Contacted", "Confirmed", "Content in review", "Posted", "Paid", "Dropped"];
const PLATFORMS = ["Instagram", "YouTube", "Facebook", "X", "LinkedIn", "Snapchat", "Moj / Josh", "ShareChat", "Threads", "Blog", "Other"];
const ROSTER_COLUMNS = ["name", "platform", "handle", "followers", "deliverables", "fee", "barter", "status", "postDate", "links", "views", "reach", "impressions", "likes", "comments", "shares", "saves", "clicks", "notes"];
const reportUrl = (token) => `${window.location.origin}/campaign-report/${token}`;

/* One influencer's part in the campaign: status, deliverables, fee, post links and results. */
const EntryEditor = ({ entry, campaignId, onOpenChange, onSaved }) => {
  const [f, setF] = useState(null);
  useEffect(() => {
    if (entry) setF({ ...entry, postDate: toDateInput(entry.postDate), links: (entry.links || []).join("\n"), metrics: { ...entry.metrics }, fee: entry.fee || "" });
  }, [entry]);
  if (!entry || !f) return null;
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    try {
      const r = await axiosInstance.put(`/v1/campaign/${campaignId}/entries/${entry._id}`, { ...f, links: f.links.split(/\s+/).filter(Boolean) });
      onSaved(r.data.campaign);
      onOpenChange(false);
    } catch (err) {
      toast.error(errMsg(err, "Could not save"));
    }
  };
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry.name}</DialogTitle>
          <DialogDescription>{[entry.platform, entry.handle && `@${entry.handle}`, entry.followers && `${compactNum(entry.followers)} followers at the time`].filter(Boolean).join(" · ")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="grid gap-1 col-span-2">
              <Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => set("status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ENTRY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid gap-1"><Label>Post date</Label><Input type="date" value={f.postDate || ""} onChange={(e) => set("postDate", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Fee (₹)</Label><Input type="number" min="0" value={f.fee} onChange={(e) => set("fee", e.target.value)} /></div>
          </div>
          <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div className="grid gap-1"><Label>Deliverables</Label><Input value={f.deliverables} onChange={(e) => set("deliverables", e.target.value)} placeholder="1 reel + 3 stories" /></div>
            <label className="flex items-center gap-2 text-sm pb-2"><input type="checkbox" checked={f.barter} onChange={(e) => set("barter", e.target.checked)} /> Barter</label>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label>Platform</Label>
              <Select value={f.platform || "Instagram"} onValueChange={(v) => set("platform", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid gap-1"><Label>Handle</Label><Input value={f.handle} onChange={(e) => set("handle", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Followers then</Label><Input type="number" min="0" value={f.followers || ""} onChange={(e) => set("followers", e.target.value)} /></div>
          </div>
          <div className="grid gap-1"><Label>Post links (one per line)</Label><Textarea rows={2} value={f.links} onChange={(e) => set("links", e.target.value)} placeholder="https://www.instagram.com/reel/..." /></div>
          <div className="grid gap-1">
            <Label>Results</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {METRICS.map(([k, label]) => (
                <div key={k} className="grid gap-0.5"><span className="text-xs text-muted-foreground">{label}</span><Input type="number" min="0" value={f.metrics?.[k] || ""} onChange={(e) => set("metrics", { ...f.metrics, [k]: e.target.value })} /></div>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.featured} onChange={(e) => set("featured", e.target.checked)} /> Feature at the top of the client report</label>
          <div className="grid gap-1"><Label>Internal notes (never shown to the client)</Label><Textarea rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save}>Save</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* Pick influencers from the database (multi-select), or add someone new on the spot. */
const AddInfluencersDialog = ({ open, onOpenChange, campaign, onSaved }) => {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [picked, setPicked] = useState(new Set());
  const [quick, setQuick] = useState({ name: "", platform: "Instagram", handle: "", followers: "" });
  useEffect(() => {
    if (!open) return;
    setPicked(new Set());
    setQuick({ name: "", platform: campaign?.platforms?.[0] || "Instagram", handle: "", followers: "" });
  }, [open, campaign]);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      axiosInstance.get("/v1/influencer", { params: { q: q || undefined, limit: 50, sort: q ? "followers" : "recent" } }).then((r) => setRows(r.data.influencers || [])).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [q, open]);
  const inCampaign = new Set((campaign?.entries || []).map((e) => String(e.influencerId)));
  const toggle = (id) => setPicked((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  });
  const addPicked = async () => {
    try {
      const r = await axiosInstance.post(`/v1/campaign/${campaign._id}/entries`, { influencerIds: [...picked] });
      toast.success(`${r.data.added} added`);
      onSaved(r.data.campaign);
      onOpenChange(false);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const addQuick = async () => {
    if (!quick.name.trim()) return toast.error("Enter the name");
    try {
      const r = await axiosInstance.post(`/v1/campaign/${campaign._id}/entries`, { influencer: quick });
      toast.success(r.data.added ? `${quick.name} added` : "Already in this campaign");
      onSaved(r.data.campaign);
      setQuick({ ...quick, name: "", handle: "", followers: "" });
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add influencers</DialogTitle>
          <DialogDescription>Pick from your influencer database, or add someone new. New people are saved to the database too.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search name, @handle, niche, city..." value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          </div>
          <div className="max-h-72 overflow-y-auto rounded-md border divide-y">
            {rows.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No influencers found.</p>}
            {rows.map((r) => {
              const already = inCampaign.has(String(r._id));
              const main = (r.platforms || [])[0];
              return (
                <label key={r._id} className={`flex items-center gap-3 p-2 text-sm ${already ? "opacity-50" : "cursor-pointer hover:bg-accent"}`}>
                  <input type="checkbox" disabled={already} checked={already || picked.has(r._id)} onChange={() => toggle(r._id)} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{[main && `${main.platform} @${main.handle}`, (r.niches || []).join(", "), r.city].filter(Boolean).join(" · ")}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{already ? "in campaign" : r.followers ? `${compactNum(r.followers)} followers` : ""}</span>
                </label>
              );
            })}
          </div>
          <div className="flex justify-end"><Button disabled={!picked.size} onClick={addPicked}>Add {picked.size || ""} selected</Button></div>
          <div className="rounded-md border p-3 space-y-2">
            <p className="text-sm font-medium">Someone new</p>
            <div className="grid grid-cols-12 gap-2">
              <Input className="col-span-12 sm:col-span-4" placeholder="Name" value={quick.name} onChange={(e) => setQuick({ ...quick, name: e.target.value })} />
              <div className="col-span-4 sm:col-span-3">
                <Select value={quick.platform} onValueChange={(v) => setQuick({ ...quick, platform: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
              </div>
              <Input className="col-span-4 sm:col-span-3" placeholder="@handle or link" value={quick.handle} onChange={(e) => setQuick({ ...quick, handle: e.target.value })} />
              <Input className="col-span-4 sm:col-span-2" type="number" min="0" placeholder="Followers" value={quick.followers} onChange={(e) => setQuick({ ...quick, followers: e.target.value })} />
            </div>
            <div className="flex justify-end"><Button variant="outline" size="sm" onClick={addQuick}><UserPlus className="h-4 w-4 mr-1" /> Add to campaign</Button></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ImportRosterDialog = ({ open, onOpenChange, campaign, onSaved }) => {
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  useEffect(() => {
    if (!open) setRows(null);
  }, [open]);
  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => {
        const key = h.trim().replace(/[\s_-]+/g, "").toLowerCase();
        const alias = { instagram: "handle", username: "handle", profile: "handle", profilelink: "handle", link: "links", postlink: "links", postlinks: "links", posturl: "links", subscribers: "followers", date: "postDate", posted: "postDate", amount: "fee", cost: "fee" };
        return ROSTER_COLUMNS.find((c) => c.toLowerCase() === key) || alias[key] || h.trim();
      },
      complete: (r) => setRows(r.data.filter((x) => Object.values(x).some((v) => String(v || "").trim()))),
      error: () => toast.error("Could not read that file"),
    });
  };
  const run = async () => {
    setBusy(true);
    try {
      const r = await axiosInstance.post(`/v1/campaign/${campaign._id}/import`, { rows });
      toast.success(`${r.data.added} added, ${r.data.updated} updated${r.data.createdInfluencers ? ` (${r.data.createdInfluencers} new to the database)` : ""}`, { description: r.data.errors.slice(0, 5).map((e) => `Row ${e.row}: ${e.message}`).join("\n") || undefined });
      onSaved(r.data.campaign);
      onOpenChange(false);
    } catch (err) {
      toast.error(errMsg(err, "Import failed"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import influencers into this campaign</DialogTitle>
          <DialogDescription>For past campaigns with many creators. Each row is matched to your influencer database by handle or name; anyone new is added to it.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 text-sm">
          <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
            <li>Download the template, fill one row per influencer, save as CSV.</li>
            <li>Handle can be @name or the profile link. Several post links: separate with spaces.</li>
            <li>Numbers can be written as 12500, 12.5K or 1.2M. Status: Shortlisted, Confirmed, Posted, Paid...</li>
            <li>Importing again updates the same influencers instead of adding them twice.</li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadFile("campaign-roster-template.csv", `${ROSTER_COLUMNS.join(",")}\n`, "text/csv")}><Download className="h-4 w-4 mr-1" /> Template</Button>
            <Button size="sm" onClick={() => input.current?.click()}><FileUp className="h-4 w-4 mr-1" /> Choose CSV</Button>
            <input ref={input} type="file" accept=".csv,text/csv" className="hidden" onChange={pick} />
          </div>
          {rows && <p className="rounded-md border p-3"><b>{rows.length}</b> rows found. First: {rows.slice(0, 3).map((r) => r.name || r.handle).filter(Boolean).join(", ") || "—"}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={run} disabled={!rows?.length || busy}>{busy ? "Importing..." : `Import ${rows?.length || ""}`}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ShareDialog = ({ open, onOpenChange, campaign, onSaved }) => {
  const [busy, setBusy] = useState(false);
  if (!campaign) return null;
  const share = campaign.share || {};
  const update = async (body) => {
    setBusy(true);
    try {
      const r = await axiosInstance.post(`/v1/campaign/${campaign._id}/share`, body);
      onSaved({ ...campaign, share: r.data.share });
      if (body.enabled) {
        await navigator.clipboard.writeText(reportUrl(r.data.share.token)).catch(() => {});
        toast.success("Report link is on and copied");
      }
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };
  const url = share.token ? reportUrl(share.token) : "";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Client report link</DialogTitle>
          <DialogDescription>A read-only page with the campaign, its creators, posts and results. It never shows influencer contacts, managers or your internal notes.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 text-sm">
          {share.enabled ? (
            <>
              <div className="flex gap-2"><Input readOnly value={url} onFocus={(e) => e.target.select()} /><Button variant="outline" size="icon" title="Copy" onClick={() => navigator.clipboard.writeText(url).then(() => toast.success("Copied"))}><Copy className="h-4 w-4" /></Button></div>
              <div className="flex gap-2"><a href={url} target="_blank" rel="noreferrer"><Button variant="outline" size="sm"><ExternalLink className="h-4 w-4 mr-1" /> Open report</Button></a></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!share.showFees} disabled={busy} onChange={(e) => update({ showFees: e.target.checked })} /> Show influencer fees and total spend</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!share.showBudget} disabled={busy} onChange={(e) => update({ showBudget: e.target.checked })} /> Show the campaign budget</label>
              <p className="text-xs text-muted-foreground">Opened {share.views || 0} time{share.views === 1 ? "" : "s"}. Before showing this campaign to a different brand as a case study, make sure {campaign.clientName || "the client"} is fine with it.</p>
              <div className="flex flex-wrap justify-between gap-2 border-t pt-3">
                <Button variant="ghost" size="sm" disabled={busy} onClick={async () => (await confirmDialog("Make a new link? The old link stops working.")) && update({ regenerate: true, enabled: true })}>New link</Button>
                <Button variant="outline" size="sm" className="text-red-600" disabled={busy} onClick={() => update({ enabled: false })}>Turn link off</Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">Sharing is off. Turning it on creates a private link anyone with the link can open. You can turn it off any time.</p>
              <div className="flex justify-end"><Button disabled={busy} onClick={() => update({ enabled: true })}><Link2 className="h-4 w-4 mr-1" /> Turn on and copy link</Button></div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* A campaign: the client, the plan, the roster of influencers with their posts and results, and the report link. */
const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAccess();
  const [c, setC] = useState(null);
  const [editing, setEditing] = useState(false);
  const [entry, setEntry] = useState(null);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    try {
      setC((await axiosInstance.get(`/v1/campaign/${id}`)).data.campaign);
    } catch (err) {
      toast.error(errMsg(err, "Could not load the campaign"));
      if (err.response?.status === 404) navigate("/crm/campaigns");
    }
  }, [id, navigate]);
  useEffect(() => {
    load();
  }, [load]);
  // Mutations return the campaign without the live influencer info; reload to keep it complete
  const saved = () => load();

  if (!c) return <p className="p-6 text-sm text-muted-foreground">Loading...</p>;
  const t = c.totals || {};
  const entries = (c.entries || []).filter((e) => !statusFilter || e.status === statusFilter).sort((a, b) => Number(a.status === "Dropped") - Number(b.status === "Dropped") || (b.metrics?.views || 0) - (a.metrics?.views || 0));
  const counts = (c.entries || []).reduce((m, e) => ({ ...m, [e.status]: (m[e.status] || 0) + 1 }), {});

  const quickStatus = async (e, status) => {
    try {
      await axiosInstance.put(`/v1/campaign/${id}/entries/${e._id}`, { status });
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const remove = async (e) => {
    if (!(await confirmDialog(`Remove ${e.name} from this campaign? (They stay in your influencer database.)`))) return;
    await axiosInstance.delete(`/v1/campaign/${id}/entries/${e._id}`).catch((err) => toast.error(errMsg(err)));
    load();
  };
  const removeCampaign = async () => {
    if (!(await confirmDialog(`Delete the campaign "${c.name}"? Its report link stops working.`))) return;
    try {
      await axiosInstance.delete(`/v1/campaign/${id}`);
      navigate("/crm/campaigns");
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader icon={Megaphone} title={c.name} back="/crm/campaigns" subtitle={[c.clientName, dateRange(c.startDate, c.endDate), c.objective, (c.platforms || []).join(", ")].filter(Boolean).join(" · ")}>
        <Pill className={`${CAMPAIGN_STATUS_STYLE[c.status]} self-center`}>{c.status}</Pill>
        <Button variant="outline" onClick={() => setEditing(true)}><Edit className="h-4 w-4 mr-1" /> Edit</Button>
        <Button variant="outline" onClick={() => setSharing(true)}><Link2 className="h-4 w-4 mr-1" /> {c.share?.enabled ? "Report link" : "Share report"}</Button>
        <Button variant="outline" onClick={() => setImporting(true)}><FileUp className="h-4 w-4 mr-1" /> Import</Button>
        <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4 mr-1" /> Add influencers</Button>
        {isAdmin && <Button variant="ghost" size="icon" className="text-red-600" title="Delete campaign" onClick={removeCampaign}><Trash2 className="h-4 w-4" /></Button>}
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="Influencers" value={t.influencers || 0} sub={`${t.posted || 0} posted · ${compactNum(t.followers)} combined followers`} />
        <Stat label="Views" value={compactNum(t.views)} sub={t.reach ? `${compactNum(t.reach)} reach` : undefined} />
        <Stat label="Engagement" value={compactNum(t.engagements)} sub={t.engagementRate ? `${t.engagementRate}% rate` : "likes, comments, shares, saves"} />
        <Stat label="Spend" value={inr(t.spend)} sub={c.budget ? `of ${inr(c.budget)} budget` : undefined} tone={c.budget && t.spend > c.budget ? "bad" : undefined} />
        <Stat label="Cost per view" value={t.costPerView ? `₹${t.costPerView}` : "—"} sub={t.posts ? `${t.posts} posts` : undefined} />
      </div>

      {(c.brief || c.resultsSummary || (c.hashtags || []).length > 0) && (
        <Card><CardContent className="p-3 grid gap-3 md:grid-cols-2 text-sm">
          {c.brief && <div><p className="font-medium mb-1">Brief</p><p className="whitespace-pre-wrap text-muted-foreground">{c.brief}</p></div>}
          {c.resultsSummary && <div><p className="font-medium mb-1">Results summary</p><p className="whitespace-pre-wrap text-muted-foreground">{c.resultsSummary}</p></div>}
          {(c.hashtags || []).length > 0 && <p className="text-brand md:col-span-2">{c.hashtags.join(" ")}</p>}
        </CardContent></Card>
      )}

      <div className="flex flex-wrap gap-1">
        {["", ...ENTRY_STATUSES.filter((s) => counts[s])].map((s) => (
          <button key={s || "all"} onClick={() => setStatusFilter(s)} className={`rounded-full border px-3 py-1 text-xs ${statusFilter === s ? "border-brand bg-brand-soft text-brand" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {s || "All"} {s ? counts[s] : (c.entries || []).length}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Influencer</TableHead>
                <TableHead>Deliverables</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posts</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Engagement</TableHead>
                <TableHead className="text-right">Fee</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">{(c.entries || []).length ? "No influencers with this status." : "No influencers yet. Add them from your database, or import a spreadsheet for a past campaign."}</TableCell></TableRow>
              )}
              {entries.map((e) => {
                const eng = entryEngagement(e.metrics);
                const base = e.metrics?.reach || e.metrics?.views;
                return (
                  <TableRow key={e._id} className={`cursor-pointer ${e.status === "Dropped" ? "opacity-50" : ""}`} onClick={() => setEntry(e)}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {e.featured && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />}
                        <Link to={`/crm/influencers/${e.influencerId}`} className="font-medium hover:underline" onClick={(ev) => ev.stopPropagation()}>{e.name}</Link>
                      </div>
                      <p className="text-xs text-muted-foreground">{[e.platform, e.handle && `@${e.handle}`, e.followers ? compactNum(e.followers) : ""].filter(Boolean).join(" · ")}</p>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px]"><div className="truncate">{e.deliverables || "—"}</div>{e.postDate && <div className="text-xs text-muted-foreground">{new Date(e.postDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>}</TableCell>
                    <TableCell onClick={(ev) => ev.stopPropagation()}>
                      <Select value={e.status} onValueChange={(v) => quickStatus(e, v)}>
                        <SelectTrigger className={`h-7 w-auto gap-1 rounded-full border-0 px-2 text-xs ${ENTRY_STATUS_STYLE[e.status]}`}><SelectValue /></SelectTrigger>
                        <SelectContent>{ENTRY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs" onClick={(ev) => ev.stopPropagation()}>
                      {(e.links || []).length ? e.links.map((l, i) => <a key={i} href={l} target="_blank" rel="noreferrer" className="mr-2 inline-flex items-center gap-0.5 text-brand hover:underline">Post{e.links.length > 1 ? ` ${i + 1}` : ""}<ExternalLink className="h-3 w-3" /></a>) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">{e.metrics?.views ? compactNum(e.metrics.views) : "—"}</TableCell>
                    <TableCell className="text-right">{eng ? <>{compactNum(eng)}{base ? <div className="text-xs text-muted-foreground">{Math.round((eng / base) * 1000) / 10}%</div> : null}</> : "—"}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{e.barter ? "Barter" : e.fee ? inr(e.fee) : "—"}</TableCell>
                    <TableCell className="text-right" onClick={(ev) => ev.stopPropagation()}>
                      <RowActions items={[{ label: "Edit results", icon: Edit, onClick: () => setEntry(e) }, "-", { label: "Remove from campaign", icon: Trash2, onClick: () => remove(e), danger: true }]} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CampaignEditor open={editing} onOpenChange={setEditing} campaign={c} onSaved={saved} />
      {entry && <EntryEditor entry={entry} campaignId={id} onOpenChange={(v) => !v && setEntry(null)} onSaved={saved} />}
      <AddInfluencersDialog open={adding} onOpenChange={setAdding} campaign={c} onSaved={saved} />
      <ImportRosterDialog open={importing} onOpenChange={setImporting} campaign={c} onSaved={saved} />
      <ShareDialog open={sharing} onOpenChange={setSharing} campaign={c} onSaved={(x) => setC(x)} />
    </div>
  );
};

export default CampaignDetail;
