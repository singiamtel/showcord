// import { Client } from "ps-client";
//dotenv
import dotenv from "dotenv";
import { createContext, useState } from "react";
dotenv.config();

export const PS_context = createContext({});

export default function PS_contextProvider (props: any) {
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
		<PS_context.Provider value={{ a:1}}>
			{props.children}
		</PS_context.Provider>
	);
}
