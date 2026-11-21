import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Edit, Mail, Megaphone, MessageCircle, Phone, Plus, Star, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import PageHeader, { Stat, Pill } from "@/components/crm/PageHeader";
import InfluencerEditor, { STATUS_STYLE, compact } from "@/components/crm/InfluencerEditor";
import { useAccess } from "@/components/crm/AccessRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { confirmDialog } from "@/components/ui/app-dialogs";
import axiosInstance from "@/utils/axiosConfig";
import { day, errMsg } from "@/lib/publicApi";
import { CAMPAIGN_STATUS_STYLE, ENTRY_STATUS_STYLE, compactNum, entryEngagement } from "@/lib/campaigns";

const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const waLink = (phone) => {
  const d = String(phone || "").replace(/\D/g, "");
  return d.length >= 10 ? `https://wa.me/${d.length === 10 ? `91${d}` : d}` : "";
};

/* Put this influencer into one of the campaigns (or start a new campaign). */
const AddToCampaignDialog = ({ open, onOpenChange, influencer, onDone }) => {
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [pick, setPick] = useState("");
  useEffect(() => {
    if (!open) return;
    setPick("");
    axiosInstance.get("/v1/campaign").then((r) => setList(r.data.campaigns || [])).catch(() => setList([]));
  }, [open]);
  const add = async () => {
    try {
      const r = await axiosInstance.post(`/v1/campaign/${pick}/entries`, { influencerIds: [influencer._id] });
      toast.success(r.data.added ? "Added to the campaign" : "Already in that campaign");
      onDone();
      onOpenChange(false);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const open_ = (list || []).filter((c) => c.status !== "Cancelled");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add {influencer?.name} to a campaign</DialogTitle>
          <DialogDescription>Deliverables, fee, post links and results are filled in on the campaign page.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {list === null ? <p className="text-sm text-muted-foreground">Loading...</p> : open_.length ? (
            <Select value={pick} onValueChange={setPick}>
              <SelectTrigger><SelectValue placeholder="Pick a campaign" /></SelectTrigger>
              <SelectContent>{open_.map((c) => <SelectItem key={c._id} value={c._id}>{c.clientName} · {c.name}</SelectItem>)}</SelectContent>
            </Select>
          ) : <p className="text-sm text-muted-foreground">No campaigns yet.</p>}
          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="ghost" onClick={() => navigate("/crm/campaigns")}>New campaign</Button>
            <Button disabled={!pick} onClick={add}>Add</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* One influencer: platforms and reach, contacts, rates, notes and the campaigns done for clients. */
const InfluencerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAccess();
  const [inf, setInf] = useState(null);
  const [editing, setEditing] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = (await axiosInstance.get(`/v1/influencer/${id}`)).data;
      setInf(r.influencer);
      setCampaigns(r.campaigns || []);
    } catch (err) {
      toast.error(errMsg(err, "Could not load"));
      if (err.response?.status === 404) navigate("/crm/influencers");
    }
  }, [id, navigate]);
  useEffect(() => {
    load();
  }, [load]);

  if (!inf) return <p className="p-6 text-sm text-muted-foreground">Loading...</p>;
  const active = campaigns.filter((c) => c.entry.status !== "Dropped");
  const posted = active.filter((c) => ["Posted", "Paid"].includes(c.entry.status));
  const spent = posted.reduce((t, c) => t + (Number(c.entry.fee) || 0), 0);
  const views = active.reduce((t, c) => t + (Number(c.entry.metrics?.views) || 0), 0);

  const removeInfluencer = async () => {
    if (!(await confirmDialog(`Delete ${inf.name}? They no longer show in the list; campaign history is kept for records.`))) return;
    try {
      await axiosInstance.delete(`/v1/influencer/${id}`);
      toast.success("Deleted");
      navigate("/crm/influencers");
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const wa = waLink(inf.phone);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader icon={Star} title={inf.name} back="/crm/influencers" subtitle={[inf.tier && `${inf.tier} influencer`, (inf.niches || []).join(", "), [inf.city, inf.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}>
        <Pill className={`${STATUS_STYLE[inf.status]} self-center`}>{inf.status}</Pill>
        <Button variant="outline" onClick={() => setEditing(true)}><Edit className="h-4 w-4 mr-1" /> Edit</Button>
        <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4 mr-1" /> Add to campaign</Button>
        {isAdmin && <Button variant="ghost" size="icon" className="text-red-600" title="Delete influencer" onClick={removeInfluencer}><Trash2 className="h-4 w-4" /></Button>}
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Biggest audience" value={compact(inf.followers)} sub={inf.platforms?.find((p) => p.followers === inf.followers)?.platform} />
        <Stat label="Campaigns" value={active.length} sub={`${posted.length} posted · ${[...new Set(active.map((c) => c.clientName))].length} clients`} />
        <Stat label="Paid so far" value={inr(spent)} sub="posted campaigns" />
        <Stat label="Views delivered" value={views ? compactNum(views) : "—"} sub={inf.rating ? `Our rating ${"★".repeat(inf.rating)}` : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4 order-2 lg:order-1">
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-3 border-b"><p className="flex items-center gap-2 text-sm font-medium"><Megaphone className="h-4 w-4 text-brand" /> Campaigns</p></div>
              {campaigns.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">{`Not in any campaign yet. Use "Add to campaign" when you book ${inf.name} for a client.`}</p>}
              <div className="divide-y">
                {campaigns.map((c) => {
                  const e = c.entry;
                  const eng = entryEngagement(e.metrics);
                  return (
                    <Link key={c._id} to={`/crm/campaigns/${c._id}`} className="block p-3 hover:bg-accent/50">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{c.clientName}</span>
                        <span className="text-sm text-muted-foreground">· {c.name}</span>
                        <Pill className={CAMPAIGN_STATUS_STYLE[c.status]}>{c.status}</Pill>
                        <Pill className={ENTRY_STATUS_STYLE[e.status]}>{e.status}</Pill>
                      </div>
                      <p className="text-sm text-muted-foreground">{[e.postDate ? day(e.postDate) : c.startDate ? day(c.startDate) : "", e.deliverables, e.barter ? "Barter" : e.fee ? inr(e.fee) : "", e.metrics?.views ? `${compactNum(e.metrics.views)} views` : "", eng ? `${compactNum(eng)} engagements` : "", (e.links || []).length ? `${e.links.length} post${e.links.length === 1 ? "" : "s"}` : ""].filter(Boolean).join(" · ")}</p>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          {inf.notes && <Card><CardContent className="p-3"><p className="text-sm font-medium mb-1">Notes</p><p className="text-sm whitespace-pre-wrap text-muted-foreground">{inf.notes}</p></CardContent></Card>}
        </div>

        <div className="space-y-4 order-1 lg:order-2">
          <Card>
            <CardContent className="p-3 space-y-2">
              <p className="text-sm font-medium">Platforms</p>
              {(inf.platforms || []).length === 0 && <p className="text-xs text-muted-foreground">None added.</p>}
              {(inf.platforms || []).map((p, i) => (
                <div key={i} className="flex items-start justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{p.platform}</p>
                    {p.url ? <a href={p.url} target="_blank" rel="noreferrer" className="text-brand hover:underline break-all">{p.handle ? `@${p.handle}` : p.url}</a> : <span>{p.handle ? `@${p.handle}` : "—"}</span>}
                  </div>
                  <div className="text-right text-xs whitespace-nowrap">
                    <p className="text-sm font-medium">{compact(p.followers)}</p>
                    <p className="text-muted-foreground">{[p.engagementRate ? `${p.engagementRate}% ER` : "", p.avgViews ? `${compact(p.avgViews)} views` : ""].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 space-y-2 text-sm">
              <p className="font-medium">Contact</p>
              {inf.email && <a href={`mailto:${inf.email}`} className="flex items-center gap-2 text-brand hover:underline break-all"><Mail className="h-4 w-4 shrink-0" /> {inf.email}</a>}
              {inf.phone && (
                <div className="flex items-center gap-3">
                  <a href={`tel:${inf.phone}`} className="flex items-center gap-2 text-brand hover:underline"><Phone className="h-4 w-4" /> {inf.phone}</a>
                  {wa && <a href={wa} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-green-700 hover:underline text-xs"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>}
                </div>
              )}
              {(inf.managerName || inf.managerPhone || inf.managerEmail) && (
                <div className="pt-1 border-t">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground"><UserRound className="h-3.5 w-3.5" /> Manager</p>
                  <p>{inf.managerName}</p>
                  {inf.managerPhone && <a href={`tel:${inf.managerPhone}`} className="block text-brand hover:underline">{inf.managerPhone}</a>}
                  {inf.managerEmail && <a href={`mailto:${inf.managerEmail}`} className="block text-brand hover:underline break-all">{inf.managerEmail}</a>}
                </div>
              )}
              {!inf.email && !inf.phone && !inf.managerName && <p className="text-xs text-muted-foreground">No contact details yet.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 space-y-1 text-sm">
              <p className="font-medium">Rates</p>
              {(inf.rates || []).length === 0 && <p className="text-xs text-muted-foreground">No rates yet.</p>}
              {(inf.rates || []).map((r, i) => (
                <div key={i} className="flex justify-between gap-2"><span>{r.deliverable || "—"}{r.note && <span className="text-xs text-muted-foreground"> · {r.note}</span>}</span><span className="font-medium whitespace-nowrap">{r.amount ? inr(r.amount) : "—"}</span></div>
              ))}
              {inf.openToBarter && <p className="text-xs text-muted-foreground pt-1">Open to barter / product collabs</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 space-y-1 text-sm">
              {[["Languages", (inf.languages || []).join(", ")], ["Gender", inf.gender], ["Country", inf.country], ["Managed by", inf.owner], ["Tags", (inf.tags || []).join(", ")], ["Added", `${day(inf.createdAt)}${inf.createdBy ? ` by ${inf.createdBy}` : ""}`]]
                .filter(([, v]) => v)
                .map(([k, v]) => <div key={k} className="flex justify-between gap-2"><span className="text-muted-foreground">{k}</span><span className="text-right">{v}</span></div>)}
            </CardContent>
          </Card>
        </div>
      </div>

      <InfluencerEditor open={editing} onOpenChange={setEditing} influencer={inf} onSaved={setInf} />
      <AddToCampaignDialog open={adding} onOpenChange={setAdding} influencer={inf} onDone={load} />
    </div>
  );
};

export default InfluencerDetail;
