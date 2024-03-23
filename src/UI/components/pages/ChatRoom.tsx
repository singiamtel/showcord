import { twMerge } from 'tailwind-merge';
import ChatBox from '../single/chatbox';
import UserList from '../single/UserList';
import Chat from '../single/chat';

export default function ChatRoom(props: any) {
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
            <div className="w-64">
                <UserList
                />
            </div>
        </div>

    );
}
