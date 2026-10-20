import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

// CRM pages any logged-in team member can use. The API limits employees to the leads assigned to them.
const CrmMemberRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export const useIsAdmin = () => useSelector((state) => state.auth.user?.role === "admin");

export default CrmMemberRoute;
