import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/hooks/Pipelineconstants";
import axiosInstance from "@/utils/axiosConfig";
import { toDateInput } from "@/lib/crmOutreach";

const DEFAULT_TERMS =
  "50% advance to start, balance on delivery. Prices exclude third-party costs (ad spend, stock assets, paid tools). " +
  "Two rounds of revisions per deliverable. Valid for 30 days from the proposal date.";

/* Create (pass `lead`) or edit (pass `proposal`) a proposal. Totals mirror the server's calculation. */
const ProposalEditor = ({ open, onOpenChange, lead, proposal, onSaved }) => {
  const editing = !!proposal;
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (proposal) {
      setForm({ ...proposal, validUntil: toDateInput(proposal.validUntil) });
    } else if (lead) {
      const brand = lead.clientId?.brandName || lead.clientName || "client";
      setForm({
        title: `${(lead.serviceType || []).join(" + ") || "Marketing"} proposal for ${brand}`,
        intro: "",
        items: (lead.serviceType || ["Social Media Marketing"]).map((service) => ({ service, description: "", quantity: 1, unit: "month", rate: 0 })),
        discount: 0,
        taxPercent: 18,
        validUntil: toDateInput(new Date(Date.now() + 30 * 86400000)),
        terms: DEFAULT_TERMS,
      });
    }
  }, [open, proposal, lead]);

  const totals = useMemo(() => {
    if (!form) return { subtotal: 0, tax: 0, total: 0 };
    const subtotal = form.items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.rate) || 0), 0);
    const taxable = Math.max(0, subtotal - (Number(form.discount) || 0));
    const tax = Math.round(taxable * (Number(form.taxPercent) || 0)) / 100;
    return { subtotal, tax, total: taxable + tax };
  }, [form]);

  if (!form) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setItem = (i, k, v) => setForm((f) => ({ ...f, items: f.items.map((it, j) => (j === i ? { ...it, [k]: v } : it)) }));

  const save = async () => {
    if (!form.title?.trim()) return toast.error("Add a title");
    if (!form.items.length || form.items.some((it) => !it.service?.trim())) return toast.error("Every line needs a service name");
    setSaving(true);
    const payload = {
      title: form.title,
      intro: form.intro,
      items: form.items.map((it) => ({ ...it, quantity: Number(it.quantity) || 0, rate: Number(it.rate) || 0 })),
      discount: Number(form.discount) || 0,
      taxPercent: Number(form.taxPercent) || 0,
      validUntil: form.validUntil ? new Date(`${form.validUntil}T23:59:00`).toISOString() : undefined,
      terms: form.terms,
    };
    try {
      const res = editing
        ? await axiosInstance.put(`/v1/proposal/${proposal._id}`, payload)
        : await axiosInstance.post("/v1/proposal", { ...payload, leadId: lead._id });
      toast.success(editing ? "Proposal saved" : `Proposal ${res.data.proposal.proposalNo} created`);
      onSaved?.(res.data.proposal);
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save proposal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${proposal.proposalNo}` : "New proposal"}</DialogTitle>
          <DialogDescription>{editing ? proposal.clientName : lead?.clientId?.brandName || lead?.clientName}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label>Introduction (optional)</Label>
            <Textarea rows={3} value={form.intro} onChange={(e) => set("intro", e.target.value)} placeholder="What you'll deliver and why it fits this client." />
          </div>

          <div className="grid gap-2">
            <Label>Line items</Label>
            {form.items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start border rounded-md p-2">
                <Input className="col-span-12 sm:col-span-4" placeholder="Service" value={it.service} onChange={(e) => setItem(i, "service", e.target.value)} />
                <Input className="col-span-12 sm:col-span-8" placeholder="Description (e.g. 12 reels + 8 posts per month)" value={it.description} onChange={(e) => setItem(i, "description", e.target.value)} />
                <Input className="col-span-3 sm:col-span-2" type="number" min="0" placeholder="Qty" value={it.quantity} onChange={(e) => setItem(i, "quantity", e.target.value)} />
                <Input className="col-span-3 sm:col-span-2" placeholder="Unit" value={it.unit} onChange={(e) => setItem(i, "unit", e.target.value)} />
                <Input className="col-span-4 sm:col-span-3" type="number" min="0" placeholder="Rate (₹)" value={it.rate} onChange={(e) => setItem(i, "rate", e.target.value)} />
                <div className="col-span-2 sm:col-span-5 flex items-center justify-end gap-2 text-sm">
                  <span className="text-gray-600">{formatCurrency((Number(it.quantity) || 0) * (Number(it.rate) || 0))}</span>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => set("items", form.items.filter((_, j) => j !== i))} title="Remove line">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => set("items", [...form.items, { service: "", description: "", quantity: 1, unit: "", rate: 0 }])}>
              <Plus className="h-4 w-4 mr-1" /> Add line
            </Button>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label>Discount (₹)</Label>
              <Input type="number" min="0" value={form.discount} onChange={(e) => set("discount", e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>GST %</Label>
              <Input type="number" min="0" max="100" value={form.taxPercent} onChange={(e) => set("taxPercent", e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Valid until</Label>
              <Input type="date" value={form.validUntil} onChange={(e) => set("validUntil", e.target.value)} />
            </div>
          </div>

          <div className="text-sm bg-gray-50 dark:bg-slate-800 rounded-md p-3 grid gap-1 sm:w-72 sm:ml-auto">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
            {Number(form.discount) > 0 && <div className="flex justify-between"><span>Discount</span><span>- {formatCurrency(form.discount)}</span></div>}
            <div className="flex justify-between"><span>GST ({form.taxPercent || 0}%)</span><span>{formatCurrency(totals.tax)}</span></div>
            <div className="flex justify-between font-semibold border-t pt-1"><span>Total</span><span>{formatCurrency(totals.total)}</span></div>
          </div>

          <div className="grid gap-1">
            <Label>Terms</Label>
            <Textarea rows={3} value={form.terms} onChange={(e) => set("terms", e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? "Saving..." : "Save proposal"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProposalEditor;
