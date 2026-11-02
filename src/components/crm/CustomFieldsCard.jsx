import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ExternalLink, Pencil, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import axiosInstance from "@/utils/axiosConfig";

const show = (f, v) => {
  if (v === undefined || v === null || v === "") return <span className="text-muted-foreground">—</span>;
  if (f.type === "checkbox") return v ? "Yes" : "No";
  if (f.type === "money") return `₹${Number(v).toLocaleString("en-IN")}`;
  if (f.type === "number") return Number(v).toLocaleString("en-IN");
  if (f.type === "date") return new Date(`${v}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  if (f.type === "url") return <a href={v} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">Open <ExternalLink className="h-3 w-3" /></a>;
  return <span className="whitespace-pre-wrap">{String(v)}</span>;
};

const FieldInput = ({ f, value, onChange }) => {
  const cls = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";
  if (f.type === "long_text") return <Textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  if (f.type === "select") return <select className={cls} value={value ?? ""} onChange={(e) => onChange(e.target.value)}><option value="">—</option>{f.options.map((o) => <option key={o}>{o}</option>)}</select>;
  if (f.type === "checkbox") return <label className="flex h-9 items-center gap-2 text-sm"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> Yes</label>;
  const type = { number: "number", money: "number", date: "date", url: "url" }[f.type] || "text";
  return <Input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={f.type === "url" ? "https://" : f.type === "money" ? "Amount in ₹" : ""} />;
};

/* The admin-defined extra fields for a client or lead: read view, and an inline editor that saves on its own. */
const CustomFieldsCard = ({ entity, recordId, initial = {}, className = "" }) => {
  const { user } = useSelector((s) => s.auth);
  const [fields, setFields] = useState(null);
  const [values, setValues] = useState(initial || {});
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axiosInstance.get("/v1/customfields", { params: { entity } }).then((r) => setFields(r.data.fields || [])).catch(() => setFields([]));
  }, [entity]);
  useEffect(() => setValues(initial || {}), [initial]);

  if (!fields || !recordId) return null;
  if (!fields.length) {
    return user?.role === "admin" ? (
      <div className={`rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground ${className}`}>
        Need to track something else for {entity === "client" ? "clients" : "leads"} (budget, followers, renewal date...)? <Link to="/crm/custom-fields" className="text-brand hover:underline">Add custom fields</Link>
      </div>
    ) : null;
  }

  const save = async () => {
    try {
      setSaving(true);
      const r = await axiosInstance.put(`/v1/customfields/values/${entity}/${recordId}`, { values: draft });
      setValues(r.data.custom || {});
      setDraft(null);
      toast.success("Saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`space-y-2 rounded-md border border-border p-3 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium"><SlidersHorizontal className="h-4 w-4 text-brand" /> More details</p>
        {!draft && <Button type="button" variant="ghost" size="sm" onClick={() => setDraft({ ...values })}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>}
      </div>
      {draft ? (
        <div className="grid gap-2">
          {fields.map((f) => (
            <div key={f._id} className="grid gap-1">
              <span className="text-xs text-muted-foreground">{f.label}</span>
              <FieldInput f={f} value={draft[f.key]} onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))} />
              {f.help && <span className="text-[11px] text-muted-foreground">{f.help}</span>}
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDraft(null)}>Cancel</Button>
            <Button type="button" size="sm" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          {fields.map((f) => (
            <div key={f._id} className="contents">
              <dt className="text-muted-foreground">{f.label}</dt>
              <dd className="min-w-0 break-words">{show(f, values?.[f.key])}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};

export default CustomFieldsCard;
