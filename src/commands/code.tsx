"use client"
import Highlight from 'react-highlight'

export const isCode = (message: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(message, "text/xml");
  const root = doc.documentElement;
  // code blocks are wrapped in <div class="infobox"> <code> </code> </div>, so we check for that
  if (root.tagName === "div" && root.classList.contains("infobox")) {
    console.log("div", root);
    const code = root.firstElementChild;
    if (code && code.tagName === "code"){
      console.log("code", code.textContent)
      return true
      }
  }
  console.log("not code");
  return false
}

export default function Code({ message }: any) {
  return (
  <code>
      {message}
  </code>
  )
}
