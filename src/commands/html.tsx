// recognize HTML commands and try to parse them
// if they have no parser, just return the sanitized HTML

import manageURL from "@/utils/manageURL";
import parse, { domToReact } from "html-react-parser";
import sanitizeHtml from "sanitize-html-react";

const parserOptions = {
  replace: ({ attribs, children }: any) => {
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
        >
          {domToReact(children, parserOptions)}
        </a>
      );
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
  ],
  allowedAttributes: {
    "img": ["src", "height", "width"],
    "a": ["href"],
    "*": ["style"],
  },
  allowedStyles: {
    "*": {
      "color": [
        /^#(0x)?[0-9a-f]+$/i,
        /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,
        /hsl\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/,
      ],
      "background-image": [
        /^url\((.*?)\)$/i,
      ],
    },
  },
};

export default function HTML({ message }: any) {
  console.log("awdmessage", message);
  console.log("awdsanitized", sanitizeHtml(message, sanitizeOptions));
  console.log(
    "awdparsed",
    parse(sanitizeHtml(message, sanitizeOptions), parserOptions),
  );
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
