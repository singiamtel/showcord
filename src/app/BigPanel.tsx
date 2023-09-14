"use client";
import { useContext } from "react";
import ChatBox from "./chatbox";
import Messages from "./chat";
import { PS_context } from "./PS_context";
import Users from "./users";
import MainPage from "./mainPage";

export default function BigPanel() {
  const { selectedPage: room, rooms } = useContext(PS_context);
  const roomType = rooms?.find((r) => r.ID === room)?.type;
  if (!room) return null;
  if (roomType === "permanent") {
    return (
      <MainPage/>
    );
  }
  return (
    <>
      <div className="bg-gray-300 flex flex-col">
        <div className="h-[90%] max-h-[90%] flex-grow flex-shrink min-h-0">
          <Messages />
        </div>
        <div className="flex-grow">
          <ChatBox />
        </div>
      </div>

      <div className="w-1/6 flex-grow">
        <Users />
      </div>
      <div id="modal-root"></div>
    </>
  );
}
