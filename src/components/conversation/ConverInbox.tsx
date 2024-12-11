import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode"; // Correct import for jwt-decode
import { useState } from "react";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import Loading from "../Loading";
import ConverPeople from "./ConverPeople";
const ConverInbox = () => {
  const [searchTerm, setSearchTerm] = useState(""); // State for search term
  const token = Cookies.get("token");
  const userDecoded = jwtDecode(token);
  const axiosSecure = useAxiosSecure();

  const { data: filteredUsers, isLoading } = useQuery({
    queryKey: ["filteredUsers"],
    queryFn: async () => {
      const { data } = await axiosSecure.get(
        `/auth/user/2?role=${userDecoded.role}`
      );
      if (userDecoded.role === "user") {
        const admin = data.data.find((user) => user.role === "admin");
        return admin ? [admin] : [];
      } else {
        return data.data.filter((user) => user.role !== "admin");
      }
    },
    refetchInterval: 10000,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!filteredUsers || filteredUsers.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500">No users found</p>
      </div>
    );
  }

  // Sort users by the latest conversation's lastUpdated field
  const sortedUsers = filteredUsers
    .filter(
      (user) => user.latestConversation && user.latestConversation.length > 0
    )
    .sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );

  // Filter users based on search term
  const displayedUsers = sortedUsers.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex-grow overflow-y-auto scrollbar w-full px-4">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border text-black rounded-lg"
          />
        </div>

        {displayedUsers.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          displayedUsers.map((user) => (
            <ConverPeople key={user._id} user={user} />
          ))
        )}
      </div>
    </>
  );
};

export default ConverInbox;
