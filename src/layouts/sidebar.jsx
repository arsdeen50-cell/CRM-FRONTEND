import { forwardRef, useState } from "react";
import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { ChevronDown } from "lucide-react";
import logoLight from "@/assets/white.png";
import logoDark from "@/assets/black.png";
import { cn } from "@/utils/cn";
import { visibleNav } from "@/constants/nav";
import { BRAND } from "@/constants/brand";
import { useAccess } from "@/components/crm/AccessRoute";

const STORE = "crm.sidebar.closedGroups";
const readClosed = () => {
  try {
    return JSON.parse(localStorage.getItem(STORE) || "[]");
  } catch {
    return [];
  }
};

/* Grouped navigation. Expanded: section titles you can fold; collapsed: icons with tooltips.
   On phones it slides in as a drawer and closes after you pick a page. */
export const Sidebar = forwardRef(({ collapsed, onNavigate }, ref) => {
  const { user } = useSelector((state) => state.auth);
  const access = useAccess();
  const groups = visibleNav({ admin: access.isAdmin, sales: access.canSales, outreach: access.canOutreach, teamLead: access.isTeamLead }, user);
  const [closed, setClosed] = useState(readClosed);
  const toggle = (key) => {
    const next = closed.includes(key) ? closed.filter((k) => k !== key) : [...closed, key];
    setClosed(next);
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
    } catch {
      /* private mode */
    }
  };

  return (
    <aside
      ref={ref}
      className={cn(
        "fixed z-[45] flex h-full w-[248px] flex-col overflow-x-hidden border-r border-border bg-card [transition:_width_250ms_ease,_left_250ms_ease]",
        collapsed ? "md:w-[68px]" : "md:w-[248px]",
        collapsed ? "max-md:-left-full" : "max-md:left-0 max-md:shadow-2xl",
      )}
    >
      <div className={cn("flex h-[60px] shrink-0 items-center gap-2 border-b border-border px-4", collapsed && "md:justify-center md:px-0")}>
        {BRAND.logo ? (
          // A client's own logo: the full logo when open, its square mark when the sidebar is collapsed
          <span className="flex h-9 items-center rounded-md bg-white px-1.5">
            <img src={collapsed && BRAND.mark ? BRAND.mark : BRAND.logo} alt={BRAND.name} className={cn("w-auto object-contain", collapsed ? "h-6 max-w-[40px]" : "h-7 max-w-[180px]")} />
          </span>
        ) : (
          <>
            <img src={logoDark} alt={BRAND.name} className="h-7 w-auto dark:hidden" />
            <img src={logoLight} alt={BRAND.name} className="hidden h-7 w-auto dark:block" />
            {!collapsed && <span className="text-sm font-semibold tracking-wide">{BRAND.name}</span>}
          </>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden p-2 [scrollbar-width:_thin]">
        {groups.map((g) => {
          const isClosed = closed.includes(g.key) && !collapsed;
          return (
            <div key={g.key} className="flex flex-col gap-0.5">
              {g.key !== "home" &&
                (collapsed ? (
                  <div className="mx-auto my-2 hidden h-px w-6 bg-border md:block" />
                ) : (
                  <button type="button" onClick={() => toggle(g.key)} className="sidebar-group-title flex items-center justify-between rounded-md hover:text-foreground">
                    {g.title}
                    <ChevronDown className={cn("h-3 w-3 transition-transform", isClosed && "-rotate-90")} />
                  </button>
                ))}
              {!isClosed &&
                g.items.map((item) => (
                  <NavLink key={item.label} to={item.to} end={item.end} title={collapsed ? item.label : undefined} onClick={onNavigate} className={({ isActive }) => cn("sidebar-item", isActive && "active", collapsed && "md:justify-center md:px-0")}>
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {(!collapsed || window.innerWidth < 768) && <span className="truncate">{item.label}</span>}
                  </NavLink>
                ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
});

Sidebar.displayName = "Sidebar";
Sidebar.propTypes = { collapsed: PropTypes.bool, onNavigate: PropTypes.func };
