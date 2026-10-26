import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckSquare, PhoneCall, Repeat, CalendarDays, CalendarCheck, CalendarRange, Users, Cake, Award, PartyPopper, TrendingUp, ArrowRight, RefreshCw, Sparkles, Target, Trophy, Percent, Clock, Wallet, Banknote, Repeat2, Clapperboard } from "lucide-react";
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

const Tile = ({ label, value, sub, tone, to, icon: Icon }) => {
  const body = (
    <div className={`h-full rounded-lg border bg-card p-3 transition ${to ? "hover:border-ring/40 hover:shadow-sm" : ""}`}>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{Icon && <Icon className="h-3.5 w-3.5" />}{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${tone === "bad" ? "text-red-600" : tone === "good" ? "text-green-700 dark:text-green-400" : ""}`}>{value}</p>
      {sub && <p className={`text-xs ${tone === "bad" ? "text-red-600/80" : "text-muted-foreground"}`}>{sub}</p>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
};

const Section = ({ icon: Icon, title, action, children, className = "" }) => (
  <Card className={className}>
    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
      <CardTitle className="flex items-center gap-2 text-base font-semibold"><Icon className="h-4 w-4 text-brand" />{title}</CardTitle>
      {action}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

/* The dashboard's "my day" sections. The API decides what each person may see. */
const DashboardSections = ({ myDay }) => {
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

  const actions = d?.actions || [];
  const { team, business } = d || {};
  const overdue = actions.filter((a) => a.overdue).length;
  const visible = showAll ? actions : actions.slice(0, 7);
  const comingUp = team && (team.upcomingLeave.length > 0 || team.celebrations.length > 0 || team.holidays.length > 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">{myDay}</div>

      <Section className="lg:col-span-2" icon={AlertCircle} title={`Needs my action${actions.length ? ` (${actions.length})` : ""}`} action={<Button size="icon" variant="ghost" onClick={load} title="Refresh"><RefreshCw className="h-4 w-4" /></Button>}>
        {error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : !d ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading your day...</p>
        ) : actions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Sparkles className="h-6 w-6 text-brand" />
            <p className="text-sm font-medium">You're all caught up</p>
            <p className="text-xs text-muted-foreground">Tasks, follow-ups and approvals that need you will show up here.</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {overdue > 0 && <p className="mb-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">{overdue} overdue</p>}
            {visible.map((a, i) => {
              const k = KIND[a.kind] || KIND.task;
              return (
                <Link key={i} to={a.link} className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted"><k.icon className={`h-4 w-4 ${k.cls}`} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    {a.sub && <p className="truncate text-xs text-muted-foreground">{a.sub}</p>}
                  </div>
                  {a.due && <span className={`whitespace-nowrap text-xs ${a.overdue ? "font-medium text-red-600" : "text-muted-foreground"}`}>{a.overdue ? "Overdue · " : ""}{day(a.due)}</span>}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                </Link>
              );
            })}
            {actions.length > 7 && <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)}>{showAll ? "Show less" : `Show all ${actions.length}`}</Button>}
          </div>
        )}
      </Section>

      {team && (
        <Section className={comingUp ? "lg:col-span-2" : "lg:col-span-3"} icon={Users} title={`Team today${team.scope === "your team" ? " (your team)" : ""}`} action={<Link to="/hr/attendance" className="text-xs text-brand hover:underline">Full attendance →</Link>}>
          {team.dayOff && <p className="mb-2 text-sm text-muted-foreground">Today is a {team.dayOff === "Weekly off" ? "weekly off" : `holiday: ${team.dayOff}`}.</p>}
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Tile label="In today" value={`${team.counts.in}/${team.counts.total}`} />
            <Tile label="Late" value={team.counts.late} tone={team.counts.late ? "bad" : undefined} sub={team.counts.outside ? `${team.counts.outside} outside office` : undefined} />
            <Tile label="On leave" value={team.counts.leave} />
            <Tile label="Not in" value={team.counts.notIn} sub={team.counts.notYet ? `${team.counts.notYet} not due yet` : undefined} tone={team.counts.notIn ? "bad" : undefined} />
          </div>
          <div className="grid max-h-64 grid-cols-1 gap-x-6 overflow-y-auto pr-1 sm:grid-cols-2">
            {team.people.map((p) => {
              const [label, cls] = STATUS[p.status] || ["", ""];
              return (
                <div key={p._id} className="flex items-center justify-between gap-2 border-b border-border/60 py-1.5 text-sm last:border-0">
                  <Link to={`/hr/people/${p._id}`} className="flex min-w-0 items-center gap-2 hover:underline">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">{(p.fullname || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
                    <span className="truncate">{p.fullname}{p.shift && <span className="ml-1 text-xs text-muted-foreground">· {p.shift}</span>}</span>
                  </Link>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {p.punchIn && <span className={`text-xs ${p.late ? "text-red-600" : "text-muted-foreground"}`}>{time(p.punchIn)}{p.late ? " late" : ""}</span>}
                    {p.outside && <span title={p.outside === "unknown" ? "Punched in without sharing location" : "Punched in outside the office geofence"} className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-800 dark:bg-orange-950 dark:text-orange-300">{p.outside === "unknown" ? "No location" : "Outside"}</span>}
                    <span className={`rounded-full px-2 py-0.5 text-xs ${cls}`}>{label}{p.leaveType ? ` · ${p.leaveType}` : ""}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {comingUp && (
        <Section icon={CalendarDays} title="Coming up">
          <div className="space-y-4 text-sm">
            {team.celebrations.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Celebrations</p>
                {team.celebrations.map((c, i) => (
                  <p key={i} className="flex items-center gap-2">
                    {c.kind === "birthday" ? <Cake className="h-4 w-4 shrink-0 text-pink-600" /> : <Award className="h-4 w-4 shrink-0 text-amber-600" />}
                    <span className="min-w-0 flex-1 truncate">{c.name} <span className="text-muted-foreground">· {c.kind === "birthday" ? "birthday" : `${c.years} year${c.years > 1 ? "s" : ""}`}</span></span>
                    <span className="text-xs text-muted-foreground">{c.inDays === 0 ? "Today" : mdLabel(c.date)}</span>
                  </p>
                ))}
              </div>
            )}
            {team.upcomingLeave.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Leave this week</p>
                {team.upcomingLeave.map((l, i) => (
                  <p key={i} className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0 text-purple-600" />
                    <span className="min-w-0 flex-1 truncate">{l.name} <span className="text-muted-foreground">· {l.leaveType}</span></span>
                    <span className="text-xs text-muted-foreground">{day(l.startDate)}{l.days > 1 ? `–${day(l.endDate)}` : ""}</span>
                  </p>
                ))}
              </div>
            )}
            {team.holidays.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Holidays</p>
                {team.holidays.map((h) => (
                  <p key={h.date} className="flex items-center gap-2">
                    <PartyPopper className="h-4 w-4 shrink-0 text-purple-600" />
                    <span className="min-w-0 flex-1 truncate">{h.name}{h.optional ? <span className="text-muted-foreground"> (optional)</span> : ""}</span>
                    <span className="text-xs text-muted-foreground">{mdLabel(h.date.slice(5))}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {business && (
        <Section className="lg:col-span-3" icon={TrendingUp} title="Business snapshot" action={<Link to="/crm/reports" className="text-xs text-brand hover:underline">Reports →</Link>}>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Tile icon={Target} label="Open pipeline" value={inr(business.pipeline.openValue)} sub={`${business.pipeline.openDeals} open deal${business.pipeline.openDeals === 1 ? "" : "s"}`} to="/crm/lead-source" />
            <Tile icon={Trophy} label="Won this month" value={inr(business.wonThisMonth.value)} sub={`${business.wonThisMonth.count} deal${business.wonThisMonth.count === 1 ? "" : "s"}`} tone="good" />
            <Tile icon={Percent} label="Win rate (90 days)" value={business.winRate90 === null ? "—" : `${business.winRate90}%`} />
            <Tile icon={Clock} label="Overdue follow-ups" value={business.pipeline.overdueFollowUps} tone={business.pipeline.overdueFollowUps ? "bad" : undefined} to="/crm/follow-ups" />
            <Tile icon={Wallet} label="Outstanding" value={inr(business.money.outstanding)} sub={business.money.overdue ? `${inr(business.money.overdue)} overdue` : "nothing overdue"} tone={business.money.overdue ? "bad" : undefined} to="/crm/invoices" />
            <Tile icon={Banknote} label="Received this month" value={inr(business.money.paidThisMonth)} tone="good" to="/crm/invoices" />
            <Tile icon={Repeat2} label="Monthly retainers" value={inr(business.money.mrr)} sub={business.money.renewalsDue ? `${business.money.renewalsDue} renewal${business.money.renewalsDue > 1 ? "s" : ""} due` : "no renewals due"} tone={business.money.renewalsDue ? "bad" : undefined} to="/crm/retainers" />
            <Tile icon={Clapperboard} label="Content this month" value={`${business.content.done}/${business.content.promised || business.content.planned}`} sub={business.content.awaitingClient ? `${business.content.awaitingClient} with client` : "delivered"} to="/crm/content" />
          </div>
          {business.pipeline.byStage.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {business.pipeline.byStage.map((st) => <span key={st.stage} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{st.stage} <span className="font-medium">{st.count}</span></span>)}
            </div>
          )}
        </Section>
      )}
    </div>
  );
};

export default DashboardSections;
