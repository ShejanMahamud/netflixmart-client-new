import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Button,
  DatePicker,
  Form,
  message,
  Modal,
  notification,
  Popover,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import { Option } from "antd/es/mentions";
import { TableProps } from "antd/es/table";
import { isWithinInterval, parseISO } from "date-fns";
import { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { AiTwotoneDelete } from "react-icons/ai";
import { FiPlus } from "react-icons/fi";
import {
  IoCardOutline,
  IoCartOutline,
  IoEyeOutline,
  IoPauseCircleOutline,
  IoReload,
} from "react-icons/io5";
import { MdAutorenew, MdOutlinePayment } from "react-icons/md";
import Loading from "../components/Loading";
import useAxiosSecure from "../hooks/useAxiosSecure";
import { getDecodedToken } from "../utils/auth";
import { decrypt } from "../utils/encryption";
// const { Text, Title } = Typography;

interface Credentials {
  _id: string;
  name: string;
  // Add other relevant fields from the Credentials model
}

interface DataType {
  key: string;
  createdAt: string;
  order_id: string;
  _id: string;
  product: {
    product_type: string;
    title: string;
    variants: { name: string; renewable: boolean; renewable_price: number }[];
    delivery_type: string;
    renewable: boolean;
    renewable_price: number;
  };
  subscription_status: string;
  subscription_end_date: Date;
  payment_status: string;
  delivery_status: string;
  credentials: {
    _id: string;
    username: string;
    password: string;
  };
  payment_method: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
}

const { RangePicker } = DatePicker;
const Orders = () => {
  const user = getDecodedToken();
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(
    undefined
  );
  // const [viewModal, setViewModal] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [changeCredentials, setChangeCredentials] = useState(false);
  const [selectedDeliveryStatus, setSelectedDeliveryStatus] = useState<
    string | undefined
  >(undefined);
  const [selectedPurchase, setSelectedPurchase] = useState<DataType | null>(
    null
  );

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentCredentials, setCurrentCredentials] = useState<{
    username: string;
    password: string;
  }>({
    username: "",
    password: "",
  });
  const [renewPaymentMethod, setRenewPaymentMethod] = useState(null); // To store selected payment method
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [form] = Form.useForm();
  const axiosSecure = useAxiosSecure();
  const {
    data: orders = [],
    isLoading: ordersLoading,
    error: ordersError,
    refetch: ordersRefetch,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      if (user) {
        const { data } = await axiosSecure.get(`/purchases/user/${user.id}`);
        return data.data;
      }
    },
    enabled: !!user,
    refetchInterval: 5000,
    refetchOnWindowFocus: false,
  });
  const {
    data: adminOrders = [],
    isLoading: adminOrdersLoading,
    error: adminOrdersError,
    refetch: adminOrdersRefetch,
  } = useQuery({
    queryKey: ["admin_orders"],
    queryFn: async () => {
      if (user) {
        const { data } = await axiosSecure.get(`/purchases`);
        return data.data;
      }
    },
    enabled: user?.role === "admin",
    refetchInterval: 5000,
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: addCredentials } = useMutation({
    mutationFn: async (values: {
      username: string;
      password: string;
    }): Promise<ApiResponse> => {
      const { data } = await axiosSecure.patch<ApiResponse>(
        `/purchases/${selectedPurchase?._id}`,
        { ...values }
      );
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        notification.success({ message: "Credentials Added successfully" });
        form.resetFields();
        setOpenModal(false);
        adminOrdersRefetch();
        setChangeCredentials(false);
      }
    },
  });

  const {
    data: credentialsData = [],
    isLoading: credentialsLoading,
    error: credentialsError,
  } = useQuery<Credentials[], Error>({
    queryKey: ["credentials"],
    queryFn: async () => {
      const { data } = await axiosSecure.get("/credentials");
      return data.data;
    },
  });

  const showModal = (credentials: { username: string; password: string }) => {
    setCurrentCredentials(credentials);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const { mutateAsync: deletePurchase } = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosSecure.delete(`/purchases/${id}`);
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        message.success("Purchase deleted successfully");
        adminOrdersRefetch();
      }
    },
    onError: () => {
      message.error("Failed to delete purchase.");
    },
  });

  const { mutateAsync: repayPendingOrder } = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosSecure.post(`/purchases/pay-pending/${id}`);
      return data;
    },
    onSuccess: (data) => {
      if (data.success && data.payment_method === "wallet") {
        message.success("Payment completed successfully using reward balance");
        ordersRefetch();
      } else if (data.success && data.payment_method === "bkash") {
        window.location.href = data.data.bkashURL;
      }
    },
  });

  const handleRenewClick = () => {
    setConfirmVisible(true);
  };

  const handleConfirmRenewal = () => {
    renewSubscription({
      purchaseId: selectedPurchase?._id || "",
      payment_method: renewPaymentMethod ? renewPaymentMethod : "",
    });
    setConfirmVisible(false);
  };

  const { mutateAsync: renewSubscription } = useMutation({
    mutationFn: async ({
      purchaseId,
      payment_method,
    }: {
      purchaseId: string;
      payment_method: string;
    }) => {
      const { data } = await axiosSecure.post(`/purchases/renew`, {
        purchaseId,
        payment_method,
      });
      return data;
    },
    onSuccess: (data) => {
      if (data.success && data.payment_method === "wallet") {
        message.success(
          "Subscription renewed successfully using reward balance"
        );
        ordersRefetch();
      } else if (data.success && data.payment_method === "bkash") {
        window.location.href = data.data.bkashURL;
      }
    },
  });

  const handleAddCredentails = async (values: {
    username: string;
    password: string;
  }) => {
    try {
      await addCredentials(values);
    } catch (error) {
      return notification.error({
        message: "Error",
        description: (error as Error).message,
      });
    }
  };

  const { mutateAsync: updateStatus } = useMutation({
    mutationFn: async ({
      id,
      statusType,
      value,
    }: {
      id: string;
      statusType: string;
      value: string;
    }) => {
      const { data } = await axiosSecure.patch(`/purchases/${id}`, {
        [statusType]: value,
      });
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        message.success("Status updated successfully");
        adminOrdersRefetch(); // Assuming this refetches your order data
      }
    },
  });

  useEffect(() => {
    // Update the form value whenever selectedPurchase changes
    if (selectedPurchase) {
      form.setFieldsValue({ credentials: selectedPurchase.credentials?._id });
    }
  }, [selectedPurchase, form]);

  const columns: TableProps<DataType>["columns"] = [
    {
      title: "Order ID",
      align: "center",
      fixed: true,
      width: 150,
      render: (_, record) => {
        return (
          <Tooltip title={record?.order_id ?? record?._id}>
            <span
              style={{
                display: "inline-block",
                maxWidth: "100px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {record?.order_id ?? record?._id}
            </span>
          </Tooltip>
        );
      },
      key: "_id",
    },
    {
      title: "Order Date",
      align: "center",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => new Date(createdAt).toLocaleDateString(),
    },
    {
      title: "Product",
      align: "center",
      key: "product",
      render: (_, record) => {
        const { product } = record;
        if (!product) return "Product data not available";

        return product?.product_type === "simple"
          ? product?.title
          : `${product?.title} - ${product?.variants[0]?.name || "No variant"}`;
      },
    },
    {
      title: "Subscription Status",
      align: "center",
      dataIndex: "subscription_status",
      key: "subscription_status",
      render: (_, record) => {
        const { subscription_status, subscription_end_date } = record;

        const subscriptionEndDate = subscription_end_date
          ? new Date(subscription_end_date)
          : null;

        const currentDate = new Date();

        const timeDifference =
          subscriptionEndDate &&
          subscriptionEndDate.getTime() - currentDate.getTime();

        if (subscription_status === "active" && timeDifference) {
          const daysDifference = Math.ceil(
            timeDifference / (1000 * 60 * 60 * 24)
          );
          const statusMessage = `${
            subscription_status.charAt(0).toUpperCase() +
            subscription_status.slice(1)
          } (${Math.abs(daysDifference)} days left)`;

          return statusMessage;
        }
        return (
          subscription_status.charAt(0).toUpperCase() +
          subscription_status.slice(1)
        );
      },
    },
    {
      title: "Total Price",
      dataIndex: "total_price",
      key: "total_price",
      render: (price) => `৳${price}.00`,
    },
    {
      title: "Payment Status",
      align: "center",
      dataIndex: "status",
      key: "status",
      render: (_, record) => {
        let color;
        switch (record.payment_status) {
          case "pending":
            color = "orange";
            break;
          case "completed":
            color = "green";
            break;
          case "cancelled":
            color = "red";
            break;
          case "expired":
            color = "gray";
            break;
          default:
            color = "volcano";
        }

        return <Tag color={color}>{record.payment_status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Delivery Status",
      align: "center",
      dataIndex: "delivery_status",
      key: "delivery_status",
      render: (_, record) => {
        let color;
        switch (record.delivery_status) {
          case "pending":
            color = "orange";
            break;
          case "delivered":
            color = "green";
            break;
          case "cancelled":
            color = "red";
            break;
          default:
            color = "volcano";
        }

        return <Tag color={color}>{record.delivery_status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Payment Method",
      align: "center",
      render: (_, record) => {
        const { payment_method } = record;
        return payment_method.charAt(0).toUpperCase() + payment_method.slice(1);
      },
      key: "payment_method",
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, record) => {
        const { payment_status, delivery_status, subscription_status } = record;
        const hasCredentials = record?.credentials;

        const subscriptionEndDate = record.subscription_end_date
          ? new Date(record.subscription_end_date)
          : null;

        const currentDate = new Date();

        const timeDifference =
          subscriptionEndDate &&
          subscriptionEndDate.getTime() - currentDate.getTime();
        const daysDifference = timeDifference
          ? timeDifference / (1000 * 60 * 60 * 24)
          : null;
        return (
          <>
            {payment_status === "completed" &&
              delivery_status === "delivered" &&
              subscription_status === "active" &&
              hasCredentials &&
              daysDifference !== 0 && (
                <Tooltip title="View Credentials">
                  <Button
                    type="primary"
                    className="mx-1 px-2"
                    onClick={() =>
                      showModal({
                        username: record.credentials.username,
                        password: record.credentials.password,
                      })
                    }
                  >
                    {user?.role === "admin" ? (
                      <IoEyeOutline />
                    ) : (
                      "View Credentials"
                    )}
                  </Button>
                </Tooltip>
              )}
            {user && user?.role === "admin" && (
              <>
                {/* Payment Status Popover */}
                <Tooltip title="Change Payment Status">
                  <Popover
                    content={
                      <Select
                        defaultValue={payment_status}
                        style={{ width: 120 }}
                        onChange={(value) =>
                          updateStatus({
                            id: record._id,
                            statusType: "payment_status",
                            value,
                          })
                        }
                      >
                        <Select.Option value="pending">Pending</Select.Option>
                        <Select.Option value="completed">
                          Completed
                        </Select.Option>
                        <Select.Option value="cancelled">
                          Cancelled
                        </Select.Option>
                        <Select.Option value="expired">Expired</Select.Option>
                      </Select>
                    }
                    title="Payment Status"
                    trigger="click"
                    placement="bottom"
                  >
                    <Button
                      type="primary"
                      className="mx-1"
                      icon={<IoCardOutline />}
                    />
                  </Popover>
                </Tooltip>

                {/* Delivery Status Popover */}
                <Tooltip title="Change Delivery Status">
                  <Popover
                    content={
                      <Select
                        defaultValue={delivery_status}
                        style={{ width: 120 }}
                        onChange={(value) =>
                          updateStatus({
                            id: record._id,
                            statusType: "delivery_status",
                            value,
                          })
                        }
                      >
                        <Select.Option value="pending">Pending</Select.Option>
                        <Select.Option value="delivered">
                          Delivered
                        </Select.Option>
                        <Select.Option value="cancelled">
                          Cancelled
                        </Select.Option>
                      </Select>
                    }
                    title="Delivery Status"
                    trigger="click"
                    placement="bottom"
                  >
                    <Button
                      type="primary"
                      className="mx-1"
                      icon={<IoCartOutline />}
                    />
                  </Popover>
                </Tooltip>

                {/* Subscription Status Popover */}
                <Tooltip title="Change Subscription Status">
                  <Popover
                    content={
                      <Select
                        defaultValue={subscription_status}
                        style={{ width: 120 }}
                        onChange={(value) =>
                          updateStatus({
                            id: record._id,
                            statusType: "subscription_status",
                            value,
                          })
                        }
                      >
                        <Select.Option value="active">Active</Select.Option>
                        <Select.Option value="inactive">Inactive</Select.Option>
                      </Select>
                    }
                    title="Subscription Status"
                    trigger="click"
                    placement="bottom"
                  >
                    <Button
                      type="primary"
                      className="mx-1"
                      icon={<IoPauseCircleOutline />}
                    />
                  </Popover>
                </Tooltip>
              </>
            )}

            {user && (
              <>
                {daysDifference &&
                  daysDifference <= 3 &&
                  record?.subscription_status !== "inactive" &&
                  (record?.product?.product_type === "variable"
                    ? record.product.variants[0]?.renewable
                    : record.product.renewable) && (
                    <Tooltip title="Renew Subscription">
                      <Button
                        type="default"
                        className="mx-1 px-2"
                        onClick={() => {
                          handleRenewClick();
                          setSelectedPurchase(record);
                        }}
                      >
                        <MdAutorenew />
                      </Button>
                    </Tooltip>
                  )}
              </>
            )}

            {record.payment_status === "pending" && user?.role !== "admin" && (
              <Tooltip title="Pay Now">
                <Button
                  type="primary"
                  className="mx-1 px-2"
                  onClick={() => repayPendingOrder(record?._id)}
                >
                  <MdOutlinePayment />
                </Button>
              </Tooltip>
            )}

            {/* Add Credentials button for manual delivery without credentials */}
            {!hasCredentials && user?.role === "admin" && (
              <>
                <Tooltip title="Add Credentials">
                  <Button
                    type="primary"
                    className="mx-1 px-2"
                    onClick={() => {
                      setOpenModal(true);
                      setSelectedPurchase(record);
                    }}
                  >
                    <FiPlus />
                  </Button>
                </Tooltip>
                {/* Modal for adding credentials */}
              </>
            )}

            {user && user?.role === "admin" && (
              <Tooltip title="Change Credentials">
                <Button
                  type="primary"
                  className="mx-1 px-2"
                  onClick={() => {
                    setChangeCredentials(true);
                    setSelectedPurchase(record);
                  }}
                >
                  <IoReload />
                </Button>
              </Tooltip>
            )}

            {/* <Tooltip title="View Purchases">
              <Button
                type="primary"
                className="mx-1"
                onClick={() => {
                  setViewModal(true);
                  setSelectedPurchase(record);
                }}
              >
                <IoEyeOff />
              </Button>
            </Tooltip> */}

            {/* Delete Purchase button */}
            {user && user.role === "admin" && (
              <Tooltip title="Delete Purchase">
                <Button
                  className="mx-1 px-2"
                  type="default"
                  onClick={() => deletePurchase(record?._id)}
                >
                  <AiTwotoneDelete />
                </Button>
              </Tooltip>
            )}
          </>
        );
      },
    },
  ];

  const filteredOrders =
    user?.role === "admin"
      ? adminOrders
      : orders
          .filter((order: DataType) =>
            selectedDeliveryStatus
              ? order.delivery_status === selectedDeliveryStatus
              : true
          )
          .filter((order: DataType) =>
            selectedStatus ? order.payment_status === selectedStatus : true
          )
          .filter((order: DataType) => {
            if (dateRange && dateRange[0] && dateRange[1]) {
              const [startDateRange, endDateRange] = dateRange;

              const productCreatedAt = parseISO(order.createdAt);
              const startDate = new Date(startDateRange.toDate());
              const endDate = new Date(endDateRange.toDate());

              return isWithinInterval(productCreatedAt, {
                start: startDate,
                end: endDate,
              });
            }
            return true;
          });

  const renderFilters = () => (
    <Space className="flex flex-col items-end gap-2 mb-5">
      <Select
        placeholder="Filter by status"
        value={selectedStatus}
        onChange={(value) => setSelectedStatus(value)}
        allowClear
        style={{ width: 200 }}
      >
        <Option value="completed">Completed</Option>
        <Option value="pending">Pending</Option>
        <Option value="cancelled">Cancelled</Option>
        <Option value="expired">Expired</Option>
      </Select>
      <Select
        placeholder="Filter by delivery status"
        value={selectedDeliveryStatus}
        onChange={(value) => setSelectedDeliveryStatus(value)}
        allowClear
        style={{ width: 200 }}
      >
        <Option value="delivered">Delivered</Option>
        <Option value="pending">Pending</Option>
        <Option value="cancelled">Cancelled</Option>
      </Select>

      <RangePicker
        onChange={(dates) => setDateRange(dates)}
        style={{ width: 300 }}
        placeholder={["Start Date", "End Date"]}
      />
    </Space>
  );

  if (ordersLoading || credentialsLoading || adminOrdersLoading)
    return <Loading />;
  if (ordersError || credentialsError || adminOrdersError)
    return <div>Error</div>;

  return (
    <div className="lg:p-4 p-4 w-full">
      <div className=" flex items-center justify-between">
        <h1 className="text-2xl font-bold mb-4">Orders</h1>
        {renderFilters()}
      </div>
      <Table
        dataSource={filteredOrders}
        columns={columns}
        rowKey="_id"
        scroll={{ x: "max-content" }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        bordered
      />
      <Modal
        title="View Credentials"
        open={isModalVisible && currentCredentials !== null}
        onCancel={handleCancel}
        footer={null}
        centered
        width={400}
      >
        {currentCredentials?.username && currentCredentials?.password ? (
          <div style={{ padding: "20px", textAlign: "left" }}>
            <div style={{ marginBottom: "15px" }}>
              <strong style={{ fontSize: "16px" }}>Username:</strong>
              <p style={{ margin: "5px 0", fontSize: "14px" }}>
                {decrypt(currentCredentials.username)}
              </p>
              <Button
                type="default"
                onClick={() => {
                  navigator.clipboard.writeText(
                    decrypt(currentCredentials.username)
                  );
                  message.success("Username copied to clipboard!");
                }}
              >
                Copy Username
              </Button>
            </div>
            <div>
              <strong style={{ fontSize: "16px" }}>Password:</strong>
              <p
                style={{
                  margin: "5px 0",
                  fontSize: "14px",
                  wordBreak: "break-all",
                }}
              >
                {decrypt(currentCredentials.password)}
              </p>
              <Button
                type="default"
                onClick={() => {
                  navigator.clipboard.writeText(
                    decrypt(currentCredentials.password)
                  );
                  message.success("Password copied to clipboard!");
                }}
              >
                Copy Password
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <p style={{ fontSize: "16px", color: "rgba(0, 0, 0, 0.45)" }}>
              No credentials available.
            </p>
          </div>
        )}
      </Modal>
      <Modal
        title="Add Credentials"
        footer={null}
        open={openModal}
        onCancel={() => setOpenModal(false)}
      >
        <Form layout="vertical" form={form} onFinish={handleAddCredentails}>
          <Form.Item name={"credentials"} label={"Credentials"}>
            <Select
              placeholder="Select Credentials"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => {
                if (!option?.children) return false;

                return option.children
                  .toString()
                  .toLowerCase()
                  .includes(input.toLowerCase());
              }}
            >
              {credentialsData &&
                credentialsData
                  .filter((cre) => cre?.status === "active")
                  .filter(
                    (cred) => cred?.max_activation >= cred?.activation_count
                  )
                  .map((credential) => (
                    <Select.Option key={credential._id} value={credential._id}>
                      {credential.name}
                    </Select.Option>
                  ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add Credentials
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Change Credentials"
        footer={null}
        open={changeCredentials}
        onCancel={() => {
          setChangeCredentials(false);
          setSelectedPurchase(null);
          form.resetFields();
        }}
      >
        <Form layout="vertical" form={form} onFinish={handleAddCredentails}>
          <Form.Item
            shouldUpdate={(prevValues, currentValues) =>
              prevValues !== currentValues
            }
          >
            <Form.Item name={"credentials"} label={"Credentials"}>
              <Select
                defaultValue={selectedPurchase?.credentials?._id}
                placeholder="Select Credentials"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) => {
                  if (!option?.children) return false;

                  return option.children
                    .toString()
                    .toLowerCase()
                    .includes(input.toLowerCase());
                }}
              >
                {credentialsData &&
                  credentialsData.map((credential) => (
                    <Select.Option key={credential._id} value={credential._id}>
                      {credential.name}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Change Credentials
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Select Payment Method"
        open={confirmVisible}
        onOk={() => handleConfirmRenewal()}
        onCancel={() => setConfirmVisible(false)}
        okText="Renew"
        cancelText="Cancel"
      >
        <span>
          Renewable Price:{" "}
          {selectedPurchase?.product?.product_type === "variable"
            ? selectedPurchase?.product.variants[0].renewable_price
            : selectedPurchase?.product.renewable_price}
        </span>
        <Select
          placeholder="Choose payment method"
          onChange={(value) => setRenewPaymentMethod(value)} // Track selected method
          className="w-full"
        >
          <Option value="wallet">Reward Balance</Option>
          <Option value="bkash">Bkash</Option>
        </Select>
      </Modal>
      {/* <Modal
        open={viewModal}
        footer={null}
        onCancel={() => setViewModal(false)}
        title={
          <div style={{ fontSize: "20px", fontWeight: "600", color: "#333" }}>
            Purchase Details -{" "}
            {selectedPurchase?.product?.title ||
              selectedPurchase?.product?.variants[0]?.name}
          </div>
        }
        width={750}
        bodyStyle={{
          backgroundColor: "#f0f2f5",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0px 10px 20px rgba(0,0,0,0.1)",
        }}
        style={{ borderRadius: "12px", overflow: "hidden" }}
      >
        <Card
          bordered={false}
          style={{
            padding: "25px",
            borderRadius: "10px",
            backgroundColor: "#fff",
          }}
        >

          <Row gutter={16} style={{ marginBottom: "30px" }}>
            <Col span={10}>
              <img
                src={selectedPurchase?.product?.image}
                alt={selectedPurchase?.product?.title}
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  objectFit: "cover",
                  boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)",
                }}
              />
            </Col>
            <Col span={14}>
              <Title level={3} style={{ color: "#333", marginBottom: "8px" }}>
                {selectedPurchase?.product?.title}
              </Title>
              <Text
                type="secondary"
                style={{
                  fontSize: "15px",
                  marginBottom: "10px",
                  display: "block",
                }}
              >
                {selectedPurchase?.product?.short_description}
              </Text>
              <Divider style={{ margin: "12px 0" }} />
              <Space direction="vertical" size="small">
                <Text>
                  <InfoCircleOutlined
                    style={{ color: "#1890ff", marginRight: "5px" }}
                  />{" "}
                  <Text strong>Category:</Text>{" "}
                  {selectedPurchase?.product?.category}
                </Text>
                <Text>
                  <UserOutlined
                    style={{ color: "#1890ff", marginRight: "5px" }}
                  />{" "}
                  <Text strong>Delivery Type:</Text>{" "}
                  {selectedPurchase?.product?.delivery_type}
                </Text>
                <Text>
                  <DollarOutlined
                    style={{ color: "#52c41a", marginRight: "5px" }}
                  />{" "}
                  <Text strong>Price:</Text> ${selectedPurchase?.total_price}
                </Text>
              </Space>
            </Col>
          </Row>

          <div
            style={{
              backgroundColor: "#fafafa",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <Title level={5} style={{ marginBottom: "10px", color: "#333" }}>
              User Information
            </Title>
            <Row gutter={16}>
              <Col span={12}>
                <Text>
                  <Text strong>Name:</Text> {selectedPurchase?.user?.name}
                </Text>
                <br />
                <Text>
                  <Text strong>Email:</Text> {selectedPurchase?.user?.email}
                </Text>
              </Col>
            </Row>
          </div>

          <div
            style={{
              backgroundColor: "#fafafa",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <Title level={5} style={{ marginBottom: "10px", color: "#333" }}>
              Subscription Information
            </Title>
            <Row gutter={16}>
              <Col span={12}>
                <Text>
                  <CalendarOutlined style={{ marginRight: "5px" }} />{" "}
                  <Text strong>Status:</Text>{" "}
                  {selectedPurchase?.subscription_status}
                </Text>
                <br />
                <Text>
                  <CalendarOutlined style={{ marginRight: "5px" }} />{" "}
                  <Text strong>Start Date:</Text>{" "}
                  {new Date(
                    selectedPurchase?.subscription_start_date
                  ).toLocaleDateString()}
                </Text>
                <br />
                <Text>
                  <CalendarOutlined style={{ marginRight: "5px" }} />{" "}
                  <Text strong>End Date:</Text>{" "}
                  {new Date(
                    selectedPurchase?.subscription_end_date
                  ).toLocaleDateString()}
                </Text>
              </Col>
              <Col span={12}>
                <Text>
                  <InfoCircleOutlined
                    style={{ color: "#faad14", marginRight: "5px" }}
                  />{" "}
                  <Text strong>Payment Status:</Text>{" "}
                  {selectedPurchase?.payment_status}
                </Text>
                <br />
                <Text>
                  <DollarOutlined
                    style={{ color: "#52c41a", marginRight: "5px" }}
                  />{" "}
                  <Text strong>Payment Method:</Text>{" "}
                  {selectedPurchase?.payment_method}
                </Text>
              </Col>
            </Row>
          </div>

          {selectedPurchase?.credentials && (
            <div
              style={{
                backgroundColor: "#fafafa",
                padding: "20px",
                borderRadius: "8px",
              }}
            >
              <Title level={5} style={{ marginBottom: "10px", color: "#333" }}>
                Credentials
              </Title>
              <Row>
                <Col span={12}>
                  <Text>
                    <Text strong>Username:</Text>{" "}
                    {selectedPurchase?.credentials?.username}
                  </Text>
                </Col>
                <Col span={12}>
                  <Text>
                    <Text strong>Password:</Text>{" "}
                    {selectedPurchase?.credentials?.password}
                  </Text>
                </Col>
              </Row>
            </div>
          )}

          <Divider style={{ margin: "20px 0" }} />
          <Row justify="end">
            <Col>
              <Text strong style={{ fontSize: "16px", color: "#333" }}>
                Total: ${selectedPurchase?.total_price}
              </Text>
            </Col>
          </Row>
        </Card>
      </Modal> */}
    </div>
  );
};

export default Orders;
