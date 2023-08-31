"use client";
import { useContext, useEffect } from "react";
import { PS_context } from "./PS_context";
import HashtagIcon from "../../public/hashtag.svg";

export function RoomComponent({ name, ID }: { name: string; ID: string }) {
  const { setRoom, selectedPage: room } = useContext(PS_context);
  return (
    <div>
      <span className={'rounded p-1 flex flex-row items-center  w-auto h-auto mr-2 ml-2 ' + (ID === room ? "bg-gray-450 hover:bg-gray-450 text-white" : "hover:bg-gray-350 text-gray-150 ") } onClick={() => setRoom(ID)}>
        <HashtagIcon height={16} width={16}/>
      <span className="ml-2">
        {name}
      </span>
      </span>
    </div>
  );
}
