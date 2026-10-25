import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Contact, UserCircle, Target } from "lucide-react";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import axiosInstance from "@/utils/axiosConfig";
import { visibleNav } from "@/constants/nav";
import { useAccess } from "@/components/crm/AccessRoute";

/* Ctrl+K / Cmd+K: jump to any page you can use, or find a client, lead or person by name. */
const CommandPalette = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const access = useAccess();
  const [q, setQ] = useState("");
  const [people, setPeople] = useState(null);
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const timer = useRef(null);
  const pages = useMemo(() => visibleNav({ admin: access.isAdmin, sales: access.canSales, outreach: access.canOutreach, teamLead: access.isTeamLead }, user).flatMap((g) => g.items.map((i) => ({ ...i, group: g.title }))), [access.isAdmin, access.canSales, access.canOutreach, access.isTeamLead, user]);

  useEffect(() => {
    if (open && people === null) axiosInstance.get("/v1/hr/employees").then((r) => setPeople(r.data.people || [])).catch(() => setPeople([]));
    if (!open) setQ("");
  }, [open, people]);
  useEffect(() => {
    clearTimeout(timer.current);
    if (!access.canSales || q.trim().length < 2) {
      setClients([]);
      setLeads([]);
      return;
    }
    timer.current = setTimeout(() => {
      axiosInstance.get("/v1/leadclient", { params: { search: q.trim() } }).then((r) => setClients((r.data.clients || []).slice(0, 6))).catch(() => setClients([]));
      axiosInstance.get("/v1/leadsource").then((r) => setLeads((r.data.leads || []).filter((l) => `${l.clientName} ${l.series}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6))).catch(() => setLeads([]));
    }, 250);
    return () => clearTimeout(timer.current);
  }, [q, access.canSales]);

  const go = (to) => {
    onOpenChange(false);
    navigate(to);
  };
  const ppl = (people || []).filter((p) => p.loginActive !== false && q && p.fullname.toLowerCase().includes(q.toLowerCase())).slice(0, 6);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, clients, leads, people..." value={q} onValueChange={setQ} />
      <CommandList>
        <CommandEmpty>Nothing found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((p) => (
            <CommandItem key={p.label} value={`${p.label} ${p.group}`} onSelect={() => go(p.to)}>
              <p.icon className="mr-2 h-4 w-4" /> {p.label} <span className="ml-auto text-xs text-muted-foreground">{p.group}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        {clients.length > 0 && (
          <CommandGroup heading="Clients">
            {clients.map((c) => (
              <CommandItem key={c._id} value={`client ${c.brandName} ${c.contactPerson}`} onSelect={() => go("/crm/lead-list")}>
                <Contact className="mr-2 h-4 w-4" /> {c.brandName} <span className="ml-auto text-xs text-muted-foreground">{c.contactPerson}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {leads.length > 0 && (
          <CommandGroup heading="Leads">
            {leads.map((l) => (
              <CommandItem key={l._id} value={`lead ${l.clientName} ${l.series}`} onSelect={() => go("/crm/lead-source")}>
                <Target className="mr-2 h-4 w-4" /> {l.clientId?.brandName || l.clientName} <span className="ml-auto text-xs text-muted-foreground">{l.pipelineStage}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {ppl.length > 0 && (
          <CommandGroup heading="People">
            {ppl.map((p) => (
              <CommandItem key={p._id} value={`person ${p.fullname} ${p.designation}`} onSelect={() => go(`/hr/people/${p._id}`)}>
                <UserCircle className="mr-2 h-4 w-4" /> {p.fullname} <span className="ml-auto text-xs text-muted-foreground">{p.designation}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
