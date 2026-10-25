import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Shared page header for CRM pages: back to /crm, icon + title, subtitle, actions on the right.
const PageHeader = ({ icon: Icon, title, subtitle, children, back = "/crm" }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(back)} title="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
            {Icon && <Icon className="h-6 w-6 text-brand" />} {title}
          </h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
};

export const Stat = ({ label, value, sub, tone }) => (
  <Card>
    <CardContent className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${tone === "bad" ? "text-red-600" : tone === "good" ? "text-green-700" : ""}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </CardContent>
  </Card>
);

export const Pill = ({ children, className = "" }) => <span className={`text-xs rounded-full px-2 py-0.5 whitespace-nowrap ${className}`}>{children}</span>;

export default PageHeader;
