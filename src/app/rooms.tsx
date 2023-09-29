"use client";
import { useContext } from "react";
import { PS_context } from "./PS_context";
import HashtagIcon from "../public/hashtag";
import Circle from "./components/circle";

export function RoomComponent(
  { name, ID, notifications: { unread, mentions } }: {
    name: string;
    ID: string;
    notifications: { unread: number; mentions: number };
  },
) {
  const { setRoom, selectedPage: room } = useContext(PS_context);
  return (
    <div className={"relative flex flex-row hover:bg-gray-350 " +(
          ID === room
            ? " bg-gray-450 hover:bg-gray-450 text-white "
            : mentions > 0 || unread > 0
            ? "text-white "
            : " text-gray-150 ")}
    >
      {/** Notification circle if it applies */}
      {unread > 0 && (
        <span className="rounded-full bg-white text-white text-xs p-1 h-1 w-1  absolute top-1/2  transform -translate-x-1/2 -translate-y-1/2" />
      )}
      {/** Room name */}
      <button
        className={"rounded p-1 flex flex-row basis-full items-center  h-auto mr-2 ml-2 "}
        onClick={() => setRoom(ID)}
      >
        <HashtagIcon height={16} width={16} />
        <span className="text-left ml-2 max-w-full truncate">
          <span className="truncate max-w-full">{name}</span>
        {unread > 0 && <span className="ml-2 text-gray-500">[{unread}]</span>}
        </span>
      {mentions > 0 &&
        (
          <span className="text-white flex justify-center items-center ml-2 mr-1">
            <Circle>{mentions}</Circle>
          </span>
        )}
      </button>
    </div>
  );
}
