import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const CrmRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  // If not logged in, send to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is not admin, show unauthorized message
  if (user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <h2 className="text-xl font-semibold text-red-600">
          You are not authorized to visit this site at this moment.
        </h2>
      </div>
    );
  }

  // Otherwise render the protected content
  return children;
};

export default CrmRoute;
