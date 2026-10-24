import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DoorOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import CrmRoute from "@/components/crm/CrmRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosInstance from "@/utils/axiosConfig";
import { HrHeader, fmtDate, toInput } from "./hrShared";

export const EXIT_TYPES = ["Resigned", "Terminated", "Absconded", "Contract ended", "Internship completed", "Other"];

export const StartExitDialog = ({ people, userId, onClose, onStarted }) => {
  const [f, setF] = useState({ userId: userId || "", type: "Resigned", reason: "", noticeDate: toInput(new Date()), lastWorkingDay: toInput(new Date(Date.now() + 30 * 86400000)) });
  const save = async () => {
    if (!f.userId) return toast.error("Pick the person");
    try {
      await axiosInstance.post(`/v1/hr/exits/${f.userId}/start`, { ...f, noticeDate: `${f.noticeDate}T12:00:00`, lastWorkingDay: `${f.lastWorkingDay}T12:00:00` });
      toast.success("Exit started");
      onStarted(f.userId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not start the exit");
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Start an exit</DialogTitle>
          <DialogDescription>They keep working until the last working day; their CRM login switches off automatically after it ends.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {!userId && (
            <div className="grid gap-1">
              <Label>Person</Label>
              <Select value={f.userId} onValueChange={(v) => setF({ ...f, userId: v })}><SelectTrigger><SelectValue placeholder="Pick a person" /></SelectTrigger><SelectContent>{people.map((p) => <SelectItem key={p._id} value={String(p._id)}>{p.fullname}</SelectItem>)}</SelectContent></Select>
            </div>
          )}
          <div className="grid gap-1">
            <Label>Type</Label>
            <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EXIT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1"><Label>Notice given on</Label><Input type="date" value={f.noticeDate} onChange={(e) => setF({ ...f, noticeDate: e.target.value })} /></div>
            <div className="grid gap-1"><Label>Last working day</Label><Input type="date" value={f.lastWorkingDay} onChange={(e) => setF({ ...f, lastWorkingDay: e.target.value })} /></div>
          </div>
          <div className="grid gap-1"><Label>Reason (internal)</Label><Textarea rows={2} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} className="bg-emerald-600 hover:bg-emerald-700">Start exit</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Exits = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [people, setPeople] = useState([]);
  const [starting, setStarting] = useState(false);
  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([axiosInstance.get("/v1/hr/exits"), axiosInstance.get("/v1/hr/employees")]);
      setRows(a.data.rows || []);
      setPeople((b.data.people || []).filter((p) => p.loginActive && p.status !== "Exited"));
    } catch {
      toast.error("Could not load exits");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <CrmRoute>
      <div className="p-4 md:p-6 space-y-4">
        <HrHeader icon={DoorOpen} title="Exits" subtitle="Notice periods, handover, access cut-off, full & final settlement and letters.">
          <Button onClick={() => setStarting(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-1" /> Start an exit</Button>
        </HrHeader>
        <Card><CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Person</TableHead><TableHead>Type</TableHead><TableHead>Last working day</TableHead><TableHead>Checklist</TableHead><TableHead>Settlement</TableHead><TableHead>CRM login</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-500">No exits yet.</TableCell></TableRow>}
              {rows.map((r) => (
                <TableRow key={r.user._id} className="cursor-pointer" onClick={() => navigate(`/hr/exits/${r.user._id}`)}>
                  <TableCell><p className="font-medium">{r.user.fullname}</p><p className="text-xs text-gray-500">{r.designation || r.user.email}</p></TableCell>
                  <TableCell>{r.exit?.type || "—"}</TableCell>
                  <TableCell>{fmtDate(r.exit?.lastWorkingDay)}</TableCell>
                  <TableCell>{r.exit ? `${r.exit.checklistDone}/${r.exit.checklistTotal}` : "—"}</TableCell>
                  <TableCell>{r.exit?.settlement?.status || "—"}</TableCell>
                  <TableCell>{r.user.isActive === false ? <span className="text-xs rounded-full px-2 py-0.5 bg-gray-100 text-gray-600">Off</span> : <span className="text-xs rounded-full px-2 py-0.5 bg-green-100 text-green-700">Active</span>}</TableCell>
                  <TableCell><span className={`text-xs rounded-full px-2 py-0.5 ${r.exit?.status === "Completed" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-800"}`}>{r.exit?.status || r.status}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
        {starting && <StartExitDialog people={people} onClose={() => setStarting(false)} onStarted={(id) => navigate(`/hr/exits/${id}`)} />}
      </div>
    </CrmRoute>
  );
};

export default Exits;
