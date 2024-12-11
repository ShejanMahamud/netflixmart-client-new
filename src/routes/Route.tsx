import { createBrowserRouter, Navigate } from "react-router-dom";
import Conversation from "../components/conversation/Conversation";
import MessageInbox from "../components/inbox/MessageInbox";
import RootLayout from "../layouts/RootLayout";
import Accounts from "../pages/Accounts";
import Login from "../pages/Auth/Login";
import LoginSuccess from "../pages/Auth/LoginSuccess";
import ReqPasswordReset from "../pages/Auth/PasswordReset";
import Register from "../pages/Auth/Register";
import VerifyLink from "../pages/Auth/VerifyLink";
import Error from "../pages/Error";
import Home from "../pages/Home";
import Notification from "../pages/Notification";
import Orders from "../pages/Orders";
import Products from "../pages/Products";
import Settings from "../pages/Settings";
import ProductsUser from "../pages/UserDash/Products";
import UserManagement from "../pages/UserManagement";
import Verify from "../pages/Verify";
import AdminRoute from "./AdminRoute";
import PrivateRoute from "./PrivateRoute";
const Route = createBrowserRouter([
  {
    path: "/",
    element: (
      <PrivateRoute>
        <RootLayout />
      </PrivateRoute>
    ),
    children: [
      {
        path: "/",
        element: <Navigate to="/overview" replace />,
      },
      {
        path: "/chats",
        element: <Navigate to="/c/chats" replace />,
      },
      {
        path: "/overview",
        element: <Home />,
      },
      {
        path: "/orders",
        element: <Orders />,
      },
      {
        path: "/accounts",
        element: (
          <AdminRoute>
            <Accounts />
          </AdminRoute>
        ),
      },
      {
        path: "/user/products",
        element: <ProductsUser />,
      },
      {
        path: "/products",
        element: <Products />,
      },
      {
        path: "/users",
        element: <UserManagement />,
      },
      {
        path: "/orders",
        element: <Orders />,
      },
      {
        path: "/notification",
        element: <Notification />,
      },
      {
        path: "/settings",
        element: <Settings />,
      },
    ],
    errorElement: <Error />,
  },
  {
    path: "/auth/login",
    element: <Login />,
  },
  {
    path: "/auth/reset-password",
    element: <ReqPasswordReset />,
  },
  {
    path: "/auth/set-password",
    element: <VerifyLink />,
  },
  {
    path: "/auth/register",
    element: <Register />,
  },
  {
    path: "/c/:box",
    element: (
      <PrivateRoute>
        <Conversation />
      </PrivateRoute>
    ),
  },
  {
    path: "/chats/:id",
    element: (
      <PrivateRoute>
        <MessageInbox />
      </PrivateRoute>
    ),
  },
  {
    path: "/verify",
    element: <Verify />,
  },
  {
    path: "/auth/login-success",
    element: <LoginSuccess />,
  },
]);

export default Route;
