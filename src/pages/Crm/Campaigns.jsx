import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Megaphone, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import PageHeader, { Pill } from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosInstance from "@/utils/axiosConfig";
import { errMsg } from "@/lib/publicApi";
import { toDateInput } from "@/lib/crmOutreach";
import { CAMPAIGN_STATUS_STYLE, compactNum, dateRange, inr } from "@/lib/campaigns";

const STATUSES = ["Planning", "Live", "Completed", "Cancelled"];
const PLATFORMS = ["Instagram", "YouTube", "Facebook", "X", "LinkedIn", "Snapchat", "Moj / Josh", "ShareChat", "Threads", "Blog", "Other"];
const OBJECTIVES = ["Awareness", "Product launch", "Sales / conversions", "Footfall", "App installs", "Event", "UGC content", "Other"];
const NO_CLIENT = "__none";
const ALL = "__all";

/* New / edit campaign: client, name, dates, objective, platforms, budget, brief and the results summary
   that the client sees on the report. */
export const CampaignEditor = ({ open, onOpenChange, campaign, onSaved, defaultClientId }) => {
  const [f, setF] = useState(null);
  const [clients, setClients] = useState([]);
  useEffect(() => {
    if (!open) return;
    axiosInstance.get("/v1/time/options").then((r) => setClients(r.data.clients || [])).catch(() => {});
    setF(
      campaign
        ? { ...campaign, clientId: campaign.clientId || "", startDate: toDateInput(campaign.startDate), endDate: toDateInput(campaign.endDate), hashtags: (campaign.hashtags || []).join(", "), budget: campaign.budget || "" }
        : { name: "", clientId: defaultClientId || "", clientName: "", objective: "", status: "Planning", startDate: toDateInput(new Date()), endDate: "", platforms: ["Instagram"], hashtags: "", budget: "", owner: "", brief: "", resultsSummary: "" }
    );
  }, [open, campaign, defaultClientId]);
  if (!f) return null;
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    if (!f.name.trim()) return toast.error("Name the campaign");
    if (!f.clientId && !f.clientName.trim()) return toast.error("Pick the client");
    const payload = { ...f };
    delete payload.entries;
    delete payload.totals;
    delete payload.share;
    try {
      const r = campaign?._id ? await axiosInstance.put(`/v1/campaign/${campaign._id}`, payload) : await axiosInstance.post("/v1/campaign", payload);
      toast.success("Campaign saved");
      onSaved?.(r.data.campaign);
      onOpenChange(false);
    } catch (err) {
      toast.error(errMsg(err, "Could not save"));
    }
  };
  const togglePlatform = (p) => set("platforms", f.platforms.includes(p) ? f.platforms.filter((x) => x !== p) : [...f.platforms, p]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign?._id ? "Edit campaign" : "New influencer campaign"}</DialogTitle>
          <DialogDescription>Add the influencers on the next screen, one by one or from a spreadsheet.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Client</Label>
              <Select value={f.clientId || NO_CLIENT} onValueChange={(v) => set("clientId", v === NO_CLIENT ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CLIENT}>Not in the CRM / type below</SelectItem>
                  {clients.map((c) => <SelectItem key={c._id} value={c._id}>{c.brandName}</SelectItem>)}
                </SelectContent>
              </Select>
              {!f.clientId && <Input placeholder="Brand name" value={f.clientName} onChange={(e) => set("clientName", e.target.value)} />}
            </div>
            <div className="grid gap-1"><Label>Campaign name</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ramadan 2026 launch" /></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="grid gap-1"><Label>Start</Label><Input type="date" value={f.startDate || ""} onChange={(e) => set("startDate", e.target.value)} /></div>
            <div className="grid gap-1"><Label>End</Label><Input type="date" value={f.endDate || ""} onChange={(e) => set("endDate", e.target.value)} /></div>
            <div className="grid gap-1">
              <Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => set("status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid gap-1"><Label>Budget (₹)</Label><Input type="number" min="0" value={f.budget} onChange={(e) => set("budget", e.target.value)} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Objective</Label>
              <Input list="cmp-objectives" value={f.objective} onChange={(e) => set("objective", e.target.value)} placeholder="Awareness, launch..." />
              <datalist id="cmp-objectives">{OBJECTIVES.map((o) => <option key={o} value={o} />)}</datalist>
            </div>
            <div className="grid gap-1"><Label>Managed by</Label><Input value={f.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Team member" /></div>
          </div>
          <div className="grid gap-1">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => (
                <button key={p} type="button" onClick={() => togglePlatform(p)} className={`rounded-full border px-3 py-1 text-xs ${f.platforms.includes(p) ? "border-brand bg-brand-soft text-brand" : "border-border text-muted-foreground"}`}>{p}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-1"><Label>Hashtags</Label><Input value={f.hashtags} onChange={(e) => set("hashtags", e.target.value)} placeholder="#BrandLaunch, #Ramadan" /></div>
          <div className="grid gap-1"><Label>Brief (shown on the client report)</Label><Textarea rows={3} value={f.brief} onChange={(e) => set("brief", e.target.value)} placeholder="What the campaign was about and what creators were asked to do" /></div>
          <div className="grid gap-1"><Label>Results summary (shown on the client report)</Label><Textarea rows={3} value={f.resultsSummary} onChange={(e) => set("resultsSummary", e.target.value)} placeholder="The headline results, in your words" /></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save}>Save campaign</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* All influencer campaigns, grouped by client: who ran, how big, what it delivered. */
const Campaigns = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [clientId, setClientId] = useState("");
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setData((await axiosInstance.get("/v1/campaign", { params: { q: query || undefined, clientId: clientId || undefined, status: status || undefined } })).data);
    } catch (err) {
      toast.error(errMsg(err, "Could not load campaigns"));
    }
  }, [query, clientId, status]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const campaigns = data?.campaigns || [];
  const groups = [];
  for (const c of campaigns) {
    const key = c.clientName || "No client";
    let g = groups.find((x) => x.key === key);
    if (!g) groups.push((g = { key, clientId: c.clientId, items: [] }));
    g.items.push(c);
  }
  const all = campaigns.reduce((t, c) => ({ influencers: t.influencers + c.totals.influencers, views: t.views + c.totals.views }), { influencers: 0, views: 0 });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader icon={Megaphone} title="Influencer campaigns" subtitle="Every influencer campaign by client, with its creators, posts and results, and a report link to share.">
        <Button variant="outline" onClick={() => navigate("/crm/influencers")}>Influencer database</Button>
        <Button onClick={() => setCreating(true)} className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" /> New campaign</Button>
      </PageHeader>

      <Card>
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Campaign, client, influencer..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={clientId || ALL} onValueChange={(v) => setClientId(v === ALL ? "" : v)}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All clients" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All clients</SelectItem>
              {(data?.clients || []).filter((c) => c._id).map((c) => <SelectItem key={c._id} value={c._id}>{c.name} ({c.campaigns})</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status || ALL} onValueChange={(v) => setStatus(v === ALL ? "" : v)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value={ALL}>Any status</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          {(q || clientId || status) && <Button variant="ghost" size="sm" onClick={() => { setQ(""); setClientId(""); setStatus(""); }}><X className="h-4 w-4 mr-1" /> Clear</Button>}
          {data && <span className="ml-auto text-xs text-muted-foreground">{campaigns.length} campaigns · {all.influencers} influencer bookings · {compactNum(all.views)} views</span>}
        </CardContent>
      </Card>

      {!data && <p className="text-sm text-muted-foreground">Loading...</p>}
      {data && campaigns.length === 0 && (
        <Card><CardContent className="py-12 text-center space-y-2">
          <Megaphone className="h-8 w-8 mx-auto text-muted-foreground/60" />
          <p className="font-medium">{q || clientId || status ? "No campaigns match." : "No campaigns yet"}</p>
          {!(q || clientId || status) && <p className="text-sm text-muted-foreground">Create one per client campaign, then add its influencers, including past campaigns you want to keep on record.</p>}
        </CardContent></Card>
      )}

      {groups.map((g) => (
        <div key={g.key} className="space-y-2">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold">{g.clientId ? <Link to={`/crm/clients/${g.clientId}`} className="hover:underline">{g.key}</Link> : g.key}</h2>
            <span className="text-xs text-muted-foreground">{g.items.length} campaign{g.items.length === 1 ? "" : "s"}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {g.items.map((c) => (
              <Link key={c._id} to={`/crm/campaigns/${c._id}`}>
                <Card className="h-full hover:border-brand/50 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{[dateRange(c.startDate, c.endDate), c.objective].filter(Boolean).join(" · ") || "No dates yet"}</p>
                      </div>
                      <Pill className={CAMPAIGN_STATUS_STYLE[c.status]}>{c.status}</Pill>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-md bg-muted/50 p-2"><p className="text-lg font-semibold">{c.totals.influencers}</p><p className="text-[11px] text-muted-foreground">influencers</p></div>
                      <div className="rounded-md bg-muted/50 p-2"><p className="text-lg font-semibold">{compactNum(c.totals.views)}</p><p className="text-[11px] text-muted-foreground">views</p></div>
                      <div className="rounded-md bg-muted/50 p-2"><p className="text-lg font-semibold">{c.totals.engagementRate ? `${c.totals.engagementRate}%` : "—"}</p><p className="text-[11px] text-muted-foreground">engagement</p></div>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{c.preview.map((p) => p.handle ? `@${p.handle}` : p.name).join(", ") || "No influencers yet"}{c.totals.influencers > c.preview.length ? ` +${c.totals.influencers - c.preview.length}` : ""}</span>
                      <span className="whitespace-nowrap">{c.totals.spend ? inr(c.totals.spend) : ""}{c.share?.enabled ? " · shared" : ""}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

      <CampaignEditor open={creating} onOpenChange={setCreating} defaultClientId={clientId} onSaved={(c) => navigate(`/crm/campaigns/${c._id}`)} />
    </div>
  );
};

export default Campaigns;
