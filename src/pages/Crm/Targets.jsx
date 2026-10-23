import { SalesRoute } from "@/components/crm/AccessRoute";
import React, { useCallback, useEffect, useState } from "react";
import { Trophy, Edit, Copy } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/components/crm/CrmMemberRoute";
import PageHeader from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosInstance from "@/utils/axiosConfig";
import { errMsg, money } from "@/lib/publicApi";

const METRICS = [
  { key: "calls", label: "Calls" },
  { key: "emails", label: "Emails" },
  { key: "whatsapps", label: "WhatsApps" },
  { key: "meetings", label: "Meetings" },
  { key: "newLeads", label: "New leads" },
  { key: "won", label: "Deals won" },
  { key: "revenue", label: "Revenue won", money: true },
];
const thisMonth = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 7);
const shiftMonth = (m, n) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};
const fmt = (m, v) => (m.money ? money(v).replace(/\.00$/, "") : v);

const Bar = ({ value, goal }) => {
  const pct = goal ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${pct >= 100 ? "bg-green-600" : pct >= 60 ? "bg-blue-600" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
    </div>
  );
};

const Targets = () => {
  const isAdmin = useIsAdmin();
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null);
  const load = useCallback(async () => {
    try {
      setData((await axiosInstance.get("/v1/target", { params: { month } })).data);
    } catch (err) {
      toast.error(errMsg(err, "Could not load targets"));
    }
  }, [month]);
  useEffect(() => {
    load();
  }, [load]);
  const save = async () => {
    try {
      await axiosInstance.put("/v1/target", { userName: editing.userName, month, goals: editing.goals });
      toast.success("Targets saved");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const copyLast = async () => {
    const res = await axiosInstance.post("/v1/target/copy", { from: shiftMonth(month, -1), to: month }).catch((e) => toast.error(errMsg(e)));
    if (res) toast.success(`${res.data.copied} target${res.data.copied === 1 ? "" : "s"} copied from last month`);
    load();
  };
  const label = new Date(`${month}-15`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <SalesRoute>
      <div className="p-4 md:p-6 space-y-4">
        <PageHeader icon={Trophy} title="Targets & leaderboard" subtitle="Monthly goals vs what each person actually logged in the CRM.">
          <Button variant="outline" onClick={() => setMonth(shiftMonth(month, -1))}>‹</Button>
          <span className="self-center font-medium w-36 text-center">{label}</span>
          <Button variant="outline" onClick={() => setMonth(shiftMonth(month, 1))}>›</Button>
          {isAdmin && <Button variant="outline" onClick={copyLast}><Copy className="h-4 w-4 mr-1" /> Copy last month's targets</Button>}
          {isAdmin && <Button onClick={() => setEditing({ userName: data?.users?.[0] || "", goals: {} })} className="bg-blue-600 hover:bg-blue-700">Set targets</Button>}
        </PageHeader>
        {data?.rows?.length === 0 && <p className="text-sm text-gray-500">No targets or activity for {label} yet.</p>}
        <div className="grid gap-3">
          {data?.rows?.map((r, i) => (
            <Card key={r.userName}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${i === 0 && r.overall !== null ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-200"}`}>{i + 1}</span>
                    <div>
                      <p className="font-medium">{r.userName}</p>
                      <p className="text-xs text-gray-500">{r.overall === null ? "No targets set" : `${r.overall}% of targets on average`}</p>
                    </div>
                  </div>
                  {isAdmin && <Button size="sm" variant="ghost" onClick={() => setEditing({ userName: r.userName, goals: { ...(r.goals || {}) } })}><Edit className="h-4 w-4 mr-1" /> Targets</Button>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {METRICS.map((m) => {
                    const goal = r.goals?.[m.key] || 0;
                    const actual = r.actuals[m.key] || 0;
                    return (
                      <div key={m.key} className="space-y-1">
                        <p className="text-xs text-gray-500">{m.label}</p>
                        <p className="text-sm font-semibold">{fmt(m, actual)}{goal ? <span className="text-gray-400 font-normal"> / {fmt(m, goal)}</span> : null}</p>
                        {goal > 0 && <Bar value={actual} goal={goal} />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-gray-400">Calls, emails, WhatsApps and meetings count activities logged by that person. New leads = leads they created or own. Won and revenue = deals they own that moved to Won this month.</p>
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Targets for {label}</DialogTitle>
              <DialogDescription>Leave a goal at 0 to not track it.</DialogDescription>
            </DialogHeader>
            {editing && (
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <Label>Team member</Label>
                  <Select value={editing.userName} onValueChange={(v) => setEditing({ userName: v, goals: { ...(data?.rows?.find((r) => r.userName === v)?.goals || {}) } })}>
                    <SelectTrigger><SelectValue placeholder="Pick a person" /></SelectTrigger>
                    <SelectContent>{(data?.users || []).map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {METRICS.map((m) => (
                    <div key={m.key} className="grid gap-1">
                      <Label>{m.label}{m.money ? " (₹)" : ""}</Label>
                      <Input type="number" min="0" value={editing.goals[m.key] ?? 0} onChange={(e) => setEditing({ ...editing, goals: { ...editing.goals, [m.key]: e.target.value } })} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                  <Button onClick={save} disabled={!editing.userName} className="bg-blue-600 hover:bg-blue-700">Save</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SalesRoute>
  );
};

export default Targets;
