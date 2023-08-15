"use client";

import {
  createRef,
  FormEvent,
  KeyboardEventHandler,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { PS_context } from "./PS_context";
import useAutosizeTextArea from "@/utils/useAutosizeTextArea";

export default function ChatBox() {
  const [input, setInput] = useState<string>("");
  const { client, selectedRoom: room, setRoom } = useContext(PS_context);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = createRef<HTMLFormElement>();
  useAutosizeTextArea(textAreaRef.current, input);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!client || !room) return;
    client.send(room, input);
    setInput("");
  };

  const manageKeybinds: KeyboardEventHandler = (e) => {
    // if user pressed enter, submit form
    // don't submit if user pressed shift+enter
    if (e.key === "Enter" && !e.shiftKey) {
      if (!formRef.current?.textContent) {
        return;
      }
      // submit form
      formRef.current?.requestSubmit();
      e.preventDefault();
      return
    }
    if((e.key === "Tab" && !e.shiftKey) || e.key === "ArrowRight") {
      setRoom(1);
      e.preventDefault();
      return;
    }
    if((e.key === "Tab" && e.shiftKey) || e.key === "ArrowLeft") {
      setRoom(-1);
      e.preventDefault();
      return;
    }

  };

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, [room]);

  return (
    <div className="w-full">
      <form onSubmit={submit} ref={formRef} className="w-full">
        <div className="flex flex-row">
          <textarea
            className="mr-5 ml-5 p-2 rounded-lg flex-grow bg-gray-375 text-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={manageKeybinds}
            ref={textAreaRef}
          >
          </textarea>
        </div>
      </form>
    </div>
  );
}
