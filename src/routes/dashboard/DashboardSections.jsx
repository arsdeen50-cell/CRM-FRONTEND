import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckSquare, PhoneCall, Repeat, CalendarDays, CalendarCheck, CalendarRange, Users, Cake, Award, PartyPopper, TrendingUp, ArrowRight, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/utils/axiosConfig";

const inr = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);
const day = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "");
const time = (d) => (d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "");
const mdLabel = (md) => new Date(`2000-${md}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

const KIND = {
  task: { icon: CheckSquare, cls: "text-brand" },
  followup: { icon: PhoneCall, cls: "text-brand" },
  sequence: { icon: Repeat, cls: "text-amber-600" },
  leave: { icon: CalendarDays, cls: "text-purple-600" },
  correction: { icon: CalendarCheck, cls: "text-purple-600" },
  content: { icon: CalendarRange, cls: "text-pink-600" },
};
const STATUS = {
  in: ["In", "bg-green-100 text-green-700"],
  break: ["On break", "bg-yellow-100 text-yellow-800"],
  left: ["Left", "bg-slate-100 text-slate-600"],
  leave: ["On leave", "bg-blue-100 text-brand"],
  "half-leave": ["Half-day leave", "bg-sky-100 text-sky-700"],
  "not-in": ["Not in", "bg-red-100 text-red-700"],
  "not-yet": ["Not in yet", "bg-gray-100 text-muted-foreground"],
  off: ["Off today", "bg-gray-100 text-muted-foreground"],
};

const Tile = ({ label, value, sub, tone, to }) => {
  const body = (
    <div className="rounded-lg border bg-card p-3 h-full hover:shadow-sm transition">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-semibold ${tone === "bad" ? "text-red-600" : tone === "good" ? "text-green-700" : ""}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
};

const Section = ({ icon: Icon, title, action, children }) => (
  <Card className="border-0 bg-card shadow-sm border">
    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
      <CardTitle className="flex items-center gap-2 text-lg"><Icon className="h-5 w-5 text-primary" />{title}</CardTitle>
      {action}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

/* The dashboard's "my day" sections. The API decides what each person may see. */
const DashboardSections = () => {
  const [d, setD] = useState(null);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const load = () =>
    axiosInstance
      .get("/v1/dashboard")
      .then((r) => {
        setD(r.data);
        setError("");
      })
      .catch((e) => setError(e.response?.data?.message || "Could not load the dashboard"));
  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!d) return <p className="text-sm text-muted-foreground">Loading your day...</p>;
  const { actions, team, business } = d;
  const overdue = actions.filter((a) => a.overdue).length;
  const visible = showAll ? actions : actions.slice(0, 8);

  return (
    <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
      <Section icon={AlertCircle} title={`Needs my action${actions.length ? ` (${actions.length})` : ""}`} action={<Button size="icon" variant="ghost" onClick={load} title="Refresh"><RefreshCw className="h-4 w-4" /></Button>}>
        {actions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">You're all caught up. 🎉</p>
        ) : (
          <div className="space-y-1">
            {overdue > 0 && <p className="text-xs text-red-600 mb-1">{overdue} overdue</p>}
            {visible.map((a, i) => {
              const k = KIND[a.kind] || KIND.task;
              return (
                <Link key={i} to={a.link} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent">
                  <k.icon className={`h-4 w-4 shrink-0 ${k.cls}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    {a.sub && <p className="text-xs text-muted-foreground truncate">{a.sub}</p>}
                  </div>
                  {a.due && <span className={`text-xs whitespace-nowrap ${a.overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{a.overdue ? "Overdue · " : ""}{day(a.due)}</span>}
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </Link>
              );
            })}
            {actions.length > 8 && <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)}>{showAll ? "Show less" : `Show all ${actions.length}`}</Button>}
          </div>
        )}
      </Section>

      {team && (
        <Section icon={Users} title={`Team today${team.scope === "your team" ? " (your team)" : ""}`} action={<Link to="/hr/attendance" className="text-xs text-primary hover:underline">Full attendance →</Link>}>
          {team.dayOff && <p className="text-sm text-muted-foreground mb-2">Today is a {team.dayOff === "Weekly off" ? "weekly off" : `holiday: ${team.dayOff}`}.</p>}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <Tile label="In today" value={`${team.counts.in}/${team.counts.total}`} />
            <Tile label="Late" value={team.counts.late} tone={team.counts.late ? "bad" : undefined} />
            <Tile label="On leave" value={team.counts.leave} />
            <Tile label="Not in" value={team.counts.notIn} sub={team.counts.notYet ? `${team.counts.notYet} not due yet` : undefined} tone={team.counts.notIn ? "bad" : undefined} />
          </div>
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            {team.people.map((p) => {
              const [label, cls] = STATUS[p.status] || ["", ""];
              return (
                <div key={p._id} className="flex items-center justify-between gap-2 text-sm py-1">
                  <Link to={`/hr/people/${p._id}`} className="truncate hover:underline">{p.fullname}</Link>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.punchIn && <span className={`text-xs ${p.late ? "text-red-600" : "text-muted-foreground"}`}>{time(p.punchIn)}{p.late ? " late" : ""}</span>}
                    <span className={`text-xs rounded-full px-2 py-0.5 ${cls}`}>{label}{p.leaveType ? ` · ${p.leaveType}` : ""}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {(team.upcomingLeave.length > 0 || team.celebrations.length > 0 || team.holidays.length > 0) && (
            <div className="border-t mt-3 pt-3 grid sm:grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                {team.upcomingLeave.length > 0 && <p className="text-xs font-medium text-muted-foreground">Leave this week</p>}
                {team.upcomingLeave.map((l, i) => <p key={i}>{l.name} · {day(l.startDate)}{l.days > 1 ? `–${day(l.endDate)}` : ""} <span className="text-xs text-muted-foreground">{l.leaveType}</span></p>)}
                {team.holidays.length > 0 && <p className="text-xs font-medium text-muted-foreground pt-1">Next holidays</p>}
                {team.holidays.map((h) => <p key={h.date} className="flex items-center gap-1"><PartyPopper className="h-3 w-3 text-purple-600" />{mdLabel(h.date.slice(5))} · {h.name}{h.optional ? " (optional)" : ""}</p>)}
              </div>
              <div className="space-y-1">
                {team.celebrations.length > 0 && <p className="text-xs font-medium text-muted-foreground">Celebrations</p>}
                {team.celebrations.map((c, i) => (
                  <p key={i} className="flex items-center gap-1">
                    {c.kind === "birthday" ? <Cake className="h-3 w-3 text-pink-600" /> : <Award className="h-3 w-3 text-amber-600" />}
                    {c.name} · {c.kind === "birthday" ? "birthday" : `${c.years} year${c.years > 1 ? "s" : ""} with us`} · {c.inDays === 0 ? "today" : mdLabel(c.date)}
                  </p>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {business && (
        <div className="2xl:col-span-2">
          <Section icon={TrendingUp} title="Business snapshot" action={<Link to="/crm/reports" className="text-xs text-primary hover:underline">Reports →</Link>}>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
              <Tile label="Open pipeline" value={inr(business.pipeline.openValue)} sub={`${business.pipeline.openDeals} deals`} to="/crm/lead-source" />
              <Tile label="Won this month" value={inr(business.wonThisMonth.value)} sub={`${business.wonThisMonth.count} deal${business.wonThisMonth.count === 1 ? "" : "s"}`} tone="good" />
              <Tile label="Win rate (90 days)" value={business.winRate90 === null ? "—" : `${business.winRate90}%`} />
              <Tile label="Overdue follow-ups" value={business.pipeline.overdueFollowUps} tone={business.pipeline.overdueFollowUps ? "bad" : undefined} to="/crm/follow-ups" />
              <Tile label="Outstanding" value={inr(business.money.outstanding)} sub={business.money.overdue ? `${inr(business.money.overdue)} overdue` : "nothing overdue"} tone={business.money.overdue ? "bad" : undefined} to="/crm/invoices" />
              <Tile label="Received this month" value={inr(business.money.paidThisMonth)} tone="good" to="/crm/invoices" />
              <Tile label="MRR" value={inr(business.money.mrr)} sub={business.money.renewalsDue ? `${business.money.renewalsDue} renewal${business.money.renewalsDue > 1 ? "s" : ""} due` : undefined} tone={business.money.renewalsDue ? "bad" : undefined} to="/crm/retainers" />
              <Tile label="Content this month" value={`${business.content.done}/${business.content.promised || business.content.planned}`} sub={business.content.awaitingClient ? `${business.content.awaitingClient} with client` : "delivered"} to="/crm/content" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Open deals by stage: {business.pipeline.byStage.map((s) => `${s.stage} ${s.count}`).join(" · ")}</p>
          </Section>
        </div>
      )}
    </div>
  );
};

export default DashboardSections;
