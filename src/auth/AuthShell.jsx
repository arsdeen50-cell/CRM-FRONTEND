import React from "react";
import { CalendarCheck, Target, Wallet } from "lucide-react";
import darkText from "@/assets/blacktext.png";
import whiteText from "@/assets/whitetext.png";

const POINTS = [
  { icon: CalendarCheck, text: "Attendance, leave and payroll in one place" },
  { icon: Target, text: "Leads, follow-ups and proposals clients sign online" },
  { icon: Wallet, text: "Invoices, retainers and profit per client" },
];

/* Split-screen frame for login, signup and password reset: brand panel on large screens, form on the right. */
const AuthShell = ({ title, subtitle, children, wide = false }) => (
  <div className="grid min-h-screen bg-background lg:grid-cols-[1fr_1.1fr]">
    <div className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-zinc-50 lg:flex">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />
      <img src={whiteText} alt="ARSDEEN" className="relative h-9 w-auto self-start" />
      <div className="relative space-y-6">
        <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">Run your whole agency from one calm place.</h2>
        <ul className="space-y-3">
          {POINTS.map((p) => (
            <li key={p.text} className="flex items-center gap-3 text-sm text-zinc-300">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"><p.icon className="h-4 w-4" /></span>
              {p.text}
            </li>
          ))}
        </ul>
      </div>
      <p className="relative text-xs text-zinc-500">© {new Date().getFullYear()} ARSDEEN</p>
    </div>
    <div className="flex items-center justify-center px-4 py-10 sm:px-8">
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-sm"} space-y-6`}>
        <div className="flex justify-center lg:hidden">
          <img src={darkText} alt="ARSDEEN" className="h-8 w-auto dark:hidden" />
          <img src={whiteText} alt="ARSDEEN" className="hidden h-8 w-auto dark:block" />
        </div>
        <div className="space-y-1 text-center lg:text-left">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  </div>
);

export default AuthShell;
