import ConverHeader from "../conversation/ConverHeader";
import ConverInbox from "../conversation/ConverInbox";

function ChatBox() {
  return (
    <div className="flex flex-col flex-grow h-full">
      <ConverHeader />
      <ConverInbox />
    </div>
  );
}

export default ChatBox;
