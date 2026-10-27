import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { CalendarCheck, Download, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosInstance from "@/utils/axiosConfig";
import { downloadFile } from "@/lib/crmOutreach";
import { useMyTeams } from "@/hooks/useTeams";
import { HrHeader, MonthPicker, thisMonth, DAY_CODES, fmtDate, WEEKDAYS } from "./hrShared";
import { promptDialog } from "@/components/ui/app-dialogs";

const time = (d) => (d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—");
const SUMMARY = [["P", "Present"], ["HD", "Half"], ["L", "Leave"], ["A", "Absent"], ["late", "Late"], ["outside", "Outside office"], ["workedHours", "Hours"]];
const outsideText = (o) => (o.status === "unknown" ? "punched in without sharing location" : `punched in ${o.distance >= 1000 ? `${(o.distance / 1000).toFixed(1)} km` : `${o.distance} m`} from the office`);

const Cell = ({ c }) => {
  const d = DAY_CODES[c.code];
  return (
    <td className="p-0.5">
      <div title={`${c.date}: ${d?.label || "—"}${c.late ? " (late)" : ""}${c.holiday ? ` - ${c.holiday}` : ""}${c.leaveType ? ` - ${c.leaveType}` : ""}${c.punchIn ? `\nIn ${time(c.punchIn)}  Out ${time(c.punchOut)}  ${c.worked}h` : ""}${c.shift ? `\nRoster: ${c.shift}` : ""}${c.outside ? `\nOutside office: ${outsideText(c.outside)}` : ""}`} className={`relative h-7 w-8 rounded text-[10px] font-medium flex items-center justify-center ${d?.cls || "bg-card text-muted-foreground/50"} ${c.late ? "ring-1 ring-red-400" : ""}`}>
        {c.code || "·"}
        {c.outside && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-card" />}
      </div>
    </td>
  );
};

const AttendanceReport = () => {
  const { user } = useSelector((s) => s.auth);
  const { isTeamLead } = useMyTeams();
  const reviewer = user?.role === "admin" || isTeamLead;
  const [month, setMonth] = useState(thisMonth());
  const [report, setReport] = useState(null);
  const [corrections, setCorrections] = useState([]);
  const [req, setReq] = useState({ date: "", punchIn: "", punchOut: "", reason: "" });

  const load = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([axiosInstance.get("/v1/hr/attendance-report", { params: { month } }), axiosInstance.get("/v1/hr/corrections")]);
      setReport(r.data);
      setCorrections(c.data.corrections || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load attendance");
    }
  }, [month]);
  useEffect(() => {
    load();
  }, [load]);

  const exportCsv = () => {
    if (!report) return;
    const head = ["Name", "Email", ...report.days.map((d) => d.slice(8)), "Present", "Half day", "Short", "Missed punch-out", "Absent", "Leave", "Half-day leave", "Holidays", "Weekly offs", "Late", "Outside office", "Hours"];
    const lines = report.rows.map((r) => [r.user.fullname, r.user.email, ...r.cells.map((c) => c.code + (c.late ? "*" : "") + (c.outside ? "!" : "")), r.summary.P, r.summary.HD, r.summary.SH, r.summary.MP, r.summary.A, r.summary.L, r.summary.HL, r.summary.H, r.summary.WO, r.summary.late, r.summary.outside ?? 0, r.summary.workedHours]);
    const csv = [head, ...lines].map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile(`attendance-${month}.csv`, csv, "text/csv");
  };
  const submitCorrection = async () => {
    try {
      await axiosInstance.post("/v1/hr/corrections", req);
      toast.success("Correction sent for approval");
      setReq({ date: "", punchIn: "", punchOut: "", reason: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send");
    }
  };
  const decide = async (c, status) => {
    const comment = status === "Rejected" ? await promptDialog("Reason (optional)") ?? "" : "";
    try {
      await axiosInstance.post(`/v1/hr/corrections/${c._id}/decide`, { status, comment });
      toast.success(`Correction ${status.toLowerCase()}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update");
    }
  };

  const pending = corrections.filter((c) => c.status === "Pending" && String(c.userId?._id) !== String(user?._id));
  const mine = corrections.filter((c) => String(c.userId?._id) === String(user?._id));

  return (
    <div className="p-4 md:p-6 space-y-4">
      <HrHeader icon={CalendarCheck} title={reviewer ? "Attendance" : "My attendance"} subtitle={report ? `Office starts ${report.settings.officeStart} (+${report.settings.graceMinutes} min grace) · full day ${report.settings.fullDayHours}h · half day ${report.settings.halfDayHours}h` : ""}>
        <MonthPicker month={month} onChange={setMonth} />
        <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> CSV</Button>
      </HrHeader>
      <div className="flex flex-wrap gap-2 text-xs">{Object.entries(DAY_CODES).map(([k, v]) => <span key={k} className={`rounded px-2 py-0.5 ${v.cls}`}>{k} {v.label}</span>)}<span className="rounded px-2 py-0.5 ring-1 ring-red-400">Late</span></div>
      <Tabs defaultValue="sheet">
        <TabsList>
          <TabsTrigger value="sheet">Monthly sheet</TabsTrigger>
          {reviewer && <TabsTrigger value="approve">To approve {pending.length ? `(${pending.length})` : ""}</TabsTrigger>}
          <TabsTrigger value="mine">My corrections</TabsTrigger>
        </TabsList>
        <TabsContent value="sheet">
          <Card><CardContent className="p-2 overflow-x-auto">
            {!report && <p className="p-6 text-muted-foreground">Loading...</p>}
            {report && (
              <table className="text-xs border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="text-left p-1 sticky left-0 bg-card min-w-[140px]">Person</th>
                    {report.days.map((d) => <th key={d} className="p-0.5 font-normal text-muted-foreground w-8"><div>{Number(d.slice(8))}</div><div className="text-[9px]">{WEEKDAYS[new Date(`${d}T00:00:00Z`).getUTCDay()][0]}</div></th>)}
                    {SUMMARY.map(([k, l]) => <th key={k} className="p-1 text-muted-foreground font-medium">{l}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((r) => (
                    <tr key={r.user._id}>
                      <td className="p-1 sticky left-0 bg-card font-medium whitespace-nowrap">{r.user.fullname}{r.shift && r.shift.name !== "Regular" && <div className="text-[10px] font-normal text-muted-foreground">{r.shift.name} · {r.shift.start} IST</div>}</td>
                      {r.cells.map((c) => <Cell key={c.date} c={c} />)}
                      {SUMMARY.map(([k]) => <td key={k} className="p-1 text-center">{r.summary[k]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent></Card>
          <p className="text-xs text-muted-foreground mt-2">Hover a day for punch times. <span className="inline-block h-2 w-2 rounded-full bg-orange-500 align-middle" /> = punched in outside the office geofence (in the CSV: !). Missed a punch or punched late by mistake? Ask for a correction under "My corrections".</p>
        </TabsContent>
        {reviewer && (
          <TabsContent value="approve">
            <Card><CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Person</TableHead><TableHead>Day</TableHead><TableHead>Requested</TableHead><TableHead>Reason</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {pending.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nothing to approve.</TableCell></TableRow>}
                  {pending.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="font-medium">{c.userId?.fullname}</TableCell>
                      <TableCell>{fmtDate(`${c.date}T12:00:00`)}</TableCell>
                      <TableCell className="text-sm">In {time(c.punchIn)} · Out {time(c.punchOut)}</TableCell>
                      <TableCell className="text-sm max-w-xs">{c.reason}</TableCell>
                      <TableCell><div className="flex gap-1 justify-end"><Button size="sm" variant="outline" className="text-green-700" onClick={() => decide(c, "Approved")}><Check className="h-4 w-4 mr-1" /> Approve</Button><Button size="sm" variant="outline" className="text-red-600" onClick={() => decide(c, "Rejected")}><X className="h-4 w-4 mr-1" /> Reject</Button></div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
        )}
        <TabsContent value="mine">
          <Card><CardContent className="p-4 space-y-3">
            <p className="font-medium text-sm">Ask for a correction</p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="grid gap-1"><Label className="text-xs">Day</Label><Input type="date" value={req.date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setReq({ ...req, date: e.target.value })} /></div>
              <div className="grid gap-1"><Label className="text-xs">Punch in</Label><Input type="time" value={req.punchIn} onChange={(e) => setReq({ ...req, punchIn: e.target.value })} /></div>
              <div className="grid gap-1"><Label className="text-xs">Punch out</Label><Input type="time" value={req.punchOut} onChange={(e) => setReq({ ...req, punchOut: e.target.value })} /></div>
              <div className="grid gap-1 flex-1 min-w-[200px]"><Label className="text-xs">Reason</Label><Input value={req.reason} onChange={(e) => setReq({ ...req, reason: e.target.value })} placeholder="e.g. Forgot to punch out after the shoot" /></div>
              <Button onClick={submitCorrection} className="">Send</Button>
            </div>
            <div className="space-y-1 pt-2">
              {mine.length === 0 && <p className="text-sm text-muted-foreground">No corrections yet.</p>}
              {mine.map((c) => <p key={c._id} className="text-sm">{fmtDate(`${c.date}T12:00:00`)} · In {time(c.punchIn)} · Out {time(c.punchOut)} · <b>{c.status}</b>{c.decidedBy ? ` by ${c.decidedBy}` : ""}{c.comment ? ` - ${c.comment}` : ""}</p>)}
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AttendanceReport;
