import ChatBox from '../single/Chatbox';
import Chat from '../single/Chat';
import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export default function PmRoom(props: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            id="big-panel"
            className={cn(
                props.className,
                'flex break-normal h-screen',
            )}
        >
            <div className={'dark:bg-gray-300 flex flex-col w-full max-w-full'}>
                <div className="h-[90%] max-h-[90%] flex-grow flex-shrink min-h-0">
                    <Chat
                    />
                </div>
                <ChatBox />
            </div>
        </div>
    );
}

