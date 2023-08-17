// recognize HTML commands and try to parse them
// if they have no parser, just return the sanitized HTML

import parse from "html-react-parser";
import sanitizeHtml from "sanitize-html";
import Code, { isCode } from "./code";

export default function HTML({ message }: any) {
  console.log("message", message);
  return (
    <div className="p-2 ml-14 mr-14 m-2 text-white border border-solid border-gray-border bg-gray-600 rounded">
      {isCode(message) ? <Code message={message} /> : (
        <span className="">
          {parse(sanitizeHtml(message))}
        </span>
      )}
    </div>
  );
}
