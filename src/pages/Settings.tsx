import { CheckCircleOutlined, InboxOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Switch,
  Tabs,
  TabsProps,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Loading from "../components/Loading";
import useAxiosSecure from "../hooks/useAxiosSecure";
import usePhotoUpload from "../hooks/usePhotoUpload";
import { getDecodedToken } from "../utils/auth";
import Error from "./Error";
import Notification from "./Notification";
import PaymentQuery from "./PaymentQuery";
import SendEmail from "./SendEmail";
import SendPushNotification from "./SendPushNotification";

const { Dragger } = Upload;
const { Title, Text } = Typography;

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  login_method: string;
}

const Settings = () => {
  const axiosSecure = useAxiosSecure();
  const { uploadProps, photo, setPhoto } = usePhotoUpload(); // Removed unused 'photo'
  const user = getDecodedToken() as User;
  const [changePasswordForm] = Form.useForm();
  const [newPasswordForm] = Form.useForm();
  const [profileForm] = Form.useForm(); // Renamed for clarity
  const [systemForm] = Form.useForm();
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  // Fetch User Details
  const {
    data: userDetails,
    isLoading: userLoading,
    error: userError,
    refetch,
  } = useQuery({
    queryKey: ["user", user?.email],
    queryFn: async () => {
      if (!user?.email) {
        Swal.fire({
          icon: "error",
          title: "User not found!",
          text: "Please Login Again!",
          timer: 2000,
        });
      }
      const { data } = await axiosSecure.get(
        `${import.meta.env.VITE_SERVER_URL}/auth/user/me/${user.email}`
      );
      return data.data;
    },
    enabled: !!user?.email, // Only run if email is available
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

  const { mutateAsync: changePassword } = useMutation({
    mutationFn: async (values: {
      old_password: string;
      new_password: string;
    }) => {
      // If the user is not logged in (no email), exit early and show an error
      if (!user?.email) {
        Swal.fire({
          icon: "error",
          title: "User not found!",
          text: "Please Login Again!",
          timer: 2000,
        });
        return;
      }

      const { old_password, new_password } = values;

      try {
        const { data } = await axiosSecure.patch(
          `${import.meta.env.VITE_SERVER_URL}/auth/user/change-password/`,
          {
            oldPassword: old_password,
            newPassword: new_password,
            email: user.email,
          }
        );
        return data;
      } catch (error) {
        console.error("Password change error", error);
        throw error;
      }
    },
  });

  const { mutateAsync: setPassword } = useMutation({
    mutationFn: async (values: { password: string }) => {
      if (!user?.email) {
        Swal.fire({
          icon: "error",
          title: "User not found!",
          text: "Please Login Again!",
          timer: 2000,
        });
        return;
      }

      const { password } = values;

      try {
        const { data } = await axiosSecure.patch(
          `${import.meta.env.VITE_SERVER_URL}/auth/user/set-password/`,
          {
            password,
            email: user.email,
          }
        );
        return data;
      } catch (error) {
        console.error("Error setting password", error);
        throw error;
      }
    },
  });

  // Mutation for Updating Profile
  const { mutateAsync: updateProfile } = useMutation({
    mutationFn: async (values: {
      name: string;
      username: string;
      email: string;
      phone: string;
    }) => {
      if (!user?.email) {
        Swal.fire({
          icon: "error",
          title: "User not found!",
          text: "Please Login Again!",
          timer: 2000,
        });
        return; // Early return if email is not available
      }

      const { name, username, email, phone } = values;

      // Prepare the data for updating the profile
      const profileUpdateData: {
        name: string;
        username: string;
        email: string;
        phone: string;
        profile_picture?: string;
      } = {
        name,
        username,
        email,
        phone,
      };

      // Conditionally add profile_picture if available
      if (photo) {
        profileUpdateData.profile_picture = photo;
      }

      try {
        // Send the profile update request
        const { data } = await axiosSecure.patch(
          `/auth/user/me/${user?.email}`,
          {
            ...profileUpdateData,
          }
        );
        return data; // Return the response data if the request is successful
      } catch (error) {
        console.error("Error updating profile", error);
        throw error; // Handle any errors that occur during the request
      }
    },
  });

  // Handle Profile Update
  const handleProfileUpdate = async (values: {
    name: string;
    username: string;
    email: string;
    phone: string;
  }) => {
    try {
      const data = await updateProfile(values);
      if (data?.success) {
        Swal.fire({
          title: "Profile Updated",
          icon: "success",
          text: "Your profile has been updated successfully.",
        });
        setPhoto(null);
        refetch();
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Update Failed",
        icon: "error",
        text: (error as Error).message,
      });
    }
  };

  // Handle Updating Password
  const handleUpdatePassword = async (values: {
    old_password: string;
    new_password: string;
  }) => {
    try {
      const data = await changePassword(values);
      if (data?.success) {
        Swal.fire({
          title: "Password Updated",
          icon: "success",
          text: "Your password has been updated successfully.",
        });
        changePasswordForm.resetFields();
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Update Failed",
        icon: "error",
        text: (error as Error).message,
      });
    }
  };

  // Handle Setting Password
  const handleSetPassword = async (values: { password: string }) => {
    try {
      const data = await setPassword(values);
      if (data?.success) {
        Swal.fire({
          title: "Password Set",
          icon: "success",
          text: "Password set successfully.",
        });
        newPasswordForm.resetFields();
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Set Password Failed",
        icon: "error",
        text: (error as Error).message,
      });
    }
  };

  // Handle Sending OTP
  const handleSendOtp = async () => {
    const phone = profileForm.getFieldValue("phone");
    if (!phone) {
      Swal.fire("Please enter your phone number first.");
      return;
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/auth/user/send-otp`,
        { phone, email: user?.email }
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
    const phone = profileForm.getFieldValue("phone");
    const otp = profileForm.getFieldValue("otp");
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

  const { mutateAsync: handleSystemSettingsUpdate } = useMutation({
    mutationFn: async (values: { logo: string }) => {
      if (photo) {
        values.logo = photo;
      }
      const { data } = await axiosSecure.patch(`/system/info`, {
        ...values,
      });
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        Swal.fire({
          title: "System Settings Updated",
          icon: "success",
          text: "System settings updated successfully.",
        });
        setPhoto(null);
        refetch();
      }
    },
  });

  // Countdown Timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Tabs Configuration
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Edit Profile",
      children: (
        <Form
          className="w-full"
          form={profileForm}
          layout="vertical"
          onFinish={handleProfileUpdate}
          initialValues={{
            name: userDetails?.name,
            username: userDetails?.username,
            email: userDetails?.email,
            phone: userDetails?.phone,
          }}
        >
          <Row gutter={[16, 16]}>
            {/* Profile Picture and Upload */}
            <Col xs={24} sm={24} md={8} lg={6}>
              <Title level={5}>Profile Picture</Title>
              <div className="flex flex-col items-center">
                <img
                  src={photo ? photo : userDetails?.profile_picture}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover mb-4"
                />
                <Dragger {...uploadProps} className="w-full">
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag file to this area to upload
                  </p>
                  <p className="ant-upload-hint">
                    Supports single upload. Only image files are allowed.
                  </p>
                </Dragger>
              </div>
            </Col>

            {/* Profile Form */}
            <Col xs={24} sm={24} md={16} lg={18}>
              {/* Name Field */}
              <Form.Item label="Name" name="name">
                <Input placeholder="Name" />
              </Form.Item>

              {/* Username Field */}
              <Form.Item label="Username" name="username">
                <Input placeholder="Username" />
              </Form.Item>

              {/* Email Field */}
              <Tooltip title="Email can't change, contact with admin!">
                <Form.Item name={"email"}>
                  <Input defaultValue={userDetails?.email} disabled />
                </Form.Item>
              </Tooltip>

              <Tooltip
                title={
                  userDetails?.phone_verified &&
                  "Phone can't change, Contact with admin"
                }
              >
                <Form.Item
                  name="phone"
                  rules={[
                    {
                      required: true,
                      message: "Please enter your phone number!",
                    },
                  ]}
                >
                  <Input
                    disabled={userDetails?.phone_verified}
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
              </Tooltip>
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
              {!phoneVerified && !userDetails?.phone_verified && (
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

              {/* Submit Button */}
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Update Profile
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      ),
    },
    {
      key: "2",
      label: "Preferences",
      children: (
        <div className="w-full">
          <div className="mt-4">
            <Text>Your referral link:</Text>
            <Input
              value={`${
                import.meta.env.VITE_FRONTEND_URL
              }/auth/register?referred_by=${user?.id}`}
              readOnly
              style={{ marginTop: 8, width: "100%" }}
            />
            <Button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${
                    import.meta.env.VITE_FRONTEND_URL
                  }/auth/register?referred_by=${user?.id}`
                );
                message.success("Referral link copied to clipboard!");
              }}
              style={{ marginTop: 8 }}
            >
              Copy Link
            </Button>
          </div>
          {userDetails?.referred_by && (
            <div className="w-full flex flex-col items-start gap-y-1 mt-5">
              <h1>Referred By:</h1>
              <span>{userDetails?.referred_by?.name}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "3",
      label: "Security",
      children: (
        <div className="w-full mt-5">
          {user?.login_method === "email" && (
            <div className="flex flex-col items-start gap-5">
              <Title level={5}>Change Password</Title>
              <Text>Update your password</Text>
              <Form
                form={changePasswordForm}
                onFinish={handleUpdatePassword}
                layout="vertical"
                className="w-full"
              >
                <Form.Item
                  name="old_password"
                  label="Old Password"
                  rules={[
                    {
                      required: true,
                      message: "Please enter your old password",
                    },
                  ]}
                >
                  <Input.Password placeholder="Old Password" />
                </Form.Item>
                <Form.Item
                  name="new_password"
                  label="New Password"
                  rules={[
                    {
                      required: true,
                      message: "Please enter your new password",
                    },
                    {
                      min: 6,
                      message: "Password must be at least 6 characters",
                    },
                  ]}
                >
                  <Input.Password placeholder="New Password" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Update Password
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}
          {user?.login_method === "google" && (
            <div className="flex flex-col items-start gap-5">
              <Title level={5}>Set Password</Title>
              <Text>
                Set your password to log in with both email/password and Google.
              </Text>
              <Form
                form={newPasswordForm}
                onFinish={handleSetPassword}
                layout="vertical"
                className="w-full"
              >
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: "Please enter your password" },
                    {
                      min: 6,
                      message: "Password must be at least 6 characters",
                    },
                  ]}
                >
                  <Input.Password placeholder="Password" />
                </Form.Item>
                <Form.Item
                  name="confirm_password"
                  label="Confirm Password"
                  dependencies={["password"]}
                  rules={[
                    { required: true, message: "Please confirm your password" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                          return Promise.resolve();
                        }
                        return Swal.fire({
                          icon: "error",
                          title: "Password not matched",
                          text: "The two passwords do not match!",
                        });
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Confirm Password" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Save Password
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}
        </div>
      ),
    },
    ...(user?.role === "admin"
      ? [
          {
            key: "4",
            label: "System Settings",
            children: (
              <Form
                className="w-full"
                layout="vertical"
                form={systemForm}
                onFinish={handleSystemSettingsUpdate}
                initialValues={{
                  name: systemDetails?.name,
                  description: systemDetails?.description,
                  logo: systemDetails?.logo,
                  referral_reward: systemDetails?.referral_reward,
                  referral_bonus: systemDetails?.referral_bonus,
                  contact_email: systemDetails?.contact_email,
                  social_links: systemDetails?.social_links,
                }}
              >
                <Row gutter={[16, 16]}>
                  {/* Logo Upload */}
                  <Col xs={24} sm={24} md={8} lg={6}>
                    <Title level={5}>System Logo</Title>
                    <div className="flex flex-col items-center">
                      <img
                        src={systemDetails?.logo || "default-logo-url"}
                        alt="System Logo"
                        className="w-32 h-32 object-cover mb-4"
                      />
                      <Dragger {...uploadProps} className="w-full">
                        <p className="ant-upload-drag-icon">
                          <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">
                          Click or drag file to upload a logo
                        </p>
                        <p className="ant-upload-hint">
                          Supports single upload. Only image files are allowed.
                        </p>
                      </Dragger>
                    </div>
                  </Col>

                  {/* System Settings Form */}
                  <Col xs={24} sm={24} md={16} lg={18}>
                    {/* Name Field */}
                    <Form.Item label="System Name" name="name">
                      <Input placeholder="System Name" />
                    </Form.Item>

                    {/* Description Field */}
                    <Form.Item label="System Description" name="description">
                      <Input.TextArea placeholder="Description" />
                    </Form.Item>

                    {/* Referral Reward Toggle */}
                    <Form.Item
                      label="Referral Reward"
                      name="referral_reward"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>

                    {/* Referral Bonus Field */}
                    <Form.Item
                      label="Referral Bonus Percentage"
                      name="referral_bonus"
                      rules={[
                        {
                          type: "number",
                          min: 0,
                          max: 100,
                          message: "Enter a valid percentage (0-100)",
                        },
                      ]}
                    >
                      <InputNumber
                        placeholder="Referral Bonus"
                        min={0}
                        max={100}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>

                    {/* Contact Email Field */}
                    <Form.Item
                      label="Contact Email"
                      name="contact_email"
                      rules={[
                        {
                          type: "email",
                          message: "Please enter a valid email!",
                        },
                      ]}
                    >
                      <Input placeholder="Contact Email" />
                    </Form.Item>

                    {/* Social Links */}
                    <Form.Item
                      label="Facebook"
                      name={["social_links", "facebook"]}
                    >
                      <Input placeholder="Facebook URL" />
                    </Form.Item>
                    <Form.Item
                      label="Twitter"
                      name={["social_links", "twitter"]}
                    >
                      <Input placeholder="Twitter URL" />
                    </Form.Item>
                    <Form.Item
                      label="Instagram"
                      name={["social_links", "instagram"]}
                    >
                      <Input placeholder="Instagram URL" />
                    </Form.Item>

                    {/* Submit Button */}
                    <Form.Item>
                      <Button type="primary" htmlType="submit">
                        Save System Settings
                      </Button>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            ),
          },
        ]
      : []),
    ...(user?.role === "admin"
      ? [
          {
            key: "5",
            label: "Send In-App Notification",
            children: <Notification />,
          },
        ]
      : []),
    ...(user?.role === "admin"
      ? [
          {
            key: "6",
            label: "Send Email",
            children: <SendEmail />,
          },
        ]
      : []),
    ...(user?.role === "admin"
      ? [
          {
            key: "7",
            label: "Send Push Notification",
            children: <SendPushNotification />,
          },
        ]
      : []),
    ...(user?.role === "admin"
      ? [
          {
            key: "8",
            label: "Payment Query/Search",
            children: <PaymentQuery />,
          },
        ]
      : []),
  ];

  if (userLoading || systemDetailsLoading) return <Loading />;
  if (userError || systemDetailsError) return <Error />;

  return (
    <div className="p-5 w-full">
      <Title level={2}>Settings</Title>
      <Text>Manage your profile and update your settings.</Text>
      <Tabs defaultActiveKey="1" items={items} className="mt-10" />
    </div>
  );
};

export default Settings;
