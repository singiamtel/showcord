import { Client } from '../client/client';
import { Message } from '../client/message';
import { Notification } from '../client/notifications';
import { Room } from '../client/room';
import { loadCustomColors } from '../utils/namecolour';
import { createContext, useCallback, useEffect, useState } from 'react';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    notifications: Notification[];
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
            notifications: [],
        });

export default function PS_contextProvider(props: any) {
    const [user, setUser] = useState<string | undefined>();
    const [selectedPage, setSelectedPage] = useState<string | null>('home');
    const [selectedPageType, setSelectedPageType] = useState<'room' | 'user'>(
        'room',
    );
    const [rooms, setRooms] = useState<Room[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
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
            console.log('Trying to set room that does not exist (' + room + ')');
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
        const newEventListener = async (e: Event) => {
            setUpdate(update + 1);
            const roomID = (e as CustomEvent)?.detail?.ID;
            if (roomID) {
                setRoom(roomID);
                // We don't switch to the room if it's in the settings as it probably means we're doing the initial join
                // console.log("settings", await client.settings.getSavedRooms());
                // const rooms = await settings.getSavedRooms();
                // if (rooms && !rooms.map((e) => e.ID).includes(roomID)) {
                //   setRoom(roomID);
                // }
            }
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

        client.events.addEventListener('room', newEventListener);
        client.events.addEventListener('leaveroom', removedEventListener);
        client.events.addEventListener('error', globalErrorListener);

        return () => {
            client.events.removeEventListener('room', newEventListener);
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
        console.log('AWD Joining rooms', client.settings.getSavedRooms());
        client.autojoin(client.settings.getSavedRooms().map((e) => e.ID), true);
    // client.login({username, password});
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
        setNotifications(client.getNotifications()); // Manage notifications
        setMessages(msgs);
    }, [client, selectedPage]);

    useEffect(() => {
        if (!client) return;
        if (!selectedPage) return;

        setMessages(client.room(selectedPage)?.messages ?? []);

        const eventListener = () => {
            setUpdateMsgs(updateMsgs + 1);
        };

        client.events.addEventListener('message', eventListener);

        return () => {
            // Clean up the event listener when the component unmounts
            client.events.removeEventListener('message', eventListener);
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
    // TODO: This logic should clearly be in the client (issue #9)
        const init = async () => {
            await loadCustomColors();
            console.log('loaded custom colors');
            // const client = new Client();
            // client.onOpen.push(() => {
            //   setClient(client);
            // });
            client.events.addEventListener('login', (username) => {
                console.log('logged in as', username);
                setUser((username as CustomEvent).detail);
            });
        };
        init();
    }, []);

    // Try to recover on socket death
    // TODO: It doesn't work very well
    // useEffect(() => {
    //   if(!client) return;
    //   client.socket.onclose = () => {
    //     const newClient = new Client();
    //     newClient.socket.onopen = () => {
    //       setClient(newClient);
    //     };
    //   }
    // }, [client])

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
                notifications,
            }}
        >
            {props.children}
        </PS_context.Provider>
    );
}
