import ChatBox from '../single/chatbox';
import UserList from '../single/UserList';
import Chat from '../single/chat';
import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export default function ChatRoom(props: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            id="big-panel"
            className={cn(
                props.className,
                'flex break-normal h-screen',
            )}
        >
            <div className="dark:bg-gray-300 flex flex-col max-h-full h-full w-full max-w-full">
                <div className="flex-grow flex-shrink min-h-0">
                    <Chat
                    />
                </div>
                <ChatBox />
            </div>
            <div className="w-64">
                <UserList
                />
            </div>
        </div>

    );
}
