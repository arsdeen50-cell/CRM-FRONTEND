import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Clock, Coffee, LogIn, LogOut, Play, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useAttendance from "@/hooks/useAttendance";

const HOUR = 3600000;
const clock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");
};
const time = (d) => (d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "");

// Break time (ms) of one attendance record up to `now`, counting a break still running
const breakMs = (rec, now) =>
  (rec?.breaks || []).reduce((t, b) => (b.breakStart ? t + ((b.breakEnd ? new Date(b.breakEnd) : now) - new Date(b.breakStart)) : t), 0);
const workedMs = (rec, now) => (rec?.punchIn ? Math.max(0, (rec.punchOut ? new Date(rec.punchOut) : now) - new Date(rec.punchIn) - breakMs(rec, now)) : 0);

/* Punch in / break / punch out for whoever is signed in, with a live timer and this week's total. */
const MyDayCard = () => {
  const { todayAttendance: today, myAttendance } = useSelector((s) => s.attendance);
  const { punchIn, punchOut, startBreak, endBreak, getMyAttendance } = useAttendance();
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const onBreak = !!today?.breaks?.some((b) => b.breakStart && !b.breakEnd);
  const state = !today?.punchIn ? "out" : today.punchOut ? "done" : onBreak ? "break" : "working";

  useEffect(() => {
    if (state !== "working" && state !== "break") return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [state]);

  const run = async (fn) => {
    setBusy(true);
    try {
      const r = await fn();
      if (r?.success && fn !== punchIn && fn !== punchOut) await getMyAttendance();
    } finally {
      setNow(new Date());
      setBusy(false);
    }
  };
  const doPunchOut = async () => {
    if (onBreak) await endBreak();
    return punchOut();
  };

  const weekAgo = new Date(now.getTime() - 7 * 24 * HOUR);
  const week = (Array.isArray(myAttendance) ? myAttendance : []).filter((r) => new Date(r.punchIn) >= weekAgo);
  const weekHours = week.reduce((t, r) => t + workedMs(r, now), 0) / HOUR;

  const STATE = {
    out: { label: "Not punched in", cls: "bg-muted text-muted-foreground" },
    working: { label: "Working", cls: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" },
    break: { label: "On break", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
    done: { label: "Done for today", cls: "bg-brand-soft text-brand" },
  }[state];

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-semibold"><Clock className="h-4 w-4 text-brand" /> My day</p>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATE.cls}`}>{STATE.label}</span>
        </div>

        <div>
          <p className="font-mono text-4xl font-semibold tabular-nums tracking-tight">{clock(workedMs(today, now))}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {state === "out" ? "Your work timer starts when you punch in." : <>In at {time(today.punchIn)}{today.punchOut ? ` · out at ${time(today.punchOut)}` : ""}{breakMs(today, now) > 0 ? ` · ${clock(breakMs(today, now)).slice(0, 5)} on break` : ""}</>}
          </p>
        </div>

        <div className="grid gap-2">
          {state === "out" && (
            <Button size="lg" onClick={() => run(punchIn)} disabled={busy}><LogIn className="mr-2 h-4 w-4" /> Punch in</Button>
          )}
          {(state === "working" || state === "break") && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => run(onBreak ? endBreak : startBreak)} disabled={busy}>
                {onBreak ? <><Play className="mr-2 h-4 w-4" /> Resume</> : <><Coffee className="mr-2 h-4 w-4" /> Break</>}
              </Button>
              <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => run(doPunchOut)} disabled={busy}>
                <LogOut className="mr-2 h-4 w-4" /> Punch out
              </Button>
            </div>
          )}
          {state === "done" && (
            <p className="flex items-center gap-2 rounded-md bg-muted px-3 py-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-green-600" /> Nice work - see you tomorrow.</p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t pt-3 text-sm">
          <span className="text-muted-foreground">Last 7 days: <span className="font-medium text-foreground">{week.length} day{week.length === 1 ? "" : "s"} · {weekHours.toFixed(1)}h</span></span>
          <Link to="/hr/attendance" className="text-brand hover:underline">Attendance →</Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyDayCard;
