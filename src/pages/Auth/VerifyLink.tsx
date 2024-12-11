import { useMutation } from "@tanstack/react-query";
import { Button, Form, Input, Typography } from "antd";
import React from "react";
import { IoTvOutline } from "react-icons/io5";
import { LuUser2 } from "react-icons/lu";
import { VscWorkspaceTrusted } from "react-icons/vsc";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import useAxiosCommon from "../../hooks/useAxiosCommon";

const { Title } = Typography;

const VerifyLink: React.FC = () => {
  const navigate = useNavigate();
  const axiosSecure = useAxiosCommon();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const token = searchParams.get("token");

  const { mutateAsync } = useMutation({
    mutationFn: async (body: { password: string; token: string | null }) => {
      const values = { newPassword: body.password, token: body.token };
      const { data } = await axiosSecure.post(`/auth/user/reset-password`, {
        ...values,
      });
      return data;
    },
  });

  const handleVerifyLink = async (values: {
    password: string;
    confirmPassword: string;
  }) => {
    const { password, confirmPassword } = values;

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Opps!",
        text: "Passwords do not match",
      });
      return;
    }

    try {
      const res = await mutateAsync({ password, token });

      if (res?.success) {
        Swal.fire({
          icon: "success",
          title: "Password Reset Successful!",
          text: "Please login with new password.",
        });
        form.resetFields();
        navigate("/auth/login");
      } else {
        Swal.fire({
          icon: "error",
          title: "Password Reset Failed!",
          text: "Password reset failed.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Password Reset Failed!",
        text: (error as Error)?.message || "Something went wrong.",
      });
    }
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="w-full bg-login bg-no-repeat bg-cover bg-center h-full lg:flex items-end justify-center px-10 py-20 hidden ">
        <div className="flex flex-col items-start gap-10 relative top-0">
          <h1 className="font-medium text-3xl w-[80%] text-white">
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

      <div
        className="w-full px-28"
        style={{
          margin: "auto",
          background: "#fff",
          borderRadius: "8px",
          boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
        }}
      >
        <Title level={3} className="text-center">
          Set New Password
        </Title>
        <Form form={form} onFinish={handleVerifyLink} layout="vertical">
          <Form.Item
            label="New Password"
            name="password"
            rules={[
              { required: true, message: "Please enter your password!" },
              { min: 6, message: "Password must be at least 6 characters!" },
              {
                pattern:
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
                message:
                  "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character!",
              },
            ]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>
          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your new password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default VerifyLink;
