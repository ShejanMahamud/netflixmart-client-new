import cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface Props {
  children: ReactNode;
}

interface User {
  id: string;
  email: string;
  role: string;
}

const AdminRoute: React.FC<Props> = ({ children }) => {
  const { pathname } = useLocation();
  const token = cookies.get("token") as string;
  const user = jwtDecode(token) as User | null;
  if (!token) {
    return <Navigate to="/auth/login" replace state={pathname} />;
  }
  if (user && user.role !== "admin") {
    return <Navigate to="/auth/login" replace state={pathname} />;
  }

  return children;
};

export default AdminRoute;
