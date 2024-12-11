import { useMutation, useQuery } from "@tanstack/react-query";
import { Modal } from "antd";
import Picker from "emoji-picker-react";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { GrEmoji } from "react-icons/gr";
import { IoSendSharp } from "react-icons/io5";
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import { SlOptionsVertical } from "react-icons/sl";
import { useNavigate } from "react-router-dom";
import addImages from "../../assets/addImage.png";
import { queryClient } from "../../constants/constants";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import Loading from "../Loading";
import { useSocket } from "../socket/Socket";
import usersStore from "../zustand/store";
import Message from "./Message";

function MessageInbox() {
  const [messages, setMessages] = useState([]);
  const [isUserLoading, setIsUserLoading] = useState(true); // Loading state for user data
  const { refetch: reftechUsers } = useQuery({ queryKey: ["filteredUsers"] });
  const axiosSecure = useAxiosSecure();
  const { socket, onlineUsers, typingUsers } = useSocket();
  const [formData, setFormData] = useState({ text: "", img: "" });
  const imgRef = useRef(null);
  const { user, conversations, addConversation, setUser } = usersStore();
  const navigate = useNavigate();
  const bottomRef = useRef();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [isEmojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const onEmojiClick = (event, emojiObject) => {
    setFormData({ ...formData, text: formData.text + event.emoji });
  };

  // Only navigate once user data has loaded
  useEffect(() => {
    if (user?._id) {
      setIsUserLoading(false); // Set loading to false once user data is loaded
    } else {
      navigate("/overview");
    }
  }, [user, navigate]);

  const {
    data: buble,
    isLoading,
    refetch: messageRefetch,
  } = useQuery({
    queryKey: ["buble", user?._id],
    queryFn: async () => {
      try {
        const { data } = await axiosSecure.get(`/api/messages/${user._id}`);
        return data;
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    enabled: !!user?._id,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
    retry: false,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (buble && buble.length > 0) {
      const newMessages = buble.filter(
        (message) => !conversations.some((conv) => conv._id === message._id)
      );
      newMessages.forEach((message) => {
        addConversation(message);
      });
    }
  }, [buble, addConversation, conversations]);

  const { mutateAsync: sendMessage, isLoading: isSending } = useMutation({
    mutationFn: async () => {
      try {
        const { data } = await axiosSecure.post(
          `/api/messages/send/${user._id}`,
          formData
        );
        socket.emit("sendMessage", data);
        return data;
      } catch (error) {
        console.error(error);
        throw new Error("Failed to send message.");
      }
    },
    onSuccess: (data) => {
      setFormData({ text: "", img: "" });
      addConversation(data);
      messageRefetch();
      queryClient.invalidateQueries({ queryKey: ["conversation", user?._id] });
      reftechUsers();
      socket.emit("stopTyping", { toUserId: user._id });
    },
    onError: () => {
      toast.error("Failed to send message.");
    },
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (socket) {
      socket.emit("typing", { toUserId: user._id });
      setIsTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { toUserId: user._id });
        setIsTyping(false);
      }, 3000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessages();
    }
  };

  const sendMessages = async () => {
    if (formData.text.trim() !== "" || formData.img) {
      const newMessage = {
        _id: Date.now(),
        text: formData.text,
        img: formData.img,
        senderId: { _id: user._id, profile_picture: user.profile_picture },
        receiverId: { _id: user._id },
        createdAt: new Date().toISOString(),
        readBy: [],
      };

      addConversation(newMessage);

      try {
        await sendMessage();
      } catch (error) {}
    }
  };

  useEffect(() => {
    if (socket) {
      // Listen for new messages from the socket
      socket.on("newMessage", (newMessage) => {
        // Update messages state with new message
        setMessages((prevMessages) => [...prevMessages, newMessage]);

        // Refetch users to update any online statuses or message-related info
        reftechUsers();

        // Optionally update conversations or any other data
        queryClient.setQueryData(["conversation", user?._id], (oldData) => {
          if (oldData) {
            return [...oldData, newMessage];
          }
          return [newMessage];
        });
      });

      // Cleanup socket listener on component unmount or when socket changes
      return () => {
        socket.off("newMessage");
      };
    }
  }, [socket, user?._id, queryClient, reftechUsers]); // Added reftechUsers to dependencies

  const filteredMessages = conversations.filter(
    (message) =>
      message.receiverId?._id === user?._id ||
      message.senderId?._id === user?._id
  );

  const imgUploader = (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, img: reader.result }));
        if (imgRef.current) {
          imgRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations]);

  if (isLoading || isUserLoading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="h-16 bg-[#202C33] flex items-center p-4">
        <MdOutlineKeyboardBackspace
          onClick={() => {
            navigate("/c/chats");
            setUser(null);
          }}
          className=" w-6 h-6 cursor-pointer text-white mr-3"
        />
        <div
          onClick={() => setIsModalVisible(true)}
          className="flex flex-1 items-center gap-4 cursor-pointer"
        >
          <div className={``}>
            <img
              src={user.profile_picture}
              alt={user.name}
              className="rounded-full w-10 h-10"
            />
          </div>
          <div className="flex flex-col items-start">
            <h1 className="text-white text-sm">{user.name}</h1>
            <h1 className="text-xs text-gray-300">
              {user.role === "admin" ? (
                <span>Online</span>
              ) : user?.isOnline ? (
                <span>Online</span>
              ) : (
                <span>Last seen {moment(user?.lastSeen).format("LT")}</span>
              )}
            </h1>
          </div>
        </div>
        <SlOptionsVertical className="w-6 h-6 cursor-pointer hover:text-sky-400" />
      </header>

      <Modal
        footer={null}
        onCancel={() => setIsModalVisible(false)}
        open={isModalVisible}
      >
        <div className="flex flex-col items-center bg-[#03141F]">
          <img
            src={user.profile_picture}
            alt={user.name}
            className="rounded-full w-24 h-24"
          />
          <h1 className="text-xl font-semibold mt-2 text-white">{user.name}</h1>
          <h1 className="text-sm text-gray-300">
            Last seen {moment(user?.lastSeen).format("LT")}
          </h1>
        </div>
      </Modal>

      {/* Messages Area */}
      <main className="flex-grow overflow-y-auto scrollbar p-4 bg-[url('https://i.pinimg.com/originals/e6/29/25/e62925d2af795db245dffbc42e05296b.png')]">
        {filteredMessages.map((message) => (
          <Message key={message._id} message={message} />
        ))}
        {filteredMessages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">
              No messages found, Start conversation now!
            </p>
          </div>
        )}
        <div ref={bottomRef}></div>
      </main>

      {/* Message Input */}
      <div className="flex items-center p-4 bg-[#202C33]">
        <div className="relative flex flex-grow items-center">
          <textarea
            name="text"
            value={formData.text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-full mr-5 resize-none bg-[#202C33] text-white p-2 rounded-lg border border-white/50"
            placeholder="Type your message..."
          />
          {isEmojiPickerVisible && (
            <div className="absolute left-0 bottom-full mb-2 z-10">
              <Picker onEmojiClick={onEmojiClick} />
            </div>
          )}
        </div>

        {/* Image Preview */}
        {formData.img && (
          <div className="mt-2 flex justify-center items-center">
            <img
              src={formData.img}
              alt="preview"
              className="max-w-xs max-h-32 object-contain"
            />
          </div>
        )}

        {/* File Input */}
        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          onChange={imgUploader}
          className="hidden"
        />
        <button
          onClick={() => imgRef.current?.click()}
          className=" p-2 text-white bg-gray-700 rounded-full hover:bg-gray-600"
        >
          <img src={addImages} alt="Add Image" className="w-5 h-5" />
        </button>
        <div
          onClick={() => setEmojiPickerVisible(!isEmojiPickerVisible)}
          className="cursor-pointer mx-2"
        >
          <GrEmoji className="w-6 h-6 text-white" />
        </div>
        {/* Send Button */}
        <button
          onClick={sendMessages}
          disabled={isSending}
          className="p-2 text-white bg-blue-500 rounded-full disabled:bg-gray-600"
        >
          <IoSendSharp className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

export default MessageInbox;
