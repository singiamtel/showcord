"use client"
import { useContext } from "react";
import { PS_context } from "./PS_context";
import { useState, useEffect  } from "react";
import { userColor } from "../utils/namecolour";

export type Message = { 
	author: string,
	message: string,
	time: Date
}
	

export default function Chat() {
	const context = useContext(PS_context);
	const [messages, setMessages] = useState<Message[]>([]);
	const addMessage = (message: Message) => {
		setMessages([...messages, message]);
	}
	useEffect(() => {
		setMessages([
			{author: 'user1', message: 'hello', time: new Date()},
			{author: 'user2', message: 'lfmqt', time: new Date()},
			{author: 'user3', message: 'pgnvy', time: new Date()},
			{author: 'user4', message: 'thozz', time: new Date()},
			{author: 'user5', message: 'xipzz', time: new Date()},
			]);
	}, []);

	return (
		<div>
			{messages.map((message, index) => (
				<MessageComponent key={index} message={message}/>
			))
			}
		</div>
	);
}

export function MessageComponent({message}: {message: Message}) {
	return (
		<div>
			<span style={{color: userColor(message.author)}}> {message.author}: </span> {message.message}
		</div>
	);
}
	
