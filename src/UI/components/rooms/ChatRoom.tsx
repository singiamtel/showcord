import ChatBox from '../single/Chatbox';
import UserList from '../single/UserList';
import Chat from '../single/Chat';
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export default function ChatRoom(props: Readonly<HTMLAttributes<HTMLDivElement>>) {
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
                <ChatBox className='p-2' />
            </div>
            <div className="w-64">
                <UserList searchable className="h-full" />
            </div>
        </div>

    );
}
