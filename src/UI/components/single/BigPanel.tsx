import {
    HTMLAttributes,
    MouseEvent,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { twMerge } from 'tailwind-merge';

import { client, PS_context } from './PS_context';
import UserList from './UserList';
import useClickOutside from '../../hooks/useClickOutside';

import ChatBox from './chatbox';
import Chat from './chat';
import Home from '../../Home';
import SettingsPage from '../../SettingsPage';

export default function BigPanel(props: HTMLAttributes<'div'>) {
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

    const [user, setUser] = useState<any | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [position, setPosition] = useState<{ x: number; y: number }>({
        x: 0,
        y: 0,
    });

    const wrapperRef = useRef(null);
    const { isOutside } = useClickOutside(wrapperRef);

    const closeWindow = useCallback(() => {
        setUser(null);
        setUsername(null);
    }, [setUser, setUsername]);

    const clickUsername = (e: MouseEvent) => {
        const username = (e.target as HTMLAnchorElement).getAttribute(
            'data-username',
        )?.trim();
        if (!username) {
            console.error('clickUsername: no username');
            return;
        }
        setUsername(username);
        setPosition({ x: e.clientX, y: e.clientY });
        setUser(undefined);
        client?.queryUser(username, (user: any) => {
            setUser(user);
        });
    };

    useEffect(() => {
        closeWindow();
    }, [isOutside]);

    return (
        <div
            className={twMerge(
                props.className,
                'flex break-normal',
            )}
        >
            <div className={'bg-gray-300 flex flex-col w-full max-w-full'}>
                <div className="h-[90%] max-h-[90%] flex-grow flex-shrink min-h-0 overflow-y-scroll">
                    <Chat
                        setUser={setUser}
                        username={username}
                        setUsername={setUsername}
                        setPosition={setPosition}
                        user={user}
                        position={position}
                        wrapperRef={wrapperRef}
                        closeWindow={closeWindow}
                        clickUsername={clickUsername}
                    />
                </div>
                <div className="flex-grow">
                    <ChatBox />
                </div>
            </div>

            {roomType === 'chat' || roomType === 'battle' ?
                (
                    <div className="w-64">
                        <UserList
                            setUser={setUser}
                            username={username}
                            setUsername={setUsername}
                            setPosition={setPosition}
                            user={user}
                            position={position}
                            wrapperRef={wrapperRef}
                            closeWindow={closeWindow}
                            clickUsername={clickUsername}
                        />
                    </div>
                ) :
                null}
        </div>
    );
}
