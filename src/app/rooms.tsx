"use client";
import { useContext } from "react";
import { PS_context } from "./PS_context";
import HashtagIcon from "../../public/hashtag.svg";
import Circle from "./components/circle";


// export default function Rooms({ className }: { className: string }) {
//   const { rooms } = useContext(PS_context);
//   return (
//     <div className={"bg-gray-600 h-full " + className}>
//       {/** big fat text */}
//       <div className="flex flex-row items-center p-2 text-white font-bold text-lg h-16 ">
//         Pokémon Showdown!
//       </div>
//       {rooms.map((room, idx) => (
//         <RoomComponent
//           key={idx}
//           name={room.name}
//           ID={room.ID}
//           notifications={{ mentions: room.mentions, unread: room.unread }}
//         />
//       ))}
//     </div>
//   );
// }

export function RoomComponent(
  { name, ID, notifications: { unread, mentions } }: {
    name: string;
    ID: string;
    notifications: { unread: number; mentions: number };
  },
) {
  const { setRoom, selectedRoom: room } = useContext(PS_context);
  console.log("mentions", mentions);
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
      <span
        className={"rounded p-1 flex flex-row basis-full items-center  w-auto h-auto mr-2 ml-2 "}
        onClick={() => setRoom(ID)}
      >
        <HashtagIcon height={16} width={16} />
        <span className="ml-2 w-full">
          {name}
        {unread > 0 && <span className="ml-2 text-gray-500">[{unread}]</span>}
        </span>
      {mentions > 0 &&
        (
          <span className="text-white flex justify-center items-center mr-1">
            <Circle>{mentions}</Circle>
          </span>
        )}
      </span>
    </div>
  );
}
