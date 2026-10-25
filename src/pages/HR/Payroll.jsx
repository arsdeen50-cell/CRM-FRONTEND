import React, { useCallback, useEffect, useState } from "react";
import { Wallet, Plus, Trash2, Download, Lock, Unlock, Mail, Edit } from "lucide-react";
import { toast } from "sonner";
import CrmRoute from "@/components/crm/CrmRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosInstance from "@/utils/axiosConfig";
import { downloadFile } from "@/lib/crmOutreach";
import { HrHeader, MonthPicker, thisMonth, monthLabel, inr } from "./hrShared";
import { confirmDialog } from "@/components/ui/app-dialogs";

const DEFAULT_EARN = [{ name: "Basic", amount: 0 }, { name: "HRA", amount: 0 }, { name: "Special allowance", amount: 0 }];
const DEFAULT_DED = [{ name: "Professional tax", amount: 200 }];

const Lines = ({ title, lines, onChange }) => (
  <div className="grid gap-2">
    <Label>{title}</Label>
    {lines.map((l, i) => (
      <div key={i} className="flex gap-2">
        <Input value={l.name} onChange={(e) => onChange(lines.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Name" />
        <Input type="number" className="w-36" value={l.amount} onChange={(e) => onChange(lines.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} placeholder="₹ / month" />
        <Button size="icon" variant="ghost" className="text-red-600" onClick={() => onChange(lines.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
      </div>
    ))}
    <Button size="sm" variant="outline" className="w-fit" onClick={() => onChange([...lines, { name: "", amount: 0 }])}><Plus className="h-4 w-4 mr-1" /> Add line</Button>
  </div>
);

const SalaryDialog = ({ person, current, onClose, onSaved }) => {
  const [f, setF] = useState({ effectiveFrom: thisMonth(), earnings: current?.earnings?.length ? current.earnings : DEFAULT_EARN, deductions: current?.deductions || DEFAULT_DED, note: "" });
  const gross = f.earnings.reduce((s, e) => s + (Number(e.amount) || 0), 0), ded = f.deductions.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const save = async () => {
    try {
      await axiosInstance.put(`/v1/hr/salary/${person._id}`, f);
      toast.success("Salary saved");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Salary for {person.fullname}</DialogTitle><DialogDescription>Monthly amounts. A new effective month keeps the old structure for earlier months.</DialogDescription></DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1 w-44"><Label>Effective from</Label><Input type="month" value={f.effectiveFrom} onChange={(e) => setF({ ...f, effectiveFrom: e.target.value })} /></div>
          <Lines title="Earnings" lines={f.earnings} onChange={(earnings) => setF({ ...f, earnings })} />
          <Lines title="Deductions (PF, professional tax, TDS ...)" lines={f.deductions} onChange={(deductions) => setF({ ...f, deductions })} />
          <p className="text-sm bg-muted/60 rounded-md p-2">Gross {inr(gross)} · deductions {inr(ded)} · <b>net {inr(gross - ded)}</b> a month (before loss of pay)</p>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} className="">Save salary</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PayslipDialog = ({ slip, locked, onClose, onSaved }) => {
  const [manual, setManual] = useState(slip.lopBreakdown?.manual || 0);
  const [adj, setAdj] = useState(slip.adjustments || []);
  const [notes, setNotes] = useState(slip.notes || "");
  const save = async () => {
    try {
      await axiosInstance.put(`/v1/hr/payroll/payslips/${slip._id}`, { manualLopDays: manual, adjustments: adj, notes });
      toast.success("Payslip updated");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{slip.employee?.name} · {monthLabel(slip.month)}</DialogTitle><DialogDescription>Loss of pay from unpaid leave: {slip.lopBreakdown?.unpaidLeave || 0} days · absences: {slip.lopBreakdown?.absent || 0} days</DialogDescription></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1 w-44"><Label>Extra loss-of-pay days</Label><Input type="number" min="0" step="0.5" value={manual} disabled={locked} onChange={(e) => setManual(e.target.value)} /></div>
          <div className="grid gap-2">
            <Label>One-off adjustments this month (+ bonus, − recovery)</Label>
            {adj.map((a, i) => (
              <div key={i} className="flex gap-2">
                <Input value={a.name} disabled={locked} onChange={(e) => setAdj(adj.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <Input type="number" className="w-36" value={a.amount} disabled={locked} onChange={(e) => setAdj(adj.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} />
                {!locked && <Button size="icon" variant="ghost" className="text-red-600" onClick={() => setAdj(adj.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>}
              </div>
            ))}
            {!locked && <Button size="sm" variant="outline" className="w-fit" onClick={() => setAdj([...adj, { name: "Bonus", amount: 0 }])}><Plus className="h-4 w-4 mr-1" /> Add adjustment</Button>}
          </div>
          <div className="grid gap-1"><Label>Note on the payslip</Label><Input value={notes} disabled={locked} onChange={(e) => setNotes(e.target.value)} /></div>
          {!locked && <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} className="">Save</Button></div>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Payroll = () => {
  const [people, setPeople] = useState([]);
  const [structures, setStructures] = useState([]);
  const [runs, setRuns] = useState([]);
  const [month, setMonth] = useState(thisMonth());
  const [run, setRun] = useState(null);
  const [salaryFor, setSalaryFor] = useState(null);
  const [slipEdit, setSlipEdit] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [p, s, r] = await Promise.all([axiosInstance.get("/v1/hr/employees"), axiosInstance.get("/v1/hr/salary"), axiosInstance.get("/v1/hr/payroll/runs")]);
    setPeople(p.data.people || []);
    setStructures(s.data.structures || []);
    setRuns(r.data.runs || []);
  }, []);
  const loadRun = useCallback(async (m) => {
    const found = (await axiosInstance.get("/v1/hr/payroll/runs")).data.runs.find((x) => x.month === m);
    setRun(found ? (await axiosInstance.get(`/v1/hr/payroll/runs/${found._id}`)).data : null);
  }, []);
  useEffect(() => {
    load().catch(() => toast.error("Could not load payroll"));
  }, [load]);
  useEffect(() => {
    loadRun(month).catch(() => {});
  }, [month, loadRun]);

  const currentOf = (userId) => structures.find((s) => String(s.userId?._id) === String(userId) && s.effectiveFrom <= month) || structures.find((s) => String(s.userId?._id) === String(userId));
  const generate = async () => {
    setBusy(true);
    try {
      const r = await axiosInstance.post("/v1/hr/payroll/runs", { month });
      toast.success(`${r.data.created} created, ${r.data.updated} refreshed${r.data.skipped ? `, ${r.data.skipped} skipped (not joined / exited)` : ""}`);
      await loadRun(month);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not run payroll");
    } finally {
      setBusy(false);
    }
  };
  const act = async (what) => {
    if (what === "finalize" && !await confirmDialog("Finalize? Payslips become visible to employees and can't be edited (you can reopen).")) return;
    if (what === "email" && !await confirmDialog("Email every payslip PDF to its employee now?")) return;
    if (what === "delete" && !await confirmDialog("Delete this draft payroll?")) return;
    try {
      if (what === "delete") await axiosInstance.delete(`/v1/hr/payroll/runs/${run.run._id}`);
      else {
        const r = await axiosInstance.post(`/v1/hr/payroll/runs/${run.run._id}/${what}`);
        if (what === "email") toast.success(`${r.data.sent} payslips emailed${r.data.failed?.length ? `; failed: ${r.data.failed.join(", ")}` : ""}`);
      }
      await loadRun(month);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update");
    }
  };
  const pdf = async (s) => {
    const r = await axiosInstance.get(`/v1/hr/payroll/payslips/${s._id}/pdf`, { responseType: "blob" }).catch(() => null);
    if (r) downloadFile(`Payslip-${s.month}-${(s.employee?.name || "").replace(/\s+/g, "_")}.pdf`, r.data);
  };
  const locked = run?.run?.status === "Finalized";
  const totals = (run?.payslips || []).reduce((t, s) => ({ gross: t.gross + s.grossEarned, ded: t.ded + s.totalDeductions, net: t.net + s.netPay }), { gross: 0, ded: 0, net: 0 });

  return (
    <CrmRoute>
      <div className="p-4 md:p-6 space-y-4">
        <HrHeader icon={Wallet} title="Payroll" subtitle="Salary structures, monthly payroll with loss of pay from unpaid leave, and payslips." />
        <Tabs defaultValue="run">
          <TabsList><TabsTrigger value="run">Monthly payroll</TabsTrigger><TabsTrigger value="salaries">Salaries</TabsTrigger><TabsTrigger value="history">History</TabsTrigger></TabsList>
          <TabsContent value="run" className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <MonthPicker month={month} onChange={setMonth} />
              {!locked && <Button onClick={generate} disabled={busy} className="">{run ? "Refresh from attendance & leave" : `Run payroll for ${monthLabel(month)}`}</Button>}
              {run && !locked && <Button variant="outline" onClick={() => act("finalize")}><Lock className="h-4 w-4 mr-1" /> Finalize</Button>}
              {locked && <Button variant="outline" onClick={() => act("reopen")}><Unlock className="h-4 w-4 mr-1" /> Reopen</Button>}
              {locked && <Button variant="outline" onClick={() => act("email")}><Mail className="h-4 w-4 mr-1" /> Email payslips</Button>}
              {run && !locked && <Button variant="ghost" className="text-red-600" onClick={() => act("delete")}><Trash2 className="h-4 w-4" /></Button>}
              {run && <span className={`text-xs rounded-full px-2 py-0.5 ${locked ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"}`}>{run.run.status}</span>}
            </div>
            {!run && <p className="text-sm text-muted-foreground">No payroll for {monthLabel(month)} yet. People without a salary structure are left out - set them up under Salaries.</p>}
            {run && (
              <Card><CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead className="text-right">Paid days</TableHead><TableHead className="text-right">LOP</TableHead><TableHead className="text-right">Gross earned</TableHead><TableHead className="text-right">Deductions</TableHead><TableHead className="text-right">Net pay</TableHead><TableHead /></TableRow></TableHeader>
                  <TableBody>
                    {run.payslips.map((s) => (
                      <TableRow key={s._id}>
                        <TableCell><p className="font-medium">{s.employee?.name}</p><p className="text-xs text-muted-foreground">{s.employee?.designation}</p></TableCell>
                        <TableCell className="text-right">{s.paidDays}/{s.daysInMonth}</TableCell>
                        <TableCell className="text-right">{s.lopDays ? <span className="text-red-600">{s.lopDays} ({inr(s.lopAmount)})</span> : "—"}</TableCell>
                        <TableCell className="text-right">{inr(s.grossEarned)}{s.adjustments?.length ? <div className="text-xs text-muted-foreground">incl. adjustments</div> : null}</TableCell>
                        <TableCell className="text-right">{inr(s.totalDeductions)}</TableCell>
                        <TableCell className="text-right font-semibold">{inr(s.netPay)}</TableCell>
                        <TableCell><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" title={locked ? "View" : "Edit LOP / adjustments"} onClick={() => setSlipEdit(s)}><Edit className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title="Payslip PDF" onClick={() => pdf(s)}><Download className="h-4 w-4" /></Button></div></TableCell>
                      </TableRow>
                    ))}
                    <TableRow><TableCell className="font-semibold">Total ({run.payslips.length})</TableCell><TableCell /><TableCell /><TableCell className="text-right font-semibold">{inr(totals.gross)}</TableCell><TableCell className="text-right font-semibold">{inr(totals.ded)}</TableCell><TableCell className="text-right font-semibold">{inr(totals.net)}</TableCell><TableCell /></TableRow>
                  </TableBody>
                </Table>
              </CardContent></Card>
            )}
          </TabsContent>
          <TabsContent value="salaries">
            <Card><CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Effective from</TableHead><TableHead className="text-right">Gross / month</TableHead><TableHead className="text-right">Deductions</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {people.filter((p) => p.status !== "Exited").map((p) => {
                    const s = currentOf(p._id);
                    return (
                      <TableRow key={p._id}>
                        <TableCell><p className="font-medium">{p.fullname}</p><p className="text-xs text-muted-foreground">{p.designation || p.email}</p></TableCell>
                        <TableCell>{s ? monthLabel(s.effectiveFrom) : <span className="text-muted-foreground/70">Not set</span>}</TableCell>
                        <TableCell className="text-right">{s ? inr(s.gross) : "—"}</TableCell>
                        <TableCell className="text-right">{s ? inr(s.deductions.reduce((a, d) => a + d.amount, 0)) : "—"}</TableCell>
                        <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setSalaryFor({ person: p, current: s })}>{s ? "Change" : "Set salary"}</Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="history">
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Status</TableHead><TableHead className="text-right">People</TableHead><TableHead className="text-right">Net paid</TableHead></TableRow></TableHeader>
                <TableBody>
                  {runs.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No payroll yet.</TableCell></TableRow>}
                  {runs.map((r) => <TableRow key={r._id} className="cursor-pointer" onClick={() => setMonth(r.month)}><TableCell>{monthLabel(r.month)}</TableCell><TableCell>{r.status}</TableCell><TableCell className="text-right">{r.count}</TableCell><TableCell className="text-right">{inr(r.net)}</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
        {salaryFor && <SalaryDialog person={salaryFor.person} current={salaryFor.current} onClose={() => setSalaryFor(null)} onSaved={load} />}
        {slipEdit && <PayslipDialog slip={slipEdit} locked={locked} onClose={() => setSlipEdit(null)} onSaved={() => loadRun(month)} />}
      </div>
    </CrmRoute>
  );
};

export default Payroll;
