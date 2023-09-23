"use client";
import {
  createRef,
  Fragment,
  MouseEvent,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
} from "react";
import { PS_context } from "./PS_context";

import useOnScreen from "@/utils/isOnScreen";
import HTML from "@/formatting/html";
import { HHMMSS } from "@/utils/date";

import Linkify from "linkify-react";
import { Message } from "@/client/message";
import Code from "@/formatting/code";
import { UserCard, UsernameComponent } from "./usercomponents";
import manageURL from "@/utils/manageURL";
import useClickOutside from "@/utils/useClickOutside";
import {
  bold,
  greentext,
  inlineCode,
  roomLink,
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
  "<": "roomlink",
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
  greentext: { pattern: /^\>.*/g, element: greentext },
  roomlink: { pattern: /\<\<(.+?)?\>\>/g, element: roomLink },
} as const;

const cleanTag = (input: string, tag: keyof typeof elements) => {
  switch (tag) {
    case "code":
      // return input.replace(/``(.+?)``/g, "$1");
      return input.replace(elements.code.pattern, "$1");
    case "spoiler":
      // return input.replace(/\|\|(.+?)\|\|/g, "$1");
      return input.replace(elements.spoiler.pattern, "$1");
    case "bold":
      // return input.replace(/\*\*(.+?)\*\*/g, "$1");
      return input.replace(elements.bold.pattern, "$1");
    case "italic":
      // return input.replace(/__(.+?)__/g, "$1");
      return input.replace(elements.italic.pattern, "$1");
    case "strikethrough":
      // return input.replace(/~~(.+?)~~/g, "$1");
      return input.replace(elements.strikethrough.pattern, "$1");
    case "superscript":
      // return input.replace(/\^\^(.+?)\^\^/g, "$1");
      return input.replace(elements.superscript.pattern, "$1");
    case "subscript":
      // return input.replace(/\\\\(.+?)\\\\/g, "$1");
      return input.replace(elements.subscript.pattern, "$1");
    case "link":
      // return input.replace(/\[\[(.+?)?\]\]/g, "$1");
      return input.replace(elements.link.pattern, "$1");
    case "greentext":
      return input?.slice(1);
    case "roomlink":
      return input.replace(elements.roomlink.pattern, "$1");
    default:
      console.error("cleanTag: unknown tag", tag);
      return "";
  }
};

let deepKey = 0;
const encloseInTag = (
  input: string,
  tag: keyof typeof elements,
): false | { length: number; element: JSX.Element } => {
  // Find the closing tag if it exists
  elements[tag].pattern.lastIndex = 0;
  const matches = elements[tag].pattern.exec(input);
  if (matches) {
    return {
      length: matches[0].length,
      element: elements[tag].element({
        children: FormatMsgDisplay({
          msg: cleanTag(matches[0], tag),
          recursed: true,
        }),
        key: deepKey++,
      }),
    };
  }
  return false;
};

export function FormatMsgDisplay(
  { msg, recursed = false }: { msg: string; recursed?: boolean },
) {
  if (!msg) return <>{msg}</>;
  const jsxElements = [];
  let currentString = "";
  for (let i = 0; i < msg.length; i++) {
    const char = msg[i];
    if (char in tokens) {
      const tag = tokens[char as keyof typeof tokens];
      if (char === ">" && i !== 0) {
        currentString += char;
        continue;
      }
      const result = encloseInTag(msg.slice(i), tag);
      if (result) {
        i += result.length - 1;
        if (currentString) {
          if (recursed) {
            jsxElements.push(
              <Fragment key={deepKey++}>{currentString}</Fragment>,
            );
          } else {
            jsxElements.push(
              <Linkify options={options} key={deepKey++}>
                {currentString}
              </Linkify>,
            );
          }
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
    if (recursed) {
      jsxElements.push(
        <Fragment key={deepKey++}>{currentString}</Fragment>,
      );
    } else {
      jsxElements.push(
        <Linkify options={options} key={deepKey++}>
          {currentString}
        </Linkify>,
      );
    }
  }
  return <>{jsxElements}</>;
}

export default function Chat() {
  const { messages, client, selectedPage } = useContext(PS_context);
  const messagesEndRef = createRef<HTMLDivElement>();
  const isIntersecting = useOnScreen(messagesEndRef);
  const [user, setUser] = useState<any | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [__messages, setMessages] = useState<Message[]>([]); // messages to display
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

  useLayoutEffect(() => {
    setMessages(messages);
  }, [messages]);


  useLayoutEffect(() => {
    messagesEndRef.current!.scrollIntoView({ behavior: "auto" });
  }, [__messages]);

  useEffect(() => {
    setUser(null);
  }, [selectedPage]);

  useEffect(() => {
    if (isIntersecting) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [__messages, messagesEndRef, isIntersecting]);

  const clickUsername = (e: MouseEvent) => {
    const username = (e.target as HTMLAnchorElement).innerText;
    // setIsOutside(null);
    setUsername(username);
    setPosition({ x: e.clientX, y: e.clientY });
    client?.queryUser(username, (user: any) => {
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
      {__messages.map((message, index, arr) => (
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

/* https://linkify.js.org/docs/linkify-react.html#custom-link-components */
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
  if (type === "simple") {
    return message ? (
    <div className="text-white">
    {" " + message}
    </div>) : null;
  }
  if (type === "log") {
    return (
      <div className="text-white">
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
    <div className={"" + (hld ? "bg-yellow-hl-body" : "")}>
      <span className="text-gray-125 font-mono text-xs">
        {time ? HHMMSS(time) : ""}
        &nbsp;
      </span>
      <span className="text-white">
        <UsernameComponent
          user={user}
          onClick={(e) => onNameClick && onNameClick(e)}
          colon
          bold
        />
        &nbsp;<FormatMsgDisplay msg={message} />
      </span>
    </div>
  );
}
