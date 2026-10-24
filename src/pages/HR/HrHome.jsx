import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Users, CalendarCheck, CalendarDays, Wallet, Settings, UserPlus, UserCircle, DoorOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useMyTeams } from "@/hooks/useTeams";

const HrHome = () => {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { isTeamLead } = useMyTeams();
  const admin = user?.role === "admin";
  const cards = [
    { title: "My profile", desc: "Personal details, documents, leave balance and payslips", icon: UserCircle, to: `/hr/people/${user?._id}` },
    { title: "People", desc: "Everyone in the company, their team and role", icon: Users, to: "/hr/people" },
    { title: admin || isTeamLead ? "Attendance" : "My attendance", desc: admin ? "Monthly sheet for everyone, corrections to approve, CSV export" : isTeamLead ? "Your team's monthly sheet and corrections to approve" : "Your month at a glance; ask for a correction", icon: CalendarCheck, to: "/hr/attendance" },
    { title: "Leave", desc: "Apply, see your balance, approve requests", icon: CalendarDays, to: "/leave" },
    ...(admin
      ? [
          { title: "Payroll", desc: "Salary structures, monthly payroll, payslips", icon: Wallet, to: "/hr/payroll" },
          { title: "Onboarding", desc: "Candidates, offer letters, joining documents", icon: UserPlus, to: "/crm/goonboardingdata" },
          { title: "Exits", desc: "Notice, handover, login cut-off, full & final, letters", icon: DoorOpen, to: "/hr/exits" },
          { title: "HR settings", desc: "Leave quotas, holidays, weekly offs, office timing", icon: Settings, to: "/hr/settings" },
        ]
      : []),
  ];
  return (
    <div className="py-8 px-4 space-y-4">
      <h1 className="text-2xl font-semibold">HR</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.title} className="cursor-pointer hover:shadow-md transition" onClick={() => navigate(c.to)}>
            <CardContent className="p-5 flex gap-4 items-start">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950"><c.icon className="h-6 w-6 text-emerald-600" /></div>
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-sm text-gray-500">{c.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HrHome;
