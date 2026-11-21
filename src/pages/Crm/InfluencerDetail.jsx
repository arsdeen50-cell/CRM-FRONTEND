import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Edit, ExternalLink, Mail, Megaphone, MessageCircle, Phone, Plus, Star, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import PageHeader, { Stat, Pill } from "@/components/crm/PageHeader";
import InfluencerEditor, { STATUS_STYLE, compact } from "@/components/crm/InfluencerEditor";
import { useAccess } from "@/components/crm/AccessRoute";
import RowActions from "@/components/ui/row-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { confirmDialog } from "@/components/ui/app-dialogs";
import axiosInstance from "@/utils/axiosConfig";
import { day, errMsg } from "@/lib/publicApi";
import { toDateInput } from "@/lib/crmOutreach";

const COLLAB_STATUSES = ["Planned", "Confirmed", "Live", "Completed", "Cancelled"];
const COLLAB_STYLE = { Planned: "bg-slate-100 text-slate-700", Confirmed: "bg-sky-100 text-sky-800", Live: "bg-violet-100 text-violet-800", Completed: "bg-green-100 text-green-700", Cancelled: "bg-gray-100 text-muted-foreground" };
const NO_CLIENT = "__none";
const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const waLink = (phone) => {
  const d = String(phone || "").replace(/\D/g, "");
  return d.length >= 10 ? `https://wa.me/${d.length === 10 ? `91${d}` : d}` : "";
};

