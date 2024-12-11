import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import { getDecodedToken } from "../../utils/auth";
import { useSocket } from "../socket/Socket";
import { extractTime } from "../utils/dateModify";
import usersStore from "../zustand/store";

const ConverPeople = ({ user }) => {
  const { setUser } = usersStore();
  const { onlineUsers } = useSocket();
  const axiosSecure = useAxiosSecure();
  const navigate = useNavigate();
  const { id } = useParams(); // Current user's ID
  const [isNewMessage, setIsNewMessage] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastText, setLastText] = useState("Send a message");
  const userInfo = getDecodedToken();

  const charLimit = 40; // Set the character limit for the message preview

  // Mutation for marking a conversation as read
  const { mutateAsync } = useMutation({
    mutationFn: async (conversationId) => {
      const { data } = await axiosSecure.post(
        `/api/messages/mark-as-read/${conversationId}`
      );
      return data;
    },
  });

  // Function to set Zustand state for the selected user
  const setZustandState = () => {
    const userData = {
      _id: user._id,
      profile_picture: user.profile_picture,
      name: user.name,
      username: user.username,
      lastSeen: user.lastSeen,
      isOnline: user.isOnline,
      role: user.role,
    };
    setUser(userData);
  };

  // Fetch authenticated user information
  const {
    data: authUser,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const { data } = await axiosSecure.get(`/auth/user/me/${user?._id}`);
      return data.data;
    },
  });

  // Fetch the conversation between the current user and the target user
  const {
    data: conversation,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["conversation", user._id],
    queryFn: async () => {
      try {
        const response = await axiosSecure.get(
          `/api/messages/conversation/${user._id}`
        );
        return response.data || { messages: [] }; // Handle unexpected response structure
      } catch (error) {
        console.error("Error fetching conversation:", error);
        return { messages: [] }; // Default to an empty conversation on error
      }
    },
    refetchOnWindowFocus: true, // Enable window refetching for instant updates in chat
    refetchOnReconnect: true,
    staleTime: 0, // Fetch fresh data every time for real-time updates
    retry: false, // No retry to avoid delays in chat
    refetchInterval: 2000,
  });

  useEffect(() => {
    // Check if the last message is unread
    if (conversation && conversation?.messages?.length > 0) {
      const lastMessage =
        conversation?.messages[conversation?.messages?.length - 1];
      setIsNewMessage(!lastMessage?.readBy?.includes(userInfo.id));

      // Handle last message text and check for character limit
      let lastMessageText = lastMessage?.text || "Media file";
      if (lastMessageText.length > charLimit) {
        lastMessageText = lastMessageText.slice(0, charLimit) + "...";
      }
      setLastText(lastMessageText);
    } else {
      setIsNewMessage(false);
      setLastText("Send a message");
    }
  }, [conversation, authUser, userInfo.id]);

  // Handle loading and error states
  if (isLoading || userLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || userError) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">Error loading conversation.</p>
      </div>
    );
  }

  // Determine the last message, time, and unread status
  let lastUpdate = "";
  let isUnread = false;
  let isReceivedMessage = false;
  let lastMessage = null;
  if (
    conversation &&
    Array.isArray(conversation.messages) &&
    conversation.messages.length > 0
  ) {
    // Sort messages by updatedAt to get the most recent first
    const sortedMessages = [...conversation.messages].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );
    lastMessage = sortedMessages[0]; // Get the latest message
    lastUpdate = lastMessage.updatedAt
      ? extractTime(lastMessage.updatedAt)
      : "";

    // Determine if the current user is the receiver of the message and it's unread
    isReceivedMessage = lastMessage.receiverId === authUser._id;
    if (isReceivedMessage && Array.isArray(lastMessage.readBy)) {
      isUnread = !lastMessage.readBy.includes(authUser._id);
    }
  }

  // Check if the user profile belongs to the authenticated user
  const isMyProfile = user._id === authUser?._id;
  console.log(authUser);
  return (
    <div
      className={`pl-4 flex justify-start items-center space-x-3 py-2 hover:bg-[#2A3942] ${
        isMyProfile ? "bg-[#2A3942]" : ""
      } border-b-[1px] border-[#556269] cursor-pointer`}
      onClick={() => {
        setZustandState();
        navigate(`/chats/${user._id}`);
        mutateAsync(conversation._id).then(() => {
          refetch();
        });
      }}
    >
      <div className={`h-14 w-14 avatar`}>
        <div className="relative">
          <img
            src={user.profile_picture}
            alt=""
            className="rounded-full object-cover w-full h-full"
          />
          {user?.isOnline ? (
            <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full"></div>
          ) : (
            <div className="absolute top-0 right-0 w-4 h-4 bg-gray-500 rounded-full"></div>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center pb-1 w-full">
        <div className="overflow-hidden">
          <p className="font-semibold truncate">
            {isMyProfile ? "Me" : user.name}
          </p>
          <p
            className={`text-[#8696A0] text-sm truncate ${
              lastMessage?.senderId !== authUser?._id &&
              isNewMessage &&
              "font-bold text-white"
            }`}
          >
            {lastText}
          </p>
        </div>
        <div className="flex items-center">
          <p className="text-[#8696A0] text-sm pr-4">{lastUpdate}</p>
          {lastMessage?.senderId !== authUser?._id && isNewMessage && (
            <div className="w-2 h-2 bg-[#3B82F6] rounded-full"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConverPeople;
