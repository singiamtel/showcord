
import { HTMLAttributes } from 'react';
import Chat from '../single/chat';
import { cn } from '@/lib/utils';

export default function HtmlRoom(props: HTMLAttributes<HTMLDivElement>) {
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
            </div>
        </div>
    );
}