const CampaignEditor = ({ open, onOpenChange, influencerId, campaign, clients, onSaved }) => {
  const [f, setF] = useState(null);
  useEffect(() => {
    if (!open) return;
    setF(campaign ? { ...campaign, clientId: campaign.clientId || "", date: toDateInput(campaign.date), links: (campaign.links || []).join("\n") } : { clientId: "", clientName: "", campaign: "", deliverables: "", fee: "", barter: false, date: toDateInput(new Date()), status: "Planned", links: "", results: "", rating: 0 });
  }, [open, campaign]);
  if (!f) return null;
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    const payload = { ...f, links: f.links.split(/\s+/).filter(Boolean) };
    try {
      const url = `/v1/influencer/${influencerId}/collaborations${campaign?._id ? `/${campaign._id}` : ""}`;
      const r = campaign?._id ? await axiosInstance.put(url, payload) : await axiosInstance.post(url, payload);
      toast.success("Campaign saved");
      onSaved(r.data.influencer);
      onOpenChange(false);
    } catch (err) {
      toast.error(errMsg(err, "Could not save"));
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign?._id ? "Edit campaign" : "Add campaign"}</DialogTitle>
          <DialogDescription>A campaign this influencer did (or will do) for one of your clients.</DialogDescription>
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
            <div className="grid gap-1"><Label>Campaign</Label><Input value={f.campaign} onChange={(e) => set("campaign", e.target.value)} placeholder="e.g. Diwali launch" /></div>
          </div>
          <div className="grid gap-1"><Label>Deliverables</Label><Input value={f.deliverables} onChange={(e) => set("deliverables", e.target.value)} placeholder="1 reel + 3 stories" /></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="grid gap-1"><Label>Fee (₹)</Label><Input type="number" min="0" value={f.fee || ""} onChange={(e) => set("fee", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Date</Label><Input type="date" value={f.date || ""} onChange={(e) => set("date", e.target.value)} /></div>
            <div className="grid gap-1">
              <Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => set("status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COLLAB_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid gap-1">
              <Label>Rating</Label>
              <Select value={String(f.rating || 0)} onValueChange={(v) => set("rating", Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[0, 1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n ? "★".repeat(n) : "—"}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.barter} onChange={(e) => set("barter", e.target.checked)} /> Barter / product exchange</label>
          <div className="grid gap-1"><Label>Post links (one per line)</Label><Textarea rows={2} value={f.links} onChange={(e) => set("links", e.target.value)} placeholder="https://www.instagram.com/reel/..." /></div>
          <div className="grid gap-1"><Label>Results</Label><Textarea rows={2} value={f.results} onChange={(e) => set("results", e.target.value)} placeholder="Views, reach, clicks, sales, what worked" /></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save}>Save campaign</Button></div>
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
  const [clients, setClients] = useState([]);
  const [editing, setEditing] = useState(false);
  const [campaign, setCampaign] = useState(undefined);

  const load = useCallback(async () => {
    try {
      setInf((await axiosInstance.get(`/v1/influencer/${id}`)).data.influencer);
    } catch (err) {
      toast.error(errMsg(err, "Could not load"));
      if (err.response?.status === 404) navigate("/crm/influencers");
    }
  }, [id, navigate]);
  useEffect(() => {
    load();
    axiosInstance.get("/v1/time/options").then((r) => setClients(r.data.clients || [])).catch(() => {});
  }, [load]);

  if (!inf) return <p className="p-6 text-sm text-muted-foreground">Loading...</p>;
  const collabs = [...(inf.collaborations || [])].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  const done = collabs.filter((c) => c.status === "Completed");
  const spent = done.reduce((t, c) => t + (Number(c.fee) || 0), 0);
  const rated = done.filter((c) => c.rating);
  const avgRating = rated.length ? (rated.reduce((t, c) => t + c.rating, 0) / rated.length).toFixed(1) : "—";

  const removeCampaign = async (c) => {
    if (!(await confirmDialog("Remove this campaign?"))) return;
    try {
      setInf((await axiosInstance.delete(`/v1/influencer/${id}/collaborations/${c._id}`)).data.influencer);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
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
        <Button onClick={() => setCampaign(null)}><Plus className="h-4 w-4 mr-1" /> Add campaign</Button>
        {isAdmin && <Button variant="ghost" size="icon" className="text-red-600" title="Delete influencer" onClick={removeInfluencer}><Trash2 className="h-4 w-4" /></Button>}
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Biggest audience" value={compact(inf.followers)} sub={inf.platforms?.find((p) => p.followers === inf.followers)?.platform} />
        <Stat label="Campaigns" value={collabs.length} sub={`${done.length} completed`} />
        <Stat label="Paid so far" value={inr(spent)} sub="completed campaigns" />
        <Stat label="Campaign rating" value={avgRating} sub={inf.rating ? `Our rating ${"★".repeat(inf.rating)}` : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4 order-2 lg:order-1">
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-3 border-b"><p className="flex items-center gap-2 text-sm font-medium"><Megaphone className="h-4 w-4 text-brand" /> Campaigns</p></div>
              {collabs.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No campaigns yet. Add one when you book {inf.name} for a client.</p>}
              <div className="divide-y">
                {collabs.map((c) => (
                  <div key={c._id} className="p-3 flex gap-3">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {c.clientId ? <Link to={`/crm/clients/${c.clientId}`} className="font-medium hover:underline">{c.clientName}</Link> : <span className="font-medium">{c.clientName || "—"}</span>}
                        {c.campaign && <span className="text-sm text-muted-foreground">· {c.campaign}</span>}
                        <Pill className={COLLAB_STYLE[c.status]}>{c.status}</Pill>
                      </div>
                      <p className="text-sm text-muted-foreground">{[c.date && day(c.date), c.deliverables, c.barter ? "Barter" : c.fee ? inr(c.fee) : "", c.rating ? "★".repeat(c.rating) : ""].filter(Boolean).join(" · ")}</p>
                      {c.results && <p className="text-sm whitespace-pre-wrap">{c.results}</p>}
                      {c.links?.length > 0 && (
                        <div className="flex flex-wrap gap-3 text-xs">
                          {c.links.map((l, i) => <a key={i} href={l} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand hover:underline">Post {c.links.length > 1 ? i + 1 : ""} <ExternalLink className="h-3 w-3" /></a>)}
                        </div>
                      )}
                    </div>
                    <RowActions items={[{ label: "Edit", icon: Edit, onClick: () => setCampaign(c) }, "-", { label: "Remove", icon: Trash2, onClick: () => removeCampaign(c), danger: true }]} />
                  </div>
                ))}
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
      <CampaignEditor open={campaign !== undefined} onOpenChange={(v) => !v && setCampaign(undefined)} influencerId={id} campaign={campaign} clients={clients} onSaved={setInf} />
    </div>
  );
};

export default InfluencerDetail;
