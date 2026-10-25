import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import CrmRoute from "@/components/crm/CrmRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/hooks/Pipelineconstants";
import axiosInstance from "@/utils/axiosConfig";

// Validated reference palette (dataviz skill): categorical slots 1-2, light and dark steps
const PALETTE = {
  light: { s1: "#2a78d6", s2: "#eb6834", grid: "#e7e6e2", axis: "#52514e", tooltipBg: "#ffffff" },
  dark: { s1: "#3987e5", s2: "#d95926", grid: "#2e2e2c", axis: "#c3c2b7", tooltipBg: "#1a1a19" },
};
const useIsDark = () => {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(document.documentElement.classList.contains("dark")));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
};

const Stat = ({ label, value, sub }) => (
  <Card>
    <CardContent className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </CardContent>
  </Card>
);

const ChartCard = ({ title, note, children, height = 260 }) => (
  <Card>
    <CardContent className="p-4">
      <p className="font-medium">{title}</p>
      {note && <p className="text-xs text-muted-foreground mb-2">{note}</p>}
      <div style={{ height }}>{children}</div>
    </CardContent>
  </Card>
);

const GroupTable = ({ title, rows, label }) => (
  <Card>
    <CardContent className="p-4">
      <p className="font-medium mb-2">{title}</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{label}</TableHead>
            <TableHead className="text-right">Leads</TableHead>
            <TableHead className="text-right">Won</TableHead>
            <TableHead className="text-right">Lost</TableHead>
            <TableHead className="text-right">Win rate</TableHead>
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(rows || []).map((r) => (
            <TableRow key={r.key}>
              <TableCell>{r.key}</TableCell>
              <TableCell className="text-right">{r.count}</TableCell>
              <TableCell className="text-right">{r.won}</TableCell>
              <TableCell className="text-right">{r.lost}</TableCell>
              <TableCell className="text-right">{r.winRate === null ? "—" : `${r.winRate}%`}</TableCell>
              <TableCell className="text-right">{formatCurrency(r.value)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

const Reports = () => {
  const navigate = useNavigate();
  const dark = useIsDark();
  const c = dark ? PALETTE.dark : PALETTE.light;
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/v1/leadsource/reports", { params: { ...(from && { from }), ...(to && { to }) } });
      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load reports");
    } finally {
      setLoading(false);
    }
  }, [from, to]);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const axis = { tick: { fill: c.axis, fontSize: 12 }, axisLine: { stroke: c.grid }, tickLine: false };
  const tooltip = { contentStyle: { background: c.tooltipBg, border: `1px solid ${c.grid}`, borderRadius: 8, fontSize: 12 }, cursor: { fill: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" } };
  const t = data?.totals;
  const monthly = (data?.monthly || []).map((m) => ({ ...m, label: new Date(`${m.key}-01`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) }));

  return (
    <CrmRoute>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/crm")} title="Back to CRM">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-brand" /> Pipeline reports
              </h1>
              <p className="text-sm text-muted-foreground">Conversion, sources, time in stage and why deals are lost.</p>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <span className="text-xs text-muted-foreground">Leads created from</span>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">to</span>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
            </div>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Apply
            </Button>
          </div>
        </div>

        {t && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Stat label="Leads" value={t.leads} sub={`${t.open} open`} />
            <Stat label="Open pipeline" value={formatCurrency(t.pipelineValue)} />
            <Stat label="Won" value={t.won} sub={formatCurrency(t.wonValue)} />
            <Stat label="Win rate" value={t.winRate === null ? "—" : `${t.winRate}%`} sub={`${t.won} won · ${t.lost} lost`} />
            <Stat label="Average won deal" value={formatCurrency(t.averageDealWon)} />
          </div>
        )}

        {data && (
          <div className="grid lg:grid-cols-2 gap-4">
            <ChartCard title="Funnel: leads that reached each stage" note="Counts every lead that got at least this far.">
              <ResponsiveContainer>
                <BarChart data={data.funnel} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid horizontal={false} stroke={c.grid} />
                  <XAxis type="number" allowDecimals={false} {...axis} />
                  <YAxis type="category" dataKey="stage" width={100} {...axis} />
                  <Tooltip {...tooltip} />
                  <Bar isAnimationActive={false} dataKey="reached" name="Leads" fill={c.s1} radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="New leads vs won, last 6 months">
              <ResponsiveContainer>
                <BarChart data={monthly} margin={{ right: 10 }} barGap={2}>
                  <CartesianGrid vertical={false} stroke={c.grid} />
                  <XAxis dataKey="label" {...axis} />
                  <YAxis allowDecimals={false} {...axis} />
                  <Tooltip {...tooltip} />
                  <Legend wrapperStyle={{ fontSize: 12, color: c.axis }} />
                  <Bar isAnimationActive={false} dataKey="created" name="New leads" fill={c.s1} radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar isAnimationActive={false} dataKey="won" name="Won" fill={c.s2} radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Average days in each stage" note="From stage history; open leads count time up to today.">
              <ResponsiveContainer>
                <BarChart data={data.avgDaysInStage.map((d) => ({ ...d, days: d.days ?? 0 }))}>
                  <CartesianGrid vertical={false} stroke={c.grid} />
                  <XAxis dataKey="stage" {...axis} />
                  <YAxis {...axis} />
                  <Tooltip {...tooltip} formatter={(v) => [`${v} days`, "Average"]} />
                  <Bar isAnimationActive={false} dataKey="days" name="Days" fill={c.s1} radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Outreach activity, last 30 days">
              {data.activityLast30Days.length ? (
                <ResponsiveContainer>
                  <BarChart data={data.activityLast30Days}>
                    <CartesianGrid vertical={false} stroke={c.grid} />
                    <XAxis dataKey="type" {...axis} />
                    <YAxis allowDecimals={false} {...axis} />
                    <Tooltip {...tooltip} />
                    <Bar isAnimationActive={false} dataKey="count" name="Activities" fill={c.s1} radius={[4, 4, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground pt-10 text-center">No activity logged in the last 30 days.</p>
              )}
            </ChartCard>
          </div>
        )}

        {data && (
          <div className="grid lg:grid-cols-2 gap-4">
            <GroupTable title="By lead source" rows={data.bySource} label="Source" />
            <GroupTable title="By industry" rows={data.byIndustry} label="Industry" />
            <GroupTable title="By service" rows={data.byService} label="Service" />
            <GroupTable title="By owner" rows={data.byOwner} label="Handled by" />
            <Card>
              <CardContent className="p-4">
                <p className="font-medium mb-2">Why deals were lost</p>
                {data.lostReasons.length ? (
                  <Table>
                    <TableBody>
                      {data.lostReasons.map((r) => (
                        <TableRow key={r.reason}>
                          <TableCell>{r.reason}</TableCell>
                          <TableCell className="text-right">{r.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">No lost deals in this range.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="font-medium mb-2">Outcomes logged, last 30 days</p>
                {data.outcomesLast30Days.length ? (
                  <Table>
                    <TableBody>
                      {data.outcomesLast30Days.map((r) => (
                        <TableRow key={r.outcome}>
                          <TableCell>{r.outcome}</TableCell>
                          <TableCell className="text-right">{r.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">{'No outcomes logged yet. Use "Contact" on a lead to log them.'}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </CrmRoute>
  );
};

export default Reports;
