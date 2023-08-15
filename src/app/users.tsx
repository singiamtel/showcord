"use client"
import { useContext } from "react";
import { PS_context } from "./PS_context";
import { useState, useEffect  } from "react";
import { userColor } from "../utils/namecolour";

export type Users = { 
	name: string,
}

export default function Users() {
	const { selectedRoom: room, client } = useContext(PS_context);
	const [users, setUsers] = useState<Users[]>([]);

	const refreshUsers = () => {
    if(!room) { return; }
    const selectedRoom = client?.room(room);
    if(!selectedRoom) {
      console.log('room does not exist');
      return;
    }
		setUsers(selectedRoom.users);
	}

  useEffect(() => {
    refreshUsers()
  }, [room])

	return (
		<div className="bg-gray-600 h-full p-2 overflow-y-scroll">
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
	
