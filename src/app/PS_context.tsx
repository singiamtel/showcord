import { Client } from '../client/client';
import { Message } from '../client/message';
import { notificationsEngine, RoomNotification } from '../client/notifications';
import { Room } from '../client/room';
import { loadCustomColors } from '../utils/namecolour';
import { createContext, useCallback, useEffect, useState } from 'react';

import { toast } from 'react-toastify';

export const client = new Client();

export const PS_context = createContext<
{
    client: Client;
    selectedPage: string | null;
    selectedPageType: 'user' | 'room';
    setRoom:(room: string | 1 | -1) => void;
    // selectedDM: string | null;
    // setDM: (user: string | 1 | -1) => void;
    // setPage: (type: 'user' | 'room', value: string) => void;
    messages: Message[];
    user?: string; // Will be an object with user info
    rooms: Room[];
    setRooms: (rooms: Room[]) => void;
    notifications: RoomNotification[];
}
>({
            client: client,
            selectedPage: null,
            selectedPageType: 'room',
            setRoom: () => {},
            // selectedDM: null,
            // setDM: () => {},
            // setPage: () => {},
            messages: [],
            user: undefined,
            rooms: [],
            setRooms: () => {},
            notifications: [],
        });

export default function PS_contextProvider(props: any) {
    const [user, setUser] = useState<string | undefined>();
    const [selectedPage, setSelectedPage] = useState<string | null>('home');
    const [selectedPageType, setSelectedPageType] = useState<'room' | 'user'>(
        'room',
    );
    const [rooms, setRooms] = useState<Room[]>([]);
    const [notifications, setNotifications] = useState<RoomNotification[]>([]);
    const [update, setUpdate] = useState<number>(0); // Used to force update on rooms change
    const [previousRooms, setPreviousRooms] = useState<string[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [updateMsgs, setUpdateMsgs] = useState<number>(0); // Used to force update on rooms change

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
        if (client?.room(room)) {
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
        if (!client) {
            return;
        }
        setRooms(Array.from(client.rooms).map((e) => e[1]));
    }, [client, update]);

    useEffect(() => {
        if (!client) {
            return;
        }
        const newEventListener = async (_: Event) => {
            setUpdate(update + 1);
        };

        const removedEventListener = () => {
            setUpdate(update + 1);
            if (client.rooms.size > 0) {
                if (
                    selectedPageType === 'room' &&
          (!selectedPage || !client.room(selectedPage))
                ) {
                    setRoom(client.rooms.values().next().value.ID);
                }
            }
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

        client.events.addEventListener('room', newEventListener);
        client.events.addEventListener('selectroom', autoSelectRoomListener);
        client.events.addEventListener('leaveroom', removedEventListener);
        client.events.addEventListener('error', globalErrorListener);

        return () => {
            client.events.removeEventListener('room', newEventListener);
            client.events.removeEventListener(
                'selectroom',
                autoSelectRoomListener,
            );
            client.events.removeEventListener('leaveroom', removedEventListener);
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
        if (!client) return;
        client.events.addEventListener('leaveroom', (_) => {
            // if the current room was deleted, go to the last room
            if (
                selectedPageType === 'room' && selectedPage &&
        !client.room(selectedPage)
            ) {
                const lastRoom = previousRooms[previousRooms.length - 2];
                if (lastRoom) {
                    setRoom(lastRoom);
                }
            }
        });
    }, [client, previousRooms, selectedPage, selectedPageType, setRoom]);

    useEffect(() => {
        if (!client) return;
        client.autojoin(client.settings.getSavedRooms().map((e) => e.ID), true);
    }, [client]);

    /* --- End room handling --- */

    /* --- Message handling --- */
    const handleMsgEvent = useCallback(async (setMessages: any) => {
        if (!client) {
            return;
        }
        if (!selectedPage) {
            return;
        }
        const msgs = client.room(selectedPage)?.messages ?? [];
        setNotifications(client.getNotifications());
        setMessages(msgs);
    }, [client, selectedPage]);

    useEffect(() => {
        if (!client) return;
        if (!selectedPage) return;

        setMessages(client.room(selectedPage)?.messages ?? []);

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
            console.log('loaded custom colors');
            client.events.addEventListener('login', (username) => {
                console.log('logged in as', username);
                setUser((username as CustomEvent).detail);
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
            }}
        >
            {props.children}
        </PS_context.Provider>
    );
}
