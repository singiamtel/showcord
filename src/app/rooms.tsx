import { useContext } from "react";
import { PS_context } from "./PS_context";

export default function Rooms() {
	const context = useContext(PS_context);
	return (
		<div>
			<h1>Rooms</h1>
		</div>
	);
}

