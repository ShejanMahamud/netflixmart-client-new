import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import { getDecodedToken } from "../../utils/auth";
import { useSocket } from "../socket/Socket";
import { extractTime } from "../utils/dateModify";

function Message({ message }) {
  const user = getDecodedToken();
  const axiosSecure = useAxiosSecure();
  const { socket } = useSocket();
  const [isExpanded, setIsExpanded] = useState(false);
  const [seen, setSeen] = useState(false);

  const {
    data: authUser,
    isLoading: isAuthUserLoading,
    error,
  } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const { data } = await axiosSecure.get(`/auth/user/me/${user?.email}`);
      return data;
    },
    enabled: !!user,
  });

  const isFromMe = message.receiverId?._id !== user.id;
  const profilePic = isFromMe
    ? authUser?.profile_picture
    : message.senderId?.profile_picture;
  const messageTime = extractTime(message.createdAt);
  const charLimit = 150; // Character limit for text preview

  useEffect(() => {
    if (isFromMe) {
      setSeen(message.readBy.includes(message.receiverId?._id));
    }
  }, [message.readBy, isFromMe, message.receiverId?._id]);

  // Construct download link from Cloudinary URL
  const getDownloadLink = (cloudinaryUrl) => {
    const urlParts = cloudinaryUrl.split("/");
    if (urlParts.length >= 8) {
      urlParts.splice(-2, 0, "fl_attachment");
      return urlParts.join("/");
    }
    return cloudinaryUrl;
  };

  // Download image function
  const downloadImage = (imageUrl) => {
    const downloadLink = getDownloadLink(imageUrl);
    const a = document.createElement("a");
    a.href = downloadLink;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (isAuthUserLoading) return <div>Loading...</div>;
  if (error) {
    console.error("Error fetching auth user:", error);
    return <div>Error loading user info.</div>;
  }

  return (
    <div
      className={`flex ${
        isFromMe ? "justify-end" : "justify-start"
      } w-full mb-3`}
    >
      {/* Avatar */}
      {!isFromMe && (
        <div className="avatar w-10 h-10 mr-2">
          <img
            src={profilePic}
            alt={`${authUser?.name}'s profile`}
            className="rounded-full w-full h-full object-cover"
          />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`flex flex-col ${
          isFromMe ? "items-end" : "items-start"
        } max-w-[70%]`}
      >
        {message.img && (
          <div className="relative group">
            <img
              src={message.img}
              alt="Message attachment"
              onDoubleClick={() => downloadImage(message.img)}
              className="w-[300px] h-[200px] object-contain border rounded-lg shadow-lg transition-transform duration-200 transform hover:scale-105"
              aria-label="Double-click to download image"
            />
            <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Double-click to download
            </span>
          </div>
        )}

        {message.text && (
          <div
            className={`relative p-3 rounded-lg ${
              isFromMe ? "bg-[#25D366] text-white" : "bg-gray-200 text-black"
            } shadow-md text-sm leading-tight`}
            style={{
              maxWidth: isExpanded ? "100%" : "300px",
              overflow: isExpanded ? "visible" : "hidden",
              wordWrap: "break-word",
            }}
          >
            {message.text.length > charLimit && !isExpanded ? (
              <>
                {message.text.slice(0, charLimit)}...
                <button
                  onClick={() => setIsExpanded(true)}
                  className="text-xs underline ml-1 text-black"
                >
                  Read more
                </button>
              </>
            ) : (
              <>
                {message.text}
                {message.text.length > charLimit && (
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="text-xs underline ml-1 text-black"
                  >
                    Show less
                  </button>
                )}
              </>
            )}
            {isFromMe && (
              <div className="absolute right-2 bottom-0 text-xs flex items-center space-x-1">
                {message.readBy.includes(message.receiverId?._id) ? (
                  <span className="text-white-400">✓✓</span> // Seen double tick
                ) : (
                  <span className="text-white-500">✓</span> // Sent single tick
                )}
              </div>
            )}
          </div>
        )}
        <span className="text-xs text-gray-500 mt-1">{messageTime}</span>
      </div>
    </div>
  );
}

export default Message;
