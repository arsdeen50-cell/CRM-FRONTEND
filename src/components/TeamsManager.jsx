import React, { useState } from "react";
import { Crown, Edit, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import axiosInstance from "@/utils/axiosConfig";

const TeamEditor = ({ team, onOpenChange, onSaved }) => {
  const [f, setF] = useState(() => ({ name: team?.name || "", description: team?.description || "", color: team?.color || "#2563eb", subRoles: (team?.subRoles || []).join("\n") }));
  const save = async () => {
    if (!f.name.trim()) return toast.error("Name the team");
    const payload = { ...f, subRoles: f.subRoles.split("\n").map((s) => s.trim()).filter(Boolean) };
    try {
      if (team?._id) await axiosInstance.put(`/v1/team/${team._id}`, payload);
      else await axiosInstance.post("/v1/team", payload);
      toast.success("Team saved");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    }
  };
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{team?._id ? `Edit ${team.name}` : "New team"}</DialogTitle>
          <DialogDescription>Renaming a team also updates the people in it and leads assigned to it.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="grid gap-1"><Label>Team / department name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. SMM Team" /></div>
            <div className="grid gap-1"><Label>Colour</Label><Input type="color" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} className="h-10 w-16 p-1" /></div>
          </div>
          <div className="grid gap-1"><Label>Description (optional)</Label><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="grid gap-1"><Label>Sub-roles (one per line)</Label><Textarea rows={5} value={f.subRoles} onChange={(e) => setF({ ...f, subRoles: e.target.value })} placeholder={"Social Strategist\nContent Creator\nAd Manager"} /></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save} className="bg-blue-600 hover:bg-blue-700">Save team</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* Admin view of all teams: sub-roles, leads and members. People are added to teams from the Users tab. */
const TeamsManager = ({ teams, reload }) => {
  const [editing, setEditing] = useState(null);
  const toggle = async (t) => {
    await axiosInstance.put(`/v1/team/${t._id}`, { isActive: !t.isActive }).catch((e) => toast.error(e.response?.data?.message || "Could not update"));
    reload();
  };
  const remove = async (t) => {
    if (!window.confirm(`Delete ${t.name}?`)) return;
    try {
      await axiosInstance.delete(`/v1/team/${t._id}`);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    }
  };
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Each team (department) has its own sub-roles. Add people from the Users tab.</p>
        <Button onClick={() => setEditing({})} className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-1" /> New team</Button>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {teams.map((t) => (
          <Card key={t._id} className={t.isActive ? "" : "opacity-60"}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                  <div>
                    <p className="font-medium">{t.name}{!t.isActive && <span className="text-xs text-gray-500"> (off)</span>}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Users className="h-3 w-3" /> {t.members?.length || 0} people</p>
                  </div>
                </div>
                <div className="flex">
                  <Button size="sm" variant="ghost" onClick={() => toggle(t)}>{t.isActive ? "Turn off" : "Turn on"}</Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditing(t)}><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-red-600" onClick={() => remove(t)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              {t.description && <p className="text-sm text-gray-600 dark:text-gray-300">{t.description}</p>}
              <div className="flex flex-wrap gap-1">
                {(t.subRoles || []).map((s) => <span key={s} className="text-xs border rounded-full px-2 py-0.5">{s}</span>)}
                {!t.subRoles?.length && <span className="text-xs text-gray-400">No sub-roles yet</span>}
              </div>
              <div className="space-y-1">
                {(t.members || []).map((m) => (
                  <p key={m._id} className="text-sm flex items-center gap-1">
                    {m.isLead && <Crown className="h-3 w-3 text-amber-600" />}
                    <span className={m.isLead ? "font-medium" : ""}>{m.fullname}</span>
                    {m.subRole && <span className="text-xs text-gray-500">· {m.subRole}</span>}
                  </p>
                ))}
                {!t.members?.length && <p className="text-xs text-gray-400">Nobody in this team yet.</p>}
                {t.members?.length > 0 && !t.members.some((m) => m.isLead) && <p className="text-xs text-amber-700">No Team Lead set</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {editing && <TeamEditor team={editing} onOpenChange={(o) => !o && setEditing(null)} onSaved={reload} />}
    </div>
  );
};

export default TeamsManager;
