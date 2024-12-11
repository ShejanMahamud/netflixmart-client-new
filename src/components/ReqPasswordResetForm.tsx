import { useMutation } from "@tanstack/react-query";
import { Button, Form, Input, Spin } from "antd";
import { useState } from "react";
import { IoIosArrowRoundForward } from "react-icons/io";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import useAxiosCommon from "../hooks/useAxiosCommon";

interface ResetPasswordFormValues {
  email: string;
}

const ReqPasswordResetForm: React.FC = () => {
  const axiosSecure = useAxiosCommon();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { mutateAsync } = useMutation({
    mutationFn: async (body: { email: string }) => {
      const { data } = await axiosSecure.post(`/auth/user/req-reset`, body);
      return data;
    },
  });

  const handleEmailSent = async (values: ResetPasswordFormValues) => {
    try {
      setLoading(true);
      const { email } = values;
      const res = await mutateAsync({ email });

      if (res?.success) {
        Swal.fire({
          icon: "success",
          title: "Email Sent Successful!",
          text: "Password Reset Email Sent Successful!",
        });
        form.resetFields();
        navigate("/auth/login");
      } else {
        throw new Error(res?.message || "Password reset failed.");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Reset Failed",
        text: (error as Error)?.message || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-8 rounded-lg shadow-md max-w-md mx-auto bg-white">
      <h2 className="text-2xl font-semibold text-center mb-6">
        Reset Password
      </h2>
      <Form
        form={form}
        onFinish={handleEmailSent}
        layout="vertical"
        className="space-y-4"
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please enter your email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
        >
          <Input
            placeholder="Email"
            className="py-2 px-4 border rounded-md focus:ring focus:ring-primary"
            aria-label="Email"
          />
        </Form.Item>

        <div className="flex items-center justify-end">
          <p>
            Already have an account?{" "}
            <Link to="/auth/login" className="text-blue-500 hover:underline">
              Login
            </Link>
          </p>
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="w-full py-3 rounded-md flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring focus:ring-blue-300"
            disabled={loading}
          >
            {loading ? (
              <Spin size="small" />
            ) : (
              <div className="flex items-center gap-2">
                <span>Reset Password</span>
                <IoIosArrowRoundForward className="text-2xl" />
              </div>
            )}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ReqPasswordResetForm;
