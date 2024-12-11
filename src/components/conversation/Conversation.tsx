import { Link, Outlet, useOutlet, useParams } from "react-router-dom";
import mIcon from "../../assets/buble.png";
import ChatBox from "../pages/ChatBox";

function Conversation() {
  const { box } = useParams();
  const hasOutlet = useOutlet();

  return (
    <div className="flex flex-col sm:flex-row w-full h-screen bg-black">

      <div
        className={`bg-[#111B21] text-white ${
          hasOutlet ? " sm:block sm:w-[40%]" : "w-full sm:w-[40%]"
        } flex-shrink-0 flex flex-col`}
      >
        {box === "chats" && <ChatBox />}
      </div>

      {/* Outlet Container */}
      <div
        className={`bg-[#222E35] flex-grow h-full ${
          hasOutlet ? "w-full" : "w-0 sm:w-[60%]"
        } transition-all duration-300 overflow-hidden`}
      >
        {hasOutlet ? (
          <Outlet />
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center">
            <img
              src={mIcon}
              alt="Start a conversation"
              className="w-2/3 h-2/3 object-contain animate-pulse"
            />
            <div className="w-full flex items-center justify-center">
             <Link to={"/"}>
             <button className="bg-green-500 px-4 py-3 rounded-md text-white">
                Back To Home
              </button>
             </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Conversation;
