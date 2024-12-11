import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

// Create context
const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]); // New state for typing indicators
  const [messages, setMessages] = useState([]); // State to hold messages
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const { refetch: reftechUsers } = useQuery({ queryKey: ["filteredUsers"] });
  useEffect(() => {
    if (authUser) {
      const socketInstance = io(import.meta.env.VITE_SERVER_URL, {
        query: {
          userId: authUser._id,
        },
      });

      setSocket(socketInstance);

      socketInstance.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      socketInstance.on("user-disconnected", ({ userId, lastSeen }) => {
        console.log(`User ${userId} disconnected at ${lastSeen}`);
        updateLastSeen(userId, lastSeen);
      });

      // Listen for typing events
      socketInstance.on("typing", ({ fromUserId }) => {
        setTypingUsers((prev) => {
          if (!prev.includes(fromUserId)) {
            return [...prev, fromUserId];
          }
          return prev;
        });
      });

      // Listen for stopTyping events
      socketInstance.on("stopTyping", ({ fromUserId }) => {
        setTypingUsers((prev) => prev.filter((id) => id !== fromUserId));
      });

      // Listen for new messages and update conversation state
      socketInstance.on("newMessage", (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
        reftechUsers();
        setConversation((prevConversations) => {
          return prevConversations.map((conv) => {
            if (conv._id === message.conversationId) {
              conv.messages.push(message);
              // Set the lastRead to null for unread messages
              conv.lastRead[authUser._id] = null;
            }
            return conv;
          });
        });
      });

      return () => socketInstance.close();
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [authUser]);

  // Function to send a new message
  const sendMessage = (toUserId, content, conversationId) => {
    if (socket) {
      reftechUsers();
      socket.emit("newMessage", { toUserId, content, conversationId });
    }
  };

  // Function to send typing event
  const sendTyping = (toUserId) => {
    if (socket) {
      socket.emit("typing", { toUserId });
    }
  };

  // Function to send stop typing event
  const sendStopTyping = (toUserId) => {
    if (socket) {
      socket.emit("stopTyping", { toUserId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        typingUsers,
        sendMessage,
        sendTyping,
        sendStopTyping,
        messages,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
