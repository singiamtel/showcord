"use client";
import Highlight from "react-highlight";

export function HTMLtoPlain(html: string) {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.innerText || "";
}

const brRegex = /<br\s*[\/]?>/gi;
const summaryOpenRegex = /<summary\s*>/gi;
const summaryCloseRegex = /<[\/]summary\s*>/gi;

export default function Code({ message }: any) {
  const msg = message.replace(brRegex, "\n").replace(summaryCloseRegex, "\n").replace(summaryOpenRegex, "").slice(1)
  const str = HTMLtoPlain(msg);
  return (
    <div className="ml-14 mr-14 m-2 text-white border border-solid border-gray-border bg-gray-600 rounded">
      <Highlight>
        {str}
      </Highlight>
    </div>
  );
}
