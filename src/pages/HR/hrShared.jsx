import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const LEAVE_TYPES = ["Sick", "Vacation", "Personal", "Other"];
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const thisMonth = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 7);
export const shiftMonth = (m, n) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1 + n, 1)).toISOString().slice(0, 7);
};
export const monthLabel = (m) => new Date(`${m}-15T00:00:00Z`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
export const inr = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
export const toInput = (d) => {
  if (!d) return "";
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

// Attendance day codes (same as the API) with colours and labels
export const DAY_CODES = {
  P: { label: "Present", cls: "bg-green-100 text-green-800" },
  HD: { label: "Half day", cls: "bg-lime-100 text-lime-800" },
  SH: { label: "Short day", cls: "bg-orange-100 text-orange-800" },
  MP: { label: "Missed punch-out", cls: "bg-amber-100 text-amber-800" },
  A: { label: "Absent", cls: "bg-red-100 text-red-700" },
  L: { label: "Leave", cls: "bg-blue-100 text-blue-800" },
  HL: { label: "Half-day leave", cls: "bg-sky-100 text-sky-800" },
  H: { label: "Holiday", cls: "bg-purple-100 text-purple-800" },
  WO: { label: "Weekly off", cls: "bg-gray-100 text-gray-500" },
};

export const HrHeader = ({ icon: Icon, title, subtitle, children, back = "/hr" }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(back)} title="Back"><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">{Icon && <Icon className="h-6 w-6 text-emerald-600" />} {title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
};

export const MonthPicker = ({ month, onChange }) => (
  <div className="flex items-center gap-1">
    <Button variant="outline" size="sm" onClick={() => onChange(shiftMonth(month, -1))}>‹</Button>
    <span className="w-36 text-center font-medium">{monthLabel(month)}</span>
    <Button variant="outline" size="sm" onClick={() => onChange(shiftMonth(month, 1))}>›</Button>
  </div>
);
