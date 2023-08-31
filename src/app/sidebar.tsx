"use client";
import { useContext, useEffect } from "react";
import { PS_context } from "./PS_context";
import HashtagIcon from "../../public/hashtag.svg";
import { RoomComponent } from "./rooms";
import { PMComponent } from "./pms";
import UserPanel from "./userpanel";
import { Allotment } from "allotment";
import 'allotment/dist/style.css';

export default function Sidebar(){
    const { rooms} = useContext(PS_context);

    useEffect(() => {
        console.log("rooms changed:", rooms);
    }, [rooms])

    return (
        <div className="bg-gray-600 h-screen flex flex-col justify-between">
            {/** big fat text */}
            <div className="text-center p-2 text-white font-bold text-lg h-16 mb-6">
                Pokémon Showdown!
            </div>
            <div className="flex-grow overflow-scroll">
                <Allotment vertical minSize={100}>
                    <div>
                        {rooms.map((room, idx) => (
                            <RoomComponent key={idx} name={room.name} ID={room.ID} />
                        ))}
                    </div>
                    <div>
                        {['PartMan', 'zxchan'].map((user: string, idx) => (
                            <PMComponent key={idx} name={user} ID={user} />
                        ))}
                    </div>
                </Allotment>
            </div>
            <UserPanel/>
        </div>
    );
}
