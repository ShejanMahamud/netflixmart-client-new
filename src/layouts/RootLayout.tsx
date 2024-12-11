import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import HolyLoader from "holy-loader";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { AiOutlineProduct } from "react-icons/ai";
import { FiShoppingCart } from "react-icons/fi";
import {
  IoCloseOutline,
  IoMenuOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import {
  LuAppWindow,
  LuMessageCircle,
  LuSettings,
  LuShoppingCart,
  LuUserPlus,
  LuUsers,
} from "react-icons/lu";
import { RiStackFill } from "react-icons/ri";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Loading from "../components/Loading";
import Navbar from "../components/Navbar";
import useAxiosSecure from "../hooks/useAxiosSecure";
import Error from "../pages/Error";
import { requestPermission } from "./../config/firebase.config";

interface user {
  email: string;
  name: string;
  role: string;
  _id: string;
}
const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const UserDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const token = Cookies.get("token") as string;
  const axiosSecure = useAxiosSecure();
  const user = jwtDecode(token) as user;
  const { data: authUser, isLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const { data } = await axiosSecure.get(`/auth/user/me/${user.email}`);
        return data.data;
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Unauthorized",
          text: "You are not authorized to access this page",
        });
        console.log(error);
        Cookies.remove("token");
        navigate("/auth/login");
      }
    },
  });

  const {
    data: systemDetails,
    isLoading: systemDetailsLoading,
    error: systemDetailsError,
  } = useQuery({
    queryKey: ["system"],
    queryFn: async () => {
      const { data } = await axiosSecure.get(`/system/info`);
      return data.data;
    },
  });

  const { mutateAsync: logOut } = useMutation({
    mutationFn: async () => {
      const { data } = await axiosSecure.post(`/auth/user/logout`);
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        Cookies.remove("token");
        notification.success({
          message: "Logout",
          description: "You have been logged out successfully",
        });
        navigate("/auth/login");
      }
    },
  });

  useEffect(() => {
    if (isMobile) {
      requestPermission();
    }
  }, []);

  if (isLoading || systemDetailsLoading) {
    return <Loading />;
  }

  if (systemDetailsError) {
    return <Error />;
  }

  return (
    <>
      <HolyLoader color="#22C55E" showSpinner />
      <div className="w-full h-screen lg:grid lg:grid-cols-[20%_80%] grid grid-cols-[1fr]">
        <button
          className="hidden fixed top-2 z-50 bg-black text-white p-2 "
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <IoCloseOutline /> : <IoMenuOutline />}
        </button>

        <div
          className={`fixed lg:static top-0 left-0 w-full  h-full bg-[#181818] py-5 px-5 lg:px-3 lg:px-5 overflow-y-auto transform transition-transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 z-20`}
        >
          <img
            src={systemDetails?.logo}
            alt=""
            className="w-full object-cover"
          />
          <div className="w-full flex flex-col items-start">
            <NavLink
              end
              className={({ isActive }) =>
                isActive
                  ? "bg-[#030303] text-white rounded-lg w-full flex items-center gap-3 py-3 px-3"
                  : "w-full flex items-center gap-3 py-3 px-3 text-[#767F8C]"
              }
              to={"/overview"}
            >
              <RiStackFill className="text-xl" />
              <span className="text-base">Overview</span>
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                isActive
                  ? "bg-[#030303] text-white rounded-lg w-full flex items-center gap-3 py-3 px-3"
                  : "w-full flex items-center gap-3 py-3 px-3 text-[#767F8C]"
              }
              to={user?.role === "admin" ? "/c/chats" : "/c/chats"}
            >
              <LuMessageCircle className="text-xl" />
              <span className="text-base">Chat</span>
            </NavLink>
            {user && user.role === "admin" && (
              <NavLink
                className={({ isActive }) =>
                  isActive
                    ? "bg-[#030303] text-white rounded-lg w-full flex items-center gap-3 py-3 px-3"
                    : "w-full flex items-center gap-3 py-3 px-3 text-[#767F8C]"
                }
                to={"/accounts"}
              >
                <LuUserPlus className="text-xl" />
                <span className="text-base">Accounts</span>
              </NavLink>
            )}
            <NavLink
              className={({ isActive }) =>
                isActive
                  ? "bg-[#030303] text-white rounded-lg w-full flex items-center gap-3 py-3 px-3"
                  : "w-full flex items-center gap-3 py-3 px-3 text-[#767F8C]"
              }
              to={"/orders"}
            >
              <FiShoppingCart className="text-xl" />
              <span className="text-base">Orders</span>
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                isActive
                  ? "bg-[#030303] text-white rounded-lg w-full flex items-center gap-3 py-3 px-3"
                  : "w-full flex items-center gap-3 py-3 px-3 text-[#767F8C]"
              }
              to={user.role === "admin" ? "/products" : "/user/products"}
            >
              <AiOutlineProduct className="text-xl" />
              <span className="text-base">Products</span>
            </NavLink>
            {user && user.role === "admin" && (
              <NavLink
                className={({ isActive }) =>
                  isActive
                    ? "bg-[#030303] text-white rounded-lg w-full flex items-center gap-3 py-3 px-3"
                    : "w-full flex items-center gap-3 py-3 px-3 text-[#767F8C]"
                }
                to={"/users"}
              >
                <LuUsers className="text-xl" />
                <span className="text-base">Users</span>
              </NavLink>
            )}
            <NavLink
              className={({ isActive }) =>
                isActive
                  ? "bg-[#030303] text-white rounded-lg w-full flex items-center gap-3 py-3 px-3"
                  : "w-full flex items-center gap-3 py-3 px-3 text-[#767F8C]"
              }
              to={"/settings"}
            >
              <IoSettingsOutline className="text-xl" />
              <span className="text-base">Settings</span>
            </NavLink>
          </div>
          <div className="flex items-center flex-col w-full justify-center mt-5">
            <div className="flex flex-col w-full items-center gap-1 mb-5">
              <img
                src={authUser?.profile_picture}
                alt=""
                className="w-16 h-16 rounded-full border border-primary object-cover"
              />
              <h1 className="text-lg text-white font-medium text-center">
                {authUser?.name}
              </h1>
              <span className="text-[#7F7F7F] text-xs uppercase">
                {authUser?.role} Dashboard
              </span>
            </div>
            <button
              onClick={() => logOut()}
              className="flex items-center gap-2 text-[#F10A0A]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 18 18"
                fill="none"
              >
                <path
                  d="M13 17L14 17C14.7956 17 15.5587 16.6839 16.1213 16.1213C16.6839 15.5587 17 14.7956 17 14L17 4C17 3.20435 16.6839 2.44129 16.1213 1.87868C15.5587 1.31607 14.7956 1 14 1L13 1M5 5L1 9M1 9L5 13M1 9L13 9"
                  stroke="#F10A0A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
        <div className="lg:col-start-2 col-span-1 h-full z-10 overflow-y-auto bg-[#FAFBFE]">
          <Navbar />
          <div className="min-h-screen w-full pb-10 lg:pb-0">
            <Outlet />
          </div>
          <div className="w-full hidden border-t border-[#E4E5E8] lg:flex items-center justify-center py-2">
            <p className="text-[#767F8C] text-sm m-0">
              Made with ❤️ by{" "}
              <Link
                className="text-green-600"
                to={"https://www.linkedin.com/in/md-shejanmahamud/"}
              >
                Shejan Mahamud
              </Link>{" "}
              | NetflixMart
            </p>
          </div>
        </div>
      </div>
      {/* Mobile Menu in bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-black py-3 flex justify-between items-center px-5 z-50">
        <NavLink
          end
          className={({ isActive }) =>
            isActive
              ? "text-white flex flex-col items-center"
              : "text-[#767F8C] flex flex-col items-center"
          }
          to={"/overview"}
        >
          <RiStackFill className="text-lg" />
          <span className="text-[10px]">Overview</span>
        </NavLink>

        <NavLink
          className={({ isActive }) =>
            isActive
              ? "text-white flex flex-col items-center"
              : "text-[#767F8C] flex flex-col items-center"
          }
          to={"/c/chats"}
        >
          <LuMessageCircle className="text-lg" />
          <span className="text-[10px]">Chat</span>
        </NavLink>

        {user && user.role === "admin" && (
          <NavLink
            className={({ isActive }) =>
              isActive
                ? "text-white flex flex-col items-center"
                : "text-[#767F8C] flex flex-col items-center"
            }
            to={"/accounts"}
          >
            <LuUserPlus className="text-lg" />
            <span className="text-[10px]">Accounts</span>
          </NavLink>
        )}

        <NavLink
          className={({ isActive }) =>
            isActive
              ? "text-white flex flex-col items-center"
              : "text-[#767F8C] flex flex-col items-center"
          }
          to={"/orders"}
        >
          <LuShoppingCart className="text-lg" />
          <span className="text-[10px]">Orders</span>
        </NavLink>

        <NavLink
          className={({ isActive }) =>
            isActive
              ? "text-white flex flex-col items-center"
              : "text-[#767F8C] flex flex-col items-center"
          }
          to={user.role === "admin" ? "/products" : "/user/products"}
        >
          <LuAppWindow className="text-lg" />
          <span className="text-[10px]">Products</span>
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            isActive
              ? "text-white flex flex-col items-center"
              : "text-[#767F8C] flex flex-col items-center"
          }
          to={"/settings"}
        >
          <LuSettings className="text-lg" />
          <span className="text-[10px]">Settings</span>
        </NavLink>
        <button
          onClick={() => logOut()}
          className="flex flex-col
           items-center gap-1 text-[#F10A0A]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 18 18"
            fill="none"
          >
            <path
              d="M13 17L14 17C14.7956 17 15.5587 16.6839 16.1213 16.1213C16.6839 15.5587 17 14.7956 17 14L17 4C17 3.20435 16.6839 2.44129 16.1213 1.87868C15.5587 1.31607 14.7956 1 14 1L13 1M5 5L1 9M1 9L5 13M1 9L13 9"
              stroke="#F10A0A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[10px]">Logout</span>
        </button>
      </div>
    </>
  );
};
// {
//   var Tawk_API = Tawk_API || {};
//   const Tawk_LoadStart = new Date();
//   (function () {
//     const s1 = document.createElement("script"),
//       s0 = document.getElementsByTagName("script")[0];
//     s1.async = true;
//     s1.src = "https://embed.tawk.to/672ee4234304e3196adf8c2b/1ic7imbi8";
//     s1.charset = "UTF-8";
//     s1.setAttribute("crossorigin", "*");
//     s0.parentNode.insertBefore(s1, s0);
//   })();
// }
export default UserDashboard;
