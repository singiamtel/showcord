import { createContext } from "vm";
// import { Client } from "ps-client";
//dotenv
import dotenv from "dotenv";
import { useState } from "react";
dotenv.config();

export const PS_context = createContext();


export const PS_contextProvider = (props: any) => {
	// const [ client, setClient ] = useState<Client | null>(null);
	//
	// const login = async (username: string, password: string) => {
	// 	const client = new Client({
	// 		username,
	// 		password,
	// 		debug: true,
	// 		rooms: [ "lobby" ],
	// 	});
	// 	client.connect();
	// 	setClient(client);
	// };

	return (
		// <PS_context.Provider value={{ client, login }}
		<PS_context.Provider value={{ }}
		>
			{props.children}
		</PS_context.Provider>
	);
}
