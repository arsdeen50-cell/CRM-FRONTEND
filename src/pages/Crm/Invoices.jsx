import React, { useCallback, useEffect, useState } from "react";
import { Receipt, Plus, Download, Send, Link2, IndianRupee, Edit, Ban, Trash2, CheckCheck, RefreshCw, BellRing } from "lucide-react";
import { toast } from "sonner";
import CrmRoute from "@/components/crm/CrmRoute";
import PageHeader, { Stat, Pill } from "@/components/crm/PageHeader";
import InvoiceEditor from "@/components/crm/InvoiceEditor";
import RowActions from "@/components/ui/row-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosInstance from "@/utils/axiosConfig";
import { money, day, errMsg } from "@/lib/publicApi";
import { downloadFile, toDateInput } from "@/lib/crmOutreach";
import { useIntegrations } from "@/hooks/useIntegrations";
import { confirmDialog, promptDialog } from "@/components/ui/app-dialogs";

const STATUS_STYLE = { Draft: "bg-slate-100 text-slate-700", Sent: "bg-blue-100 text-brand", "Partially Paid": "bg-amber-100 text-amber-800", Paid: "bg-green-100 text-green-700", Cancelled: "bg-gray-100 text-muted-foreground" };
const FILTERS = ["All", "Draft", "Unpaid", "Overdue", "Paid", "Cancelled"];

