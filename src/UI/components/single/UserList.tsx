import { type HTMLAttributes, useLayoutEffect, useState } from 'react';
import { Username } from '../Username';
import { isStaff, type User } from '../../../client/user';
import { toID } from '@/utils/generic';
import { cn } from '@/lib/utils';
import { useRoomStore } from '@/client/client';

export default function UserList(props: Readonly<HTMLAttributes<HTMLDivElement> & {
    searchable?: boolean
}>) {
    const room = useRoomStore(state => state.currentRoom);
    const usersUpdateCounter = useRoomStore(state => state.usersUpdateCounter);
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState<string>('');

    const filteredUsers = users.filter((user) => toID(user.name).includes(toID(search)));

    useLayoutEffect(() => {
        if (!room) return;
        setUsers([...room.users]);
    }, [room, usersUpdateCounter]);

    // separate users into staff and regular users
    const staff = filteredUsers.filter((user) => isStaff(user.name));
    const regular = filteredUsers.filter((user) => !isStaff(user.name));

    return (
        <div className={cn('bg-gray-sidebar-light dark:bg-gray-600 w-full p-2 overflow-y-auto whitespace-nowrap', props.className)}>
            {props.searchable && <input
                className="w-full text-sm h-10 py-1 mb-2 px-2 bg-gray-251 placeholder:text-gray-150 dark:bg-gray-700 rounded-md"
                type="text"
                placeholder="Search users"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />}
            {staff.length > 0 && <h2 className="text-sm font-bold text-gray-500 dark:text-gray-175">Staff</h2>}
            {staff.map((user) => (
                <div key={user.ID}>
                    <Username
                        user={user.name}
                        bold={isStaff(user.name)}
                        alignRight
                        idle={user.status === '!'}
                    />
                </div>
            ))}
            {
                staff.length > 0 && regular.length > 0 && <hr className="my-2" />
            }
            {regular.length > 0 && <h2 className="text-sm font-bold text-gray-500 dark:text-gray-175">Users</h2>}
            {regular.map((user) => (
                <div key={user.ID}>
                    <Username
                        user={user.name}
                        bold={isStaff(user.name)}
                        alignRight
                        idle={user.status === '!'}
                    />
                </div>
            ))}
        </div>
    );
}
