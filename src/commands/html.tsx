// recognize HTML commands and try to parse them
// if they have no parser, just return the sanitized HTML

import parse from "html-react-parser";
import sanitizeHtml from "sanitize-html";
import Code, { isCode } from "./code";

export default function HTML({ message }: any) {
  if(isCode(message)) {
    return (
      <Code message={message} />
    )
  }
  return (
    <div className="p-0.5">
      <span className="text-white">
        {parse(sanitizeHtml(message))}
      </span>
    </div>
  );
}
