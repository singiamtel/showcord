"use client";
import { useContext } from "react";
import { PS_context } from "./PS_context";
import { useEffect, useState } from "react";
import { userColor } from "../utils/namecolour";

export type Users = {
  name: string;
};

export default function Users() {
  const { selectedRoom: room, client } = useContext(PS_context);
  const [users, setUsers] = useState<Users[]>([]);

  const refreshUsers = () => {
    if (!room) return;
    const selectedRoom = client?.room(room);
    if (!selectedRoom) {
      console.log("room does not exist");
      return;
    }
    setUsers(selectedRoom.users);
  };

  useEffect(() => {
    refreshUsers();
  }, [room]);

  return (
    <div className="bg-gray-600 h-full p-2 overflow-y-scroll">
      {users.map((user, index) => 
        <div key={index}>
          <UserComponent user={user.name} alignRight />
        </div>
      )}
    </div>
  );
}

export function UserComponent({ user, alignRight }: { user: string, alignRight?: boolean }){
  const rank = user.charAt(0);
  return (
    <>
      <span className="text-[#9D9488]">
        &nbsp;
        {rank + (alignRight ? " " : "")}
      </span>
      <span style={{ color: userColor(user) }} className="font-bold">
        {user.slice(1)}
      </span>
    </>
  );
}
