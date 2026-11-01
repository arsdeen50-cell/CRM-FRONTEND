import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Eye, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import axiosInstance from "@/utils/axiosConfig";

// The template that best fits the candidate: same designation, else same position type, else the first
const suggest = (templates, designation, positionType) => {
  const d = String(designation || "").trim().toLowerCase();
  return (
    templates.find((t) => d && (t.designations || []).some((x) => x.toLowerCase() === d)) ||
    templates.find((t) => t.positionType === positionType) ||
    templates[0]
  );
};

/* On a candidate's onboarding record: choose the offer-letter template for their role, fill in what it needs
   (stipend or salary, probation ...), save, and preview. Approving the candidate sends this letter. */
const OfferLetterPanel = ({ onboardingId, designation, positionType, initialTemplateId, initialFields, locked, onPreview, previewing }) => {
  const [templates, setTemplates] = useState(null);
  const [templateId, setTemplateId] = useState("");
  const [values, setValues] = useState({});
  const [missing, setMissing] = useState([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    axiosInstance
      .get("/v1/onboarding/offer-templates")
      .then((r) => setTemplates((r.data.templates || []).filter((t) => t.active !== false)))
      .catch(() => setTemplates([]));
  }, []);
  // Start from what's saved, else the best match for this role
  useEffect(() => {
    if (!templates) return;
    const saved = initialTemplateId && templates.find((t) => String(t._id) === String(initialTemplateId));
    const t = saved || suggest(templates, designation, positionType);
    if (t) {
      setTemplateId(String(t._id));
      setValues(saved ? { ...(initialFields || {}) } : {});
      setDirty(!saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates, initialTemplateId]);

  const template = useMemo(() => (templates || []).find((t) => String(t._id) === templateId), [templates, templateId]);
  const set = (k, v) => {
    setValues((x) => ({ ...x, [k]: v }));
    setDirty(true);
  };
  const valueOf = (f) => values[f.key] ?? f.default ?? "";
  const payTotal = (template?.fields || []).filter((f) => f.type === "money" && f.inPayTable).reduce((sum, f) => sum + (Number(valueOf(f)) || 0), 0);

  const save = async () => {
    try {
      setSaving(true);
      const offerFields = Object.fromEntries((template?.fields || []).map((f) => [f.key, valueOf(f)]));
      const r = await axiosInstance.put(`/v1/onboarding/${onboardingId}/offer`, { offerTemplateId: templateId, offerFields });
      setMissing(r.data.missing || []);
      setDirty(false);
      if (r.data.missing?.length) toast.warning(`Saved. Still needed before sending: ${r.data.missing.join(", ")}`);
      else toast.success("Offer letter details saved");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the offer details");
      return false;
    } finally {
      setSaving(false);
    }
  };
  const saveAndPreview = async () => {
    if (await save()) onPreview?.();
  };

  if (!templates) return <p className="text-sm text-muted-foreground">Loading offer letter templates...</p>;

  return (
    <div className="mt-6 space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4 text-brand" /> Offer letter</h4>
          <p className="text-sm text-muted-foreground">Pick the letter for this role and fill in its details. Approving the candidate sends it.</p>
        </div>
        <Link to="/hr/settings?tab=offers" className="text-xs text-brand hover:underline">Edit templates</Link>
      </div>
      {locked && <p className="rounded-md bg-muted px-3 py-2 text-sm">The offer letter has been sent; these details can't change any more.</p>}

      <div className="grid gap-1">
        <Label>Template</Label>
        <select disabled={locked} className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={templateId} onChange={(e) => { setTemplateId(e.target.value); setDirty(true); }}>
          {templates.map((t) => <option key={t._id} value={t._id}>{t.name}{t.positionType && t.positionType !== "Any" ? ` (${t.positionType})` : ""}</option>)}
        </select>
      </div>

      {template && (
        <div className="grid gap-3 sm:grid-cols-2">
          {template.fields.map((f) => (
            <div key={f.key} className={`grid gap-1 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
              <Label>{f.label}{f.required && <span className="text-destructive"> *</span>}</Label>
              {f.type === "textarea" ? (
                <Textarea disabled={locked} rows={3} value={valueOf(f)} onChange={(e) => set(f.key, e.target.value)} placeholder="One per line; start a line with - for a bullet" />
              ) : (
                <Input disabled={locked} type={f.type === "date" ? "date" : ["money", "number"].includes(f.type) ? "number" : "text"} min={["money", "number"].includes(f.type) ? 0 : undefined} value={valueOf(f)} onChange={(e) => set(f.key, e.target.value)} placeholder={f.type === "money" ? "Amount in ₹" : ""} />
              )}
            </div>
          ))}
          {template.fields.length === 0 && <p className="text-sm text-muted-foreground">This template needs no extra details.</p>}
        </div>
      )}
      {template?.payTotalLabel && (
        <p className="text-sm">
          {template.payTotalLabel}: <span className="font-semibold">₹{payTotal.toLocaleString("en-IN")}</span>
          <span className="text-muted-foreground"> (₹{(payTotal * 12).toLocaleString("en-IN")} a year)</span>
        </p>
      )}

      {missing.length > 0 && !dirty && <p className="text-sm text-destructive">Still needed before approving: {missing.join(", ")}</p>}
      {!locked && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={save} disabled={saving || !templateId}><Save className="mr-1 h-4 w-4" /> {saving ? "Saving..." : "Save details"}</Button>
          <Button type="button" onClick={saveAndPreview} disabled={saving || previewing || !templateId}><Eye className="mr-1 h-4 w-4" /> {previewing ? "Generating..." : "Save & preview"}</Button>
        </div>
      )}
      {locked && <div className="flex justify-end"><Button type="button" variant="outline" onClick={onPreview} disabled={previewing}><Eye className="mr-1 h-4 w-4" /> {previewing ? "Generating..." : "View letter"}</Button></div>}
    </div>
  );
};

export default OfferLetterPanel;
