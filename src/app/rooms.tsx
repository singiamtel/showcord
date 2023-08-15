"use client";
import { useContext } from "react";
import { PS_context } from "./PS_context";
import HashtagIcon from "../../public/hashtag.svg";

export default function Rooms({className}: {className: string}){
  const { rooms} = useContext(PS_context);

  return (
    <div className={"bg-gray-600 h-full " + className}>
      {/** big fat text */}
      <div className="flex flex-row items-center p-2 text-white font-bold text-lg h-16 ">
        Pokémon Showdown!
      </div>
      {rooms.map((room, idx) => (
        <RoomComponent key={idx} name={room.name} ID={room.ID} />
      ))}
    </div>
  );
}

export function RoomComponent({ name, ID }: { name: string; ID: string }) {
  const { setRoom, selectedRoom: room } = useContext(PS_context);
  const selectRoom = () => {
    setRoom(ID);
  };
  return (
    <div>
      <span className={'rounded p-1 flex flex-row items-center  w-auto h-auto mr-2 ml-2 ' + (ID === room ? "bg-gray-450 hover:bg-gray-450 text-white" : "hover:bg-gray-350 text-gray-150 ") } onClick={selectRoom}>
        <HashtagIcon height={16} width={16}/>
      <span className="ml-2">
        {name}
      </span>
      </span>
    </div>
  );
}
