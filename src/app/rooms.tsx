"use client";
import { useContext } from "react";
import { PS_context } from "./PS_context";
import { useEffect, useState } from "react";
import Image from "next/image";
import HashtagIcon from "../../public/hashtag.svg";

export default function Rooms() {
  const {client} = useContext(PS_context);
  const [rooms, setRooms] = useState<string[]>([]);
  useEffect(() => {
    setRooms(["Lobby", "Room 1", "Room 2"]);
  }, []);
  return (
    <div className="bg-gray-600 h-full">
      {/** big fat text */}
      <div className="flex flex-row items-center p-2 text-white font-bold text-xl">
        Pokémon Showdown!
      </div>
      {rooms.map((room) => <Room key={room} name={room} />)}
    </div>
  );
}

export function Room({ name }: { name: string }) {
  return (
    <div className="flex flex-row items-center p-2 text-white">
      <HashtagIcon height={16} width={16} />
      {name}
    </div>
  );
}
