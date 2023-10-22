import { HTMLAttributes, useContext } from 'react';
import ChatBox from './chatbox';
import Chat from './chat';
import { PS_context } from './PS_context';
import Users from './users';
import MainPage from './mainPage';
import { twMerge } from 'tailwind-merge';

export default function BigPanel(props: HTMLAttributes<'div'>) {
    const { selectedPage: room, rooms } = useContext(PS_context);
    const roomType = rooms?.find((r) => r.ID === room)?.type;
    if (!room) return null;
    if (roomType === 'permanent') {
        return <MainPage className={props.className}/>;
    }
    return (
        <div
            className={twMerge(
                props.className,
                'flex break-normal',
            )}
        >
            <div className={'bg-gray-300 flex flex-col w-full max-w-full'}>
                <div className="h-[90%] max-h-[90%] flex-grow flex-shrink min-h-0 overflow-y-scroll">
                    <Chat />
                </div>
                <div className="flex-grow">
                    <ChatBox />
                </div>
            </div>

            {roomType === 'chat' || roomType === 'battle' ?
                (
                    <div className="w-64">
                        <Users />
                    </div>
                ) :
                null}
        </div>
    );
}
