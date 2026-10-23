import React from "react";
import {
  BarChart3,
  Users,
  CalendarDays,
  Target,
  Briefcase,
  FileText,
  CalendarClock,
  FileUp,
  MessageSquareText,
  History,
  Inbox,
  Repeat,
  ClipboardList,
  Trophy,
  Receipt,
  Repeat2,
  CalendarRange,
  KeyRound,
  Timer,
  TrendingUp,
  Plug,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CrmMemberRoute, { useIsAdmin } from "./CrmMemberRoute";
import { useAccess } from "./AccessRoute";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const Crm = () => {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { canSales, canOutreach } = useAccess();

  const allCards = [
    {
      title: "Sales Pipeline",
      icon: <BarChart3 className="text-blue-600" size={20} />,
      options: [
        // { label: "Leads", need: "sales", icon: <Users size={18} className="text-blue-500" /> },
         {
          label: "Current cliental", need: "sales",
          icon: <Users size={18} className="text-blue-500" />,
          route: "/crm/lead-list",
        },
        {
          label: "Leads", need: "sales",
          icon: <Target size={18} className="text-blue-500" />,
          route: "/crm/lead-source",
        },
        {
          label: "Follow-ups", need: "sales",
          icon: <CalendarClock size={18} className="text-blue-500" />,
          route: "/crm/follow-ups",
        },
        {
          label: "Proposals", need: "sales",
          icon: <FileText size={18} className="text-blue-500" />,
          route: "/crm/proposals",
        },
      ],
    },
    {
      title: "Outreach & Automation",
      icon: <Repeat className="text-amber-600" size={20} />,
      options: [
        { label: "Messages", need: "outreach", icon: <Inbox size={18} className="text-amber-500" />, route: "/crm/messages" },
        { label: "Sequences", need: "outreach", icon: <Repeat size={18} className="text-amber-500" />, route: "/crm/sequences" },
        { label: "Targets", need: "sales", icon: <Trophy size={18} className="text-amber-500" />, route: "/crm/targets" },
        { label: "Lead capture", icon: <ClipboardList size={18} className="text-amber-500" />, route: "/crm/lead-forms", adminOnly: true },
      ],
    },
    {
      title: "Agency Operations",
      icon: <Briefcase className="text-emerald-600" size={20} />,
      options: [
        { label: "Projects", icon: <Briefcase size={18} className="text-emerald-500" />, route: "/crm/projects" },
        { label: "Content calendar", icon: <CalendarRange size={18} className="text-emerald-500" />, route: "/crm/content" },
        { label: "Time tracking", icon: <Timer size={18} className="text-emerald-500" />, route: "/crm/time" },
        { label: "Invoices", icon: <Receipt size={18} className="text-emerald-500" />, route: "/crm/invoices", adminOnly: true },
        { label: "Retainers", icon: <Repeat2 size={18} className="text-emerald-500" />, route: "/crm/retainers", adminOnly: true },
        { label: "Client portal", icon: <KeyRound size={18} className="text-emerald-500" />, route: "/crm/portal", adminOnly: true },
        { label: "Profit per client", icon: <TrendingUp size={18} className="text-emerald-500" />, route: "/crm/profitability", adminOnly: true },
      ],
    },
    {
      title: "Sales Tools",
      adminOnly: true,
      icon: <BarChart3 className="text-indigo-600" size={20} />,
      options: [
        { label: "Reports", icon: <BarChart3 size={18} className="text-indigo-500" />, route: "/crm/reports" },
        { label: "Import CSV", icon: <FileUp size={18} className="text-indigo-500" />, route: "/crm/import" },
        { label: "Templates", icon: <MessageSquareText size={18} className="text-indigo-500" />, route: "/crm/templates" },
        { label: "Audit log", icon: <History size={18} className="text-indigo-500" />, route: "/crm/audit-log" },
        { label: "Integrations", icon: <Plug size={18} className="text-indigo-500" />, route: "/crm/integrations" },
      ],
    },
    {
      title: "HR Management",
      adminOnly: true,
      icon: <Users className="text-green-600" size={20} />,
      options: [
        {
          label: "Go OnBoarding",
          icon: <FileText size={18} className="text-green-500" />,
          route: "/crm/goonboardingdata",
        },
        // {
        //   label: "Active Deals",
        //   icon: <Briefcase size={18} className="text-green-500" />,
        // },
        // {
        //   label: "Feedbacks",
        //   icon: <Target size={18} className="text-green-500" />,
        // },
      ],
    },
    // {
    //   title: "Reports & Analytics",
    //   icon: <BarChart3 className="text-indigo-600" size={20} />,
    //   options: [
    //     {
    //       label: "Daily Reports",
    //       icon: <FileText size={18} className="text-indigo-500" />,
    //     },
    //     {
    //       label: "Monthly Reports",
    //       icon: <CalendarDays size={18} className="text-indigo-500" />,
    //     },
    //     {
    //       label: "Custom Exports",
    //       icon: <Target size={18} className="text-indigo-500" />,
    //     },
    //   ],
    // },
  ];

  const cards = allCards
    .filter((c) => isAdmin || !c.adminOnly)
    .map((c) => ({
      ...c,
      options: c.options.filter((o) => (isAdmin || !o.adminOnly) && (o.need !== "sales" || canSales) && (o.need !== "outreach" || canOutreach)),
    }))
    .filter((c) => c.options.length);

  return (
    <CrmMemberRoute>
      <div className="py-8 px-4">
        <h1 className="lg:text-2xl text-md font-semibold mb-6">
          Reports & Masters
        </h1>

        {/* Accordion Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
          {cards.map((card, index) => (
            <Accordion type="single" collapsible key={index}>
              <AccordionItem
                value={`item-${index}`}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700"
              >
                <AccordionTrigger className="flex items-center gap-3 p-4 text-lg font-semibold text-gray-800 dark:text-gray-100 hover:no-underline">
                  <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center w-9 h-9">
                    {card.icon}
                  </div>
                  {card.title}
                </AccordionTrigger>

                <AccordionContent className="p-4 flex flex-row flex-wrap gap-x-10 gap-y-3 items-center">
                  {card.options.map((opt, i) => (
                    <div
                      key={i}
                      className="flex flex-row items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer"
                      onClick={() => {
                        if (opt.route) navigate(opt.route);
                      }}
                    >
                      <div className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-slate-800 rounded-md">
                        {opt.icon}
                      </div>
                      <p className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                        {opt.label}
                      </p>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </div>
      </div>
    </CrmMemberRoute>
  );
};

export default Crm;