const PaymentDialog = ({ invoice, onOpenChange, onDone }) => {
  const [p, setP] = useState({ amount: "", method: "Bank transfer", reference: "", paidAt: toDateInput(new Date()) });
  useEffect(() => {
    if (invoice) setP({ amount: invoice.balance, method: "Bank transfer", reference: "", paidAt: toDateInput(new Date()) });
  }, [invoice]);
  if (!invoice) return null;
  const save = async () => {
    try {
      await axiosInstance.post(`/v1/invoice/${invoice._id}/payments`, { ...p, paidAt: new Date(`${p.paidAt}T12:00:00`).toISOString() });
      toast.success("Payment recorded");
      onDone();
      onOpenChange(false);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment · {invoice.invoiceNo}</DialogTitle>
          <DialogDescription>Balance due {money(invoice.balance)}. Razorpay payments are recorded automatically.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1"><Label>Amount (₹)</Label><Input type="number" value={p.amount} onChange={(e) => setP({ ...p, amount: e.target.value })} /></div>
            <div className="grid gap-1"><Label>Date</Label><Input type="date" value={p.paidAt} onChange={(e) => setP({ ...p, paidAt: e.target.value })} /></div>
          </div>
          <div className="grid gap-1">
            <Label>Method</Label>
            <Select value={p.method} onValueChange={(v) => setP({ ...p, method: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Bank transfer", "UPI", "Cheque", "Cash", "Other"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="grid gap-1"><Label>Reference (UTR / cheque no.)</Label><Input value={p.reference} onChange={(e) => setP({ ...p, reference: e.target.value })} /></div>
          {invoice.payments?.length > 0 && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Already received</p>
              {invoice.payments.map((x) => <p key={x._id}>{day(x.paidAt)} · {money(x.amount)} · {x.method} {x.reference}</p>)}
            </div>
          )}
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save} className="">Save payment</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Invoices = () => {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("All");
  const [clients, setClients] = useState([]);
  const [editing, setEditing] = useState(undefined);
  const [paying, setPaying] = useState(null);
  const [busy, setBusy] = useState("");
  const integrations = useIntegrations();
  const load = useCallback(async () => {
    try {
      setData((await axiosInstance.get("/v1/invoice")).data);
    } catch (err) {
      toast.error(errMsg(err, "Could not load invoices"));
    }
  }, []);
  useEffect(() => {
    load();
    axiosInstance.get("/v1/time/options").then((r) => setClients(r.data.clients || [])).catch(() => {});
  }, [load]);

  const act = async (inv, what) => {
    setBusy(inv._id + what);
    try {
      if (what === "pdf") {
        const res = await axiosInstance.get(`/v1/invoice/${inv._id}/pdf`, { responseType: "blob" });
        downloadFile(`${inv.invoiceNo}.pdf`, res.data);
      }
      if (what === "send") {
        const to = await promptDialog(`Email ${inv.invoiceNo} (PDF + pay link) to:`, inv.billingEmail || "");
        if (!to) return;
        await axiosInstance.post(`/v1/invoice/${inv._id}/send`, { to });
        toast.success(`Sent to ${to}`);
      }
      if (what === "remind") {
        await axiosInstance.post(`/v1/invoice/${inv._id}/send`, { reminder: true });
        toast.success("Reminder sent");
      }
      if (what === "link") {
        const res = integrations.razorpay?.configured ? await axiosInstance.post(`/v1/invoice/${inv._id}/payment-link`) : await axiosInstance.post(`/v1/invoice/${inv._id}/mark-sent`);
        const link = res.data.publicUrl;
        await navigator.clipboard.writeText(link).catch(() => {});
        toast.success("Invoice link copied", { description: `${link}${res.data.payUrl ? `\nPay: ${res.data.payUrl}` : ""}` });
      }
      if (what === "sent") {
        await axiosInstance.post(`/v1/invoice/${inv._id}/mark-sent`);
        toast.success("Marked as sent");
      }
      if (what === "cancel") {
        if (!await confirmDialog(`Cancel ${inv.invoiceNo}? The number is kept but it no longer counts as due.`)) return;
        await axiosInstance.post(`/v1/invoice/${inv._id}/cancel`);
      }
      if (what === "delete") {
        if (!await confirmDialog(`Delete draft ${inv.invoiceNo}?`)) return;
        await axiosInstance.delete(`/v1/invoice/${inv._id}`);
      }
      load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy("");
    }
  };

  const rows = (data?.invoices || []).filter((i) =>
    filter === "All" ? true : filter === "Unpaid" ? ["Sent", "Partially Paid"].includes(i.status) : filter === "Overdue" ? i.isOverdue : i.status === filter
  );
  const s = data?.summary || {};
  return (
    <CrmRoute>
      <div className="p-4 md:p-6 space-y-4">
        <PageHeader icon={Receipt} title="Invoices" subtitle="GST invoices with online payment links. Accepted proposals and retainers create them for you.">
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
          <Button onClick={() => setEditing(null)} className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" /> New invoice</Button>
        </PageHeader>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Outstanding" value={money(s.outstanding)} />
          <Stat label="Overdue" value={money(s.overdue)} tone={s.overdue ? "bad" : undefined} />
          <Stat label="Received this month" value={money(s.paidThisMonth)} tone="good" />
          <Stat label="Drafts to send" value={s.drafts ?? "–"} />
        </div>
        {!integrations.razorpay?.configured && <p className="text-xs text-muted-foreground">Razorpay isn't connected, so invoices show your bank / UPI details instead of a "Pay online" button (CRM → Integrations).</p>}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f}</Button>)}
        </div>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">{data ? "No invoices here." : "Loading..."}</TableCell></TableRow>}
                {rows.map((inv) => (
                  <TableRow key={inv._id}>
                    <TableCell className="font-medium whitespace-nowrap">{inv.invoiceNo}{inv.period && <div className="text-xs text-muted-foreground">{inv.period}</div>}</TableCell>
                    <TableCell>{inv.billingName || inv.clientName}<div className="text-xs text-muted-foreground">{inv.billingEmail}</div></TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{day(inv.issueDate)}</TableCell>
                    <TableCell className={`whitespace-nowrap text-sm ${inv.isOverdue ? "text-red-600 font-medium" : ""}`}>{day(inv.dueDate)}{inv.reminders?.length ? <div className="text-xs text-muted-foreground">{inv.reminders.length} reminder{inv.reminders.length > 1 ? "s" : ""}</div> : null}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{money(inv.total)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{inv.status === "Cancelled" ? "—" : money(inv.balance)}</TableCell>
                    <TableCell>
                      <Pill className={inv.isOverdue ? "bg-red-100 text-red-700" : STATUS_STYLE[inv.status]}>{inv.isOverdue ? "Overdue" : inv.status}</Pill>
                      {inv.viewedAt && <div className="text-xs text-muted-foreground mt-1">Viewed {day(inv.viewedAt)}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5 whitespace-nowrap">
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="Download PDF" onClick={() => act(inv, "pdf")}><Download className="h-4 w-4" /></Button>
                        {!["Paid", "Cancelled"].includes(inv.status) && <Button size="icon" variant="ghost" className="h-8 w-8" title="Record payment" onClick={() => setPaying(inv)}><IndianRupee className="h-4 w-4" /></Button>}
                        <RowActions
                          items={[
                            { label: "Email invoice + pay link", icon: Send, onClick: () => act(inv, "send"), hidden: ["Paid", "Cancelled"].includes(inv.status), disabled: busy === inv._id + "send" },
                            { label: "Copy invoice / pay link", icon: Link2, onClick: () => act(inv, "link"), hidden: ["Paid", "Cancelled"].includes(inv.status) },
                            { label: "Mark as sent", icon: CheckCheck, onClick: () => act(inv, "sent"), hidden: inv.status !== "Draft" },
                            { label: "Send payment reminder", icon: BellRing, onClick: () => act(inv, "remind"), hidden: ["Draft", "Paid", "Cancelled"].includes(inv.status) },
                            { label: "Edit", icon: Edit, onClick: () => setEditing(inv), hidden: ["Paid", "Cancelled"].includes(inv.status) },
                            "-",
                            { label: "Delete draft", icon: Trash2, onClick: () => act(inv, "delete"), danger: true, hidden: inv.status !== "Draft" },
                            { label: "Cancel invoice", icon: Ban, onClick: () => act(inv, "cancel"), danger: true, hidden: inv.status === "Draft" || ["Cancelled", "Paid"].includes(inv.status) || !!inv.amountPaid },
                          ]}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <InvoiceEditor open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)} invoice={editing} clients={clients} onSaved={load} />
        <PaymentDialog invoice={paying} onOpenChange={(o) => !o && setPaying(null)} onDone={load} />
      </div>
    </CrmRoute>
  );
};

export default Invoices;
