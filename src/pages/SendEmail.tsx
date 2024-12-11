import { MailOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Checkbox, Form, Input, Select } from "antd";
import { useState } from "react";
import Swal from "sweetalert2";
import Loading from "../components/Loading";
import useAxiosSecure from "../hooks/useAxiosSecure";
import Error from "./Error";

interface User {
  _id: string;
  email: string;
  name: string;
}

const { TextArea } = Input;

const SendEmail = () => {
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
    mutationFn: async (body: {
      users: string | string[];
      subject: string;
      body: string;
    }) => {
      const { data } = await axiosSecure.post("/system/info/email-send", body);
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        form.resetFields();
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Email sent successfully!",
        });
      }
    },
  });

  // Handle sending email
  const handleSendEmail = async (values: {
    subject: string;
    body: string;
    selectedUsers: string[];
  }) => {
    const { subject, body, selectedUsers } = values;

    if (!subject || !body) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please complete all fields!",
      });
      return;
    }

    setLoading(true);

    const emailData = {
      users: sendToAll ? "all" : selectedUsers,
      subject,
      body,
    };

    try {
      await mutateAsync(emailData);
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
    <div className="send-email-page" style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "20px" }}>Send Email</h1>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSendEmail}
        style={{ maxWidth: "600px" }}
      >
        {/* Subject Input */}
        <Form.Item
          label="Subject"
          name="subject"
          rules={[{ required: true, message: "Please enter the subject!" }]}
        >
          <Input placeholder="Enter subject" style={{ borderRadius: "8px" }} />
        </Form.Item>

        {/* Email Body Input */}
        <Form.Item
          label="Body"
          name="body"
          rules={[{ required: true, message: "Please enter the email body!" }]}
        >
          <TextArea
            rows={4}
            placeholder="Enter email content"
            style={{ borderRadius: "8px" }}
          />
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
                  {user.name}
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
            icon={<MailOutlined />}
            loading={loading}
            style={{ width: "100%", borderRadius: "8px" }}
          >
            Send Email
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default SendEmail;
