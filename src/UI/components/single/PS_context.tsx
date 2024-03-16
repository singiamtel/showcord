import { Client } from '../../../client/client';
import { Message } from '../../../client/message';
import { notificationsEngine, RoomNotification } from '../../../client/notifications';
import { Room } from '../../../client/room';
import { loadCustomColors } from '../../../utils/namecolour';
import { createContext, useCallback, useEffect, useState } from 'react';

import { toast } from 'react-toastify';

export const client = new Client();
window.client = client; // Only for debugging

export const PS_context = createContext<
{
    client: Client;
    selectedPage: string;
    selectedPageType: 'user' | 'room';
    setRoom:(room: string | 1 | -1) => void;
    messages: Message[];
    user?: string; // Will be an object with user info
    rooms: Room[];
    setRooms: (rooms: Room[]) => void;
    notifications: RoomNotification[];
    avatar?: string;
    theme: 'light' | 'dark'
}
>({
            client: client,
            selectedPage: '',
            selectedPageType: 'room',
            setRoom: () => {},
            messages: [],
            user: undefined,
            rooms: [],
            setRooms: () => {},
            notifications: [],
            theme: 'dark',
        });

export default function PS_contextProvider(props: any) {
    const [user, setUser] = useState<string | undefined>();
    const [selectedPage, setSelectedPage] = useState<string>('home');
    const [selectedPageType, setSelectedPageType] = useState<'room' | 'user'>(
        'room',
    );
    const [rooms, setRooms] = useState<Room[]>(client.getRooms());
    const [notifications, setNotifications] = useState<RoomNotification[]>([]);
    const [update, setUpdate] = useState<number>(0); // Used to force update on rooms change
    const [previousRooms, setPreviousRooms] = useState<string[]>(['home']);
    const [messages, setMessages] = useState<Message[]>([]);
    const [updateMsgs, setUpdateMsgs] = useState<number>(0); // Used to force update on rooms change
    const [avatar, setAvatar] = useState<string | undefined>(undefined);
    const [theme, setTheme] = useState<'light' | 'dark'>(client.settings.getTheme());

    /* --- Room handling --- */

    const setRoom = useCallback((room: string | 1 | -1) => {
        if (typeof room === 'number') {
            if (rooms) {
                if (!selectedPage) return;
                const roomNames = rooms.map((r) => r.ID);
                const index = roomNames.indexOf(selectedPage);
                const newIndex = index + room;
                if (newIndex >= roomNames.length) room = roomNames[0];
                else if (newIndex < 0) room = roomNames[roomNames.length - 1];
                else room = roomNames[newIndex];
            } else {
                console.log('No rooms found');
                return;
            }
        }
        if (client.room(room)) {
            const tmpPR = previousRooms;
            if (tmpPR.includes(room)) {
                const index = previousRooms.indexOf(room);
                tmpPR.splice(index, 1);
            }
            tmpPR.push(room);
            if (tmpPR.length > 5) tmpPR.shift();
            setPreviousRooms(tmpPR);
            setSelectedPage(room);
            client.selectRoom(room);
        } else {
            console.warn('Trying to set room that does not exist (' + room + ')');
        }
        setSelectedPageType('room');
    }, [client, rooms, selectedPage, previousRooms]);

    useEffect(() => {
        const changeRoomsEventListener = (e: Event) => {
            const newRooms = client.getRooms();
            // Keep the same order we had before
            const newRoomsOrdered = newRooms.sort((a, b) => {
                const indexA = rooms.findIndex((e) => e.ID === a.ID);
                const indexB = rooms.findIndex((e) => e.ID === b.ID);
                if (indexA === -1 || indexB === -1) {
                    return 0;
                }
                return indexA - indexB;
            });
            setRooms(newRoomsOrdered);
            if (e.type === 'leaveroom' && selectedPage === (e as CustomEvent).detail) {
                setRoom('home');
            } else if (!selectedPage) { setRoom('home'); }
        };

        const globalErrorListener = (e: Event) => {
            const error = (e as CustomEvent).detail;
            console.warn('Received error from socket', error);
            if (error) {
                toast.error(error);
            }
        };

        const autoSelectRoomListener = (e: Event) => {
            console.log('Received selectroom event', e);
            const roomID = (e as CustomEvent)?.detail;
            if (roomID) {
                setRoom(roomID);
            }
        };

        const themeEventListener = (_e: Event) => {
            const theme = client.settings.getTheme();
            setTheme(theme);
        };

        client.events.addEventListener('room', changeRoomsEventListener);
        client.events.addEventListener('selectroom', autoSelectRoomListener);
        client.events.addEventListener('leaveroom', changeRoomsEventListener);
        client.events.addEventListener('error', globalErrorListener);
        client.events.addEventListener('theme', themeEventListener);

        return () => {
            client.events.removeEventListener('room', changeRoomsEventListener);
            client.events.removeEventListener(
                'selectroom',
                autoSelectRoomListener,
            );
            client.events.removeEventListener('leaveroom', changeRoomsEventListener);
            client.events.removeEventListener('error', globalErrorListener);
        };
    }, [
        client,
        setRooms,
        selectedPage,
        selectedPageType,
        setRoom,
        update,
        setUpdate,
    ]);

    useEffect(() => {
        client.autojoin(client.settings.getSavedRooms().map((e) => e.ID), true);
    }, []);

    /* --- End room handling --- */

    /* --- Message handling --- */
    const handleMsgEvent = useCallback(async (setMessages: any) => {
        if (!selectedPage) {
            return;
        }
        const msgs = client.room(selectedPage)?.messages ?? [];
        setNotifications(client.getNotifications());
        setMessages([...msgs]);
    }, [client, selectedPage]);

    useEffect(() => {
        if (!selectedPage) return;

        setMessages([...client.room(selectedPage)?.messages ?? []]);

        const eventListener = () => {
            setUpdateMsgs(updateMsgs + 1);
        };

        const notificationsEventListener: EventListener = (event) => {
            console.log('Received notification', (event as CustomEvent).detail);
            notificationsEngine.sendNotification((event as CustomEvent).detail);
        };

        client.events.addEventListener('message', eventListener);
        client.events.addEventListener('notification', notificationsEventListener);

        return () => {
            // Clean up the event listener when the component unmounts
            client.events.removeEventListener('message', eventListener);
            client.events.removeEventListener(
                'notification',
                notificationsEventListener,
            );
        };
    }, [
        client,
        selectedPage,
        selectedPageType,
        setMessages,
        handleMsgEvent,
        updateMsgs,
    ]);

    useEffect(() => {
        handleMsgEvent(setMessages);
    }, [handleMsgEvent, setMessages, updateMsgs]);

    /* --- End message handling --- */

    useEffect(() => {
    // TODO: Unclear if this should be here
        const init = async () => {
            await loadCustomColors();
            client.events.addEventListener('login', (username) => {
                setUser((username as CustomEvent).detail);
                setAvatar(client.settings.getAvatar());
            });
        };
        init();
    }, []);

    /* --- End user handling --- */

    return (
        <PS_context.Provider
            value={{
                client: client,
                selectedPage,
                selectedPageType,
                setRoom,
                user,
                messages,
                rooms,
                setRooms,
                notifications,
                avatar,
                theme,
            }}
        >
            {props.children}
        </PS_context.Provider>
    );
}
