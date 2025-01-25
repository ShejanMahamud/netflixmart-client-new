import { useMutation, useQuery } from "@tanstack/react-query"
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
  Card,
  Space,
  Popconfirm,
  message,
  Row,
  Col,
} from "antd"
import { useState } from "react"
import { EditOutlined, DeleteOutlined, UserAddOutlined, SearchOutlined } from "@ant-design/icons"
import Swal from "sweetalert2"
import Loading from "../components/Loading"
import useAxiosSecure from "../hooks/useAxiosSecure"
import Error from "./Error"
import UserStatsCard from "../components/UserStatsCard"

const { Text } = Typography
const { Option } = Select

const UserManagement = () => {
  const axiosSecure = useAxiosSecure()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchText, setSearchText] = useState("")
  const [filteredInfo, setFilteredInfo] = useState({})
  const [sortedInfo, setSortedInfo] = useState({})

  const {
    data: users = [],
    isLoading: userLoading,
    error: userError,
    refetch,
  } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const { data } = await axiosSecure.get("/auth/user")
      return data.data
    },
  })

  const { mutateAsync: editUserMutation } = useMutation({
    mutationFn: async (updatedUser) => {
      const { data } = await axiosSecure.patch(`/auth/user/me/${updatedUser._id}`, updatedUser)
      return data
    },
    onSuccess: (data) => {
      if (data.success) {
        refetch()
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "User updated successfully!",
        })
      }
    },
  })

  const showEditModal = (user) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleModalCancel = () => {
    setIsModalOpen(false)
    setSelectedUser(null)
  }

  const handleEditSubmit = (values) => {
    editUserMutation({ ...selectedUser, ...values })
    setIsModalOpen(false)
  }

  const handleChange = (pagination, filters, sorter) => {
    setFilteredInfo(filters)
    setSortedInfo(sorter)
  }

  const clearFilters = () => {
    setFilteredInfo({})
  }

  const clearAll = () => {
    setFilteredInfo({})
    setSortedInfo({})
  }

  const columns = [
    {
      title: "Avatar",
      dataIndex: "profile_picture",
      key: "profile_picture",
      render: (text, record) => <Avatar src={record.profile_picture} alt={record.name} />,
      width: 80,
      fixed: "left",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong>{text}</Text>,
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortOrder: sortedInfo.columnKey === "name" && sortedInfo.order,
      ellipsis: true,
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      ellipsis: true,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text, record) => (
        <Tooltip title={record.email_verified ? "Verified" : "Not Verified"}>
          <Text type={record.email_verified ? "success" : "danger"}>{text}</Text>
        </Tooltip>
      ),
      ellipsis: true,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (text, record) => (
        <Tooltip title={record.phone_verified ? "Verified" : "Not Verified"}>
          <Text type={record.phone_verified ? "success" : "danger"}>{text}</Text>
        </Tooltip>
      ),
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "isOnline",
      key: "isOnline",
      filters: [
        { text: "Online", value: true },
        { text: "Offline", value: false },
      ],
      filteredValue: filteredInfo.isOnline || null,
      onFilter: (value, record) => record.isOnline === value,
      render: (isOnline) => (isOnline ? <Tag color="green">Online</Tag> : <Tag color="red">Offline</Tag>),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      filters: [
        { text: "User", value: "user" },
        { text: "Admin", value: "admin" },
      ],
      filteredValue: filteredInfo.role || null,
      onFilter: (value, record) => record.role === value,
      render: (role) => <Tag color={role === "admin" ? "gold" : "blue"}>{role}</Tag>,
    },
    {
      title: "Loyalty Bonus",
      dataIndex: "loyalty_bonus",
      key: "loyalty_bonus",
      sorter: (a, b) => a.loyalty_bonus - b.loyalty_bonus,
      sortOrder: sortedInfo.columnKey === "loyalty_bonus" && sortedInfo.order,
    },
    {
      title: "Referred By",
      dataIndex: "referred_by",
      key: "referred_by",
      render: (referredBy) =>
        referredBy ? (
          <Tooltip title="Referred by another user">
            <Text code>{users.find((user) => user._id === referredBy)?.name}</Text>
          </Tooltip>
        ) : (
          "None"
        ),
      ellipsis: true,
    },
    {
      title: "Referral Count",
      dataIndex: "referral_count",
      key: "referral_count",
      sorter: (a, b) => a.referral_count - b.referral_count,
      sortOrder: sortedInfo.columnKey === "referral_count" && sortedInfo.order,
    },
    {
      title: "Last Seen",
      dataIndex: "lastSeen",
      key: "lastSeen",
      render: (lastSeen) => new Date(lastSeen).toLocaleString(),
      sorter: (a, b) => new Date(a.lastSeen) - new Date(b.lastSeen),
      sortOrder: sortedInfo.columnKey === "lastSeen" && sortedInfo.order,
    },
    {
      title: "Login Method",
      dataIndex: "login_method",
      key: "login_method",
      filters: [
        { text: "Email", value: "email" },
        { text: "Google", value: "google" },
        { text: "Facebook", value: "facebook" },
      ],
      filteredValue: filteredInfo.login_method || null,
      onFilter: (value, record) => record.login_method === value,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => showEditModal(record)} icon={<EditOutlined />} />
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDeleteUser(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleDeleteUser = (userId) => {
    // Implement delete user logic here
    message.success("User deleted successfully")
    refetch()
  }

  if (userLoading) return <Loading />
  if (userError) return <Error />

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      user.username.toLowerCase().includes(searchText.toLowerCase()),
  )

  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col>
            <h1 className="text-2xl font-bold">User Management</h1>
          </Col>
          <Col>
            <Space>
              <Button onClick={clearFilters}>Clear filters</Button>
              <Button onClick={clearAll}>Clear filters and sorters</Button>
              <Button type="primary" icon={<UserAddOutlined />}>
                Add New User
              </Button>
            </Space>
          </Col>
        </Row>
        <Row gutter={[16, 16]} className="mt-4">
          <Col span={24}>
            <Input.Search
              placeholder="Search users..."
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
              enterButton={<SearchOutlined />}
            />
          </Col>
        </Row>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="_id"
          onChange={handleChange}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 1500 }}
          sticky
        />
      </Card>

      <Row gutter={16}>
        <Col span={8}>
          <UserStatsCard title="Total Users" value={users.length} />
        </Col>
        <Col span={8}>
          <UserStatsCard title="Online Users" value={users.filter((user) => user.isOnline).length} />
        </Col>
        <Col span={8}>
          <UserStatsCard title="Admins" value={users.filter((user) => user.role === "admin").length} />
        </Col>
      </Row>

      {isModalOpen && (
        <Modal title="Edit User" visible={isModalOpen} onCancel={handleModalCancel} footer={null}>
          <Form layout="vertical" initialValues={selectedUser} onFinish={handleEditSubmit}>
            <Form.Item label="Name" name="name" rules={[{ required: true, message: "Please input the name!" }]}>
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

            <Form.Item label="Is Online" name="isOnline" valuePropName="checked">
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
  )
}

export default UserManagement

