"use client";

import {
  ChangeEventHandler,
  createRef,
  FormEvent,
  KeyboardEventHandler,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { PS_context } from "./PS_context";
import TextareaAutosize from "react-textarea-autosize";

type SearchBoxOffset = {
  width: number;
  marginBottom: number;
}

export default function ChatBox() {
  const [input, setInput] = useState<string>("");
  const [displaySearchbox, setDisplaySearchbox] = useState<boolean>(false);
  const [searchBoxOffset, setSearchBoxOffset] = useState<SearchBoxOffset>({ width: 0, marginBottom: 0 });
  const { client, selectedRoom: room, setRoom } = useContext(PS_context);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = createRef<HTMLFormElement>();

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
      return;
    }
    if ((e.key === "Tab" && !e.shiftKey) || e.key === "ArrowRight") {
      if (!formRef.current?.textContent) {
        setRoom(1);
        e.preventDefault();
        return;
      }
    }
    if ((e.key === "Tab" && e.shiftKey) || e.key === "ArrowLeft") {
      console.log(formRef.current?.textContent);
      if (!formRef.current?.textContent) {
        setRoom(-1);
        e.preventDefault();
        return;
      }
    }
  };

  const manageChanges: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    // if (!formRef.current?.textContent) {
    // }
    if (e.target.value.startsWith("/")) {
      setDisplaySearchbox(true);
      // calculate vertical offset
    } else {
      setDisplaySearchbox(false);
    }
    setInput(e.target.value);
  };

  useEffect(() => {
    const size = formRef.current?.getBoundingClientRect();
    if (
      searchBoxOffset.width === size?.width &&
      searchBoxOffset.marginBottom === size?.height
    ) return;
    setSearchBoxOffset({
      width: size?.width || 0,
      marginBottom: size?.height || 0,
    });
  }, [formRef, searchBoxOffset.width, searchBoxOffset.marginBottom]);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, [room]);

  return (
    <>
      <div className="w-full">
        <form onSubmit={submit} ref={formRef} className="w-full">
            <SearchBox offset={searchBoxOffset} display={displaySearchbox} />
          <div className="flex flex-row">
            <TextareaAutosize
              className="mr-5 ml-5 p-2 rounded-lg flex-grow bg-gray-375 text-white resize-none"
              value={input}
              onChange={manageChanges}
              onKeyDown={manageKeybinds}
              ref={textAreaRef}
            >
            </TextareaAutosize>
          </div>
        </form>
      </div>
    </>
  );
}

const SearchBox = ({offset, display} : { offset: SearchBoxOffset, display: boolean }) => {
  return (
          <div
            style={{
              bottom: `${offset.marginBottom}px`,
              width: `${offset.width}px`,
            }}
            className={"absolute mr-5 ml-5 mb-2 rounded-lg text-white bg-gray-600 " +
              (display ? `` : "hidden")}
          >
    <div>
      awdawd
    </div>
          </div>
  );
};
