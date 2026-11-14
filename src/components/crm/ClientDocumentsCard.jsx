import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileSignature, FileText, Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { confirmDialog } from "@/components/ui/app-dialogs";
import axiosInstance from "@/utils/axiosConfig";
import { downloadFile } from "@/lib/crmOutreach";
import { downloadProposalPdf } from "@/pages/Crm/Proposals";

const ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp";
const size = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const day = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");
const blank = { title: "", type: "Agreement", signedOn: "", validUntil: "", note: "" };

/* Client page: signed agreements, NDAs, POs and briefs. Files are stored privately on the CRM server and download
   only for logged-in team members. Proposals the client accepted online are listed too - they are signed agreements. */
const ClientDocumentsCard = ({ clientId, canDeleteAll, userId, onChange }) => {
  const [data, setData] = useState(null);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const input = useRef(null);

  const load = useCallback(() => {
    axiosInstance.get(`/v1/leadclient/${clientId}/documents`).then((r) => setData(r.data)).catch(() => setData({ documents: [], signedProposals: [], types: [], maxMb: 25 }));
  }, [clientId]);
  useEffect(load, [load]);

  const pick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (data?.maxMb && f.size > data.maxMb * 1048576) return toast.error(`Files can be up to ${data.maxMb} MB`);
    setFile(f);
    setForm({ ...blank, title: f.name.replace(/\.[^.]+$/, "") });
  };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const body = new FormData();
      body.append("file", file);
      Object.entries(form).forEach(([k, v]) => body.append(k, v));
      await axiosInstance.post(`/v1/leadclient/${clientId}/documents`, body);
      toast.success("Document uploaded");
      setFile(null);
      load();
      onChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  };
  const download = async (d) => {
    try {
      const r = await axiosInstance.get(`/v1/leadclient/${clientId}/documents/${d._id}/file`, { responseType: "blob" });
      downloadFile(d.fileName, r.data);
    } catch {
      toast.error("Could not download the file");
    }
  };
  const remove = async (d) => {
    if (!(await confirmDialog(`Delete "${d.title}"? The file is removed from the CRM and can't be recovered.`))) return;
    try {
      await axiosInstance.delete(`/v1/leadclient/${clientId}/documents/${d._id}`);
      toast.success("Document deleted");
      load();
      onChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    }
  };

  const docs = data?.documents || [];
  const signed = data?.signedProposals || [];
  return (
    <Card>
      <CardContent className="space-y-3 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-medium"><Paperclip className="h-4 w-4 text-brand" /> Documents</p>
          <Button size="sm" variant="outline" onClick={() => input.current?.click()}><Upload className="mr-1 h-4 w-4" /> Upload</Button>
          <input ref={input} type="file" accept={ACCEPT} className="hidden" onChange={pick} />
        </div>
        {!data && <p className="text-xs text-muted-foreground">Loading...</p>}
        {data && !docs.length && !signed.length && <p className="text-xs text-muted-foreground">No documents yet. Upload signed agreements, NDAs or POs here. Only your team can open them.</p>}
        {signed.map((p) => (
          <div key={p._id} className="flex items-start gap-2 text-sm">
            <FileSignature className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">Proposal {p.proposalNo}: {p.title}</p>
              <p className="text-xs text-muted-foreground">Accepted {day(p.acceptedAt)}{p.signedBy ? ` · signed online by ${p.signedBy}` : ""}</p>
            </div>
            <Button size="icon" variant="ghost" className="h-7 w-7" title="Download PDF" onClick={() => downloadProposalPdf(p)}><Download className="h-4 w-4" /></Button>
          </div>
        ))}
        {docs.map((d) => (
          <div key={d._id} className="flex items-start gap-2 text-sm">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium" title={d.fileName}>{d.title}</p>
              <p className="text-xs text-muted-foreground">
                {[d.type, d.signedOn && `signed ${day(d.signedOn)}`, d.validUntil && `valid until ${day(d.validUntil)}`, size(d.size)].filter(Boolean).join(" · ")}
              </p>
              {d.note && <p className="whitespace-pre-wrap text-xs text-muted-foreground">{d.note}</p>}
              <p className="text-xs text-muted-foreground">Uploaded by {d.uploadedBy || "someone"} · {day(d.createdAt)}</p>
            </div>
            <Button size="icon" variant="ghost" className="h-7 w-7" title="Download" onClick={() => download(d)}><Download className="h-4 w-4" /></Button>
            {(canDeleteAll || String(d.uploadedById) === String(userId)) && (
              <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-destructive" title="Delete" onClick={() => remove(d)}><Trash2 className="h-4 w-4" /></Button>
            )}
          </div>
        ))}
      </CardContent>

      <Dialog open={!!file} onOpenChange={(o) => !o && !saving && setFile(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Upload document</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <p className="truncate text-sm text-muted-foreground">{file?.name} · {file && size(file.size)}</p>
            <div className="grid gap-1"><Label>Title</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
            <div className="grid gap-1">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(data?.types || ["Agreement"]).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1"><Label>Signed on</Label><Input type="date" value={form.signedOn} onChange={(e) => set("signedOn", e.target.value)} /></div>
              <div className="grid gap-1"><Label>Valid until</Label><Input type="date" value={form.validUntil} onChange={(e) => set("validUntil", e.target.value)} /></div>
            </div>
            <div className="grid gap-1"><Label>Note (optional)</Label><Textarea rows={2} value={form.note} onChange={(e) => set("note", e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFile(null)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.title.trim()}>{saving ? "Uploading..." : "Upload"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ClientDocumentsCard;
