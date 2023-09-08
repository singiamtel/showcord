// recognize HTML commands and try to parse them
// if they have no parser, just return the sanitized HTML

import { PS_context } from "@/app/PS_context";
import manageURL from "@/utils/manageURL";
import parse, { domToReact } from "html-react-parser";
import { useContext } from "react";
import sanitizeHtml from "sanitize-html-react";

export default function HTML({ message }: any) {
  // console.log("HTMLmessage", message);
  // console.log("HTMLsanitized", sanitizeHtml(message, sanitizeOptions));
  // console.log(
  //   "HTMLparsed",
  //   parse(sanitizeHtml(message, sanitizeOptions), parserOptions),
  // );
  const { client, selectedRoom } = useContext(PS_context);
  const parserOptions = {
    replace: (domNode: any) => {
      const { attribs, children } = domNode;
      if (!attribs) {
        return;
      }
      if (attribs.href) {
        return (
          <a
            href={attribs.href}
            target="_blank"
            onClick={manageURL}
            style={{ cursor: "pointer" }}
            className="novisited"
          >
            {domToReact(children, parserOptions)}
          </a>
        );
      }
      if (domNode.name === "button" && attribs.value) {
        return (
          <button
            onClick={() => {
              client?.send(attribs.value, selectedRoom || "");
            }}
            className="bg-blue-100 hover:bg-blue-400 text-white font-bold p-1 m-1 rounded text-sm"
            data-parsed="true"
          >
            {domToReact(children, parserOptions)}
          </button>
        );
      }
      if (domNode.name === "anonymous") {
        console.log("anonymous", domNode);
        return (
          <>
            {"<anonymous>"}
            {domToReact(children, parserOptions)}
          </>
        );
      }
      if (domNode.name === "summary") {
        return (
          <>
            {domToReact(children, parserOptions)}
          </>
        );
      }
    },
  };

  const colorRegex = [
    /^#(0x)?[0-9a-f]+$/i,
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,
    /hsl\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/,
  ];
  const sanitizeOptions = {
    allowedTags: [
      "img",
      "center",
      "table",
      "tbody",
      "tr",
      "td",
      "strong",
      "p",
      "code",
      "br",
      "a",
      "div",
      "span",
      "button",
      "summary",
      "small",
    ],
    allowedAttributes: {
      "img": ["src", "height", "width"],
      "button": ["value"],
      "a": ["href"],
      "*": ["style"],
    },
    allowedStyles: {
      "p": {
        "letter-spacing": [/^(\d+)(\w+)$/],
      },
      "span": {
        "background": colorRegex,
        "padding-right": [/^(\d+)px$/],
      },
      "*": {
        "color": colorRegex,
        // "background-image": [
        //   /^url\((.*?)\)$/i,
        // ],
      },
    },
    disallowedTagsMode: "escape",
  };
  // console.log("HTMLmessage", sanitizeHtml(message, sanitizeOptions));
  // console.log("testHTML", sanitizeHtml("<test>lol", sanitizeOptions));
  return (
    <div className="p-2 ml-10 mr-10 m-2 text-white border border-solid border-gray-border bg-gray-600 rounded">
      <span className="">
        {parse(
          sanitizeHtml(message, sanitizeOptions),
          parserOptions,
        )}
      </span>
    </div>
  );
}
