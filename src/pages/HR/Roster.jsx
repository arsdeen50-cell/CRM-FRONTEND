import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarRange, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosInstance from "@/utils/axiosConfig";
import { HrHeader, WEEKDAYS } from "./hrShared";

const DAY = 86400000;
const shiftWeek = (monday, n) => new Date(Date.parse(`${monday}T00:00:00Z`) + n * 7 * DAY).toISOString().slice(0, 10);
const dayLabel = (k) => new Date(`${k}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
// Soft colour per shift so the week reads at a glance
const TONES = ["bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200", "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200", "bg-violet-50 text-violet-800 dark:bg-violet-950 dark:text-violet-200", "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200", "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200", "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200"];

/* Weekly shift plan: admins and Team Leads pick each person's shift per day. Days left alone follow the person's usual shift. */
const Roster = () => {
  const [week, setWeek] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(async (w = week) => {
    try {
      const r = await axiosInstance.get("/v1/hr/roster", { params: w ? { week: w } : {} });
      setData(r.data);
      setWeek(r.data.week);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load the roster");
    }
  }, [week]);
  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shiftById = useMemo(() => new Map((data?.shifts || []).map((s, i) => [s.id, { ...s, tone: TONES[i % TONES.length] }])), [data]);
  const people = (data?.people || []).filter((p) => !q || `${p.fullname} ${p.designation} ${p.teams.join(" ")}`.toLowerCase().includes(q.toLowerCase()));

  const setCell = async (person, day, value) => {
    try {
      await axiosInstance.put("/v1/hr/roster", { userId: person._id, date: day.date, value });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    }
  };
  const copyLastWeek = async () => {
    try {
      const r = await axiosInstance.post("/v1/hr/roster/copy-week", { week });
      toast.success(`Copied ${r.data.copied} planned shift${r.data.copied === 1 ? "" : "s"} from last week`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not copy");
    }
  };

  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;
  if (!data) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <HrHeader icon={CalendarRange} title="Shift roster" subtitle="Plan who works which shift each day. Days you leave alone follow the person's usual shift; times are IST and follow US daylight saving.">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => load(shiftWeek(week, -1))} title="Previous week"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="min-w-[150px] text-center text-sm font-medium">{dayLabel(data.days[0])} – {dayLabel(data.days[6])}</span>
          <Button variant="outline" size="icon" onClick={() => load(shiftWeek(week, 1))} title="Next week"><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={copyLastWeek}><Copy className="mr-1 h-4 w-4" /> Copy last week</Button>
        </div>
      </HrHeader>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {data.shifts.map((s) => (
          <span key={s.id || "regular"} className={`rounded-full px-2.5 py-1 ${shiftById.get(s.id)?.tone}`}>{s.name} · {s.startLocal}{s.timeZone ? ` (${s.start} ${s.timeZone.split("/").pop().replace("_", " ")} time)` : ""}</span>
        ))}
        <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">Off</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b p-3"><Input className="max-w-xs" placeholder="Filter by name or team..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="sticky left-0 min-w-[180px] bg-card p-2 text-left font-medium">Person</th>
                  {data.days.map((k) => {
                    const wd = new Date(`${k}T00:00:00Z`).getUTCDay();
                    return <th key={k} className={`min-w-[150px] p-2 text-left font-medium ${data.weeklyOffs.includes(wd) ? "text-muted-foreground/60" : ""}`}>{WEEKDAYS[wd]} {dayLabel(k)}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p._id} className="border-b last:border-0">
                    <td className="sticky left-0 bg-card p-2">
                      <p className="font-medium">{p.fullname}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.teams[0] || p.designation}</p>
                    </td>
                    {p.days.map((d) => {
                      const wd = new Date(`${d.date}T00:00:00Z`).getUTCDay();
                      const off = d.rostered ? d.off : data.weeklyOffs.includes(wd);
                      const s = shiftById.get(d.shiftId);
                      const value = !d.rostered ? "" : d.off ? "off" : d.shiftId || "regular";
                      return (
                        <td key={d.date} className="p-1.5">
                          <select
                            value={value}
                            onChange={(e) => setCell(p, d, e.target.value)}
                            className={`w-full cursor-pointer rounded-md border-0 px-2 py-1.5 text-xs outline-none ring-brand focus:ring-2 ${off ? "bg-muted text-muted-foreground" : s?.tone || ""} ${d.rostered ? "font-semibold" : ""}`}
                            title={d.rostered ? "Planned for this day" : "Their usual shift"}
                          >
                            <option value="">{off && !d.rostered ? "Off (weekly)" : shiftById.get(p.usualShift)?.name || "Regular"}</option>
                            {data.shifts.map((x) => <option key={x.id || "regular"} value={x.id || "regular"}>{x.name} · {x.startLocal}</option>)}
                            <option value="off">Off</option>
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {people.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No one to show.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Bold = planned for that day; the rest follow each person's usual shift. Late marking, half days and Team today use the planned shift.</p>
    </div>
  );
};

export default Roster;
