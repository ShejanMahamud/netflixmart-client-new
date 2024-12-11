import { UserAddOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { Button, Form, Input } from "antd";
import { useState } from "react";
import Swal from "sweetalert2";
import useAxiosSecure from "../hooks/useAxiosSecure";

const { TextArea } = Input;

const SendPushNotification = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [form] = Form.useForm();
  const axiosSecure = useAxiosSecure();

  const { mutateAsync } = useMutation({
    mutationFn: async (body: {
      title: string;
      body: string;
      image: string;
    }) => {
      const { data } = await axiosSecure.post("/notification/push", body);
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
    title: string;
    body: string;
    image: string;
  }) => {
    const { title, body, image } = values;

    setLoading(true);

    try {
      await mutateAsync({ title, body, image });
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

  return (
    <div className="send-push-notification" style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "20px" }}>Send Push Notification</h1>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSendNotification}
        style={{ maxWidth: "600px" }}
      >
        {/* Title Input */}
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter the title!" }]}
        >
          <Input placeholder="Enter title" style={{ borderRadius: "8px" }} />
        </Form.Item>

        {/* Message Input */}
        <Form.Item
          label="Body"
          name="body"
          rules={[{ required: true, message: "Please enter the message!" }]}
        >
          <TextArea
            rows={4}
            placeholder="Enter your message"
            style={{ borderRadius: "8px" }}
          />
        </Form.Item>

        {/* Image URL Input */}
        <Form.Item label="Image URL" name="image">
          <Input
            placeholder="Enter image URL (optional)"
            style={{ borderRadius: "8px" }}
          />
        </Form.Item>

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

export default SendPushNotification;
