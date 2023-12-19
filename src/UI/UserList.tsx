import { PS_context } from './PS_context';
import { MouseEvent, useContext, useEffect, useState } from 'react';
import { UsernameComponent } from './usercomponents';
import { User } from '../client/user';

export default function UserList({
    setUser,
    username,
    setUsername,
    setPosition,
    user,
    position,
    wrapperRef,
    closeWindow,
    clickUsername,
}: {
    setUser: (user: any) => void;
    username: string | null;
    setUsername: (username: string) => void;
    setPosition: (position: { x: number; y: number }) => void;
    user: any | null;
    position: { x: number; y: number };
    wrapperRef: React.MutableRefObject<any>;
    closeWindow: () => void;
    clickUsername: (e: MouseEvent) => void;
}) {
    const { selectedPage: room, client } = useContext(PS_context);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        if (!client) return;
        const refreshUsers = () => {
            if (!room) return;
            const selectedRoom = client?.room(room);
            if (!selectedRoom) {
                return;
            }
            setUsers(selectedRoom.users);
        };

        refreshUsers();
        client.events.addEventListener('users', refreshUsers);
        return () => {
            client.events.removeEventListener('users', refreshUsers);
        };
    }, [client, room]);

    return (
        <div className="bg-gray-600 w-full h-full p-2 overflow-y-auto whitespace-nowrap">
            {users.map((user, index) => (
                <div key={index}>
                    <UsernameComponent
                        user={user.name}
                        bold={user.name[0] !== ' '}
                        alignRight
                        onClick={(e) => clickUsername(e)}
                        idle={user.status === '!'}
                    />
                </div>
            ))}
        </div>
    );
}
