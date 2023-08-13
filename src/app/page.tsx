import Rooms from "./rooms";
import ChatBox from "./chatbox";
import Messages from "./chat";
import Users from "./users";
import UserPanel from "./userpanel";

export default function Home() {
  return (
    <div className="h-full flex bg-gray-300 w-full">
      {/* JSX comment*/}
      <div className="w-1/6 flex-col flex">
        <Rooms className="flex-grow" />
        <UserPanel />
      </div>
      <div className="w-full bg-gray-300 flex flex-col">
        <div className="h-[90%]">
          <Messages />
        </div>
        <div className="h-[10%]">
          <ChatBox />
        </div>
      </div>
      <div className="w-1/6">
        <Users />
      </div>
      <div id="modal-root"></div>
    </div>
  );
}
