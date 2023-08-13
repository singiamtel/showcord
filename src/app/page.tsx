import Rooms from "./rooms";
import ChatBox from "./chatbox";
import Messages from "./chat";
import Users from "./users";

export default function Home() {
  return (
    <div className="h-full flex bg-gray-300 w-full">
      {/* JSX comment*/}
      <div className="w-1/6">
        <Rooms />
      </div>
      <div className="w-full bg-gray-300">
        <div className="h-[90%] ">
          <Messages />
        </div>
        <div className="h-[10%]">
          <ChatBox />
        </div>
      </div>
      <div className="w-1/6">
        <Users />
      </div>
    </div>
  );
}
