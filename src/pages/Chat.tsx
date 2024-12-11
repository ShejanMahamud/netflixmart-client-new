// src/components/ChatApp.tsx
import { Layout } from "antd";
import React, { useEffect } from "react";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import { useChat } from "../context/ChatContext";
import useSocket from "../hooks/useSocket";
import api from "../services/api";

const { Sider, Content } = Layout;

const ChatApp: React.FC = () => {
  const socket = useSocket(import.meta.env.VITE_SERVER_URL); // Replace with your backend URL
  const { user, setConversations, selectedConversation, setMessages } =
    useChat();

  useEffect(() => {
    if (!socket) return;

    // Fetch initial conversations
    const fetchConversations = async () => {
      try {
        const response = await api.get("/api/messages/conversations"); // Adjust endpoint as needed
        setConversations(response.data.conversations);
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      }
    };

    fetchConversations();

    // Listen for incoming messages
    socket.on("receiveMessage", (message: any) => {
      if (
        selectedConversation &&
        message.conversationId === selectedConversation._id
      ) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [socket, setConversations, selectedConversation, setMessages]);

  return (
    <Layout style={{ height: "100vh" }}>
      <Sider width={300} className="bg-white shadow-md">
        <ChatList />
      </Sider>
      <Layout>
        <Content className="bg-gray-100">
          <ChatWindow />
        </Content>
      </Layout>
    </Layout>
  );
};

export default ChatApp;
