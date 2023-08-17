"use client";
import { createRef, useContext } from "react";
import { PS_context } from "./PS_context";
import { useEffect } from "react";

import { userColor } from "../utils/namecolour";
import useOnScreen from "@/utils/isOnScreen";
import HTML from "@/commands/html";
import { HHMMSS } from "@/utils/date";
import { UserComponent } from "./users";

export default function Chat() {
  const { messages } = useContext(PS_context);
  const messagesEndRef = createRef<HTMLDivElement>();
  const isIntersecting = useOnScreen(messagesEndRef);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [])

  useEffect(() => {
    if (isIntersecting) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    } 
  }, [messages, messagesEndRef, isIntersecting]);

  return ( //no-scrollbar
    <div className="p-5 flex flex-col overflow-auto overflow-x-hidden break-words overflow-y-scroll h-full ">
      {messages.map((message, index) => (
        <MessageComponent
          key={index}
          time={message.timestamp}
          user={message.user || ""}
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
  { message, user, type, time }: {
    message: string;
    user: string;
    type: string;
    time: Date;
  },
) {
  if (type === "raw") {
    return <HTML message={message} />;
  }
  return (
    <div className="p-0.5">
      <span className="text-gray-125 font-mono">
        {HHMMSS(time)}
        </span>
      <span className="text-white">
        <UserComponent user={user} />
        {" " + message}
      </span>
    </div>
  );
}
