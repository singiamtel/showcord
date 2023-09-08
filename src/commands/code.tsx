"use client";
import { roboto_mono } from "@/app/usercomponents";
import Highlight from "react-highlight";
import hljs from "highlight.js";

export function HTMLtoPlain(html: string) {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.innerText || "";
}

const brRegex = /<br\s*[\/]?>/gi;
const summaryOpenRegex = /<summary\s*>/gi;
const summaryCloseRegex = /<[\/]summary\s*>/gi;

export default function Code({ message }: any) {
  const msg = message.replace(brRegex, "\n").replace(summaryCloseRegex, "\n")
    .replace(summaryOpenRegex, "").slice(1);
  const str = HTMLtoPlain(msg);
  const { relevance } = hljs.highlightAuto(str);
  return (
    <div
      className={"ml-10 mr-10 m-2 text-white border border-solid border-gray-border bg-gray-600 rounded p-2 "}
    >
      {relevance > 10
        ? (
          <Highlight
            className={"whitespace-pre-wrap text-sm " + roboto_mono.className}
          >
            {str}
          </Highlight>
        )
        : (
          <pre
            className={"whitespace-pre-wrap text-sm " + roboto_mono.className}
          >
        {str}
          </pre>
        )}
    </div>
  );
}
