import React, { useCallback, useEffect, useState } from "react";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import CrmRoute from "@/components/crm/CrmRoute";
import PageHeader, { Stat } from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosInstance from "@/utils/axiosConfig";
import { money, errMsg } from "@/lib/publicApi";
import { toDateInput } from "@/lib/crmOutreach";

const r0 = (n) => money(n).replace(/\.00$/, "");

const Profitability = () => {
  const now = new Date();
  const [from, setFrom] = useState(toDateInput(new Date(now.getFullYear(), now.getMonth() - 2, 1)));
  const [to, setTo] = useState(toDateInput(now));
  const [data, setData] = useState(null);
  const [rates, setRates] = useState([]);
  const load = useCallback(async () => {
    try {
      const [p, r] = await Promise.all([axiosInstance.get("/v1/time/profitability", { params: { from, to } }), axiosInstance.get("/v1/time/rates")]);
      setData(p.data);
      setRates(r.data.rates || []);
    } catch (err) {
      toast.error(errMsg(err, "Could not load"));
    }
  }, [from, to]);
  useEffect(() => {
    load();
  }, [load]);
  const saveRate = async (u, value) => {
    try {
      await axiosInstance.put(`/v1/time/rates/${u.userId}`, { hourlyCost: Number(value) || 0 });
      toast.success(`Saved ${u.userName}'s cost`);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const t = data?.totals || {};
  return (
    <CrmRoute>
      <div className="p-4 md:p-6 space-y-4">
        <PageHeader icon={TrendingUp} title="Profit per client" subtitle="Invoiced revenue (before GST) minus the cost of hours logged. Worst first, so money-losing clients stand out.">
          <div className="grid gap-1"><span className="text-xs text-muted-foreground">From</span><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="grid gap-1"><span className="text-xs text-muted-foreground">To</span><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </PageHeader>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Revenue invoiced" value={r0(t.revenue)} />
          <Stat label="Cost of time" value={r0(t.cost)} sub={`${t.hours || 0} hours`} />
          <Stat label="Profit" value={r0(t.profit)} tone={t.profit < 0 ? "bad" : "good"} />
          <Stat label="Margin" value={t.margin === null || t.margin === undefined ? "—" : `${t.margin}%`} />
        </div>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-right">Earned / hour</TableHead>
                  <TableHead className="text-right">Retainer / month</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.rows || []).length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">{data ? "No time or invoices in this range yet." : "Loading..."}</TableCell></TableRow>}
                {(data?.rows || []).map((r) => (
                  <TableRow key={String(r.clientId || r.clientName)} className={r.losing ? "bg-red-50 dark:bg-red-950" : ""}>
                    <TableCell>
                      <p className="font-medium flex items-center gap-1">{r.losing && <AlertTriangle className="h-4 w-4 text-red-600" />}{r.clientName}</p>
                      <p className="text-xs text-muted-foreground">{Object.entries(r.people).map(([n, m]) => `${n.split(" ")[0]} ${Math.round(m / 6) / 10}h`).join(" · ")}</p>
                      {r.missingRates.length > 0 && <p className="text-xs text-amber-700">No hourly cost set for {r.missingRates.join(", ")} - counted as ₹0</p>}
                    </TableCell>
                    <TableCell className="text-right">{r.hours}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{r0(r.revenue)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{r0(r.cost)}</TableCell>
                    <TableCell className={`text-right whitespace-nowrap font-medium ${r.profit < 0 ? "text-red-600" : "text-green-700"}`}>{r0(r.profit)}</TableCell>
                    <TableCell className="text-right">{r.margin === null ? "—" : `${r.margin}%`}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{r.effectiveRate === null ? "—" : r0(r.effectiveRate)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{r.retainerMonthly ? r0(r.retainerMonthly) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div><p className="font-medium">Internal cost per hour</p><p className="text-xs text-muted-foreground">Monthly salary + overheads ÷ working hours (e.g. ₹40,000 ÷ 160 h = ₹250). Only admins see this.</p></div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rates.map((u) => (
                <div key={u.userId} className="flex items-center gap-2">
                  <span className="text-sm flex-1 truncate">{u.userName}</span>
                  <Input type="number" min="0" className="w-28" defaultValue={u.hourlyCost ?? ""} placeholder="₹ / hour" onBlur={(e) => String(e.target.value) !== String(u.hourlyCost ?? "") && saveRate(u, e.target.value)} />
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={load}>Recalculate</Button>
          </CardContent>
        </Card>
      </div>
    </CrmRoute>
  );
};

export default Profitability;
