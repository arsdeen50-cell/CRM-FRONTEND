import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { confirmDialog } from "@/components/ui/app-dialogs";
import axiosInstance from "@/utils/axiosConfig";
import { errMsg } from "@/lib/publicApi";

export const PLATFORMS = ["Instagram", "YouTube", "Facebook", "X", "LinkedIn", "Snapchat", "Moj / Josh", "ShareChat", "Threads", "Blog", "Other"];
export const STATUSES = ["Prospect", "Contacted", "In talks", "Worked with", "Not interested", "Do not use"];
export const STATUS_STYLE = {
  Prospect: "bg-slate-100 text-slate-700",
  Contacted: "bg-sky-100 text-sky-800",
  "In talks": "bg-amber-100 text-amber-800",
  "Worked with": "bg-green-100 text-green-700",
  "Not interested": "bg-gray-100 text-muted-foreground",
  "Do not use": "bg-red-100 text-red-700",
};
export const compact = (n) => {
  const v = Number(n) || 0;
  if (!v) return "—";
  if (v >= 1e6) return `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(v >= 1e4 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(v);
};
const RATE_SUGGESTIONS = ["Instagram reel", "Instagram post", "Instagram story", "Story set (3)", "Collab post", "YouTube video", "YouTube integration", "YouTube short", "Event appearance", "Usage rights (per month)"];
const blank = { name: "", platforms: [{ platform: "Instagram", handle: "", url: "", followers: "", avgViews: "", engagementRate: "" }], niches: "", languages: "", city: "", state: "", country: "India", gender: "", email: "", phone: "", managerName: "", managerPhone: "", managerEmail: "", rates: [{ deliverable: "Instagram reel", amount: "", note: "" }], openToBarter: false, status: "Prospect", rating: 0, owner: "", tags: "", notes: "" };
const joinList = (v) => (Array.isArray(v) ? v.join(", ") : v || "");

/* Add or edit an influencer. Several platforms per person; rates per deliverable; contact and manager details. */
const InfluencerEditor = ({ open, onOpenChange, influencer, onSaved, owners = [] }) => {
  const [f, setF] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!open) return;
    setF(
      influencer
        ? { ...blank, ...influencer, niches: joinList(influencer.niches), languages: joinList(influencer.languages), tags: joinList(influencer.tags), platforms: influencer.platforms?.length ? influencer.platforms : blank.platforms, rates: influencer.rates?.length ? influencer.rates : blank.rates }
        : { ...blank }
    );
  }, [open, influencer]);
  if (!f) return null;
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const setRow = (key, i, k, v) => set(key, f[key].map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  const save = async (allowDuplicate = false) => {
    if (!f.name.trim()) return toast.error("Enter the influencer's name");
    setSaving(true);
    const payload = { ...f, allowDuplicate };
    delete payload.collaborations;
    try {
      const r = influencer?._id ? await axiosInstance.put(`/v1/influencer/${influencer._id}`, payload) : await axiosInstance.post("/v1/influencer", payload);
      toast.success("Influencer saved");
      onSaved?.(r.data.influencer);
      onOpenChange(false);
    } catch (err) {
      if (err.response?.status === 409 && (await confirmDialog(`${errMsg(err)}. Save anyway?`))) {
        setSaving(false);
        return save(true);
      }
      if (err.response?.status !== 409) toast.error(errMsg(err, "Could not save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{influencer?._id ? `Edit ${influencer.name}` : "Add influencer"}</DialogTitle>
          <DialogDescription>Only the name is required. Handles, email and phone are checked for duplicates.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="grid gap-1 sm:col-span-2"><Label>Name</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Creator or page name" /></div>
            <div className="grid gap-1">
              <Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => set("status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Platforms</Label>
            {f.platforms.map((p, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6 sm:col-span-2">
                  <Select value={p.platform} onValueChange={(v) => setRow("platforms", i, "platform", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PLATFORMS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
                </div>
                <Input className="col-span-6 sm:col-span-2" placeholder="@handle" value={p.handle} onChange={(e) => setRow("platforms", i, "handle", e.target.value)} />
                <Input className="col-span-12 sm:col-span-3" placeholder="Profile link" value={p.url} onChange={(e) => setRow("platforms", i, "url", e.target.value)} />
                <Input className="col-span-4 sm:col-span-2" type="number" min="0" placeholder="Followers" value={p.followers || ""} onChange={(e) => setRow("platforms", i, "followers", e.target.value)} />
                <Input className="col-span-3 sm:col-span-1" type="number" min="0" step="0.1" placeholder="ER %" title="Engagement rate %" value={p.engagementRate || ""} onChange={(e) => setRow("platforms", i, "engagementRate", e.target.value)} />
                <Input className="col-span-3 sm:col-span-1" type="number" min="0" placeholder="Views" title="Average views" value={p.avgViews || ""} onChange={(e) => setRow("platforms", i, "avgViews", e.target.value)} />
                <Button size="icon" variant="ghost" className="col-span-2 sm:col-span-1 text-red-600" onClick={() => set("platforms", f.platforms.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-fit" onClick={() => set("platforms", [...f.platforms, { platform: "YouTube", handle: "", url: "", followers: "", avgViews: "", engagementRate: "" }])}><Plus className="h-4 w-4 mr-1" /> Add platform</Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1"><Label>Niches (comma separated)</Label><Input value={f.niches} onChange={(e) => set("niches", e.target.value)} placeholder="Food, Travel, Lifestyle" /></div>
            <div className="grid gap-1"><Label>Languages</Label><Input value={f.languages} onChange={(e) => set("languages", e.target.value)} placeholder="Hindi, English" /></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="grid gap-1"><Label>City</Label><Input value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
            <div className="grid gap-1"><Label>State</Label><Input value={f.state} onChange={(e) => set("state", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Country</Label><Input value={f.country} onChange={(e) => set("country", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Gender (optional)</Label><Input value={f.gender} onChange={(e) => set("gender", e.target.value)} /></div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1"><Label>Email</Label><Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Phone / WhatsApp</Label><Input value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="grid gap-1"><Label>Manager / agency</Label><Input value={f.managerName} onChange={(e) => set("managerName", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Manager phone</Label><Input value={f.managerPhone} onChange={(e) => set("managerPhone", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Manager email</Label><Input type="email" value={f.managerEmail} onChange={(e) => set("managerEmail", e.target.value)} /></div>
          </div>

          <div className="grid gap-2">
            <Label>Rates (₹)</Label>
            <datalist id="inf-rate-list">{RATE_SUGGESTIONS.map((r) => <option key={r} value={r} />)}</datalist>
            {f.rates.map((r, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <Input className="col-span-12 sm:col-span-5" list="inf-rate-list" placeholder="Deliverable" value={r.deliverable} onChange={(e) => setRow("rates", i, "deliverable", e.target.value)} />
                <Input className="col-span-5 sm:col-span-2" type="number" min="0" placeholder="Amount" value={r.amount || ""} onChange={(e) => setRow("rates", i, "amount", e.target.value)} />
                <Input className="col-span-5 sm:col-span-4" placeholder="Note (e.g. +GST, 30-day usage)" value={r.note} onChange={(e) => setRow("rates", i, "note", e.target.value)} />
                <Button size="icon" variant="ghost" className="col-span-2 sm:col-span-1 text-red-600" onClick={() => set("rates", f.rates.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => set("rates", [...f.rates, { deliverable: "", amount: "", note: "" }])}><Plus className="h-4 w-4 mr-1" /> Add rate</Button>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.openToBarter} onChange={(e) => set("openToBarter", e.target.checked)} /> Open to barter / product collabs</label>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label>Managed by</Label>
              <Input list="inf-owner-list" value={f.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Team member" />
              <datalist id="inf-owner-list">{owners.map((o) => <option key={o} value={o} />)}</datalist>
            </div>
            <div className="grid gap-1">
              <Label>Our rating</Label>
              <Select value={String(f.rating || 0)} onValueChange={(v) => set("rating", Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[0, 1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n ? "★".repeat(n) : "Not rated"}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid gap-1"><Label>Tags</Label><Input value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder="Reliable, Fast turnaround" /></div>
          </div>
          <div className="grid gap-1"><Label>Notes</Label><Textarea rows={3} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Audience, past brands, what works with them..." /></div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button onClick={() => save(false)} disabled={saving}>{saving ? "Saving..." : "Save influencer"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InfluencerEditor;
