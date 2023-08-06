"use client"
import { useContext } from "react";
import { PS_context } from "./PS_context";
import { useState, useEffect  } from "react";
import Image from 'next/image';
import HashtagIcon from '../../public/hashtag.svg';

export default function Rooms() {
	const context = useContext(PS_context);
	const [rooms, setRooms] = useState<string[]>([]);
	useEffect(() => {
		setRooms(['Lobby', 'Room 1', 'Room 2']);
	}, []);
	return (
		<div className="bg-gray-600 h-full">
			{rooms.map((room) => (
				<Room key={room} name={room} />
			))
			}

		</div>
	);
}

export function Room({name}: {name: string}) {
			// <HashtagIcon />
			console.log(HashtagIcon);
	return (
		<div>
			<HashtagIcon />
			{name}
		</div>
	);
}
	
