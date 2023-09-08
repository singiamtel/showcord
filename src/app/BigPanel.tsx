"use client";
import { useContext } from "react";
import ChatBox from "./chatbox";
import Messages from "./chat";
import { PS_context } from "./PS_context";

export default function BigPanel() {
  const { selectedPage: room, rooms } = useContext(PS_context);
  if (!room) return null;
  return (
      <div className="bg-gray-300 flex flex-col  w-[70%]">
        <div className="h-[90%] max-h-[90%] flex-shrink min-h-0">
          <Messages />
        </div>
        <div className="flex-grow">
          <ChatBox />
        </div>
      </div>
  );
}
