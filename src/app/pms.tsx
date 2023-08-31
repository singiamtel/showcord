"use client";
import { useContext, useEffect } from "react";
import { PS_context } from "./PS_context";
import HashtagIcon from "../../public/hashtag.svg";

export function PMComponent({ name, ID }: { name: string; ID: string }) {
    const { selectedPageType, selectedPage, setDM } = useContext(PS_context);
    return (
        <div>
      <span className={'rounded p-1 flex flex-row items-center  w-auto h-auto mr-2 ml-2 ' + (selectedPageType === 'user' && ID === selectedPage ? "bg-gray-450 hover:bg-gray-450 text-white" : "hover:bg-gray-350 text-gray-150 ") } onClick={() => setDM(ID)}>
        <HashtagIcon height={16} width={16}/>
      <span className="ml-2">
        {name}
      </span>
      </span>
        </div>
    );
}
