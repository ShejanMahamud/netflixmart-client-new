import cookies from "js-cookie";
import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface Props {
  children: ReactNode;
}

const PrivateRoute: React.FC<Props> = ({ children }) => {
  const { pathname } = useLocation();
  const token = cookies.get("token");
  if (!token) {
    return <Navigate to="/auth/login" replace state={pathname} />;
  }
  return children;
};

export default PrivateRoute;
