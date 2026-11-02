import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Check, Paperclip, Plus, ReceiptIndianRupee, Trash2, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { confirmDialog } from "@/components/ui/app-dialogs";
import axiosInstance from "@/utils/axiosConfig";
import { HrHeader, MonthPicker, fmtDate, inr, thisMonth, toInput } from "./hrShared";

const STATUS_STYLE = {
  Submitted: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  Approved: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  Paid: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
};
const StatusPill = ({ status }) => <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[status] || ""}`}>{status === "Submitted" ? "Waiting" : status}</span>;

const NewClaimDialog = ({ categories, onClose, onSaved }) => {
  const [f, setF] = useState({ date: toInput(new Date()), category: categories[0] || "Other", amount: "", description: "", client: "" });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!file) return toast.error("Attach the receipt or bill");
    const body = new FormData();
    Object.entries({ ...f, date: `${f.date}T12:00:00` }).forEach(([k, v]) => body.append(k, v));
    body.append("file", file);
    try {
      setSaving(true);
      await axiosInstance.post("/v1/hr/expenses", body);
      toast.success("Claim submitted");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit the claim");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New expense claim</DialogTitle>
          <DialogDescription>Something you paid for the company. An admin approves it and marks it paid when you're reimbursed.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1"><Label>Date spent</Label><Input type="date" value={f.date} max={toInput(new Date())} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
            <div className="grid gap-1"><Label>Amount (₹)</Label><Input type="number" min="1" inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
          </div>
          <div className="grid gap-1">
            <Label>Category</Label>
            <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="grid gap-1"><Label>What was it for?</Label><Textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="e.g. Cab to the client shoot" /></div>
          <div className="grid gap-1"><Label>Client or project (optional)</Label><Input value={f.client} onChange={(e) => setF({ ...f, client: e.target.value })} /></div>
          <div className="grid gap-1">
            <Label>Receipt or bill</Label>
            <Input type="file" accept="image/*,application/pdf" capture="environment" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-xs text-muted-foreground">A photo or PDF, up to 10 MB.</p>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? "Submitting..." : "Submit claim"}</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PayDialog = ({ claim, methods, onClose, onSaved }) => {
  const [method, setMethod] = useState(methods[0] || "Bank transfer");
  const [reference, setReference] = useState("");
  const save = async () => {
    try {
      await axiosInstance.post(`/v1/hr/expenses/${claim._id}/paid`, { method, reference });
      toast.success("Marked paid");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not mark it paid");
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Mark {inr(claim.amount)} paid</DialogTitle><DialogDescription>To {claim.employeeName}</DialogDescription></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1"><Label>Paid by</Label><select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>{methods.map((m) => <option key={m}>{m}</option>)}</select></div>
          <div className="grid gap-1"><Label>Reference (optional)</Label><Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="UTR / transaction ID" /></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Mark paid</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* People > Expenses: claim back money spent for the company. Everyone sees their own claims; admins also
   see everyone's, approve or reject them, and mark them paid. */
const Expenses = () => {
  const { user } = useSelector((s) => s.auth);
  const admin = user?.role === "admin";
  const [view, setView] = useState(admin ? "all" : "mine");
  const [status, setStatus] = useState(admin ? "Submitted" : "");
  const [month, setMonth] = useState("");
  const [data, setData] = useState({ expenses: [], totals: {}, categories: [], paymentMethods: [] });
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await axiosInstance.get("/v1/hr/expenses", { params: { mine: view === "mine" ? 1 : undefined, status: status || undefined, month: month || undefined } });
      setData(r.data);
    } catch {
      toast.error("Could not load expense claims");
    }
  }, [view, status, month]);
  useEffect(() => {
    load();
  }, [load]);

  const openReceipt = async (e) => {
    const tab = window.open("", "_blank");
    try {
      const r = await axiosInstance.get(`/v1/hr/expenses/${e._id}/receipt`, { responseType: "blob" });
      const url = URL.createObjectURL(r.data);
      if (tab) tab.location.href = url;
      else window.location.assign(url);
    } catch {
      tab?.close();
      toast.error("Could not open the receipt");
    }
  };
  const decide = async (e, decision) => {
    let note = "";
    if (decision === "Rejected") {
      note = window.prompt(`Why is ${e.employeeName}'s ${inr(e.amount)} claim rejected? They will see this.`) || "";
      if (!note.trim()) return;
    }
    try {
      await axiosInstance.post(`/v1/hr/expenses/${e._id}/decide`, { decision, note });
      toast.success(decision === "Approved" ? "Approved" : "Rejected");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    }
  };
  const remove = async (e) => {
    if (!(await confirmDialog(`Withdraw the ${inr(e.amount)} claim for "${e.description}"?`))) return;
    try {
      await axiosInstance.delete(`/v1/hr/expenses/${e._id}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not withdraw");
    }
  };

  const t = data.totals || {};
  const tiles = [["Waiting", t.Submitted], ["Approved, to pay", t.Approved], ["Paid", t.Paid]];
  const showWho = admin && view === "all";

  return (
    <div className="space-y-4">
      <HrHeader icon={ReceiptIndianRupee} title="Expenses" subtitle="Claim back what you spend for the company: add the receipt, get it approved, get paid." back="/">
        <Button onClick={() => setCreating(true)}><Plus className="mr-1 h-4 w-4" /> New claim</Button>
      </HrHeader>

      <div className="flex flex-wrap items-center gap-2">
        {admin && (
          <div className="flex rounded-md border border-border p-0.5 text-sm">
            {[["all", "Everyone"], ["mine", "Mine"]].map(([v, l]) => <button key={v} onClick={() => setView(v)} className={`rounded px-3 py-1 ${view === v ? "bg-accent font-medium" : "text-muted-foreground"}`}>{l}</button>)}
          </div>
        )}
        <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Submitted">Waiting for approval</option>
          <option value="Approved">Approved, to pay</option>
          <option value="Paid">Paid</option>
          <option value="Rejected">Rejected</option>
        </select>
        {month ? (
          <div className="flex items-center gap-1"><MonthPicker month={month} onChange={setMonth} /><Button variant="ghost" size="sm" onClick={() => setMonth("")}>All months</Button></div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setMonth(thisMonth())}>Filter by month</Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {tiles.map(([label, n]) => (
          <Card key={label}><CardContent className="p-3 md:p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold md:text-2xl">{inr(n)}</p></CardContent></Card>
        ))}
      </div>

      <Card><CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead>{showWho && <TableHead>Person</TableHead>}<TableHead>What for</TableHead><TableHead className="hidden text-right sm:table-cell">Amount</TableHead><TableHead className="hidden sm:table-cell">Status</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {data.expenses.length === 0 && <TableRow><TableCell colSpan={showWho ? 6 : 5} className="py-10 text-center text-muted-foreground">{status === "Submitted" && admin ? "Nothing waiting for approval." : "No expense claims here yet."}</TableCell></TableRow>}
            {data.expenses.map((e) => (
              <TableRow key={e._id}>
                <TableCell className="whitespace-nowrap max-sm:align-top max-sm:text-xs">{fmtDate(e.date)}</TableCell>
                {showWho && <TableCell className="whitespace-nowrap font-medium">{e.employeeName}</TableCell>}
                <TableCell className="sm:min-w-[200px]">
                  <p>{e.description}</p>
                  <p className="flex items-center gap-2 py-0.5 sm:hidden"><span className="font-semibold">{inr(e.amount)}</span><StatusPill status={e.status} /></p>
                  <p className="text-xs text-muted-foreground">{e.category}{e.client ? ` · ${e.client}` : ""}</p>
                  {e.status === "Rejected" && e.decisionNote && <p className="text-xs text-destructive">Rejected: {e.decisionNote}</p>}
                  {e.status === "Paid" && <p className="text-xs text-muted-foreground">Paid {fmtDate(e.paidAt)} · {e.paymentMethod}{e.paymentRef ? ` · ${e.paymentRef}` : ""}</p>}
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-right font-medium sm:table-cell">{inr(e.amount)}</TableCell>
                <TableCell className="hidden sm:table-cell"><StatusPill status={e.status} /></TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1 max-sm:flex-col max-sm:items-end">
                    {e.receipt && <Button variant="ghost" size="icon" title="Receipt" onClick={() => openReceipt(e)}><Paperclip className="h-4 w-4" /></Button>}
                    {admin && e.status === "Submitted" && String(e.userId) !== String(user._id) && (
                      <>
                        <Button variant="ghost" size="icon" title="Approve" onClick={() => decide(e, "Approved")}><Check className="h-4 w-4 text-green-600" /></Button>
                        <Button variant="ghost" size="icon" title="Reject" onClick={() => decide(e, "Rejected")}><X className="h-4 w-4 text-destructive" /></Button>
                      </>
                    )}
                    {admin && e.status === "Approved" && <Button variant="outline" size="sm" onClick={() => setPaying(e)}><Wallet className="mr-1 h-4 w-4" /> Paid</Button>}
                    {((String(e.userId) === String(user._id) && e.status === "Submitted") || (admin && e.status !== "Paid")) && (
                      <Button variant="ghost" size="icon" title={admin && String(e.userId) !== String(user._id) ? "Delete" : "Withdraw"} onClick={() => remove(e)}><Trash2 className="h-4 w-4" /></Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      {creating && <NewClaimDialog categories={data.categories} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); setView("mine"); setStatus(""); load(); }} />}
      {paying && <PayDialog claim={paying} methods={data.paymentMethods} onClose={() => setPaying(null)} onSaved={() => { setPaying(null); load(); }} />}
    </div>
  );
};

export default Expenses;
