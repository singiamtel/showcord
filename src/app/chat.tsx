"use client";
import {
  createElement,
  createRef,
  Fragment,
  MouseEvent,
  MouseEventHandler,
  ReactElement,
  useContext,
  useRef,
  useState,
} from "react";
import { PS_context } from "./PS_context";
import { useEffect } from "react";

import useOnScreen from "@/utils/isOnScreen";
import HTML from "@/formatting/html";
import { HHMMSS } from "@/utils/date";

import * as linkify from "linkifyjs";
import Linkify from "linkify-react";
// import linkifyHtml from 'linkify-html';
import { Message } from "@/client/message";
import Code from "@/formatting/code";
import { UserCard, UsernameComponent } from "./usercomponents";
import manageURL from "@/utils/manageURL";
import useClickOutside from "@/utils/useClickOutside";
import {
  bold,
  greentext,
  inlineCode,
  italic,
  link,
  spoiler,
  strikethrough,
  subscript,
  superscript,
} from "@/formatting/chat";

// ``code here`` marks inline code
// ||text|| are spoilers
// **text** is bold
// __text__ is italic
// ~~text~~ is strikethrough
// ^^text^^ is superscript
// \\text\\ is subscript
// [[text]] is a link
// >text is greentext
// /me is an emote

const tokens = {
  "`": "code",
  "|": "spoiler",
  "*": "bold",
  "_": "italic",
  "~": "strikethrough",
  "^": "superscript",
  "\\": "subscript",
  "[": "link",
  ">": "greentext",
} as const;

const elements = {
  code: { pattern: /``(.+?)``/g, element: inlineCode },
  spoiler: { pattern: /\|\|(.+?)\|\|/g, element: spoiler },
  bold: { pattern: /\*\*(.+?)\*\*/g, element: bold },
  italic: { pattern: /__(.+?)__/g, element: italic },
  strikethrough: { pattern: /~~(.+?)~~/g, element: strikethrough },
  superscript: { pattern: /\^\^(.+?)\^\^/g, element: superscript },
  subscript: { pattern: /\\\\(.+?)\\\\/g, element: subscript },
  link: { pattern: /\[\[(.+?)?\]\]/g, element: link },
  greentext: { pattern: />.*/g, element: greentext },
} as const;

const cleanTag = (input: string, tag: keyof typeof elements) => {
  switch (tag) {
    case "code":
      return input.replace(/``(.+?)``/g, "$1");
    case "spoiler":
      return input.replace(/\|\|(.+?)\|\|/g, "$1");
    case "bold":
      return input.replace(/\*\*(.+?)\*\*/g, "$1");
    case "italic":
      return input.replace(/__(.+?)__/g, "$1");
    case "strikethrough":
      return input.replace(/~~(.+?)~~/g, "$1");
    case "superscript":
      return input.replace(/\^\^(.+?)\^\^/g, "$1");
    case "subscript":
      return input.replace(/\\\\(.+?)\\\\/g, "$1");
    case "link":
      return input.replace(/\[\[(.+?)?\]\]/g, "$1");
    case "greentext":
      return input?.slice(1);
    default:
      console.error("cleanTag: unknown tag", tag);
      return "";
  }
};

let deepKey = 0
const encloseInTag = (
  input: string,
  tag: keyof typeof elements,
): false | { length: number; element: JSX.Element } => {
  // Find the closing tag if it exists
  elements[tag].pattern.lastIndex = 0;
  const matches = elements[tag].pattern.exec(input);
  console.log('encloseInTag', input, tag, matches)
  if (matches) {
    return {
      length: matches[0].length,
      element: elements[tag].element({
        children: FormatMsgDisplay({ msg: cleanTag(matches[0], tag) }),
        key: deepKey++,
      }),
    };
  }
  return false;
};

export function FormatMsgDisplay({ msg }: { msg: string }) {
  if (!msg) return <>{msg}</>;
  const jsxElements = [];
  let currentString = "";
  for (let i = 0; i < msg.length; i++) {
    const char = msg[i];
    if (char in tokens) {
      const tag = tokens[char as keyof typeof tokens];
      const result = encloseInTag(msg.slice(i), tag);
      if (result) {
        i += result.length - 1;
        if (currentString) {
          jsxElements.push(<Fragment key={deepKey++}>currentString</Fragment>);
          currentString = "";
        }
        jsxElements.push(result.element);
      } else {
        currentString += msg[i];
      }
    } else {
      currentString += msg[i];
    }
  }
  if (currentString) {
    jsxElements.push(<Fragment key={deepKey++}>{currentString}</Fragment>);
  }
  return <Linkify options={options}>{jsxElements}</Linkify>;
}

export default function Chat() {
  const { messages, client, selectedPage } = useContext(PS_context);
  const messagesEndRef = createRef<HTMLDivElement>();
  const isIntersecting = useOnScreen(messagesEndRef);
  const [user, setUser] = useState<any | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const wrapperRef = useRef(null);
  const { isOutside } = useClickOutside(wrapperRef);

  useEffect(() => {
    setUser(null);
    setUsername(null);
  }, [isOutside]);

  useEffect(() => {
    messagesEndRef.current!.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  useEffect(() => {
    setUser(null);
  }, [selectedPage]);

  useEffect(() => {
    if (isIntersecting) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [messages, messagesEndRef, isIntersecting]);

  const clickUsername = (e: MouseEvent) => {
    const username = (e.target as HTMLAnchorElement).innerText;
    // setIsOutside(null);
    setUsername(username);
    setPosition({ x: e.clientX, y: e.clientY });
    client?.getUser(username, (user: any) => {
      setUser(user);
    });
  };

  return (
    <div className="p-5 flex flex-col overflow-auto overflow-x-hidden break-words overflow-y-scroll h-full ">
      {username
        ? (
          <UserCard
            user={user}
            name={username}
            position={position}
            forwardRef={wrapperRef}
          />
        )
        : null}
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

          &nbsp;
        </span>
        {" " + message}
      </div>
    );
  }
  // {" " + message}
  return (
    <div className={"p-0.5 " + (hld ? "bg-yellow-hl-body" : "")}>
      <span className="text-gray-125 font-mono text-xs">
        {time ? HHMMSS(time) : ""}
        &nbsp;
      </span>
      <span className="text-white">
        <UsernameComponent
          user={user}
          onClick={(e) => onNameClick && onNameClick(e)}
          colon
        />
        {/* https://linkify.js.org/docs/linkify-react.html#custom-link-components */}
        &nbsp;<FormatMsgDisplay msg={message} />
      </span>
    </div>
  );

  // <Linkify options={options}>
  // &nbsp;{message}
  // </Linkify>
}
