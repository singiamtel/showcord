import { useContext, useEffect, useState } from "react";
import { PS_context } from "./PS_context";
import RoomCard from "./components/RoomCard";
import { InfinitySpin } from "react-loader-spinner";

export default function MainPage() {
  const { client } = useContext(PS_context);
  const [roomsJSON, setRoomsJSON] = useState<any>({});
  useEffect(() => {
    if (!client) return;
    client.queryRooms(setRoomsJSON);
  }, [client]);

  return (
    <div className="w-full grid grid-cols-7 grid-rows-2">
      <div className="col-span-3 bg-white m-4 p-4 rounded">
        Ladder
      </div>
      <div className="col-span-2 bg-white m-4 p-4 rounded">
        Friends
      </div>
      <div className="col-span-2 row-span-2 m-4 p-4 rounded overflow-y-auto text-white bg-gray-600">
        <h2 className="font-bold text-xl text-center">
          Rooms
        </h2>
        <span className="m-2 block">
        Find a chatroom for your favourite metagame or hobby!
        <hr/>
        </span>

        {roomsJSON
          ? roomsJSON.chat?.sort((a: any, b: any) => b.userCount - a.userCount)
            .map((room: any, idx: number) => <RoomCard key={idx} room={room} />)
          : (
            <div className="h-full flex items-center justify-center !bg-white">
            <InfinitySpin
              width="200"
              color="#4fa94d"
              
            />
            </div>
          )}
      </div>
    </div>
  );
}

// {"chat":[{"title":"Lobby","desc":"Still haven't decided on a room for you? Relax here amidst the chaos.","userCount":626,"section":"Official"},
