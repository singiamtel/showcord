"use client";
import { Client } from "@/client/client";
import dotenv from "dotenv";
import { createContext, useEffect, useState } from "react";
dotenv.config();

export const PS_context = createContext<
  {
    client: Client | null;
    room: string | null;
    setRoom: (room: string) => void;
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

  const lastRooms = () => {
    const rooms = localStorage.getItem("rooms");
    const defaultRooms = ["lobby", "help", "overused"]
    if (rooms) {
      return JSON.parse(rooms);
    }
    return defaultRooms;
  };

  const setRoom = (room: string) => {
    if (client?.room(room)) {
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
