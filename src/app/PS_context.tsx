'use client';
import { Client } from "@/client/client";
//dotenv
import dotenv from "dotenv";
import { createContext, useEffect, useState } from "react";
dotenv.config();

export const PS_context = createContext({});

export default function PS_contextProvider (props: any) {
 //  console.log(Client);
	const [ client, setClient ] = useState<Client | null>(null);
  const [ selectedRoom, setSelectedRoom ] = useState<string | null>(null);

	const login = async (username: string, password: string) => {
		const client = new Client();
		client.login({username, password});
    console.log('logged in');
		setClient(client);
	};

  const setRoom = (room: string) => {
    if(client?.roomExists(room)) {
      setSelectedRoom(room);
    }
    else {
      console.log('Trying to set room that does not exist (' + room + ')');
    }
  }

  useEffect(() => {
    // login('wydy', 'thewydypass')
  }, [])

	return (
		// <PS_context.Provider value={{ client, login }}
		<PS_context.Provider value={{ client: client, room: selectedRoom, setRoom}}>
			{props.children}
		</PS_context.Provider>
	);
}
