import React, { useCallback, useEffect, useState } from "react";
import { Settings, Trash2, Plus, MapPin, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import CrmRoute from "@/components/crm/CrmRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosInstance from "@/utils/axiosConfig";
import { HrHeader, LEAVE_TYPES, WEEKDAYS, fmtDate } from "./hrShared";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Office location + radius for punch-in. Staff marked WFH / field staff on their profile are not checked.
const GeofenceSettings = ({ value, onChange, onSave }) => {
  const g = { enabled: false, mode: "flag", name: "Office", lat: null, lng: null, radiusMeters: 200, ...(value || {}) };
  const set = (k, v) => onChange({ ...g, [k]: v });
  const [locating, setLocating] = useState(false);
  const hasPoint = g.lat !== null && g.lat !== "" && g.lng !== null && g.lng !== "";
  const useHere = () => {
    if (!navigator.geolocation) return toast.error("This browser can't share location");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        onChange({ ...g, lat: Number(p.coords.latitude.toFixed(6)), lng: Number(p.coords.longitude.toFixed(6)) });
        toast.success(`Location set (accurate to about ${Math.round(p.coords.accuracy)} m). Save to apply.`);
      },
      (e) => {
        setLocating(false);
        toast.error(e.code === 1 ? "Location access was blocked - allow it in the browser and try again" : "Could not get your location");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };
  return (
    <Card><CardContent className="p-4 grid gap-5">
      <label className="text-sm flex items-center gap-2 font-medium"><input type="checkbox" checked={g.enabled} onChange={(e) => set("enabled", e.target.checked)} /> Check location on punch-in</label>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="grid gap-1"><Label>Office name</Label><Input value={g.name} onChange={(e) => set("name", e.target.value)} placeholder="Office" /></div>
        <div className="grid gap-1">
          <Label>When someone punches in outside</Label>
          <Select value={g.mode} onValueChange={(v) => set("mode", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="flag">Allow, but flag it for HR</SelectItem>
              <SelectItem value="block">Don't allow the punch-in</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
        <div className="grid gap-1"><Label>Latitude</Label><Input type="number" step="0.000001" value={g.lat ?? ""} onChange={(e) => set("lat", e.target.value === "" ? null : Number(e.target.value))} placeholder="19.0760" /></div>
        <div className="grid gap-1"><Label>Longitude</Label><Input type="number" step="0.000001" value={g.lng ?? ""} onChange={(e) => set("lng", e.target.value === "" ? null : Number(e.target.value))} placeholder="72.8777" /></div>
        <div className="grid gap-1"><Label>Radius (metres)</Label><Input type="number" min="25" max="5000" value={g.radiusMeters} onChange={(e) => set("radiusMeters", e.target.value)} /></div>
        <Button type="button" variant="outline" onClick={useHere} disabled={locating}><LocateFixed className="h-4 w-4 mr-1" /> {locating ? "Locating..." : "Use my location"}</Button>
      </div>
      {hasPoint && (
        <a className="text-sm text-brand inline-flex items-center gap-1 w-fit" href={`https://www.google.com/maps?q=${g.lat},${g.lng}`} target="_blank" rel="noreferrer"><MapPin className="h-4 w-4" /> Check this point on Google Maps</a>
      )}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>Tip: press "Use my location" while standing in the office, or copy the coordinates from Google Maps (right-click the building). 150-300 m works for most offices; phone GPS indoors can be off by 50-100 m.</p>
        <p>People set to "Work from home" or "Field staff" on their profile can punch in from anywhere. Punch-out is never blocked, only flagged. Browsers can be tricked with fake-location apps, so treat this as a strong check, not proof.</p>
      </div>
      <div className="flex justify-end"><Button onClick={onSave}>Save geofence</Button></div>
    </CardContent></Card>
  );
};

// Time zones a shift's start time can be written in (US shifts follow daylight saving automatically)
const SHIFT_ZONES = [["", "India (IST)"], ["America/New_York", "US Eastern"], ["America/Chicago", "US Central"], ["America/Denver", "US Mountain"], ["America/Phoenix", "US Arizona (no DST)"], ["America/Los_Angeles", "US Pacific"], ["Europe/London", "UK"]];

const HrSettings = () => {
  const [s, setS] = useState(null);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [holidays, setHolidays] = useState([]);
  const [h, setH] = useState({ date: "", name: "", optional: false });
  const [balances, setBalances] = useState([]);
  const [adj, setAdj] = useState({ userId: "", leaveType: "Vacation", days: "", note: "" });

  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([axiosInstance.get("/v1/hr/settings"), axiosInstance.get("/v1/hr/holidays", { params: { year } }), axiosInstance.get("/v1/hr/leave-balances")]);
    setS(a.data.settings);
    setHolidays(b.data.holidays || []);
    setBalances(c.data.rows || []);
  }, [year]);
  useEffect(() => {
    load().catch(() => toast.error("Could not load HR settings"));
  }, [load]);
  if (!s) return <div className="p-6 text-muted-foreground">Loading...</div>;
  const set = (k, v) => setS((x) => ({ ...x, [k]: v }));

  const save = async () => {
    try {
      await axiosInstance.put("/v1/hr/settings", s);
      toast.success("Settings saved");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    }
  };
  const addHoliday = async () => {
    try {
      await axiosInstance.post("/v1/hr/holidays", h);
      setH({ date: "", name: "", optional: false });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add");
    }
  };
  const addAdj = async () => {
    try {
      await axiosInstance.post("/v1/hr/leave-adjustments", adj);
      toast.success("Balance adjusted");
      setAdj({ ...adj, days: "", note: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not adjust");
    }
  };

  return (
    <CrmRoute>
      <div className="p-4 md:p-6 space-y-4">
        <HrHeader icon={Settings} title="HR settings" subtitle="Leave quotas, holidays, weekly offs, office timing and punch-in location." />
        <Tabs defaultValue="leave">
          <TabsList><TabsTrigger value="leave">Leave & attendance rules</TabsTrigger><TabsTrigger value="geofence">Office geofence</TabsTrigger><TabsTrigger value="holidays">Holidays</TabsTrigger><TabsTrigger value="balances">Leave balances</TabsTrigger></TabsList>
          <TabsContent value="leave">
            <Card><CardContent className="p-4 grid gap-5">
              <div>
                <p className="font-medium mb-2">Leave a year</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {LEAVE_TYPES.map((t) => (
                    <div key={t} className="grid gap-1">
                      <Label>{t}</Label>
                      <Input type="number" min="0" placeholder="No limit" value={s.leaveQuotas?.[t] ?? ""} onChange={(e) => set("leaveQuotas", { ...s.leaveQuotas, [t]: e.target.value === "" ? null : Number(e.target.value) })} />
                      <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={s.unpaidLeaveTypes.includes(t)} onChange={(e) => set("unpaidLeaveTypes", e.target.checked ? [...s.unpaidLeaveTypes, t] : s.unpaidLeaveTypes.filter((x) => x !== t))} /> Unpaid (loss of pay)</label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Leave empty for no limit. Requests over the balance are refused.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-1"><Label>Leave year starts in</Label><Select value={String(s.leaveYearStartMonth)} onValueChange={(v) => set("leaveYearStartMonth", Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid gap-1"><Label>Weekly offs</Label><div className="flex flex-wrap gap-2 pt-2">{WEEKDAYS.map((d, i) => <label key={d} className="text-sm flex items-center gap-1"><input type="checkbox" checked={s.weeklyOffs.includes(i)} onChange={(e) => set("weeklyOffs", e.target.checked ? [...s.weeklyOffs, i] : s.weeklyOffs.filter((x) => x !== i))} /> {d}</label>)}</div></div>
              </div>
              <p className="font-medium -mb-2">Regular shift <span className="text-xs font-normal text-muted-foreground">(everyone without a shift)</span></p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="grid gap-1"><Label>Office starts</Label><Input type="time" value={s.officeStart} onChange={(e) => set("officeStart", e.target.value)} /></div>
                <div className="grid gap-1"><Label>Late after (grace, min)</Label><Input type="number" min="0" value={s.graceMinutes} onChange={(e) => set("graceMinutes", e.target.value)} /></div>
                <div className="grid gap-1"><Label>Full day (hours)</Label><Input type="number" min="0" step="0.5" value={s.fullDayHours} onChange={(e) => set("fullDayHours", e.target.value)} /></div>
                <div className="grid gap-1"><Label>Half day (hours)</Label><Input type="number" min="0" step="0.5" value={s.halfDayHours} onChange={(e) => set("halfDayHours", e.target.value)} /></div>
              </div>
              <div>
                <p className="font-medium">Other shifts</p>
                <p className="text-xs text-muted-foreground mb-2">For people with different hours, e.g. interns 2 PM - 8 PM or a US 6-3 Eastern shift. Pick the usual shift on each person's profile, or plan day by day in Shift roster. A US time zone follows US daylight saving, so the IST time moves by an hour in March and November. Late = after the shift start + the grace above.</p>
                <div className="space-y-2">
                  {(s.shifts || []).map((sh, i) => {
                    const upd = (k, v) => set("shifts", s.shifts.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
                    return (
                      <div key={sh._id || `new-${i}`} className="grid grid-cols-2 sm:grid-cols-[1fr_110px_150px_100px_100px_auto] gap-2 items-end">
                        <div className="grid gap-1"><Label className="text-xs">Name</Label><Input value={sh.name} onChange={(e) => upd("name", e.target.value)} placeholder="Interns" /></div>
                        <div className="grid gap-1"><Label className="text-xs">Starts</Label><Input type="time" value={sh.start} onChange={(e) => upd("start", e.target.value)} /></div>
                        <div className="grid gap-1"><Label className="text-xs">Time zone</Label><select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={sh.timeZone || ""} onChange={(e) => upd("timeZone", e.target.value)}>{SHIFT_ZONES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                        <div className="grid gap-1"><Label className="text-xs">Full day (h)</Label><Input type="number" min="0" step="0.5" value={sh.fullDayHours} onChange={(e) => upd("fullDayHours", e.target.value)} /></div>
                        <div className="grid gap-1"><Label className="text-xs">Half day (h)</Label><Input type="number" min="0" step="0.5" value={sh.halfDayHours} onChange={(e) => upd("halfDayHours", e.target.value)} /></div>
                        <Button variant="ghost" size="icon" title="Remove shift" onClick={() => set("shifts", s.shifts.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    );
                  })}
                  <Button variant="outline" size="sm" onClick={() => set("shifts", [...(s.shifts || []), { name: "", start: "14:00", fullDayHours: 6, halfDayHours: 3 }])}><Plus className="h-4 w-4 mr-1" /> Add shift</Button>
                </div>
              </div>
              <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={s.deductAbsentDays} onChange={(e) => set("deductAbsentDays", e.target.checked)} /> Payroll: count absent days (no punch-in, no leave) as loss of pay</label>
              <div className="flex justify-end"><Button onClick={save} className="">Save settings</Button></div>
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="geofence">
            <GeofenceSettings value={s.geofence} onChange={(g) => set("geofence", g)} onSave={save} />
          </TabsContent>
          <TabsContent value="holidays">
            <Card><CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2"><Label>Year</Label><Input className="w-28" type="number" value={year} onChange={(e) => setYear(e.target.value)} /></div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="grid gap-1"><Label className="text-xs">Date</Label><Input type="date" value={h.date} onChange={(e) => setH({ ...h, date: e.target.value })} /></div>
                <div className="grid gap-1 flex-1 min-w-[200px]"><Label className="text-xs">Holiday</Label><Input value={h.name} onChange={(e) => setH({ ...h, name: e.target.value })} placeholder="e.g. Diwali" /></div>
                <label className="text-sm flex items-center gap-1 pb-2"><input type="checkbox" checked={h.optional} onChange={(e) => setH({ ...h, optional: e.target.checked })} /> Optional</label>
                <Button variant="outline" onClick={addHoliday}><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </div>
              {holidays.length === 0 && <p className="text-sm text-muted-foreground">No holidays for {year} yet.</p>}
              {holidays.map((x) => (
                <div key={x._id} className="flex items-center justify-between border rounded-md p-2">
                  <p className="text-sm"><b>{fmtDate(`${x.date}T12:00:00`)}</b> · {x.name}{x.optional ? " (optional)" : ""}</p>
                  <Button size="icon" variant="ghost" className="text-red-600" onClick={() => axiosInstance.delete(`/v1/hr/holidays/${x._id}`).then(load)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="balances" className="space-y-3">
            <Card><CardContent className="p-4 flex flex-wrap items-end gap-2">
              <div className="grid gap-1"><Label className="text-xs">Person</Label><Select value={adj.userId} onValueChange={(v) => setAdj({ ...adj, userId: v })}><SelectTrigger className="w-52"><SelectValue placeholder="Pick a person" /></SelectTrigger><SelectContent>{balances.map((b) => <SelectItem key={b.user._id} value={String(b.user._id)}>{b.user.fullname}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-1"><Label className="text-xs">Leave type</Label><Select value={adj.leaveType} onValueChange={(v) => setAdj({ ...adj, leaveType: v })}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{LEAVE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-1"><Label className="text-xs">Days (+/−)</Label><Input type="number" step="0.5" className="w-24" value={adj.days} onChange={(e) => setAdj({ ...adj, days: e.target.value })} /></div>
              <div className="grid gap-1 flex-1 min-w-[180px]"><Label className="text-xs">Note</Label><Input value={adj.note} onChange={(e) => setAdj({ ...adj, note: e.target.value })} placeholder="e.g. Carry forward from last year" /></div>
              <Button variant="outline" onClick={addAdj}>Adjust balance</Button>
            </CardContent></Card>
            <Card><CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Person</TableHead>{LEAVE_TYPES.map((t) => <TableHead key={t} className="text-right">{t} left / quota</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {balances.map((b) => (
                    <TableRow key={b.user._id}>
                      <TableCell className="font-medium">{b.user.fullname}</TableCell>
                      {LEAVE_TYPES.map((t) => { const x = b.types[t]; return <TableCell key={t} className="text-right text-sm">{x.quota === null ? `${x.used} used` : `${x.available} / ${x.quota}`}{x.pending ? <span className="text-xs text-amber-700"> ({x.pending} pending)</span> : null}</TableCell>; })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </CrmRoute>
  );
};

export default HrSettings;
