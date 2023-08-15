"use client";
import { createRef, useContext } from "react";
import { PS_context } from "./PS_context";
import { useEffect, useState } from "react";

import { userColor } from "../utils/namecolour";
import { Message } from "@/client/message";
import useOnScreen from "@/utils/isOnScreen";
import HTML from "@/commands/html"

export default function Chat() {
  const { client, selectedRoom: room, messages } = useContext(PS_context);
  // const [messages, setMessages] = useState<Message[]>([]);
  const [update, setUpdate] = useState<number>(0);
  const messagesEndRef = createRef<HTMLDivElement>();
  const isIntersecting = useOnScreen(messagesEndRef);

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [room]);

  useEffect(() => {
    if (isIntersecting){
      console.log("scrolling", messagesEndRef.current);
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    } else {
      console.log("not on screen, refusing to scroll");
    }
  }, [messages, messagesEndRef, isIntersecting, update]);

  return ( //no-scrollbar
    <div className="p-5 flex flex-col overflow-auto overflow-x-hidden break-words overflow-y-scroll h-full ">
      {messages.map((message, index) => (
        <MessageComponent
          key={index}
          user={message.user}
          message={message.content}
          type={message.type}
        />
      ))}
      <div>
        <div id="msg_end" ref={messagesEndRef} className="h-4 w-4"></div>
      </div>
    </div>
  );
}

export function MessageComponent(
  { message, user, type }: { message: string; user: string | undefined, type: string }
) {
  if(type === "raw"){
    return (
    <HTML message={message} />
      )
  }
  return (
    <div className="p-0.5">
      <span className="text-white">
        <span className="text-[#9D9488]">
          {user?.slice(0, 1)}
        </span>
        <span style={{ color: userColor(user) }} className="font-bold">
          {user?.slice(1)}:
        </span>{" "}
        {message}
      </span>
    </div>
  );
}
