import React, { useEffect, useState } from "react";
import { Crown, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosInstance from "@/utils/axiosConfig";

/* Put a person in one or more teams, with a sub-role in each, and choose which teams they lead. */
const UserTeamsDialog = ({ user, teams, onOpenChange, onSaved }) => {
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (user) setRows((user.teams || []).map((t) => ({ team: String(t.team), subRole: t.subRole || "", isLead: !!t.isLead })));
  }, [user]);
  if (!user) return null;
  const active = teams.filter((t) => t.isActive || rows.some((r) => r.team === String(t._id)));
  const teamOf = (id) => teams.find((t) => String(t._id) === id);
  const set = (i, patch) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const free = active.filter((t) => !rows.some((r) => r.team === String(t._id)));

  const save = async () => {
    if (rows.some((r) => !r.team)) return toast.error("Pick a team on every row");
    setSaving(true);
    try {
      await axiosInstance.put(`/v1/team/members/${user._id}`, { teams: rows });
      toast.success(`Teams saved for ${user.fullname}`);
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save teams");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Teams for {user.fullname}</DialogTitle>
          <DialogDescription>
            A Team Lead sees their team's leads, proposals and projects, and approves the team's leave. Everyone else sees their own work.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {rows.length === 0 && <p className="text-sm text-gray-500">Not in any team yet.</p>}
          {rows.map((r, i) => {
            const t = teamOf(r.team);
            return (
              <div key={i} className="flex flex-wrap items-center gap-2 border rounded-md p-2">
                <Select value={r.team} onValueChange={(v) => set(i, { team: v, subRole: "" })}>
                  <SelectTrigger className="w-52"><SelectValue placeholder="Team" /></SelectTrigger>
                  <SelectContent>
                    {[t, ...free].filter(Boolean).map((x) => <SelectItem key={x._id} value={String(x._id)}>{x.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={r.subRole || "none"} onValueChange={(v) => set(i, { subRole: v === "none" ? "" : v })} disabled={!t}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Sub-role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No sub-role</SelectItem>
                    {(t?.subRoles || []).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <label className={`text-sm flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer ${r.isLead ? "bg-amber-100 text-amber-800" : ""}`}>
                  <input type="checkbox" checked={r.isLead} onChange={(e) => set(i, { isLead: e.target.checked })} />
                  <Crown className="h-3 w-3" /> Team Lead
                </label>
                <Button size="icon" variant="ghost" className="ml-auto text-red-600" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            );
          })}
          <Button variant="outline" size="sm" className="w-fit" disabled={!free.length} onClick={() => setRows((rs) => [...rs, { team: String(free[0]._id), subRole: "", isLead: false }])}>
            <Plus className="h-4 w-4 mr-1" /> Add to a team
          </Button>
          {user.role === "admin" && <p className="text-xs text-gray-500">This person is an admin, so they already see every team.</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? "Saving..." : "Save teams"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserTeamsDialog;
