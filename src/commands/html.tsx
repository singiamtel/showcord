// recognize HTML commands and try to parse them
// if they have no parser, just return the sanitized HTML

import manageURL from "@/utils/manageURL";
import parse, { domToReact } from "html-react-parser";
import sanitizeHtml from "sanitize-html-react";

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
    if(domNode.name === "button" && attribs.value) {
      return (
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" data-parsed="true">
          {domToReact(children, parserOptions)}
        </button>
      )
    }
  },
};

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
    "button",
  ],
  allowedAttributes: {
    "img": ["src", "height", "width"],
    "button": ["value"],
    "a": ["href"],
    // "*": ["style"],
  },
  allowedStyles: {
    "*": {
      "color": [
        /^#(0x)?[0-9a-f]+$/i,
        /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,
        /hsl\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/,
      ],
      // "background-image": [
      //   /^url\((.*?)\)$/i,
      // ],
    },
  },
};

export default function HTML({ message }: any) {
  // console.log("HTMLmessage", message);
  // console.log("HTMLsanitized", sanitizeHtml(message, sanitizeOptions));
  // console.log(
  //   "HTMLparsed",
  //   parse(sanitizeHtml(message, sanitizeOptions), parserOptions),
  // );
  return (
    <div className="p-2 ml-14 mr-14 m-2 text-white border border-solid border-gray-border bg-gray-600 rounded">
      <span className="">
        {parse(
          sanitizeHtml(message, sanitizeOptions),
          parserOptions,
        )}
      </span>
    </div>
  );
}
