import { CheckCircleOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Checkbox, Form, Input } from "antd";
import axios from "axios";
import disposableDomains from "disposable-email-domains";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { IoIosArrowRoundForward } from "react-icons/io";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import useAxiosCommon from "../hooks/useAxiosCommon";
import Error from "../pages/Error";
import Loading from "./Loading";
interface RegisterFormValues {
  name: string;
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  phone: string;
  otp?: string;
  referred_by?: string; // Optional field
  terms: boolean; // Checkbox for terms
}

interface RegisterResponse {
  success: boolean;
  message?: string;
}

const RegisterForm = () => {
  const token = Cookies.get("token");
  const [form] = Form.useForm();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const navigate = useNavigate();
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const axiosCommon = useAxiosCommon();
  const { mutateAsync } = useMutation<
    RegisterResponse,
    unknown,
    RegisterFormValues
  >({
    mutationFn: async (body) => {
      const profile_picture = `https://robohash.org/${body.username}?bgset=bg1&set=set1`;
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/auth/user/register`,
        { ...body, profile_picture, phone_verified: phoneVerified }
      );
      return data;
    },
  });

  const handleRegister = async (values: RegisterFormValues) => {
    try {
      const res = await mutateAsync(values);
      if (res?.success) {
        Swal.fire({
          icon: "success",
          title: "Registration Successful",
          text: "Please check your email to verify your account.",
        });
        form.resetFields();
        navigate("/auth/login");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text:
          (error as Error).message || "Something went wrong. Please try again.",
      });
    }
  };

  const handleSendOtp = async () => {
    const phone = form.getFieldValue("phone");
    if (!phone) {
      Swal.fire("Please enter your phone number first.");
      return;
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/auth/user/send-otp`,
        { phone }
      );
      setOtpSent(true);
      setResendTimer(60);
      Swal.fire({
        icon: "success",
        title: "OTP Sent",
        text: "An OTP has been sent to your phone number.",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to send OTP",
        text:
          (error as Error).message || "Something went wrong. Please try again.",
      });
    }
  };

  const handleVerifyOtp = async () => {
    const phone = form.getFieldValue("phone");
    const otp = form.getFieldValue("otp");
    if (!otp) {
      Swal.fire({
        icon: "error",
        title: "Please enter OTP",
        text: "Please enter the OTP sent to your phone number.",
      });
      return;
    }
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/auth/user/verify`,
        {
          phoneNumber: phone,
          otp,
        }
      );
      if (response.data.success) {
        setPhoneVerified(true);
        Swal.fire({
          icon: "success",
          title: "Phone Verified",
          text: "Your phone number has been verified successfully.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to verify OTP",
          text: "The OTP you entered is incorrect. Please try again.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to verify OTP",
        text:
          (error as Error).message || "Something went wrong. Please try again.",
      });
    }
  };

  // Resend timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const {
    data: systemDetails,
    isLoading: systemDetailsLoading,
    error: systemDetailsError,
  } = useQuery({
    queryKey: ["system"],
    queryFn: async () => {
      const { data } = await axiosCommon.get(`/system/info`);
      return data.data;
    },
  });

  const handleGoogleLogin = () => {
    window.open(`${import.meta.env.VITE_SERVER_URL}/auth/google`, "_self");
  };

  if (systemDetailsLoading) return <Loading />;
  if (systemDetailsError) return <Error />;

  if (token) navigate("/user/products");
  return (
    <div className="w-full p-10 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <div className="flex lg:hidden md:hidden items-center justify-center w-full">
        <img
          src={systemDetails?.logo}
          alt="logo"
          className="w-full object-contain max-w-[200px]"
        />
      </div>
      <Form
        form={form}
        onFinish={handleRegister}
        layout="vertical"
        initialValues={{ terms: false }}
      >
        <div className="flex flex-col items-center gap-1 text-center mb-8">
          <h1 className="text-4xl font-semibold text-gray-800">
            Create Account
          </h1>
          <p className="text-gray-500">
            Already have an account?{" "}
            <Link to={"/auth/login"} className="text-primary font-semibold">
              Log In
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-6">
          {/* Name and Username */}
          <Form.Item
            name="name"
            rules={[
              { required: true, message: "Please enter your full name!" },
            ]}
          >
            <Input
              placeholder="Full Name"
              className="py-2 px-4 border rounded-md focus:ring focus:ring-primary"
            />
          </Form.Item>
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please enter a username!" }]}
          >
            <Input
              placeholder="Username"
              className="py-2 px-4 border rounded-md focus:ring focus:ring-primary"
            />
          </Form.Item>

          {/* Email */}
          <Form.Item
            name="email"
            className="col-span-2"
            rules={[
              { required: true, message: "Please enter your email!" },
              { type: "email", message: "Please enter a valid email!" },
              {
                validator: (_, value) => {
                  if (value) {
                    const domain = value.split("@")[1]?.toLowerCase();
                    if (domain && disposableDomains.includes(domain)) {
                      return Promise.reject(
                        new Error("Temporary email addresses are not allowed!")
                      );
                    }
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              placeholder="Email"
              className="py-2 px-4 border rounded-md focus:ring focus:ring-primary"
            />
          </Form.Item>

          {/* Phone Number with OTP Handling */}
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: "Please enter your phone number!" },
            ]}
          >
            <Input
              placeholder="Phone Number"
              className="py-2 px-4 border rounded-md focus:ring focus:ring-primary w-full"
              prefix={
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/f/f9/Flag_of_Bangladesh.svg"
                  alt="Bangladesh Flag"
                  style={{ width: "20px", marginRight: "8px" }}
                />
              }
              suffix={
                phoneVerified ? (
                  <CheckCircleOutlined
                    style={{ color: "green", fontSize: "20px" }}
                  />
                ) : null
              }
            />
          </Form.Item>
          {otpSent && !phoneVerified && (
            <Form.Item
              name="otp"
              rules={[
                {
                  required: true,
                  message: "Please enter the OTP sent to your phone!",
                },
              ]}
            >
              <Input
                placeholder="OTP"
                className="py-2 px-4 border rounded-md focus:ring focus:ring-primary"
              />
            </Form.Item>
          )}
          {!phoneVerified && (
            <Form.Item
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.phone !== currentValues.phone
              }
            >
              {({ getFieldValue }) =>
                getFieldValue("phone") ? ( // Check if the phone field has a value
                  <Button
                    type="dashed"
                    onClick={handleSendOtp}
                    disabled={otpSent && resendTimer > 0}
                  >
                    {resendTimer > 0
                      ? `Resend OTP in ${resendTimer}s`
                      : "Send OTP"}
                  </Button>
                ) : null
              }
            </Form.Item>
          )}

          {otpSent && !phoneVerified && (
            <Form.Item>
              <Button
                type="dashed"
                onClick={handleVerifyOtp}
                disabled={phoneVerified}
              >
                Verify OTP
              </Button>
            </Form.Item>
          )}

          {/* Password Fields */}
          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Please enter your password!" },
              { min: 6, message: "Password must be at least 6 characters!" },
              {
                pattern:
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W)[A-Za-z\d\W]{6,}$/,
                message:
                  "Password must contain uppercase, lowercase, number, and a special character!",
              },
            ]}
          >
            <Input.Password
              placeholder="Password"
              className="py-2 px-4 border rounded-md focus:ring focus:ring-primary"
            />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match!"));
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="Confirm Password"
              className="py-2 px-4 border rounded-md focus:ring focus:ring-primary"
            />
          </Form.Item>
        </div>
        <div className="col-span-2">
          <Form.Item
            initialValue={params.get("referred_by")}
            name="referred_by"
            className="col-span-2"
          >
            <Input
              placeholder="Referral Code"
              className="py-2 px-4 border rounded-md focus:ring focus:ring-primary"
            />
          </Form.Item>
        </div>
        {/* Terms and Conditions Checkbox */}
        <Form.Item
          name="terms"
          valuePropName="checked"
          className="mb-4"
          rules={[
            {
              required: true,
              message: "You must agree to the terms and conditions!",
            },
          ]}
        >
          <Checkbox>
            I agree to the{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary"
            >
              Terms and Conditions
            </a>
          </Checkbox>
        </Form.Item>

        {/* Register Button */}
        <Button
          type="primary"
          htmlType="submit"
          className="w-full py-2 px-4 bg-primary rounded-md hover:bg-opacity-90 text-white flex items-center justify-center gap-2"
          icon={<IoIosArrowRoundForward className="text-xl" />}
        >
          Register
        </Button>
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

export default RegisterForm;
