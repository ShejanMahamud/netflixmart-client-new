import {
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Divider,
  Dropdown,
  Spin,
  Tooltip,
  Typography,
} from "antd";
import React from "react";
import useAxiosSecure from "../hooks/useAxiosSecure";
import { getDecodedToken } from "../utils/auth";

const NotificationDropdown: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const user = getDecodedToken();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await axiosSecure.get(
        `/notification/${user.id}?page=${pageParam}&limit=10`
      );
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.nextPage ?? false,
    enabled: !!user.id,
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: markAsRead } = useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosSecure.patch(
        `/notification/mark-as-read/${id}`
      );
      return data;
    },
    onSuccess: () => refetch(),
  });

  const { mutateAsync: markAllAsRead } = useMutation({
    mutationFn: async (id) => {
      await axiosSecure.patch(`/notification/mark-all-as-read/${id}`);
    },
    onSuccess: () => refetch(),
  });

  const getNotificationColor = (read: boolean, type: string) => {
    if (read) return "#f9f9f9";
    switch (type) {
      case "warning":
        return "#fff8e1";
      case "error":
        return "#ffe0e0";
      case "info":
        return "#e6f7ff";
      default:
        return "#e8f5e9";
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "warning":
        return <WarningOutlined style={{ color: "#fa8c16" }} />;
      case "error":
        return <ExclamationCircleOutlined style={{ color: "#f5222d" }} />;
      case "info":
        return <InfoCircleOutlined style={{ color: "#1890ff" }} />;
      default:
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
    }
  };

  const notifications = data?.pages.flatMap((page) => page.data) || [];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50 && hasNextPage) {
      fetchNextPage();
    }
  };

  const menu = (
    <div
      style={{
        width: 320,
        padding: 0,
        backgroundColor: "#fff",
        border: "1px solid #e8e8e8",
        borderRadius: 4,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 15px",
          backgroundColor: "#fafafa",
          borderBottom: "1px solid #e8e8e8",
        }}
      >
        <Typography.Text strong style={{ fontSize: "16px" }}>
          Notifications
        </Typography.Text>
        <Button
          type="link"
          onClick={() => markAllAsRead(user.id)}
          style={{
            fontSize: "12px",
            color: "#1890ff",
            padding: 0,
          }}
        >
          Mark all as read
        </Button>
      </div>
      <Divider style={{ margin: 0 }} />
      <div
        style={{
          maxHeight: "300px",
          overflowY: "auto",
        }}
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spin />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => markAsRead(notif._id)}
              style={{
                backgroundColor: getNotificationColor(notif.read, notif.type),
                color: notif.read ? "#595959" : "#000",
                padding: "10px 15px",
                borderRadius: "4px",
                margin: "4px",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                position: "relative",
                boxShadow: notif.read
                  ? "none"
                  : "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Tooltip title={notif.read ? "Read" : "Unread"}>
                <div style={{ marginRight: 10 }}>
                  {getIconForType(notif.type)}
                </div>
              </Tooltip>
              <Typography.Text strong={!notif.read}>
                {notif.message}
              </Typography.Text>
              {!notif.read && (
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#1890ff",
                    borderRadius: "50%",
                    position: "absolute",
                    right: "10px",
                    top: "10px",
                  }}
                />
              )}
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Typography.Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: "5px" }} />
              No new notifications
            </Typography.Text>
          </div>
        )}
        {isFetchingNextPage && (
          <div style={{ textAlign: "center", padding: "10px" }}>
            <Spin />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dropdown overlay={menu} trigger={["click"]} placement="bottomRight">
      <span className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
        <Badge
          count={notifications.filter((notif) => !notif.read).length}
          overflowCount={9}
          style={{
            boxShadow: "0 0 0 2px #fff",
          }}
        >
          <BellOutlined style={{ fontSize: 24, color: "#595959" }} />
        </Badge>
      </span>
    </Dropdown>
  );
};

export default NotificationDropdown;
