// recognize HTML commands and try to parse them
// if they have no parser, just return the sanitized HTML

import manageURL from "@/utils/manageURL";
import parse, { domToReact } from "html-react-parser";
import sanitizeHtml from "sanitize-html-react";

const options = {
  replace: ({ attribs, children }: any) => {
    if (!attribs) {
      return;
    }
    if (attribs.href) {
      return <a href={attribs.href} target="_blank" onClick={manageURL} style={{cursor: "pointer"}}>{domToReact(children, options)}</a>;
    }
  },
};

export default function HTML({ message }: any) {
  return (
    <div className="p-2 ml-14 mr-14 m-2 text-white border border-solid border-gray-border bg-gray-600 rounded">
      <span className="">
        {parse(
          sanitizeHtml(message, {
            // allowedTags: ["img"], // TODO: This is ugly as fuck, style them
          }),
          options,
        )}
      </span>
    </div>
  );
}
