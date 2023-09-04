"use client";
import { createRef, MouseEvent, MouseEventHandler, useContext, useRef, useState } from "react";
import { PS_context } from "./PS_context";
import { useEffect } from "react";

import useOnScreen from "@/utils/isOnScreen";
import HTML from "@/commands/html";
import { HHMMSS } from "@/utils/date";

import Linkify from "linkify-react";
import { Message } from "@/client/message";
import Code from "@/commands/code";
import { UserCard, UsernameComponent } from "./usercomponents";
import manageURL from "@/utils/manageURL";
import useClickOutside from "@/utils/useClickOutside";

export default function Chat() {
  const { messages, client, selectedRoom } = useContext(PS_context);
  const messagesEndRef = createRef<HTMLDivElement>();
  const isIntersecting = useOnScreen(messagesEndRef);
  const [user, setUser] = useState<any | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [position, setPosition] = useState<{x:number, y:number}>({x:0, y:0});

  const wrapperRef = useRef(null);
  const {isOutside} = useClickOutside(wrapperRef);

  useEffect(() => {
    setUser(null)
    setUsername(null)
  }, [isOutside]);

  useEffect(() => {
    messagesEndRef.current!.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  useEffect(() => {
    setUser(null);
  }, [selectedRoom])

  useEffect(() => {
    if (isIntersecting) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [messages, messagesEndRef, isIntersecting]);

  const clickUsername = (e: MouseEvent) => {
    const username = (e.target as HTMLAnchorElement).innerText;
    // setIsOutside(null);
    setUsername(username);
    setPosition({x: e.clientX, y: e.clientY});
    client?.getUser(username, (user: any) => {
      setUser(user);
    });
  };

  return (
    <div className="p-5 flex flex-col overflow-auto overflow-x-hidden break-words overflow-y-scroll h-full ">
      {username ? <UserCard user={user} name={username} position={position} forwardRef={wrapperRef} /> : null}
      {messages.map((message, index, arr) => (
        <MessageComponent
          key={index}
          time={message.timestamp}
          user={message.user || ""}
          message={message.content}
          type={message.type}
          hld={message.hld}
          prev={arr[index - 1]}
          onNameClick={clickUsername}
        />
      ))}
      <div>
        <div id="msg_end" ref={messagesEndRef} className="h-4 w-4"></div>{" "}
        {/* invisible div to scroll to */}
      </div>
    </div>
  );
}

const options = {
  defaultProtocol: "https",
  target: "_blank",
  attributes: {
    onClick: manageURL,
    className: "text-blue-500 underline cursor-pointer",
  },
};

export function MessageComponent(
  { message, user, type, time, hld, prev, onNameClick }: {
    message: string;
    user: string;
    type: string;
    time?: Date;
    hld?: boolean;
    prev?: Message;
    onNameClick?: (e: MouseEvent) => void;
  },
) {
  if (type === "raw") {
    if (prev?.content.startsWith("!code")) {
      return <Code message={message} />;
    }
    return <HTML message={message} />;
  }
  if (type === "log") {
    return (
      <div className="p-0.5 text-white">
        <span className="text-gray-125 font-mono text-xs">
          {time ? HHMMSS(time) : ""}
        </span>
        {" " + message}
      </div>
    );
  }
  return (
    <div className={"p-0.5 " + (hld ? "bg-yellow-hl-body" : "")}>
      <span className="text-gray-125 font-mono text-xs">
        {time ? HHMMSS(time) : ""}
      </span>
      <span className="text-white">
        <UsernameComponent user={user} onClick={(e) => onNameClick && onNameClick(e)} />
        {/* https://linkify.js.org/docs/linkify-react.html#custom-link-components */}
        <Linkify options={options}>
          {" " + message}
        </Linkify>
      </span>
    </div>
  );
}
