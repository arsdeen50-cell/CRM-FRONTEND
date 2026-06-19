import React from "react";
import { useSelector } from "react-redux"; 

import { Navigate } from "react-router-dom"; 

const EmployeeRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === "employee") {
    return null; 
  }
  return children;
};

export default EmployeeRoute;
