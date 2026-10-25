import React, { useCallback, useEffect, useState } from "react";
import { ClipboardList, Plus, Copy, ExternalLink, Edit, Trash2, Code } from "lucide-react";
import { toast } from "sonner";
import CrmRoute from "@/components/crm/CrmRoute";
import PageHeader, { Pill } from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosInstance from "@/utils/axiosConfig";
import { errMsg, day } from "@/lib/publicApi";
import { useIntegrations } from "@/hooks/useIntegrations";
import { confirmDialog } from "@/components/ui/app-dialogs";

const SOURCES = ["Website Enquiry", "Instagram DM", "Facebook Ad", "Google Ad", "Referral", "WhatsApp", "Event / Exhibition", "Others"];
const FIELD_LABELS = { company: "Company / brand", email: "Email", phone: "Phone", instagram: "Instagram", website: "Website", service: "Service", budget: "Budget", message: "Message" };
const copy = async (text, what) => {
  await navigator.clipboard.writeText(text);
  toast.success(`${what} copied`);
};

const FormEditor = ({ open, onOpenChange, form, onSaved }) => {
  const [f, setF] = useState(null);
  useEffect(() => {
    if (open) setF(form ? { ...form, serviceOptions: form.serviceOptions.join("\n"), budgetOptions: form.budgetOptions.join("\n"), notifyEmails: (form.notifyEmails || []).join(", ") } : { name: "Website enquiry", title: "Tell us about your project", intro: "", leadSourceType: "Website Enquiry", priority: "Medium", assignTo: "", thankYouMessage: "Thanks! We'll get back to you within one working day.", redirectUrl: "", accentColor: "#2563eb", notifyEmails: "", fields: { company: true, email: true, phone: true, instagram: false, website: false, service: true, budget: false, message: true }, serviceOptions: "Social Media Marketing\nWebsite Development\nBranding & Design\nperformance marketing\nProduction / Shoot\nSEO\nInfluencer Marketing", budgetOptions: "Under ₹25,000 / month\n₹25,000 – ₹75,000 / month\n₹75,000+ / month\nOne-time project" });
  }, [open, form]);
  if (!f) return null;
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    const payload = { ...f, serviceOptions: f.serviceOptions.split("\n").map((s) => s.trim()).filter(Boolean), budgetOptions: f.budgetOptions.split("\n").map((s) => s.trim()).filter(Boolean), notifyEmails: f.notifyEmails.split(",").map((s) => s.trim()).filter(Boolean) };
    try {
      if (form) await axiosInstance.put(`/v1/leadform/${form._id}`, payload);
      else await axiosInstance.post("/v1/leadform", payload);
      toast.success("Form saved");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(errMsg(err, "Could not save"));
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form ? "Edit form" : "New lead form"}</DialogTitle>
          <DialogDescription>Each submission creates a client + lead (or adds to the existing one if the email/phone matches) with a follow-up due today.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1"><Label>Internal name</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Heading shown to visitors</Label><Input value={f.title} onChange={(e) => set("title", e.target.value)} /></div>
          </div>
          <div className="grid gap-1"><Label>Intro text (optional)</Label><Textarea rows={2} value={f.intro} onChange={(e) => set("intro", e.target.value)} /></div>
          <div>
            <Label>Fields (name is always asked)</Label>
            <div className="flex flex-wrap gap-3 mt-1">
              {Object.keys(FIELD_LABELS).map((k) => (
                <label key={k} className="text-sm flex items-center gap-1"><input type="checkbox" checked={!!f.fields[k]} onChange={(e) => set("fields", { ...f.fields, [k]: e.target.checked })} /> {FIELD_LABELS[k]}</label>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {f.fields.service && <div className="grid gap-1"><Label>Service options (one per line)</Label><Textarea rows={4} value={f.serviceOptions} onChange={(e) => set("serviceOptions", e.target.value)} /></div>}
            {f.fields.budget && <div className="grid gap-1"><Label>Budget options (one per line)</Label><Textarea rows={4} value={f.budgetOptions} onChange={(e) => set("budgetOptions", e.target.value)} /></div>}
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label>Lead source</Label>
              <Select value={f.leadSourceType} onValueChange={(v) => set("leadSourceType", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid gap-1">
              <Label>Priority</Label>
              <Select value={f.priority} onValueChange={(v) => set("priority", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Low", "Medium", "High", "Critical"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid gap-1"><Label>Assign to (name)</Label><Input value={f.assignTo} onChange={(e) => set("assignTo", e.target.value)} placeholder="e.g. Fardeen" /></div>
          </div>
          <div className="grid gap-1"><Label>Email these people on each new lead (comma separated)</Label><Input value={f.notifyEmails} onChange={(e) => set("notifyEmails", e.target.value)} /></div>
          <div className="grid gap-1"><Label>Thank-you message</Label><Input value={f.thankYouMessage} onChange={(e) => set("thankYouMessage", e.target.value)} /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1"><Label>Redirect after submit (optional URL)</Label><Input value={f.redirectUrl} onChange={(e) => set("redirectUrl", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Button colour</Label><Input type="color" value={f.accentColor} onChange={(e) => set("accentColor", e.target.value)} className="h-10 w-20 p-1" /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={save} className="">Save form</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const LeadForms = () => {
  const [forms, setForms] = useState([]);
  const [editing, setEditing] = useState(undefined);
  const integrations = useIntegrations();
  const load = useCallback(async () => {
    try {
      setForms((await axiosInstance.get("/v1/leadform")).data.forms || []);
    } catch (err) {
      toast.error(errMsg(err, "Could not load forms"));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const remove = async (f) => {
    if (!await confirmDialog(`Delete "${f.name}"? The link stops working.`)) return;
    await axiosInstance.delete(`/v1/leadform/${f._id}`).catch(() => {});
    load();
  };
  return (
    <CrmRoute>
      <div className="p-4 md:p-6 space-y-4">
        <PageHeader icon={ClipboardList} title="Lead capture" subtitle="Forms for your website and bio links. Meta lead ads, Instagram DMs and WhatsApp messages also create leads once connected.">
          <Button onClick={() => setEditing(null)} className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" /> New form</Button>
        </PageHeader>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            ["Facebook / Instagram lead ads", integrations.meta?.configured],
            ["Instagram DMs", integrations.meta?.configured],
            ["WhatsApp messages", integrations.whatsapp?.configured && integrations.whatsapp?.webhookReady],
          ].map(([label, on]) => (
            <Card key={label}><CardContent className="p-4 flex items-center justify-between"><span className="text-sm">{label}</span><Pill className={on ? "bg-green-100 text-green-700" : "bg-gray-100 text-muted-foreground"}>{on ? "Connected" : "Not connected"}</Pill></CardContent></Card>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {forms.length === 0 && <p className="text-sm text-muted-foreground">No forms yet. Create one, then put the link in your Instagram bio or paste the embed code on your website.</p>}
          {forms.map((f) => (
            <Card key={f._id} className={f.isActive ? "" : "opacity-60"}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{f.name} {!f.isActive && <Pill className="bg-gray-100 text-muted-foreground">Off</Pill>}</p>
                    <p className="text-sm text-muted-foreground">{f.submissions} submission{f.submissions === 1 ? "" : "s"}{f.lastSubmissionAt ? ` · last ${day(f.lastSubmissionAt)}` : ""} · {f.leadSourceType}{f.assignTo ? ` · to ${f.assignTo}` : ""}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => axiosInstance.put(`/v1/leadform/${f._id}`, { isActive: !f.isActive }).then(load)}>{f.isActive ? "Turn off" : "Turn on"}</Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditing(f)}><Edit className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-red-600" onClick={() => remove(f)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Input readOnly value={f.url} className="text-xs" onFocus={(e) => e.target.select()} />
                  <Button size="icon" variant="outline" title="Copy link" onClick={() => copy(f.url, "Link")}><Copy className="h-4 w-4" /></Button>
                  <Button asChild size="icon" variant="outline" title="Open"><a href={f.url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
                </div>
                <Button size="sm" variant="outline" onClick={() => copy(f.embedCode, "Embed code")}><Code className="h-4 w-4 mr-1" /> Copy website embed code</Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <FormEditor open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)} form={editing} onSaved={load} />
      </div>
    </CrmRoute>
  );
};

export default LeadForms;
