import React from "react";
import { Route, Navigate } from "react-router-dom";

const Protec = ({ children }) => {
  const isLogin = localStorage.getItem("isLogin");

  if (isLogin) {
    return <>{children}</>;
  } else {
    // Redirect to the login page if not logged in
    return <Navigate to="/login" replace />;
  }
};

export default Protec;
