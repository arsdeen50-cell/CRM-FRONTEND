import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import CrmMemberRoute from "./CrmMemberRoute";
import { useAccess } from "./AccessRoute";
import { visibleNav } from "@/constants/nav";

// Workspace home: every area this person can use, grouped like the sidebar.
const Crm = () => {
  const { user } = useSelector((s) => s.auth);
  const a = useAccess();
  const groups = visibleNav({ admin: a.isAdmin, sales: a.canSales, outreach: a.canOutreach, teamLead: a.isTeamLead }, user).filter((g) => g.key !== "home");
  return (
    <CrmMemberRoute>
      <div className="space-y-6">
        <div>
          <h1 className="title">Workspace</h1>
          <p className="text-sm text-muted-foreground">Everything you can use, in one place. Tip: press Ctrl/⌘ + K to jump anywhere.</p>
        </div>
        {groups.map((g) => (
          <section key={g.key} className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.title}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {g.items.map((i) => (
                <Link key={i.label} to={i.to} className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition hover:border-brand/40 hover:shadow-md">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"><i.icon className="h-[18px] w-[18px]" /></span>
                  <span className="text-sm font-medium group-hover:text-foreground">{i.label}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </CrmMemberRoute>
  );
};

export default Crm;
