import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Avatar,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useState } from "react";
import { AiOutlineEdit } from "react-icons/ai";
import Swal from "sweetalert2";
import Loading from "../components/Loading";
import useAxiosSecure from "../hooks/useAxiosSecure";
import Error from "./Error";

const { Text } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const axiosSecure = useAxiosSecure();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const {
    data: users = [],
    isLoading: userLoading,
    error: userError,
    refetch,
  } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const { data } = await axiosSecure.get("/auth/user");
      return data.data;
    },
  });

  const { mutateAsync: editUserMutation } = useMutation({
    mutationFn: async (updatedUser) => {
      const { data } = await axiosSecure.patch(
        `/auth/user/me/${updatedUser._id}`,
        updatedUser
      );
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        refetch();
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "User updated successfully!",
        });
      }
    },
  });

  const showEditModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleEditSubmit = (values) => {
    editUserMutation({ ...selectedUser, ...values });
    setIsModalOpen(false);
  };

  const columns = [
    {
      title: "Avatar",
      dataIndex: "profile_picture",
      key: "profile_picture",
      render: (text, record) => (
        <Avatar src={record.profile_picture} alt={record.name} />
      ),
      width: 80,
      align: "center",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong>{text}</Text>,
      sorter: (a, b) => a.name.localeCompare(b.name),
      align: "center",
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      align: "center",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      align: "center",
      render: (text, record) => (
        <Tooltip title={record.email_verified ? "Verified" : "Not Verified"}>
          <Text type={record.email_verified ? "success" : "danger"}>
            {text}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      align: "center",
      render: (text, record) => (
        <Tooltip title={record.phone_verified ? "Verified" : "Not Verified"}>
          <Text type={record.phone_verified ? "success" : "danger"}>
            {text}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "isOnline",
      align: "center",
      key: "isOnline",
      render: (isOnline) =>
        isOnline ? (
          <Tag color="green">Online</Tag>
        ) : (
          <Tag color="red">Offline</Tag>
        ),
    },
    {
      title: "Role",
      dataIndex: "role",
      align: "center",
      key: "role",
      filters: [
        { text: "User", value: "user" },
        { text: "Admin", value: "admin" },
      ],
      onFilter: (value, record) => record.role === value,
      render: (role) => (
        <Tag color={role === "admin" ? "gold" : "blue"}>{role}</Tag>
      ),
    },
    {
      title: "Loyalty Bonus",
      dataIndex: "loyalty_bonus",
      align: "center",
      key: "loyalty_bonus",
      render: (bonus) => <Text>{bonus}</Text>,
    },
    {
      title: "Referred By",
      dataIndex: "referred_by",
      key: "referred_by",
      align: "center",
      render: (referredBy) =>
        referredBy ? (
          <Tooltip title="Referred by another user">
            <Text code>
              {users.find((user) => user._id === referredBy)?.name}
            </Text>
          </Tooltip>
        ) : (
          "None"
        ),
    },
    {
      title: "Referral Count",
      dataIndex: "referral_count",
      align: "center",
      key: "referral_count",
      render: (count) => <Text>{count}</Text>,
    },
    {
      title: "Last Seen",
      dataIndex: "lastSeen",
      align: "center",
      key: "lastSeen",
      render: (lastSeen) => new Date(lastSeen).toLocaleString(),
    },
    {
      title: "Login Method",
      dataIndex: "login_method",
      key: "login_method",
      align: "center",
      render: (loginMethod) => <Text>{loginMethod}</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button type="link" onClick={() => showEditModal(record)}>
          <AiOutlineEdit />
        </Button>
      ),
    },
  ];

  if (userLoading) return <Loading />;
  if (userError) return <Error />;

  return (
    <div className="w-full p-4">
      <h1 className="text-xl font-medium mb-5">User Management</h1>
      <Table
        columns={columns}
        dataSource={users}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: "max-content" }}
      />

      {isModalOpen && (
        <Modal
          title="Edit User"
          visible={isModalOpen}
          onCancel={handleModalCancel}
          footer={null}
        >
          <Form
            layout="vertical"
            initialValues={selectedUser}
            onFinish={handleEditSubmit}
          >
            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true, message: "Please input the name!" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                {
                  required: true,
                  type: "email",
                  message: "Please input a valid email!",
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Phone"
              name="phone"
              rules={[
                {
                  required: true,
                  message: "Please input a valid phone number!",
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item label="Role" name="role">
              <Select>
                <Option value="user">User</Option>
                <Option value="admin">Admin</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Is Online"
              name="isOnline"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item label="Referral Count" name="referral_count">
              <InputNumber className="w-full" />
            </Form.Item>

            <Form.Item label="Loyalty Bonus" name="loyalty_bonus">
            <InputNumber className="w-full" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Save Changes
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
