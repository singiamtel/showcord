"use client";
import { createRef, useContext } from "react";
import { PS_context } from "./PS_context";
import { useEffect, useState } from "react";
import { userColor } from "../utils/namecolour";
import { Message } from "@/client/message";

export default function Chat() {
  const { client, room } = useContext(PS_context);
  const [messages, setMessages] = useState<Message[]>([]);
  const [update, setUpdate] = useState<number>(0);
  const messagesEndRef = createRef<HTMLDivElement>();

  const handleMsgEvent = async () => {
    if (!client) {
      return;
    }
    if (!room) {
      return;
    }
    const msgs = client.room(room)?.messages ?? [];
    setMessages(msgs);
  }; 

  useEffect(() => {
    if (!client) {
      return;
    }
    if (!room) {
      return;
    }

    setMessages(client.room(room)?.messages ?? []);

    const eventListener = () => {
      // handleMsgEvent();
      setUpdate(update + 1);
    };

    client.events.addEventListener("message", eventListener);

    return () => {
      // Clean up the event listener when the component unmounts
      client.events.removeEventListener("message", eventListener);
    };
  }, [client, room, setMessages, update]);

  useEffect(() => {
    handleMsgEvent();
  }, [update]);

  return ( //no-scrollbar
    <div className="p-5 flex flex-col overflow-auto overflow-x-hidden break-words overflow-y-scroll h-full ">
      {messages.map((message, index) => (
        <MessageComponent
          key={index}
          user={message.user}
          message={message.content}
        />
      ))}
      <div id="msg_end" ref={messagesEndRef}></div>
    </div>
  );
}

export function MessageComponent(
  { message, user }: { message: string; user: string | undefined },
) {
  return (
    <div>
      <span className="text-white">
        <span style={{ color: userColor(user) }} className="font-bold">
          {user}:
        </span>{" "}
        {message}
      </span>
    </div>
  );
}
