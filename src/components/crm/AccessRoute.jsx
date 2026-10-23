import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useMyTeams } from "@/hooks/useTeams";

const NoAccess = ({ area }) => (
  <div className="flex min-h-[60vh] items-center justify-center p-6">
    <div className="max-w-md text-center space-y-2">
      <Lock className="h-8 w-8 mx-auto text-gray-400" />
      <h2 className="text-lg font-semibold">{area} is limited to admins and the sales team</h2>
      <p className="text-sm text-gray-500">Ask an admin to add you to a team with {area.toLowerCase()} access in Role Based Access.</p>
      <Link to="/crm" className="text-sm text-blue-600 underline">Back to CRM</Link>
    </div>
  </div>
);

// Sales pages (leads, clients, follow-ups, proposals, targets): admins + teams with Sales access
export const SalesRoute = ({ children }) => {
  const { user } = useSelector((s) => s.auth);
  const me = useMyTeams();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return children;
  if (me.loading) return null;
  return me.canSales ? children : <NoAccess area="Sales" />;
};

// Outreach automation (messages, sequences): admins + teams with Outreach access
export const OutreachRoute = ({ children }) => {
  const { user } = useSelector((s) => s.auth);
  const me = useMyTeams();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return children;
  if (me.loading) return null;
  return me.canOutreach ? children : <NoAccess area="Outreach automation" />;
};

// For hiding buttons and links
export const useAccess = () => {
  const { user } = useSelector((s) => s.auth);
  const me = useMyTeams();
  const isAdmin = user?.role === "admin";
  return { isAdmin, loading: me.loading, canSales: isAdmin || !!me.canSales, canOutreach: isAdmin || !!me.canOutreach, isTeamLead: !!me.isTeamLead };
};
