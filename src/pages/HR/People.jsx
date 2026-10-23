import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Users, Search, Crown, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import axiosInstance from "@/utils/axiosConfig";
import { HrHeader, fmtDate } from "./hrShared";

const STATUS_STYLE = { Active: "bg-green-100 text-green-700", Probation: "bg-amber-100 text-amber-800", "Notice Period": "bg-orange-100 text-orange-700", Exited: "bg-gray-100 text-gray-500" };

const ImportOnboarding = ({ onClose, onDone }) => {
  const [list, setList] = useState(null);
  useEffect(() => {
    axiosInstance.get("/v1/onboarding", { params: { limit: 200 } }).then((r) => setList(r.data.data || r.data.onboardings || r.data.goOnBoardings || [])).catch(() => setList([]));
  }, []);
  const run = async (o) => {
    try {
      const r = await axiosInstance.post(`/v1/hr/employees/from-onboarding/${o._id}`);
      toast.success(`Profile updated for ${o.candidateName}`);
      onDone(r.data.userId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not import");
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a profile from onboarding</DialogTitle>
          <DialogDescription>Copies joining date, designation, personal, bank and statutory details and links their documents. The person needs a CRM login with the same email first.</DialogDescription>
        </DialogHeader>
        {!list && <p className="text-sm text-gray-500">Loading...</p>}
        {list?.length === 0 && <p className="text-sm text-gray-500">No onboarding records.</p>}
        <div className="space-y-2">
          {(list || []).map((o) => (
            <div key={o._id} className="flex items-center justify-between border rounded-md p-2">
              <div><p className="font-medium text-sm">{o.candidateName}</p><p className="text-xs text-gray-500">{o.email} · {o.designation || "—"} · joins {fmtDate(o.doj)}</p></div>
              <Button size="sm" variant="outline" onClick={() => run(o)}>Import</Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const People = () => {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const admin = user?.role === "admin";
  const [people, setPeople] = useState([]);
  const [q, setQ] = useState("");
  const [team, setTeam] = useState("all");
  const [status, setStatus] = useState("current");
  const [importing, setImporting] = useState(false);
  useEffect(() => {
    axiosInstance.get("/v1/hr/employees").then((r) => setPeople(r.data.people || [])).catch(() => toast.error("Could not load people"));
  }, []);
  const teams = useMemo(() => [...new Set(people.flatMap((p) => p.teams.map((t) => t.teamName)))].sort(), [people]);
  const shown = people.filter(
    (p) =>
      (!q || `${p.fullname} ${p.email} ${p.designation}`.toLowerCase().includes(q.toLowerCase())) &&
      (team === "all" || p.teams.some((t) => t.teamName === team)) &&
      (status === "all" || (status === "current" ? p.status !== "Exited" : p.status === "Exited"))
  );
  return (
    <div className="p-4 md:p-6 space-y-4">
      <HrHeader icon={Users} title="People" subtitle={`${shown.length} of ${people.length} people`}>
        {admin && <Button variant="outline" onClick={() => setImporting(true)}><UserPlus className="h-4 w-4 mr-1" /> From onboarding</Button>}
      </HrHeader>
      <div className="flex flex-wrap gap-2">
        <div className="relative"><Search className="h-4 w-4 absolute left-2 top-3 text-gray-400" /><Input className="pl-8 w-64" placeholder="Search name, email, designation" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={team} onValueChange={setTeam}><SelectTrigger className="w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All teams</SelectItem>{teams.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="current">Current staff</SelectItem><SelectItem value="exited">Exited</SelectItem><SelectItem value="all">Everyone</SelectItem></SelectContent></Select>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {shown.map((p) => (
          <Card key={p._id} className="cursor-pointer hover:shadow-md transition" onClick={() => navigate(`/hr/people/${p._id}`)}>
            <CardContent className="p-4 flex gap-3">
              {p.photo ? <img src={p.photo} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold">{(p.fullname || "?")[0]}</div>}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><p className="font-medium truncate">{p.fullname}</p>{p.status !== "Active" && <span className={`text-xs rounded-full px-2 ${STATUS_STYLE[p.status] || ""}`}>{p.status}</span>}</div>
                <p className="text-sm text-gray-500 truncate">{p.designation || (p.role === "admin" ? "Admin" : "—")}</p>
                <p className="text-xs text-gray-500 truncate">{p.email}</p>
                <div className="flex flex-wrap gap-1 mt-1">{p.teams.map((t) => <span key={t.teamName} className="text-xs border rounded-full px-2 flex items-center gap-1">{t.isLead && <Crown className="h-3 w-3 text-amber-600" />}{t.teamName}{t.subRole ? ` · ${t.subRole}` : ""}</span>)}</div>
                {p.dateOfJoining && <p className="text-xs text-gray-400 mt-1">Joined {fmtDate(p.dateOfJoining)}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {importing && <ImportOnboarding onClose={() => setImporting(false)} onDone={(id) => { setImporting(false); navigate(`/hr/people/${id}`); }} />}
    </div>
  );
};

export default People;
