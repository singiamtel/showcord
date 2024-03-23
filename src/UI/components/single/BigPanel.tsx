import {
    HTMLAttributes,
    useContext,
    useRef,
    useState,
} from 'react';
import { twMerge } from 'tailwind-merge';

import { PS_context } from './PS_context';
import UserList from './UserList';

import ChatBox from './chatbox';
import Chat from './chat';
import Home from '../../Home';
import SettingsPage from '../../SettingsPage';

export default function BigPanel(props: Readonly<HTMLAttributes<'div'>>) {
    const { selectedPage: room, rooms } = useContext(PS_context);
    const roomType = rooms?.find((r) => r.ID === room)?.type;

    if (!room) return null;
    if (roomType === 'permanent') {
        if (room === 'home') {
            return <Home className={props.className} />;
        }
        if (room === 'settings') {
            return <SettingsPage className={props.className} />;
        } else {
            return (
                <div className={twMerge(props.className, 'flex flex-col text-red-400')}>
          Unknown room type: "{roomType}"
                </div>
            );
        }
    }

    return (
        <div
            id="big-panel"
            className={twMerge(
                props.className,
                'flex break-normal h-screen',
            )}
        >
            <div className={'dark:bg-gray-300 flex flex-col w-full max-w-full'}>
                <div className="h-[90%] max-h-[90%] flex-grow flex-shrink min-h-0">
                    <Chat
                    />
                </div>
                <div className="flex-grow">
                    <ChatBox />
                </div>
            </div>

            {roomType === 'chat' || roomType === 'battle' ?
                (
                    <div className="w-64">
                        <UserList />
                    </div>
                ) :
                null}
        </div>
    );
}
