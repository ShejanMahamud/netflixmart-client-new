import { UserAddOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Checkbox, Form, Input, Select } from "antd";
import { useState } from "react";
import Swal from "sweetalert2";
import Loading from "../components/Loading";
import useAxiosSecure from "../hooks/useAxiosSecure";
import Error from "./Error";

interface User {
  _id: string;
  username: string;
}

const { TextArea } = Input;

const Notification = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [sendToAll, setSendToAll] = useState<boolean>(false);
  const [form] = Form.useForm();
  const axiosSecure = useAxiosSecure();

  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await axiosSecure.get("/auth/user");
      return data.data;
    },
  });

  const { mutateAsync } = useMutation({
    mutationFn: async (body: { message: string }) => {
      const { data } = await axiosSecure.post(
        "/notification/send-notification",
        body
      );
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        form.resetFields();
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Notification sent successfully!",
        });
      }
    },
  });

  // Handle sending notification
  const handleSendNotification = async (values: {
    message: string;
    type: string;
    selectedUsers: string[];
  }) => {
    const { message, type, selectedUsers } = values;

    if (!message) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please enter the message!",
      });
      return;
    }

    setLoading(true);

    const notificationData = {
      users: sendToAll ? "all" : selectedUsers,
      message,
      type,
    };

    try {
      await mutateAsync(notificationData);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (usersLoading) return <Loading />;
  if (usersError) return <Error />;

  return (
    <div className="notification-page" style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "20px" }}>Send Notification</h1>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSendNotification}
        style={{ maxWidth: "600px" }}
      >
        {/* Message Input */}
        <Form.Item
          label="Message"
          name="message"
          rules={[{ required: true, message: "Please enter the message!" }]}
        >
          <TextArea
            rows={4}
            placeholder="Enter your message"
            style={{ borderRadius: "8px" }}
          />
        </Form.Item>

        {/* Notification Type Dropdown */}
        <Form.Item label="Notification Type" name="type" initialValue="info">
          <Select style={{ borderRadius: "8px" }}>
            <Select.Option value="info">Info</Select.Option>
            <Select.Option value="warning">Warning</Select.Option>
            <Select.Option value="error">Error</Select.Option>
            <Select.Option value="success">Success</Select.Option>
          </Select>
        </Form.Item>

        {/* Send to All Users Checkbox */}
        <Form.Item name="sendToAll" valuePropName="checked">
          <Checkbox
            checked={sendToAll}
            onChange={(e) => setSendToAll(e.target.checked)}
          >
            Send to All Users
          </Checkbox>
        </Form.Item>

        {/* User Selection Dropdown */}
        {!sendToAll && (
          <Form.Item
            label="Select Users"
            name="selectedUsers"
            rules={[{ required: !sendToAll, message: "Please select users!" }]}
          >
            <Select
              mode="multiple"
              placeholder="Select users"
              style={{ borderRadius: "8px" }}
            >
              {users.map((user: User) => (
                <Select.Option key={user._id} value={user._id}>
                  {user.username}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* Submit Button */}
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<UserAddOutlined />}
            loading={loading}
            style={{ width: "100%", borderRadius: "8px" }}
          >
            Send Notification
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Notification;
