"use client";
import { useContext } from "react";
import { PS_context } from "./PS_context";
import { useEffect, useState } from "react";
import { UsernameComponent } from "./usercomponents";

export type Users = {
  name: string;
};

export default function Users() {
  const { selectedPage: room, client } = useContext(PS_context);
  const [users, setUsers] = useState<Users[]>([]);

  const onClick = () => {
    console.log("clicked");
  };

  useEffect(() => {
    if (!client) return;
    const refreshUsers = () => {
      console.log("refreshing users");
      if (!room) return;
      const selectedRoom = client?.room(room);
      if (!selectedRoom) {
        return;
      }
      setUsers(selectedRoom.users);
    };

    refreshUsers();
    client.events.addEventListener("users", refreshUsers);
    console.log("added event listener");
    return () => {
      client.events.removeEventListener("users", refreshUsers);
    };
  }, [client, room]);

  return (
    <div className="bg-gray-600 h-full p-2 overflow-y-scroll">
      {users.map((user, index) => (
        <div key={index}>
          <UsernameComponent user={user.name} alignRight onClick={onClick} />
        </div>
      ))}
    </div>
  );
}
