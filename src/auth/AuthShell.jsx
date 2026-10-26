import React from "react";
import { CalendarCheck, Target, Wallet } from "lucide-react";
import darkText from "@/assets/blacktext.png";
import whiteText from "@/assets/whitetext.png";
import { BRAND } from "@/constants/brand";

const DEFAULT_POINTS = ["Attendance, leave and payroll in one place", "Leads, follow-ups and proposals clients sign online", "Invoices, retainers and profit per client"];
const POINTS = [CalendarCheck, Target, Wallet].map((icon, i) => ({ icon, text: BRAND.points[i] || DEFAULT_POINTS[i] }));
const TAGLINE = BRAND.tagline || "Run your whole agency from one calm place.";
// A client's logo sits on a white chip so it reads on the dark panel whatever its background
const Logo = ({ className }) =>
  BRAND.logo ? (
    <span className={`inline-flex items-center rounded-lg bg-white px-3 py-2 ${className}`}><img src={BRAND.logo} alt={BRAND.name} className="h-8 w-auto" /></span>
  ) : null;

/* Split-screen frame for login, signup and password reset: brand panel on large screens, form on the right. */
const AuthShell = ({ title, subtitle, children, wide = false }) => (
  <div className="grid min-h-screen bg-background lg:grid-cols-[1fr_1.1fr]">
    <div className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-zinc-50 lg:flex">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />
      {BRAND.logo ? <Logo className="relative self-start" /> : <img src={whiteText} alt={BRAND.name} className="relative h-9 w-auto self-start" />}
      <div className="relative space-y-6">
        <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">{TAGLINE}</h2>
        <ul className="space-y-3">
          {POINTS.map((p) => (
            <li key={p.text} className="flex items-center gap-3 text-sm text-zinc-300">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"><p.icon className="h-4 w-4" /></span>
              {p.text}
            </li>
          ))}
        </ul>
      </div>
      <p className="relative text-xs text-zinc-500">© {new Date().getFullYear()} {BRAND.name}</p>
    </div>
    <div className="flex items-center justify-center px-4 py-10 sm:px-8">
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-sm"} space-y-6`}>
        <div className="flex justify-center lg:hidden">
          {BRAND.logo ? (
            <Logo />
          ) : (
            <>
              <img src={darkText} alt={BRAND.name} className="h-8 w-auto dark:hidden" />
              <img src={whiteText} alt={BRAND.name} className="hidden h-8 w-auto dark:block" />
            </>
          )}
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
