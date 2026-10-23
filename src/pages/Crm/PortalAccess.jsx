import React, { useCallback, useEffect, useState } from "react";
import { KeyRound, Plus, Copy, Ban } from "lucide-react";
import { toast } from "sonner";
import CrmRoute from "@/components/crm/CrmRoute";
import PageHeader, { Pill } from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosInstance from "@/utils/axiosConfig";
import { day, errMsg } from "@/lib/publicApi";

const PortalAccess = () => {
  const [access, setAccess] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(null);
  const [link, setLink] = useState("");
  const load = useCallback(async () => {
    try {
      setAccess((await axiosInstance.get("/v1/portal-access")).data.access || []);
    } catch (err) {
      toast.error(errMsg(err, "Could not load"));
    }
  }, []);
  useEffect(() => {
    load();
    axiosInstance.get("/v1/time/options").then((r) => setClients(r.data.clients || [])).catch(() => {});
  }, [load]);
  const create = async () => {
    if (!form.clientId) return toast.error("Pick a client");
    try {
      const res = await axiosInstance.post("/v1/portal-access", form);
      setLink(res.data.url);
      await navigator.clipboard.writeText(res.data.url).catch(() => {});
      toast.success(form.sendEmail ? "Invite emailed and link copied" : "Link copied");
      setForm(null);
      load();
    } catch (err) {
      if (err.response?.data?.url) setLink(err.response.data.url);
      toast.error(errMsg(err));
    }
  };
  const revoke = async (a) => {
    if (!window.confirm(`Revoke ${a.clientName}'s link (…${a.tokenHint})? It stops working immediately.`)) return;
    await axiosInstance.post(`/v1/portal-access/${a._id}/revoke`).catch((e) => toast.error(errMsg(e)));
    load();
  };
  const status = (a) => (a.revoked ? ["Revoked", "bg-gray-100 text-gray-500"] : a.expiresAt && new Date(a.expiresAt) < new Date() ? ["Expired", "bg-amber-100 text-amber-800"] : ["Active", "bg-green-100 text-green-700"]);
  return (
    <CrmRoute>
      <div className="p-4 md:p-6 space-y-4">
        <PageHeader icon={KeyRound} title="Client portal" subtitle="Private links where clients see project progress, approve content, download files and pay invoices. No passwords to manage.">
          <Button onClick={() => setForm({ clientId: "", name: "", email: "", days: 180, sendEmail: true })} className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-1" /> Invite a client</Button>
        </PageHeader>
        {link && (
          <Card className="border-green-300">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-medium">Portal link (shown once - copy it now)</p>
              <div className="flex gap-2"><Input readOnly value={link} onFocus={(e) => e.target.select()} /><Button variant="outline" onClick={() => navigator.clipboard.writeText(link).then(() => toast.success("Copied"))}><Copy className="h-4 w-4" /></Button></div>
              <p className="text-xs text-gray-500">Anyone with this link can see the client's portal. Revoke it here if it's shared by mistake.</p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Person</TableHead><TableHead>Created</TableHead><TableHead>Last opened</TableHead><TableHead>Expires</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {access.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-500">No portal links yet.</TableCell></TableRow>}
                {access.map((a) => {
                  const [label, cls] = status(a);
                  return (
                    <TableRow key={a._id}>
                      <TableCell className="font-medium">{a.clientName}<div className="text-xs text-gray-400">…{a.tokenHint}</div></TableCell>
                      <TableCell className="text-sm">{a.name}<div className="text-xs text-gray-500">{a.email}</div></TableCell>
                      <TableCell className="text-sm">{day(a.createdAt)}<div className="text-xs text-gray-500">{a.createdBy}</div></TableCell>
                      <TableCell className="text-sm">{a.lastAccessAt ? `${day(a.lastAccessAt)} (${a.accessCount}×)` : "Never"}</TableCell>
                      <TableCell className="text-sm">{day(a.expiresAt)}</TableCell>
                      <TableCell><Pill className={cls}>{label}</Pill></TableCell>
                      <TableCell>{label === "Active" && <Button size="icon" variant="ghost" className="text-red-600" title="Revoke" onClick={() => revoke(a)}><Ban className="h-4 w-4" /></Button>}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Invite a client to the portal</DialogTitle><DialogDescription>They'll see projects, content waiting for approval, invoices and shared files.</DialogDescription></DialogHeader>
            {form && (
              <div className="grid gap-3">
                <div className="grid gap-1"><Label>Client</Label><Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}><SelectTrigger><SelectValue placeholder="Pick a client" /></SelectTrigger><SelectContent>{clients.map((c) => <SelectItem key={c._id} value={c._id}>{c.brandName}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Defaults to contact person" /></div>
                  <div className="grid gap-1"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Defaults to client email" /></div>
                </div>
                <div className="grid gap-1"><Label>Link works for (days)</Label><Input type="number" min="1" max="730" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} /></div>
                <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={form.sendEmail} onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })} /> Email the invite now</label>
                <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button onClick={create} className="bg-blue-600 hover:bg-blue-700">Create link</Button></div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </CrmRoute>
  );
};

export default PortalAccess;
