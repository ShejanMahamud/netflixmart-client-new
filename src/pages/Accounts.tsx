// src/pages/Accounts.tsx
import { PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Button,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  TableColumnsType,
  Tag,
  Tooltip,
} from "antd";
import moment from "moment";
import React, { useState } from "react";
import { FaPencil, FaTrash } from "react-icons/fa6";
import { FiSearch } from "react-icons/fi";
import CredentialForm from "../components/CredentialForm";
import Loading from "../components/Loading";
import useAxiosSecure from "../hooks/useAxiosSecure";
import { decrypt } from "../utils/encryption";
import Error from "./Error";

const { Search } = Input;
const { Option } = Select;

interface Credential {
  _id: string;
  username: string;
  password: string;
  name: string;
  max_activation: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  activation_count: number;
  isPurchased: boolean;
}

const Accounts: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedCredential, setSelectedCredential] =
    useState<Credential | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const {
    data: credentials = [],
    isLoading: credentailsLoading,
    error: credentialsError,
    refetch: credentialsRefetch,
  } = useQuery({
    queryKey: ["credentials"],
    queryFn: async () => {
      const { data } = await axiosSecure.get("/credentials");
      if (!data.success) {
        return message.error("Failed to fetch credentials");
      }
      return data.data;
    },
  });

  const handleReveal = (id: string) => {
    setRevealed((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCreate = () => {
    setSelectedCredential(null);
    setIsEditing(false);
    setIsModalVisible(true);
  };

  const handleEdit = (record: Credential) => {
    setSelectedCredential(record);
    setIsEditing(true);
    setIsModalVisible(true);
  };

  const { mutateAsync: deleteCredentials } = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosSecure.delete(`/credentials/${id}`);
      return data;
    },
    onSuccess: (data) => {
      if (!data.success) {
        return message.error(data.error);
      }
      message.success("Credential deleted successfully");
      credentialsRefetch();
    },
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteCredentials(id);
    } catch (error) {
      message.error((error as Error).message || "Failed to delete credential");
    }
  };

  const { mutateAsync: editCredentials } = useMutation({
    mutationFn: async (values) => {
      if (selectedCredential) {
        const { data } = await axiosSecure.patch(
          `/credentials/${selectedCredential._id}`,
          values
        );
        return data;
      }
    },
    onSuccess: (data) => {
      if (!data.success) {
        return message.error(data.error);
      }
      message.success("Credential updated successfully");
      setIsModalVisible(false);
      credentialsRefetch();
    },
  });
  const { mutateAsync: addCredentials } = useMutation({
    mutationFn: async (values) => {
      const { data } = await axiosSecure.post("/credentials", values);
      return data;
    },
    onSuccess: (data) => {
      if (!data.success) {
        return message.error(data.error);
      }
      message.success("Credential added successfully");
      setIsModalVisible(false);
      credentialsRefetch();
    },
  });

  const handleFormSubmit = async (values: any) => {
    try {
      if (isEditing && selectedCredential) {
        editCredentials(values);
      } else {
        // const { subscription_start_date, subscription_end_date } = values;
        // const newStart = format(subscription_start_date, "dd/MM/yyyy")        ;
        // const newEnd =  format(subscription_end_date, "dd/MM/yyyy")        ;

        // if (newStart === newEnd) {
        //   message.error("Start and end dates cannot be the same!");
        //   return;
        // }

        addCredentials({
          ...values,
        });
      }
    } catch (error) {
      console.log(error);
      message.error((error as Error).message || "Failed to save credential");
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
  };

  const filteredCredentials = credentials.filter((cred) => {
    const matchesSearch =
      cred.username.toLowerCase().includes(searchText.toLowerCase()) ||
      cred.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter ? cred.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const columns: TableColumnsType = [
    {
      title: "Created At",
      align: "center",
      key: "createdAt",
      sorter: (a: Credential, b: Credential) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (_, record) => {
        return moment(record.createdAt).format("YYYY-MM-DD");
      },
    },
    {
      title: "Name",
      align: "center",
      dataIndex: "name",
      key: "name",
      sorter: (a: Credential, b: Credential) => a.name.localeCompare(b.name),
    },
    {
      title: "Email/Account",
      dataIndex: "username",
      key: "username",
      align: "center",
      fixed: "left",
      width: 100,
      sorter: (a: Credential, b: Credential) =>
        a.username.localeCompare(b.username),
      render: (_, record: Credential) => {
        const isRevealed = revealed[record._id];
        return (
          <Space>
            <Tooltip title={isRevealed && record.username}>
              <span
                style={{
                  display: "inline-block",
                  maxWidth: "100px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                className="text-xs cursor-pointer text-wrap ..."
                onClick={() => handleReveal(record._id)}
              >
                {isRevealed ? decrypt(record.username) : "****"}
              </span>
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: "Password",
      dataIndex: "password",
      key: "password",
      align: "center",
      fixed: "left",
      width: 100,
      sorter: (a: Credential, b: Credential) =>
        a.password.localeCompare(b.password),
      render: (_, record: Credential) => {
        const isRevealed = revealed[record._id];
        return (
          <Space>
            <Tooltip title={isRevealed && record.password}>
              <span
                style={{
                  display: "inline-block",
                  maxWidth: "100px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                className="text-xs cursor-pointer text-wrap ..."
                onClick={() => handleReveal(record._id)}
              >
                {isRevealed ? decrypt(record.password) : "****"}
              </span>
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: "Product/Variant",
      align: "center",
      key: "productOrVariant",
      render: (_, record: Credential) => {
        console.log(record);
        if (record.product) {
          return (
            <span>
              {record.product.title}{" "}
              {record.product.variant ? `- ${record.product.variant.name}` : ""}
            </span>
          );
        }
        return "N/A";
      },
    },
    {
      title: "Max Activations",
      align: "center",
      render: (_, record) => {
        return (
          (
            <Tag color={record.max_activation ? "green" : "red"}>
              {record.max_activation ?? "N/A"}
            </Tag>
          ) ?? <Tag color="red">N/A</Tag>
        );
      },
      key: "max_activation",
      sorter: (a: Credential, b: Credential) =>
        a.max_activation - b.max_activation,
    },
    {
      title: "Activation Count",
      align: "center",
      render: (_, record) => {
        return record.activation_count ?? <Tag color="red">N/A</Tag>;
      },
      key: "activation_count",
      sorter: (a: Credential, b: Credential) =>
        a.activation_count - b.activation_count,
    },
    {
      title: "Purchased Status",
      align: "center",
      render: (_, record) => {
        return (
          <Tag color={record.isPurchased ? "blue" : "red"}>
            {record.isPurchased ?? "N/A"}
          </Tag>
        );
      },
      key: "isPurchased",
      sorter: (a: Credential, b: Credential) => a.isPurchased - b.isPurchased,
    },
    {
      title: "Status",
      align: "center",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Active", value: "active" },
        { text: "Inactive", value: "inactive" },
      ],
      onFilter: (value: string | number | boolean, record: Credential) =>
        record.status === value,
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "volcano"}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Actions",
      align: "center",
      key: "actions",
      render: (_, record: Credential) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>
            <FaPencil />
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this product?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger>
              <FaTrash />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (credentailsLoading) {
    return <Loading />;
  }

  if (credentialsError) {
    return <Error />;
  }

  return (
    <div className="w-full lg:p-4 p-2">
      <div className="w-full flex flex-col lg:flex-row items-center lg:justify-between justify-end gap-4 my-10">
        <div className="flex flex-col lg:items-start items-end gap-2">
          <h1 className="font-medium text-xl">Accounts</h1>
          <p>Manage your accounts securely</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Credential
          </Button>
          <Search
            placeholder="Search by username or name"
            allowClear
            enterButton={<FiSearch />}
            size="middle"
            onSearch={handleSearch}
            style={{ maxWidth: 300, flex: 1 }}
          />
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 200 }}
            onChange={handleStatusFilter}
          >
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Select>
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={filteredCredentials}
        rowKey="_id"
        scroll={{ x: "max-content" }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        bordered
      />

      <Modal
        title={isEditing ? "Edit Credential" : "Create Credential"}
        open={isModalVisible}
        footer={null}
        onCancel={() => setIsModalVisible(false)}
        destroyOnClose
      >
        <CredentialForm
          initialValues={selectedCredential}
          onFinish={handleFormSubmit}
          onCancel={() => setIsModalVisible(false)}
          isEditing={isEditing}
        />
      </Modal>
    </div>
  );
};

export default Accounts;
