import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Form, Input } from "antd";
import Cookies from "js-cookie";
import { FcGoogle } from "react-icons/fc";
import { IoIosArrowRoundForward } from "react-icons/io";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import useAxiosCommon from "../hooks/useAxiosCommon";
import Error from "../pages/Error";
import Loading from "./Loading";
const LoginForm: React.FC = () => {
  const axios = useAxiosCommon();
  const [form] = Form.useForm();
  const token = Cookies.get("token");
  const navigate = useNavigate();
  const { mutateAsync } = useMutation({
    mutationFn: async (body: { email: string; password: string }) => {
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/auth/user/login`,
        body
      );
      return data;
    },
  });
  const { mutateAsync: sendEmailVerification } = useMutation({
    mutationFn: async (body: { email: string }) => {
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/auth/user/resend-email-verify`,
        body
      );
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Email sent successfully!",
        });
      }
    },
  });

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      const { email, password } = values;
      const res = await mutateAsync({ email, password });
      if (res?.success) {
        Cookies.set("token", res?.token, {
          expires: 1,
          sameSite: "strict",
          secure: true,
        });
        Swal.fire({
          icon: "success",
          title: res?.message,
          text: "You have successfully logged in.",
        });
        form.resetFields();
        navigate("/user/products");
      } else {
        if (res?.message === "Email not verified!") {
          await sendEmailVerification({ email });
          Swal.fire({
            icon: "error",
            title: "Login Failed",
            text: "Email not verified! A verification email has been sent.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Login Failed",
            text: res?.message || "Something went wrong. Please try again.",
          });
        }
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: (error as Error).message,
      });
    }
  };
  const {
    data: systemDetails,
    isLoading: systemDetailsLoading,
    error: systemDetailsError,
  } = useQuery({
    queryKey: ["system"],
    queryFn: async () => {
      const { data } = await axios.get(`/system/info`);
      return data.data;
    },
  });

  if (systemDetailsLoading) return <Loading />;
  if (systemDetailsError) return <Error />;

  if (token) navigate("/user/products");
  const handleGoogleLogin = () => {
    window.open(`${import.meta.env.VITE_SERVER_URL}/auth/google`, "_self");
  };
  return (
    <div className="w-full p-12 rounded-lg shadow-md max-w-md mx-auto">
      <div className="flex lg:hidden md:hidden items-center justify-center w-full">
        <img
          src={systemDetails?.logo}
          alt="logo"
          className="w-full object-contain max-w-[200px]"
        />
      </div>
      <Form
        form={form}
        onFinish={handleLogin}
        layout="vertical"
        className="space-y-3"
      >
        <div className="flex flex-col items-center gap-1 text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800">Welcome Back</h1>
          <p className="text-gray-500">
            Don't have an account?{" "}
            <Link to="/auth/register" className="text-primary font-semibold">
              Sign Up
            </Link>
          </p>
        </div>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: "Please enter your email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
        >
          <Input
            placeholder="Email"
            className="py-2 px-4 border rounded-md focus:ring focus:ring-primary"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: "Please enter your password!" }]}
        >
          <Input.Password
            placeholder="Password"
            className="py-2 px-4 border rounded-md focus:ring focus:ring-primary"
          />
        </Form.Item>

        <div className="flex items-center justify-end">
          <Link to="/auth/reset-password" className="text-primary">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          className="w-full py-3 text-white bg-gradient-to-r from-blue-500 to-blue-500 rounded-md flex items-center justify-center gap-2 hover:from-blue-600 hover:to-blue-700 transition-all focus:ring focus:ring-primary"
        >
          <span>Login</span>
          <IoIosArrowRoundForward className="text-2xl" />
        </button>

        <div className="flex items-center justify-center mt-5">
          <span className="text-gray-500">or</span>
        </div>

        <Button
          onClick={handleGoogleLogin}
          type="default"
          icon={<FcGoogle className="text-xl mr-2" />}
          className="w-full mt-3 py-3 border border-gray-300 rounded-lg flex items-center justify-center gap-2 
             text-gray-700 bg-white hover:bg-gray-100 transition-all shadow-sm"
          style={{
            backgroundColor: "#fff",
            color: "#4285F4",
            fontWeight: "500",
          }}
        >
          Sign in with Google
        </Button>
      </Form>
    </div>
  );
};

export default LoginForm;
