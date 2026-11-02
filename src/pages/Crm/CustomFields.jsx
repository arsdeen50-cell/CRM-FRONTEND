import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import CrmRoute from "@/components/crm/CrmRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { confirmDialog } from "@/components/ui/app-dialogs";
import axiosInstance from "@/utils/axiosConfig";

const TYPE_LABEL = { text: "Short text", long_text: "Long text", number: "Number", money: "Amount (₹)", date: "Date", select: "Dropdown", checkbox: "Yes / no", url: "Link" };
const ENTITIES = [["client", "Client fields", "Shown on each client's page."], ["lead", "Lead fields", "Shown when you edit a lead."]];
const select = "h-9 rounded-md border border-input bg-background px-2 text-sm";

const FieldRow = ({ f, first, last, onChange, onMove, onDelete }) => {
  const [d, setD] = useState({ label: f.label, help: f.help || "", options: (f.options || []).join(", ") });
  const dirty = d.label !== f.label || d.help !== (f.help || "") || d.options !== (f.options || []).join(", ");
  return (
    <div className={`grid gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_130px_auto] sm:items-start ${f.active ? "" : "opacity-60"}`}>
      <div className="grid gap-1">
        <Input value={d.label} onChange={(e) => setD({ ...d, label: e.target.value })} />
        <Input value={d.help} onChange={(e) => setD({ ...d, help: e.target.value })} placeholder="Hint shown under the field (optional)" className="h-8 text-xs" />
        {f.type === "select" && <Input value={d.options} onChange={(e) => setD({ ...d, options: e.target.value })} placeholder="Choices, separated by commas" className="h-8 text-xs" />}
        {dirty && <div><Button size="sm" onClick={() => onChange({ ...d })}>Save changes</Button></div>}
      </div>
      <p className="text-sm text-muted-foreground sm:pt-2">{TYPE_LABEL[f.type]}</p>
      <div className="flex items-center gap-1">
        <label className="mr-1 flex items-center gap-1 text-xs"><input type="checkbox" checked={f.active} onChange={(e) => onChange({ active: e.target.checked })} /> On</label>
        <Button variant="ghost" size="icon" title="Move up" disabled={first} onClick={() => onMove(-1)}><ArrowUp className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" title="Move down" disabled={last} onClick={() => onMove(1)}><ArrowDown className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" title="Delete" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

const NewField = ({ entity, onAdded }) => {
  const [f, setF] = useState({ label: "", type: "text", options: "" });
  const add = async () => {
    try {
      await axiosInstance.post("/v1/customfields", { ...f, entity });
      setF({ label: "", type: "text", options: "" });
      toast.success("Field added");
      onAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add the field");
    }
  };
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_150px_auto]">
      <Input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder={entity === "client" ? "e.g. Monthly ad budget" : "e.g. How they found us"} onKeyDown={(e) => e.key === "Enter" && add()} />
      <select className={select} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{Object.entries(TYPE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      <Button variant="outline" onClick={add} disabled={!f.label.trim()}><Plus className="mr-1 h-4 w-4" /> Add</Button>
      {f.type === "select" && <Input className="sm:col-span-3" value={f.options} onChange={(e) => setF({ ...f, options: e.target.value })} placeholder="Choices, separated by commas, e.g. Instagram, Referral, Walk-in" />}
    </div>
  );
};

/* Admin > Custom fields: extra details to track on clients and leads, without code. */
const CustomFields = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const load = useCallback(async () => {
    try {
      const r = await axiosInstance.get("/v1/customfields", { params: { all: 1 } });
      setFields(r.data.fields || []);
    } catch {
      toast.error("Could not load custom fields");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const update = async (f, patch) => {
    try {
      await axiosInstance.put(`/v1/customfields/${f._id}`, { ...f, ...patch, options: patch.options ?? f.options });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    }
  };
  const move = async (list, i, dir) => {
    const a = [...list];
    [a[i], a[i + dir]] = [a[i + dir], a[i]];
    await Promise.all(a.map((f, order) => (f.order !== order ? axiosInstance.put(`/v1/customfields/${f._id}`, { ...f, order }) : null)));
    load();
  };
  const remove = async (f) => {
    if (!(await confirmDialog(`Delete "${f.label}"? Values already filled in stay in the database but stop showing. Switching it off instead keeps it easy to bring back.`))) return;
    await axiosInstance.delete(`/v1/customfields/${f._id}`).catch(() => toast.error("Could not delete"));
    load();
  };

  return (
    <CrmRoute>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/crm")} title="Back to CRM"><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold md:text-2xl"><SlidersHorizontal className="h-6 w-6 text-brand" /> Custom fields</h1>
            <p className="text-sm text-muted-foreground">Track the extra details your agency cares about on clients and leads.</p>
          </div>
        </div>
        {ENTITIES.map(([entity, title, note]) => {
          const list = fields.filter((f) => f.entity === entity);
          return (
            <Card key={entity}><CardContent className="space-y-3 p-4">
              <div><p className="font-medium">{title}</p><p className="text-xs text-muted-foreground">{note}</p></div>
              {list.map((f, i) => <FieldRow key={f._id} f={f} first={i === 0} last={i === list.length - 1} onChange={(patch) => update(f, patch)} onMove={(dir) => move(list, i, dir)} onDelete={() => remove(f)} />)}
              {list.length === 0 && <p className="text-sm text-muted-foreground">No {entity} fields yet.</p>}
              <NewField entity={entity} onAdded={load} />
            </CardContent></Card>
          );
        })}
      </div>
    </CrmRoute>
  );
};

export default CustomFields;
