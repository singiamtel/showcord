"use client"
import { useContext } from "react";
import { PS_context } from "./PS_context";
import { useState, useEffect  } from "react";
import { userColor } from "../utils/namecolour";

export type Users = { 
	name: string,
}

export default function Chat() {
	const { room, client } = useContext(PS_context);
	const [users, setUsers] = useState<Users[]>([]);
	const addUser = (user: Users) => {
		setUsers([...users, user]);
	}
	const removeMessage = (user: Users) => {
		setUsers(users.filter((u) => u.name !== user.name));
	}
		

	useEffect(() => {
		setUsers([
			{name: 'user1'},
			{name: 'user2'},
			{name: 'user3'},
			{name: 'user4'},
			{name: 'user5'},
			]);
	}, []);

	return (
		<div className="bg-gray-600 h-full">
			{users.map((user, index) => (
				<MessageComponent key={index} user={user}/>
			))
			}
		</div>
	);
}

export function MessageComponent({user}: {user: Users}) {
	return (
		<div>
			<span style={{color: userColor(user.name)}}>
				{user.name}
			</span>
		</div>
	);
}
	
