"use client";
import { createRef, useContext } from "react";
import { PS_context } from "./PS_context";
import { useEffect } from "react";

import useOnScreen from "@/utils/isOnScreen";
import HTML from "@/commands/html";
import { HHMMSS } from "@/utils/date";

import Linkify from 'linkify-react';
import { Message } from "@/client/message";
import Code from "@/commands/code";
import { UsernameComponent } from "./usercomponents";
import manageURL from "@/utils/manageURL";

export default function Chat() {
  const { messages } = useContext(PS_context);
  const messagesEndRef = createRef<HTMLDivElement>();
  const isIntersecting = useOnScreen(messagesEndRef);

  useEffect(() => {
    messagesEndRef.current!.scrollIntoView({ behavior: "auto"});
  }, [messages])

  useEffect(() => {
    if (isIntersecting) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    } 
  }, [messages, messagesEndRef, isIntersecting]);

  return ( //no-scrollbar
    <div className="p-5 flex flex-col overflow-auto overflow-x-hidden break-words overflow-y-scroll h-full ">
      {messages.map((message, index, arr) => (
        <MessageComponent
          key={index}
          time={message.timestamp}
          user={message.user || ""}
          message={message.content}
          type={message.type}
          hld={message.hld}
          prev={arr[index - 1]}
        />
      ))}
      <div>
        <div id="msg_end" ref={messagesEndRef} className="h-4 w-4"></div>
      </div>
    </div>
  );
}

const options = {
  defaultProtocol: 'https',
  target: '_blank',
  attributes: {
    onClick: manageURL,
    className: 'text-blue-500 underline cursor-pointer',
  }
};

export function MessageComponent(
  { message, user, type, time, hld, prev }: {
    message: string;
    user: string;
    type: string;
    time?: Date;
    hld?: boolean;
    prev?: Message;
  },
) {
  if (type === "raw") {
    if(prev?.content.startsWith("!code")) {
      return <Code message={message} />;
    }
    return <HTML message={message} />;
  }
  if(type === "log") {
    return (
      <div className="p-0.5 text-white">
      <span className="text-gray-125 font-mono">
        {time ? HHMMSS(time) : ""}
        </span>
        {" " + message}
      </div>
    )
  }
  return (
    <div className={"p-0.5 " + (hld ? "bg-yellow-hl-body" : "")}>
      <span className="text-gray-125 font-mono">
        {time ? HHMMSS(time) : ""}
        </span>
      <span className="text-white">
        <UsernameComponent user={user} />
        {/* https://linkify.js.org/docs/linkify-react.html#custom-link-components */}
        <Linkify options={options}>
        {' ' + message}
        </Linkify>
      </span>
    </div>
  );
}
