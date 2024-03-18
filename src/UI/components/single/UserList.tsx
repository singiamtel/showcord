import { PS_context } from './PS_context';
import { MouseEvent, useContext, useEffect, useState } from 'react';
import { Username } from '../Username';
import { isStaff, User } from '../../../client/user';

export default function UserList({
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
    const [search, setSearch] = useState<string>('');

    const filteredUsers = users.filter((user) => user.name.toLowerCase().includes(search.toLowerCase()));

    useEffect(() => {
        if (!client) return;
        const refreshUsers = () => {
            if (!room) return;
            const selectedRoom = client?.room(room);
            if (!selectedRoom) {
                return;
            }
            setUsers([...selectedRoom.users]);
        };

        refreshUsers();
        client.events.addEventListener('users', refreshUsers);
        return () => {
            client.events.removeEventListener('users', refreshUsers);
        };
    }, [client, room]);

    // separate users into staff and regular users
    const staff = filteredUsers.filter((user) => isStaff(user.name));
    const regular = filteredUsers.filter((user) => !isStaff(user.name));

    return (
        <div className="bg-gray-sidebar-light dark:bg-gray-600 w-full h-full p-2 overflow-y-auto whitespace-nowrap">
            <input className="w-full text-sm h-10 py-1 mb-2 px-2 bg-gray-251 placeholder:text-gray-150 dark:bg-gray-700 rounded-md" type="text" placeholder="Search users" value={search} onChange={(e) => setSearch(e.target.value)} />
            {staff.length > 0 && <h2 className="text-sm font-bold text-gray-500 dark:text-gray-175 mb-2">Staff</h2>}
            {staff.map((user, index) => (
                <div key={index}>
                    <Username
                        user={user.name}
                        bold={isStaff(user.name)}
                        alignRight
                        onClick={(e) => clickUsername(e)}
                        idle={user.status === '!'}
                    />
                </div>
            ))}
            {
                staff.length > 0 && regular.length > 0 && <hr className="my-2" />
            }
            {regular.length > 0 && <h2 className="text-sm font-bold text-gray-500 dark:text-gray-175 mb-2">Users</h2>}
            {regular.map((user, index) => (
                <div key={index}>
                    <Username
                        user={user.name}
                        bold={isStaff(user.name)}
                        alignRight
                        onClick={(e) => clickUsername(e)}
                        idle={user.status === '!'}
                    />
                </div>
            ))}
        </div>
    );
}
