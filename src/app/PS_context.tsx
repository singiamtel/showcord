"use client";
import { Client } from "@/client/client";
import dotenv from "dotenv";
import { createContext, useEffect, useState } from "react";
dotenv.config();

export const PS_context = createContext<
  {
    client: Client | null;
    room: string | null;
    setRoom: (room: string | number) => void;
    loggedIn: boolean;
  }
>({
  client: null,
  room: null,
  setRoom: () => {},
  loggedIn: false,
});

export default function PS_contextProvider(props: any) {
  const [client, setClient] = useState<Client | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [previousRooms, setPreviousRooms] = useState<string[]>([]);

  const lastRooms = () => {
    const rooms = localStorage.getItem("rooms");
    const defaultRooms = ["lobby", "help", "overused"];
    if (rooms) {
      return JSON.parse(rooms);
    }
    return defaultRooms;
  };

  const setRoom = (room: string | number) => {
    if (typeof room === "number") {
      // number is either 1 or -1
      //find the adjacent room in client.rooms, and set it
      // if the room is the first/last, loop around
      // if there is no adjacent room, do nothing
      const rooms = client?.rooms;
      if (rooms) {
        if (!selectedRoom) return;
        const roomNames = rooms.map((r) => r.ID)
        console.log(roomNames)
        console.log(selectedRoom)
        const index = roomNames.indexOf(selectedRoom);
        console.log(index)
        const newIndex = index + room;
        if (newIndex >= roomNames.length) room = roomNames[0];
        else room = roomNames[newIndex];
      } else {
        console.log("No rooms found");
        return;
      }
    }
    if (client?.room(room)) {
      const tmpPR = previousRooms;
      if (tmpPR.includes(room)) {
        const index = previousRooms.indexOf(room);
        tmpPR.splice(index, 1);
      }
      tmpPR.push(room);
      if (tmpPR.length > 5) tmpPR.shift();
      setPreviousRooms(tmpPR);
      setSelectedRoom(room);
    } else {
      console.log("Trying to set room that does not exist (" + room + ")");
    }
  };

  useEffect(() => {
    const client = new Client();
    client.socket.onopen = () => {
      setClient(client);
    };
    client.events.addEventListener("login", (username) => {
      console.log("logged in as", username);
      setLoggedIn(true);
    });
  }, []);

  useEffect(() => {
    if (!client) return;
    client.events.addEventListener("leaveroom", (room) => {
      // if the current room was deleted, go to the last room
      if (selectedRoom && !client.room(selectedRoom)) {
        const lastRoom = previousRooms[previousRooms.length - 2];
        if (lastRoom) {
          setRoom(lastRoom);
        }
      }
    });
  }, [client, previousRooms, selectedRoom]);

  useEffect(() => {
    if (!client) return;
    client.join(lastRooms());
    // client.login({username, password});
  }, [client]);

  return (
    // <PS_context.Provider value={{ client, login }}
    <PS_context.Provider
      value={{ client: client, room: selectedRoom, setRoom, loggedIn }}
    >
      {props.children}
    </PS_context.Provider>
  );
}
