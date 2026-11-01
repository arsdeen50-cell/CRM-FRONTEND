import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Copy } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { confirmDialog } from "@/components/ui/app-dialogs";
import axiosInstance from "@/utils/axiosConfig";

const POSITION_TYPES = ["Any", "Full Time", "Internship", "Contract", "Part Time"];
const FIELD_TYPES = [["text", "Text"], ["textarea", "Long text"], ["money", "Amount (₹)"], ["number", "Number"], ["date", "Date"]];
const keyOf = (label) => String(label || "").replace(/[^a-zA-Z0-9 ]/g, "").trim().split(/\s+/).map((w, i) => (i ? w[0]?.toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join("").replace(/^[^a-zA-Z]+/, "").slice(0, 40);
const blank = () => ({ name: "New template", positionType: "Any", designations: [], title: "{{positionType}} Offer - {{designation}}", intro: "We are pleased to offer you the position of {{designation}} at {{company}}.", payTitle: "Compensation", sections: [{ heading: "Details", body: "- Date of joining: {{doj}}" }], fields: [], terms: [], closing: "To confirm your acceptance, please sign and return this letter by {{doj}}." });
const move = (arr, i, d) => {
  const a = [...arr];
  const j = i + d;
  if (j < 0 || j >= a.length) return a;
  [a[i], a[j]] = [a[j], a[i]];
  return a;
};

/* HR settings > Offer letters: one template per kind of role, with the details HR fills in for each candidate. */
const OfferTemplatesSettings = () => {
  const [templates, setTemplates] = useState([]);
  const [placeholders, setPlaceholders] = useState([]);
  const [current, setCurrent] = useState(null);

  const load = async (selectId) => {
    const r = await axiosInstance.get("/v1/onboarding/offer-templates");
    setTemplates(r.data.templates || []);
    setPlaceholders(r.data.placeholders || []);
    const pick = (r.data.templates || []).find((t) => t._id === (selectId || current?._id)) || r.data.templates?.[0];
    setCurrent(pick ? JSON.parse(JSON.stringify(pick)) : null);
  };
  useEffect(() => {
    load().catch(() => toast.error("Could not load offer letter templates"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k, v) => setCurrent((t) => ({ ...t, [k]: v }));
  const save = async () => {
    try {
      const body = { ...current, designations: typeof current.designations === "string" ? current.designations.split(",") : current.designations };
      const r = current._id ? await axiosInstance.put(`/v1/onboarding/offer-templates/${current._id}`, body) : await axiosInstance.post("/v1/onboarding/offer-templates", body);
      toast.success("Template saved");
      load(r.data.template._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    }
  };
  const remove = async () => {
    if (!current?._id || !(await confirmDialog(`Delete the "${current.name}" template?`))) return;
    try {
      await axiosInstance.delete(`/v1/onboarding/offer-templates/${current._id}`);
      toast.success("Template deleted");
      setCurrent(null);
      load("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    }
  };

  const allKeys = [...placeholders.map((p) => p.key), ...(current?.fields || []).map((f) => f.key).filter(Boolean)];

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <Card><CardContent className="space-y-1 p-2">
        {templates.map((t) => (
          <button key={t._id} onClick={() => setCurrent(JSON.parse(JSON.stringify(t)))} className={`flex w-full flex-col rounded-md px-3 py-2 text-left text-sm hover:bg-accent ${current?._id === t._id ? "bg-brand-soft text-brand" : ""}`}>
            <span className="font-medium">{t.name}{t.active === false ? " (off)" : ""}</span>
            <span className="text-xs text-muted-foreground">{t.positionType}{t.designations?.length ? ` · ${t.designations.join(", ")}` : ""}</span>
          </button>
        ))}
        <div className="flex gap-1 pt-1">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setCurrent(blank())}><Plus className="mr-1 h-4 w-4" /> New</Button>
          {current?._id && <Button variant="outline" size="sm" title="Duplicate" onClick={() => setCurrent({ ...JSON.parse(JSON.stringify(current)), _id: undefined, name: `${current.name} (copy)` })}><Copy className="h-4 w-4" /></Button>}
        </div>
      </CardContent></Card>

      {current && (
        <Card><CardContent className="grid gap-5 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1"><Label>Template name</Label><Input value={current.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Suggested for position type</Label><select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={current.positionType} onChange={(e) => set("positionType", e.target.value)}>{POSITION_TYPES.map((p) => <option key={p}>{p}</option>)}</select></div>
            <div className="grid gap-1"><Label>…and designations (comma separated)</Label><Input value={Array.isArray(current.designations) ? current.designations.join(", ") : current.designations} onChange={(e) => set("designations", e.target.value)} placeholder="e.g. Video Editor, Graphic Designer" /></div>
          </div>

          <div>
            <p className="font-medium">Details HR fills in</p>
            <p className="mb-2 text-xs text-muted-foreground">Shown on the candidate's onboarding page. Use each one in the letter as {"{{key}}"}. Amounts ticked “in pay table” are listed in the pay table.</p>
            <div className="space-y-2">
              {current.fields.map((f, i) => {
                const upd = (k, v) => set("fields", current.fields.map((x, j) => (j === i ? { ...x, [k]: v, ...(k === "label" && !x._keyEdited && { key: keyOf(v) }) } : x)));
                return (
                  <div key={i} className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[1.4fr_1fr_130px_1fr_auto_auto_auto]">
                    <div className="grid gap-1"><Label className="text-xs">Label</Label><Input value={f.label} onChange={(e) => upd("label", e.target.value)} placeholder="Monthly stipend" /></div>
                    <div className="grid gap-1"><Label className="text-xs">Key</Label><Input value={f.key} onChange={(e) => set("fields", current.fields.map((x, j) => (j === i ? { ...x, key: e.target.value.replace(/[^a-zA-Z0-9]/g, ""), _keyEdited: true } : x)))} /></div>
                    <div className="grid gap-1"><Label className="text-xs">Type</Label><select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={f.type} onChange={(e) => upd("type", e.target.value)}>{FIELD_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                    <div className="grid gap-1"><Label className="text-xs">Default</Label><Input value={f.default || ""} onChange={(e) => upd("default", e.target.value)} /></div>
                    <label className="flex items-center gap-1 pb-2 text-xs"><input type="checkbox" checked={!!f.required} onChange={(e) => upd("required", e.target.checked)} /> Required</label>
                    <label className={`flex items-center gap-1 pb-2 text-xs ${f.type === "money" ? "" : "invisible"}`}><input type="checkbox" checked={!!f.inPayTable} onChange={(e) => upd("inPayTable", e.target.checked)} /> In pay table</label>
                    <Button variant="ghost" size="icon" title="Remove" onClick={() => set("fields", current.fields.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                );
              })}
              <Button variant="outline" size="sm" onClick={() => set("fields", [...current.fields, { label: "", key: "", type: "text", required: false, default: "" }])}><Plus className="mr-1 h-4 w-4" /> Add detail</Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1"><Label>Letter title</Label><Input value={current.title} onChange={(e) => set("title", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Pay table heading</Label><Input value={current.payTitle} onChange={(e) => set("payTitle", e.target.value)} /></div>
          </div>
          <div className="grid gap-1"><Label>Opening paragraph</Label><Textarea rows={3} value={current.intro} onChange={(e) => set("intro", e.target.value)} /></div>

          <div>
            <p className="font-medium">Sections</p>
            <p className="mb-2 text-xs text-muted-foreground">Start a line with “- ” for a bullet. A section containing only {"{{payTable}}"}, {"{{keyResponsibilities}}"} or {"{{whatYoullGain}}"} shows that table or list.</p>
            <div className="space-y-3">
              {current.sections.map((sec, i) => (
                <div key={i} className="grid gap-2 rounded-md border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Input value={sec.heading} onChange={(e) => set("sections", current.sections.map((x, j) => (j === i ? { ...x, heading: e.target.value } : x)))} placeholder="Heading" />
                    <Button variant="ghost" size="icon" title="Move up" onClick={() => set("sections", move(current.sections, i, -1))}><ArrowUp className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Move down" onClick={() => set("sections", move(current.sections, i, 1))}><ArrowDown className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Remove" onClick={() => set("sections", current.sections.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <Textarea rows={4} value={sec.body} onChange={(e) => set("sections", current.sections.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => set("sections", [...current.sections, { heading: "", body: "" }])}><Plus className="mr-1 h-4 w-4" /> Add section</Button>
            </div>
          </div>

          <div className="grid gap-1"><Label>Terms & conditions (one per line)</Label><Textarea rows={5} value={(current.terms || []).join("\n")} onChange={(e) => set("terms", e.target.value.split("\n"))} /></div>
          <div className="grid gap-1"><Label>Closing (before the signatures)</Label><Textarea rows={3} value={current.closing} onChange={(e) => set("closing", e.target.value)} /></div>

          <div className="rounded-md bg-muted p-3 text-xs">
            <p className="mb-1 font-medium">Placeholders you can use</p>
            <p className="leading-6">{allKeys.map((k) => <code key={k} className="mr-1 rounded bg-background px-1.5 py-0.5">{`{{${k}}}`}</code>)}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={current.active !== false} onChange={(e) => set("active", e.target.checked)} /> In use (offered to HR on candidates)</label>
            <div className="flex gap-2">
              {current._id && <Button variant="outline" onClick={remove}><Trash2 className="mr-1 h-4 w-4" /> Delete</Button>}
              <Button onClick={save}>Save template</Button>
            </div>
          </div>
        </CardContent></Card>
      )}
    </div>
  );
};

export default OfferTemplatesSettings;
