"use client";
import { useContext, useEffect } from "react";
import { PS_context } from "./PS_context";
import { RoomComponent } from "./rooms";
import UserPanel from "./userpanel";
import { Allotment } from "allotment";
import "allotment/dist/style.css";

export default function Sidebar() {
  const { rooms } = useContext(PS_context);
  const [chatRooms, pmRooms, permanentRooms] = [
    rooms.filter((e) => e.type === "chat"),
    rooms.filter((e) => e.type === "pm"),
    rooms.filter((e) => e.type === "permanent"),
  ];

  useEffect(() => {
    console.log("rooms changed:", rooms);
  }, [rooms]);

  return (
    <div className="w-auto bg-gray-600 h-screen flex flex-col justify-between">
      <div className="text-center mr-2 ml-2 p-2 text-white font-bold text-lg h-16 whitespace-nowrap">
        Pokémon Showdown!
      </div>
      <div className="flex flex-grow">
        <Allotment vertical minSize={100} className="">
          <div >
            {permanentRooms.map((room, idx) => (
              <RoomComponent
                key={idx}
                name={room.name}
                ID={room.ID}
                notifications={{ unread: room.unread, mentions: room.mentions }}
              />
            ))}
            {chatRooms.map((room, idx) => (
              <RoomComponent
                key={idx}
                name={room.name}
                ID={room.ID}
                notifications={{ unread: room.unread, mentions: room.mentions }}
              />
            ))}
          </div>

          {pmRooms.length > 0 && (
            <div>
              {pmRooms.filter((e) => e.type === "pm").map((room, idx) => (
                <RoomComponent
                  key={idx}
                  name={room.name}
                  ID={room.ID}
                  notifications={{
                    unread: room.unread,
                    mentions: room.mentions,
                  }}
                />
              ))}
            </div>
          )}
        </Allotment>
      </div>
      <UserPanel />
    </div>
  );
}
