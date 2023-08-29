import { User } from "@/client/user";
import { userColor } from "@/utils/namecolour";
import { MouseEventHandler, useState } from "react";

export function UsernameComponent(
  { user, alignRight, onClick }: {
    user: string;
    alignRight?: boolean;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
  },
) {
  const [display, setDisplay] = useState<string>("hidden");
  const rank = user.charAt(0);
  const onclick = onClick ? onClick : () => {
    setDisplay("");
  };
  return (
    <>
      <span className="text-[#9D9488] whitespace-nowrap font-mono">
        &nbsp;
        {rank + (alignRight ? " " : "")}
      </span>
      <a onClick={onclick} style={{ cursor: "pointer" }}>
        <span style={{ color: userColor(user) }} className="font-bold ">
          {user.slice(1)}
        </span>
      </a>
    </>
  );
  // <UserCard user={user} />
}

export function UserCard({ user }: { user: User }) {
  return (
    <div className="bg-gray-600 rounded-lg p-2">
      <UsernameComponent user={user.name} />
      <div className="text-xs text-gray-400">
        {user.status} Hellooo helooooo
      </div>
    </div>
  );
}
