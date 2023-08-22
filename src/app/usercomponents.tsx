import { User } from "@/client/user";
import { userColor } from "@/utils/namecolour";
import { MouseEventHandler } from "react";

export function UsernameComponent({ user, alignRight, onClick }: { user: string, alignRight?: boolean, onClick?: MouseEventHandler<HTMLButtonElement> }){
  const rank = user.charAt(0);
  const onclick = onClick ? onClick : () => {};
  return (
    <button onClick={onclick}>
      <span className="text-[#9D9488] whitespace-nowrap font-mono">
        &nbsp;
        {rank + (alignRight ? " " : "")}
      </span>
      <span style={{ color: userColor(user) }} className="font-bold ">
        {user.slice(1)}
      </span>
    </button>
  );
}

export function UserCard({ user }: { user: User }) {
  return (
    <div className="bg-gray-600 rounded-lg p-2">
      <UsernameComponent user={user.name} />
      <div className="text-xs text-gray-400">
        {user.status} Hellooo helooooo 
    </div>
  </div>
  )
}
