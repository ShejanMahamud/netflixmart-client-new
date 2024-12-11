import "antd/dist/reset.css";
import cookies from "js-cookie";
import React, { useEffect } from "react";
import { IoTvOutline } from "react-icons/io5";
import { LuUser2 } from "react-icons/lu";
import { VscWorkspaceTrusted } from "react-icons/vsc";
import { useNavigate } from "react-router-dom";
import LoginForm from "../../components/LoginForm";

const Login: React.FC = () => {
  const token = cookies.get("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token]);

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Section (Image & Stats) */}
      <div className="w-full bg-login bg-no-repeat bg-cover bg-center h-full lg:flex items-end justify-center px-10 py-10 hidden lg:block">
        <div className="flex flex-col items-start gap-8">
          <h1 className="font-medium text-3xl lg:text-4xl text-white leading-tight w-[80%]">
            Thrilling entertainment waiting for your quality time
          </h1>
          <div className="flex items-center gap-16">
            <div className="flex items-start flex-col gap-5">
              <div className="bg-[#ffffff1a] px-3 py-3 rounded-lg">
                <IoTvOutline className="text-4xl text-white" />
              </div>
              <div className="flex flex-col items-start gap-1 text-white">
                <h1 className="text-xl font-medium">10,000</h1>
                <p className="text-white opacity-70 text-sm">Products</p>
              </div>
            </div>
            <div className="flex items-start flex-col gap-5">
              <div className="bg-[#ffffff1a] px-3 py-3 rounded-lg">
                <LuUser2 className="text-4xl text-white" />
              </div>
              <div className="flex flex-col items-start gap-1 text-white">
                <h1 className="text-xl font-medium">5,000</h1>
                <p className="text-white opacity-70 text-sm">Users</p>
              </div>
            </div>
            <div className="flex items-start flex-col gap-5">
              <div className="bg-[#ffffff1a] px-3 py-3 rounded-lg">
                <VscWorkspaceTrusted className="text-4xl text-white" />
              </div>
              <div className="flex flex-col items-start gap-1 text-white">
                <h1 className="text-xl font-medium">100%</h1>
                <p className="text-white opacity-70 text-sm">Trusted</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section (Login Form) */}
      <div className="flex items-center justify-center bg-white p-8">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
