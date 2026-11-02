import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LineChart, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import CrmRoute from "@/components/crm/CrmRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosInstance from "@/utils/axiosConfig";

// Same validated palette as Pipeline reports (categorical slots 1-2, light and dark steps)
const PALETTE = {
  light: { s1: "#2a78d6", s2: "#eb6834", grid: "#e7e6e2", axis: "#52514e", tooltipBg: "#ffffff" },
  dark: { s1: "#3987e5", s2: "#d95926", grid: "#2e2e2c", axis: "#c3c2b7", tooltipBg: "#1a1a19" },
};
const DEFAULT_ODDS = { Lead: 10, Qualified: 25, "Proposal Sent": 50, Negotiation: 75 };
const ODDS_KEY = "crm.revenue.stageOdds";
const readOdds = () => {
  try {
    return { ...DEFAULT_ODDS, ...JSON.parse(localStorage.getItem(ODDS_KEY) || "{}") };
  } catch {
    return DEFAULT_ODDS;
  }
};
const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const short = (n) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : n >= 1e3 ? `₹${Math.round(n / 1e3)}k` : `₹${Math.round(n)}`);
const monthName = (key, long) => new Date(`${key}-15T00:00:00Z`).toLocaleDateString("en-IN", { month: long ? "long" : "short", year: "2-digit" });
const useIsDark = () => {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(document.documentElement.classList.contains("dark")));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
};

