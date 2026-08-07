import ChatBox from '../single/Chatbox';
import UserList from '../single/UserList';
import Chat from '../single/Chat';
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';
import useFocusChatboxOnClick from '@/UI/hooks/useFocusChatboxOnClick';

export default function ChatRoom(props: Readonly<HTMLAttributes<HTMLDivElement>>) {
    const { containerRef, onMouseUp } = useFocusChatboxOnClick<HTMLDivElement>();
    return (
        <div
            id="big-panel"
            className={cn(
                props.className,
                'flex break-normal h-screen',
            )}
        >
            <div className="dark:bg-gray-300 flex flex-col max-h-full h-full w-full max-w-full" ref={containerRef}>
                <div className="grow shrink min-h-0" onMouseUp={onMouseUp}>
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
