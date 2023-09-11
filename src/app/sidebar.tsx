"use client";
import { useContext, useEffect } from "react";
import { PS_context } from "./PS_context";
import { RoomComponent } from "./rooms";
import UserPanel from "./userpanel";
import { Allotment } from "allotment";
import "allotment/dist/style.css";

export default function Sidebar() {
  const { rooms } = useContext(PS_context);
  const [chatRooms, pmRooms] = [
    rooms.filter((e) => e.type === "chat"),
    rooms.filter((e) => e.type === "pm"),
  ];

  useEffect(() => {
    console.log("rooms changed:", rooms);
  }, [rooms]);

  return (
    <div className="bg-gray-600 h-screen flex flex-col justify-between">
      {/** big fat text */}
      <div className="text-center p-2 text-white font-bold text-lg h-16">
        Pokémon Showdown!
      </div>
      <div className="flex-grow overflow-scroll">
        <Allotment vertical minSize={100}>
          <div>
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
