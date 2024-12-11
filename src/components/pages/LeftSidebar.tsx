import { useQuery } from "@tanstack/react-query";
import { HiOutlineStatusOnline } from "react-icons/hi";
import { IoSettingsOutline } from "react-icons/io5";
import { MdOutlineGroups } from "react-icons/md";
import { TbMessage, TbMessageCircle } from "react-icons/tb";
import { useLocation, useNavigate } from "react-router-dom";

function LeftSidebar() {
  const navigate = useNavigate();
  const tab = useLocation();
  const isActive = (path) => tab.pathname === path;
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  console.log(authUser);
  if (!authUser) return null;
  return (
    <div>
      <div className="flex flex-col justify-between h-screen w-full py-4 items-center text-[#AEBAC1] ">
        <div className="space-y-4">
          <TbMessage
            className={`h-7 w-7 ${
              isActive("/c/chats") && "text-green-500"
            } hover:text-green-500 hover:scale-110 cursor-pointer`}
            onClick={() => navigate("/c/chats")}
          />
          <HiOutlineStatusOnline className="h-7 w-7  hover:text-green-500 hover:scale-110 cursor-pointer" />
          <TbMessageCircle className="h-7 w-7 hover:text-green-500 hover:scale-110 cursor-pointer" />
          <MdOutlineGroups className="h-7 w-7 hover:text-green-500 hover:scale-110 cursor-pointer" />
        </div>
        <div className="space-y-4 flex flex-col items-center">
          <IoSettingsOutline
            className={`h-7 w-7 ${
              isActive("/settings") && "text-green-500"
            } hover:text-green-500 hover:scale-110 cursor-pointer`}
            onClick={() => navigate("/settings")}
          />
          <div className="h-8 w-8 ">
            <img
              src={authUser.profileImg}
              alt=""
              className={`rounded-full h-8 w-8 object-cover ${
                isActive("/profile") && "border-2 border-green-500"
              } hover:text-green-500 hover:scale-110 cursor-pointer`}
              onClick={() => navigate("/profile")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeftSidebar;
