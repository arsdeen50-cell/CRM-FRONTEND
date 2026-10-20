import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquareText, Plus, Edit, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import CrmRoute from "@/components/crm/CrmRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosInstance from "@/utils/axiosConfig";

const PLACEHOLDERS = ["brandName", "firstName", "contactPerson", "industry", "location", "website", "gap", "angle", "signal", "myName", "company"];
const CHANNELS = ["Email", "WhatsApp", "Call", "Visit", "Instagram DM"];
const EMPTY = { name: "", channel: "Email", subject: "", body: "" };

const Templates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/v1/template");
      setTemplates(res.data.templates || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load templates");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const addStarters = async () => {
    const res = await axiosInstance.post("/v1/template/starters");
    toast.success(res.data.added ? `Added ${res.data.added} starter templates` : "Starter templates are already there");
    load();
  };

  const save = async () => {
    if (!form.name.trim() || !form.body.trim()) return toast.error("Name and message are required");
    setSaving(true);
    try {
      if (form._id) await axiosInstance.put(`/v1/template/${form._id}`, form);
      else await axiosInstance.post("/v1/template", form);
      toast.success("Template saved");
      setForm(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete template "${t.name}"?`)) return;
    await axiosInstance.delete(`/v1/template/${t._id}`);
    load();
  };

  return (
    <CrmRoute>
      <div className="p-4 md:p-6 space-y-4 max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/crm")} title="Back to CRM"><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2"><MessageSquareText className="h-6 w-6 text-blue-600" /> Outreach templates</h1>
              <p className="text-sm text-gray-500">{'Used by the "Contact" button on every lead. Placeholders fill in from the lead automatically.'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {templates.length === 0 && <Button variant="outline" onClick={addStarters}><Sparkles className="h-4 w-4 mr-1" /> Add starter templates</Button>}
            <Button onClick={() => setForm({ ...EMPTY })} className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-1" /> New template</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {templates.length === 0 && <p className="text-sm text-gray-500">No templates yet. Add the starter set or create your own.</p>}
          {templates.map((t) => (
            <Card key={t._id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <span className="text-xs bg-gray-100 dark:bg-slate-700 rounded px-2 py-0.5">{t.channel}</span>
                  </div>
                  <div className="flex">
                    <Button size="icon" variant="ghost" onClick={() => setForm({ ...t })} title="Edit"><Edit className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-red-600" onClick={() => remove(t)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                {t.subject && <p className="text-sm"><span className="text-gray-500">Subject:</span> {t.subject}</p>}
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line line-clamp-5">{t.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{form?._id ? "Edit template" : "New template"}</DialogTitle></DialogHeader>
            {form && (
              <div className="grid gap-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="grid gap-1"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div className="grid gap-1">
                    <Label>Channel</Label>
                    <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                {form.channel === "Email" && <div className="grid gap-1"><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>}
                <div className="grid gap-1"><Label>Message</Label><Textarea rows={9} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
                <div className="flex flex-wrap gap-1">
                  {PLACEHOLDERS.map((p) => (
                    <button key={p} type="button" className="text-xs border rounded px-2 py-0.5 hover:bg-gray-50 dark:hover:bg-slate-800" onClick={() => setForm({ ...form, body: `${form.body}{{${p}}}` })}>
                      {`{{${p}}}`}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setForm(null)}>Cancel</Button>
                  <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? "Saving..." : "Save"}</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </CrmRoute>
  );
};

export default Templates;
