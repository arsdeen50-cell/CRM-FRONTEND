import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosInstance from "@/utils/axiosConfig";
import { money, errMsg } from "@/lib/publicApi";
import { toDateInput } from "@/lib/crmOutreach";

const blankItem = { service: "", description: "", hsnSac: "998361", quantity: 1, unit: "", rate: 0 };

/* Create or edit an invoice. Totals (incl. CGST/SGST or IGST) mirror the server. */
const InvoiceEditor = ({ open, onOpenChange, invoice, clients = [], onSaved }) => {
  const [f, setF] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!open) return;
    setF(
      invoice
        ? { ...invoice, issueDate: toDateInput(invoice.issueDate), dueDate: toDateInput(invoice.dueDate) }
        : { clientId: "", billingName: "", billingEmail: "", billingAddress: "", clientGstin: "", placeOfSupply: "Maharashtra", interState: false, items: [{ ...blankItem }], discount: 0, taxPercent: 18, issueDate: toDateInput(new Date()), dueDate: toDateInput(new Date(Date.now() + 7 * 86400000)), notes: "", terms: "" }
    );
  }, [open, invoice]);
  const totals = useMemo(() => {
    if (!f) return {};
    const subtotal = f.items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.rate) || 0), 0);
    const taxable = Math.max(0, subtotal - (Number(f.discount) || 0));
    const tax = Math.round(taxable * (Number(f.taxPercent) || 0)) / 100;
    return { subtotal, taxable, tax, total: taxable + tax };
  }, [f]);
  if (!f) return null;
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const setItem = (i, k, v) => setF((x) => ({ ...x, items: x.items.map((it, j) => (j === i ? { ...it, [k]: v } : it)) }));
  const save = async () => {
    if (!invoice && !f.clientId) return toast.error("Pick a client");
    if (!f.items.length || f.items.some((i) => !i.service?.trim())) return toast.error("Every line needs a description");
    setSaving(true);
    const payload = {
      ...(invoice ? {} : { clientId: f.clientId }),
      billingName: f.billingName,
      billingEmail: f.billingEmail,
      billingAddress: f.billingAddress,
      clientGstin: f.clientGstin,
      placeOfSupply: f.placeOfSupply,
      interState: !!f.interState,
      items: f.items.map((it) => ({ ...it, quantity: Number(it.quantity) || 0, rate: Number(it.rate) || 0 })),
      discount: Number(f.discount) || 0,
      taxPercent: Number(f.taxPercent) || 0,
      issueDate: f.issueDate ? new Date(`${f.issueDate}T10:00:00`).toISOString() : undefined,
      dueDate: f.dueDate ? new Date(`${f.dueDate}T23:59:00`).toISOString() : undefined,
      notes: f.notes,
      terms: f.terms,
    };
    try {
      const res = invoice ? await axiosInstance.put(`/v1/invoice/${invoice._id}`, payload) : await axiosInstance.post("/v1/invoice", payload);
      toast.success(invoice ? "Invoice saved" : `Draft ${res.data.invoice.invoiceNo} created`);
      onSaved?.(res.data.invoice);
      onOpenChange(false);
    } catch (err) {
      toast.error(errMsg(err, "Could not save invoice"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? `Edit ${invoice.invoiceNo}` : "New invoice"}</DialogTitle>
          <DialogDescription>GST is split into CGST + SGST for clients in Maharashtra, or charged as IGST for other states.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {!invoice && (
            <div className="grid gap-1">
              <Label>Client</Label>
              <Select value={f.clientId} onValueChange={(v) => set("clientId", v)}>
                <SelectTrigger><SelectValue placeholder="Pick a client" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c._id} value={c._id}>{c.brandName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1"><Label>Bill to (legal name)</Label><Input value={f.billingName} onChange={(e) => set("billingName", e.target.value)} placeholder="Defaults to the brand name" /></div>
            <div className="grid gap-1"><Label>Billing email</Label><Input value={f.billingEmail} onChange={(e) => set("billingEmail", e.target.value)} placeholder="Defaults to the client's email" /></div>
            <div className="grid gap-1"><Label>Client GSTIN</Label><Input value={f.clientGstin} onChange={(e) => set("clientGstin", e.target.value.toUpperCase())} /></div>
            <div className="grid gap-1"><Label>Place of supply</Label><Input value={f.placeOfSupply} onChange={(e) => set("placeOfSupply", e.target.value)} /></div>
          </div>
          <div className="grid gap-1"><Label>Billing address</Label><Textarea rows={2} value={f.billingAddress} onChange={(e) => set("billingAddress", e.target.value)} /></div>
          <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={!!f.interState} onChange={(e) => set("interState", e.target.checked)} /> Client is outside Maharashtra (charge IGST)</label>
          <div className="grid gap-2">
            <Label>Line items</Label>
            {f.items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 border rounded-md p-2">
                <Input className="col-span-12 sm:col-span-5" placeholder="Description" value={it.service} onChange={(e) => setItem(i, "service", e.target.value)} />
                <Input className="col-span-12 sm:col-span-7" placeholder="Details (optional)" value={it.description} onChange={(e) => setItem(i, "description", e.target.value)} />
                <Input className="col-span-3 sm:col-span-2" placeholder="SAC" value={it.hsnSac} onChange={(e) => setItem(i, "hsnSac", e.target.value)} />
                <Input className="col-span-3 sm:col-span-2" type="number" min="0" placeholder="Qty" value={it.quantity} onChange={(e) => setItem(i, "quantity", e.target.value)} />
                <Input className="col-span-3 sm:col-span-2" placeholder="Unit" value={it.unit} onChange={(e) => setItem(i, "unit", e.target.value)} />
                <Input className="col-span-3 sm:col-span-3" type="number" min="0" placeholder="Rate (₹)" value={it.rate} onChange={(e) => setItem(i, "rate", e.target.value)} />
                <div className="col-span-12 sm:col-span-3 flex items-center justify-end gap-2 text-sm">
                  {money((Number(it.quantity) || 0) * (Number(it.rate) || 0))}
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => set("items", f.items.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-fit" onClick={() => set("items", [...f.items, { ...blankItem }])}><Plus className="h-4 w-4 mr-1" /> Add line</Button>
          </div>
          <div className="grid sm:grid-cols-4 gap-3">
            <div className="grid gap-1"><Label>Discount (₹)</Label><Input type="number" min="0" value={f.discount} onChange={(e) => set("discount", e.target.value)} /></div>
            <div className="grid gap-1"><Label>GST %</Label><Input type="number" min="0" max="100" value={f.taxPercent} onChange={(e) => set("taxPercent", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Invoice date</Label><Input type="date" value={f.issueDate} onChange={(e) => set("issueDate", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Due date</Label><Input type="date" value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} /></div>
          </div>
          <div className="text-sm bg-muted/60 rounded-md p-3 grid gap-1 sm:w-72 sm:ml-auto">
            <div className="flex justify-between"><span>Taxable value</span><span>{money(totals.taxable)}</span></div>
            {f.interState ? (
              <div className="flex justify-between"><span>IGST {f.taxPercent}%</span><span>{money(totals.tax)}</span></div>
            ) : (
              <>
                <div className="flex justify-between"><span>CGST {f.taxPercent / 2}%</span><span>{money(totals.tax / 2)}</span></div>
                <div className="flex justify-between"><span>SGST {f.taxPercent / 2}%</span><span>{money(totals.tax / 2)}</span></div>
              </>
            )}
            <div className="flex justify-between font-semibold border-t pt-1"><span>Total</span><span>{money(totals.total)}</span></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1"><Label>Notes</Label><Textarea rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></div>
            <div className="grid gap-1"><Label>Terms</Label><Textarea rows={2} value={f.terms} onChange={(e) => set("terms", e.target.value)} placeholder="Defaults to your standard payment terms" /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="">{saving ? "Saving..." : "Save invoice"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceEditor;
