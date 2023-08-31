import { userColor } from "@/utils/namecolour";
import { MouseEventHandler, MutableRefObject } from "react";
import { clamp, toID } from "@/utils/generic";

export function UsernameComponent(
  { user, alignRight, onClick }: {
    user: string;
    alignRight?: boolean;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
  },
) {
  const rank = user.charAt(0);
  return (
    <>
      <span className="text-[#9D9488] whitespace-nowrap font-mono">
        &nbsp;
        {rank + (alignRight ? " " : "")}
      </span>
      <a onClick={onClick} style={onClick && { cursor: "pointer" } }>
        <span style={{ color: userColor(user) }} className="font-bold " data-message='true'>
          {user.slice(1)}
        </span>
      </a>
    </>
  );
}

const margin = 15;
export function UserCard(
  { user, name, position, forwardRef }: {
    user: any;
    name: string;
    position: { x: number; y: number };
    forwardRef: MutableRefObject<any>;
  },
) { // user is a json
  return (
    <div
      ref={forwardRef}
      className="absolute bg-gray-600 rounded-lg p-2 w-[500px] h-[300px] text-white border-gray-125"
      style={{
        left: clamp(position.x, 0, window.innerWidth - 500 - margin),
        top: clamp(position.y, 0, window.innerHeight - 300 - margin)
      }}
    >
      <strong><a target="_blank" href={"https://pokemonshowdown.com/users/"+toID(name)}>{name}</a></strong>
      <div className="text-xs text-gray-100">
        {user ? user.status : ""}
      </div>
    </div>
  );
}
