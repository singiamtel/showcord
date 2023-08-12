"use client";
import { createRef, useContext } from "react";
import { PS_context } from "./PS_context";
import { useEffect, useState } from "react";
import { userColor } from "../utils/namecolour";
import { Message } from "@/client/message";
import { debounce } from "lodash";

export default function Chat() {
  const { client, room } = useContext(PS_context);
  const [messages, setMessages] = useState<Message[]>([]);
  const [juan, setJuan] = useState<number>(0);
  const messagesEndRef = createRef<HTMLDivElement>();

  const handleMsgEvent = async () => {
    if (!client) {
      return;
    }
    if (!room) {
      return;
    }
    const msgs = client.room(room)?.messages ?? [];
    if (!msgs || !msgs.length) {
      console.log("no updated messages");
    }
    console.log("updated messages ", JSON.stringify(msgs));
    console.log("update debounce");
    setMessages(msgs);
  }; //, 400); // Not sure how long the debounce should be. Without it, we overlap events
  useEffect(() => {
    if (!client) {
      return;
    }
    if (!room) {
      return;
    }

    setMessages(client.room(room)?.messages ?? []);

    const eventListener = (msg: any) => {
      // handleMsgEvent();
      setJuan(juan + 1);
    };

    client.events.addEventListener("message", eventListener);

    return () => {
      // Clean up the event listener when the component unmounts
      client.events.removeEventListener("message", eventListener);
    };
  }, [client, room, setMessages, juan]);

  //print messages when they change
  useEffect(() => {
    console.log("juan is now ", juan);
    handleMsgEvent();
  }, [juan]);

  useEffect(() => {
    console.log("actually updated messages ", messages);
  }, [messages]);

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
        <span style={{ color: userColor(user) }}>
          {user}:
        </span>{" "}
        {message}
      </span>
    </div>
  );
}
