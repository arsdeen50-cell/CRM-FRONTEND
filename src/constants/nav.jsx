import {
  LayoutDashboard, CheckSquare, Target, Users, CalendarClock, FileText, Trophy, Inbox, Repeat, ClipboardList,
  Briefcase, CalendarRange, Timer, Receipt, Repeat2, TrendingUp, KeyRound, UserCircle, CalendarCheck, CalendarDays,
  Wallet, DoorOpen, UserPlus, Settings, ShieldCheck, BarChart3, FileUp, MessageSquareText, History, Plug, Contact,
} from "lucide-react";

/* Every page in one place. `show` decides who sees it (the API enforces access; this just hides links
   people can't use). ctx = { admin, sales, outreach, teamLead }. The sidebar, the CRM page and the
   Ctrl+K search all read this list. */
export const NAV_GROUPS = [
  {
    key: "home",
    title: "Home",
    items: [
      { label: "Dashboard", to: "/", icon: LayoutDashboard, end: true },
      { label: "Tasks", to: "/employeetask", icon: CheckSquare, show: (c) => c.admin },
      { label: "My tasks", to: "/task", icon: CheckSquare, show: (c) => !c.admin },
    ],
  },
  {
    key: "sales",
    title: "Sales",
    show: (c) => c.sales,
    items: [
      { label: "Leads", to: "/crm/lead-source", icon: Target },
      { label: "Clients", to: "/crm/lead-list", icon: Contact },
      { label: "Follow-ups", to: "/crm/follow-ups", icon: CalendarClock },
      { label: "Proposals", to: "/crm/proposals", icon: FileText },
      { label: "Targets", to: "/crm/targets", icon: Trophy },
    ],
  },
  {
    key: "outreach",
    title: "Outreach",
    show: (c) => c.outreach || c.admin,
    items: [
      { label: "Messages", to: "/crm/messages", icon: Inbox, show: (c) => c.outreach },
      { label: "Sequences", to: "/crm/sequences", icon: Repeat, show: (c) => c.outreach },
      { label: "Lead capture", to: "/crm/lead-forms", icon: ClipboardList, show: (c) => c.admin },
    ],
  },
  {
    key: "delivery",
    title: "Delivery",
    items: [
      { label: "Projects", to: "/crm/projects", icon: Briefcase },
      { label: "Content calendar", to: "/crm/content", icon: CalendarRange },
      { label: "Time tracking", to: "/crm/time", icon: Timer },
    ],
  },
  {
    key: "finance",
    title: "Finance",
    show: (c) => c.admin,
    items: [
      { label: "Invoices", to: "/crm/invoices", icon: Receipt },
      { label: "Retainers", to: "/crm/retainers", icon: Repeat2 },
      { label: "Profit per client", to: "/crm/profitability", icon: TrendingUp },
      { label: "Client portal", to: "/crm/portal", icon: KeyRound },
    ],
  },
  {
    key: "people",
    title: "People",
    items: [
      { label: "My profile", to: (u) => `/hr/people/${u?._id}`, icon: UserCircle },
      { label: "People", to: "/hr/people", icon: Users },
      { label: "Attendance", to: "/hr/attendance", icon: CalendarCheck },
      { label: "Leave", to: "/leave", icon: CalendarDays },
      { label: "Payroll", to: "/hr/payroll", icon: Wallet, show: (c) => c.admin },
      { label: "Onboarding", to: "/crm/goonboardingdata", icon: UserPlus, show: (c) => c.admin },
      { label: "Exits", to: "/hr/exits", icon: DoorOpen, show: (c) => c.admin },
    ],
  },
  {
    key: "admin",
    title: "Admin",
    show: (c) => c.admin,
    items: [
      { label: "Users & teams", to: "/rolebased", icon: ShieldCheck },
      { label: "Reports", to: "/crm/reports", icon: BarChart3 },
      { label: "HR settings", to: "/hr/settings", icon: Settings },
      { label: "Templates", to: "/crm/templates", icon: MessageSquareText },
      { label: "Import CSV", to: "/crm/import", icon: FileUp },
      { label: "Integrations", to: "/crm/integrations", icon: Plug },
      { label: "Audit log", to: "/crm/audit-log", icon: History },
    ],
  },
];

export const visibleNav = (ctx, user) =>
  NAV_GROUPS.filter((g) => !g.show || g.show(ctx))
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.show || i.show(ctx)).map((i) => ({ ...i, to: typeof i.to === "function" ? i.to(user) : i.to })) }))
    .filter((g) => g.items.length);