const Stat = ({ label, value, sub, warn }) => (
  <Card><CardContent className="p-4">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className={`mt-1 text-2xl font-semibold ${warn ? "text-amber-600" : ""}`}>{value}</p>
    {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
  </CardContent></Card>
);

/* Finance > Revenue & forecast: what should come in over the next six months (retainers plus open deals weighted
   by how likely each stage is to close), who owes money and how late, and invoiced vs collected so far. */
const Revenue = () => {
  const navigate = useNavigate();
  const dark = useIsDark();
  const c = dark ? PALETTE.dark : PALETTE.light;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [odds, setOdds] = useState(readOdds);

  const load = async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get("/v1/invoice/reports/revenue");
      setData(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the revenue report");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const setOdd = (stage, v) => {
    const next = { ...odds, [stage]: Math.min(100, Math.max(0, Number(v) || 0)) };
    setOdds(next);
    try {
      localStorage.setItem(ODDS_KEY, JSON.stringify(next));
    } catch {
      /* private mode */
    }
  };

  const view = useMemo(() => {
    if (!data) return null;
    const weighted = (d) => (d.value * (odds[d.stage] ?? 0)) / 100;
    const forecast = data.months.map((m, i) => {
      const deals = data.openDeals.filter((d) => d.month === m);
      return { month: m, label: monthName(m), retainers: data.retainerByMonth[i]?.amount || 0, deals: Math.round(deals.reduce((t, d) => t + weighted(d), 0)), dealCount: deals.length };
    });
    const undated = data.openDeals.filter((d) => !d.month || !data.months.includes(d.month));
    const late30 = data.aging.buckets.filter((b) => ["d60", "d90", "d90plus"].includes(b.key)).reduce((t, b) => t + b.amount, 0);
    return {
      forecast,
      undated,
      undatedWeighted: undated.reduce((t, d) => t + weighted(d), 0),
      next3: forecast.slice(0, 3).reduce((t, m) => t + m.retainers + m.deals, 0),
      late30,
      deals: [...data.openDeals].map((d) => ({ ...d, weighted: Math.round(weighted(d)) })).sort((a, b) => b.weighted - a.weighted),
      history: data.history.map((h) => ({ ...h, label: monthName(h.month) })),
    };
  }, [data, odds]);

  const axis = { tick: { fill: c.axis, fontSize: 12 }, axisLine: { stroke: c.grid }, tickLine: false };
  const tooltip = { contentStyle: { background: c.tooltipBg, border: `1px solid ${c.grid}`, borderRadius: 8, fontSize: 12 }, cursor: { fill: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }, formatter: (v) => inr(v) };

  return (
    <CrmRoute>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/crm")} title="Back to CRM"><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <h1 className="flex items-center gap-2 text-xl font-semibold md:text-2xl"><LineChart className="h-6 w-6 text-brand" /> Revenue & forecast</h1>
              <p className="text-sm text-muted-foreground">What should come in, who owes what, and what was collected.</p>
            </div>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>
        </div>

        {view && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label={`Expected in ${monthName(data.thisMonth, true)}`} value={inr(view.forecast[0].retainers + view.forecast[0].deals)} sub={`${inr(view.forecast[0].retainers)} retainers + ${inr(view.forecast[0].deals)} deals`} />
              <Stat label="Expected next 3 months" value={inr(view.next3)} sub="Retainers + weighted deals" />
              <Stat label="Unpaid invoices" value={inr(data.aging.total)} sub={`${data.aging.invoices.length} invoice${data.aging.invoices.length === 1 ? "" : "s"}`} />
              <Stat label="More than 30 days late" value={inr(view.late30)} warn={view.late30 > 0} />
            </div>

            <Card><CardContent className="space-y-3 p-4">
              <div>
                <p className="font-medium">Forecast, next 6 months</p>
                <p className="text-xs text-muted-foreground">Retainers that are running, plus each open deal&apos;s value × the chance of closing at its stage, in the month it&apos;s expected to close.</p>
              </div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={view.forecast} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={c.grid} />
                    <XAxis dataKey="label" {...axis} interval={0} />
                    <YAxis {...axis} width={56} tickFormatter={short} />
                    <Tooltip {...tooltip} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="retainers" name="Retainers" stackId="f" fill={c.s1} stroke={c.tooltipBg} strokeWidth={2} />
                    <Bar dataKey="deals" name="Weighted deals" stackId="f" fill={c.s2} radius={[4, 4, 0, 0]} stroke={c.tooltipBg} strokeWidth={2} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap items-end gap-3 border-t border-border pt-3">
                <p className="w-full text-xs text-muted-foreground">Chance of closing by stage (yours to adjust; remembered on this device):</p>
                {data.stages.map((s) => (
                  <label key={s} className="grid gap-1 text-xs">
                    <span className="text-muted-foreground">{s}</span>
                    <span className="flex items-center gap-1"><Input type="number" min="0" max="100" className="h-8 w-16" value={odds[s]} onChange={(e) => setOdd(s, e.target.value)} />%</span>
                  </label>
                ))}
                {view.undated.length > 0 && <p className="text-xs text-amber-700 dark:text-amber-400">{view.undated.length} open deal{view.undated.length === 1 ? " has" : "s have"} no expected close date ({inr(view.undatedWeighted)} weighted) and {view.undated.length === 1 ? "isn't" : "aren't"} in the chart - set one on the lead.</p>}
              </div>
            </CardContent></Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card><CardContent className="p-4">
                <p className="mb-1 font-medium">Unpaid invoices by how late they are</p>
                <div className="mb-3 grid grid-cols-5 gap-1 text-center">
                  {data.aging.buckets.map((b, i) => (
                    <div key={b.key} className={`rounded-md p-2 ${b.amount && i >= 2 ? "bg-amber-50 dark:bg-amber-500/10" : "bg-muted"}`}>
                      <p className="text-[11px] leading-tight text-muted-foreground">{b.label}</p>
                      <p className="text-sm font-semibold">{short(b.amount)}</p>
                    </div>
                  ))}
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Client</TableHead><TableHead className="text-right">Owed</TableHead><TableHead className="text-right">Oldest</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.aging.byClient.length === 0 && <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">Nothing unpaid.</TableCell></TableRow>}
                    {data.aging.byClient.map((r) => (
                      <TableRow key={`${r.clientId || r.clientName}`}>
                        <TableCell>{r.clientId ? <Link to={`/crm/clients/${r.clientId}`} className="hover:text-brand hover:underline">{r.clientName}</Link> : r.clientName}<span className="text-xs text-muted-foreground"> · {r.invoices} invoice{r.invoices === 1 ? "" : "s"}</span></TableCell>
                        <TableCell className="text-right font-medium">{inr(r.total)}</TableCell>
                        <TableCell className={`text-right ${r.oldestDays > 30 ? "text-amber-600" : "text-muted-foreground"}`}>{r.oldestDays > 0 ? `${r.oldestDays} days late` : "not due"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {data.aging.invoices.length > 0 && <Link to="/crm/invoices" className="mt-2 inline-block text-sm text-brand hover:underline">Open invoices to send reminders</Link>}
              </CardContent></Card>

              <Card><CardContent className="p-4">
                <p className="font-medium">Invoiced vs collected, last 6 months</p>
                <p className="mb-2 text-xs text-muted-foreground">Invoiced by issue date; collected by the date each payment came in.</p>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={view.history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
                      <CartesianGrid vertical={false} stroke={c.grid} />
                      <XAxis dataKey="label" {...axis} interval={0} />
                      <YAxis {...axis} width={56} tickFormatter={short} />
                      <Tooltip {...tooltip} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="invoiced" name="Invoiced" fill={c.s1} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="collected" name="Collected" fill={c.s2} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent></Card>
            </div>

            <Card><CardContent className="overflow-x-auto p-4">
              <p className="mb-2 font-medium">Open deals, biggest weighted value first</p>
              <Table>
                <TableHeader><TableRow><TableHead>Deal</TableHead><TableHead>Stage</TableHead><TableHead>Expected close</TableHead><TableHead className="text-right">Value</TableHead><TableHead className="text-right">Weighted</TableHead></TableRow></TableHeader>
                <TableBody>
                  {view.deals.length === 0 && <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">No open deals with a value. Add a deal value on leads to forecast them.</TableCell></TableRow>}
                  {view.deals.slice(0, 25).map((d) => (
                    <TableRow key={d._id}>
                      <TableCell>{d.name}{d.owner && <span className="text-xs text-muted-foreground"> · {d.owner}</span>}</TableCell>
                      <TableCell>{d.stage} <span className="text-xs text-muted-foreground">({odds[d.stage]}%)</span></TableCell>
                      <TableCell className={d.overdueClose ? "text-amber-600" : ""}>{d.month ? `${monthName(d.month, true)}${d.overdueClose ? " (date passed)" : ""}` : <span className="text-muted-foreground">Not set</span>}</TableCell>
                      <TableCell className="text-right">{inr(d.value)}</TableCell>
                      <TableCell className="text-right font-medium">{inr(d.weighted)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </>
        )}
      </div>
    </CrmRoute>
  );
};

export default Revenue;
