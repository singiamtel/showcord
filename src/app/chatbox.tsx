"use client";

import { FormEvent, useContext, useState } from "react";
import { PS_context } from "./PS_context";

export default function ChatBox() {
  const [input, setInput] = useState<string>("");
  const { client, room } = useContext(PS_context);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(input);
    if (!client || !room) return;
    client.send(room, input);
    setInput("");
  };
  return (
    <div className="w-full">
      <form onSubmit={submit}>
        <div className="flex flex-row">
          <input
            className="mr-5 ml-5 flex-grow bg-gray-375 text-white"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          >
          </input>
        </div>
      </form>
    </div>
  );
}
