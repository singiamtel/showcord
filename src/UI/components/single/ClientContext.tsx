import { assertNever } from '@/lib/utils';
import { Client } from '../../../client/client';
import { Message } from '../../../client/message';
import { notificationsEngine, RoomNotification } from '../../../client/notifications';
import { Room } from '../../../client/room/room';
import { loadCustomColors } from '../../../utils/namecolour';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { toast } from 'react-toastify';

export const client = new Client();
window.client = client; // Only for debugging

interface ClientContextType {
    client: Client;
    rooms: Room[];
    currentRoom: Room | undefined;
    setRoom:(room: string | 1 | -1 | Room) => void;
    messages: Message[];
    user?: string; // Will be an object with user info
    setRooms: (rooms: Room[]) => void;
    notifications: RoomNotification[];
    avatar?: string;
    theme: 'light' | 'dark'
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export default function ClientContextProvider(props: Readonly<React.PropsWithChildren>) {
    const [user, setUser] = useState<string | undefined>();
    const [selectedRoom, setSelectedRoom] = useState<Room | undefined>(client.room('home'));
    const [rooms, setRooms] = useState<Room[]>(client.getRooms());
    const [notifications, setNotifications] = useState<RoomNotification[]>([]);
    const [update, setUpdate] = useState<number>(0); // Used to force update on rooms change
    const [previousRooms, setPreviousRooms] = useState<string[]>(['home']);
    const [messages, setMessages] = useState<Message[]>([]);
    const [updateMsgs, setUpdateMsgs] = useState<number>(0); // Used to force update on rooms change
    const [avatar, setAvatar] = useState<string | undefined>(undefined);
    const [theme, setTheme] = useState<'light' | 'dark'>(client.settings.getTheme());

    /* --- Room handling --- */

    const setRoom = useCallback((newRoom: string | 1 | -1 | Room) => {
        if (newRoom instanceof Room) {
            setSelectedRoom(newRoom);
            return;
        }
        if (typeof newRoom === 'number') {
            if (rooms) {
                if (!selectedRoom) return;
                const index = rooms.indexOf(selectedRoom);
                const newIndex = index + newRoom;
                if (newIndex >= rooms.length) {
                    setSelectedRoom(rooms[0]);
                } else if (newIndex < 0) {
                    setSelectedRoom(rooms[rooms.length - 1]);
                } else {
                    setSelectedRoom(rooms[newIndex]);
                }
                return;
            } else { return; }
        }
        const roomObj = client.room(newRoom);
        if (roomObj) {
            const tmpPR = previousRooms;
            if (tmpPR.includes(newRoom)) {
                const index = previousRooms.indexOf(newRoom);
                tmpPR.splice(index, 1);
            }
            tmpPR.push(newRoom);
            if (tmpPR.length > 5) tmpPR.shift();
            setPreviousRooms(tmpPR);
            setSelectedRoom(roomObj);
            client.selectRoom(newRoom);
            return;
        } else {
            console.warn('Trying to set room that does not exist (' + newRoom + ')');
            return;
        }
    }, [client, rooms, selectedRoom, previousRooms]);

    useEffect(() => {
        console.log('Updated rooms', rooms);
    }, [rooms]);


    const globalErrorListener = (e: Event) => {
        const error = (e as CustomEvent).detail;
        console.warn('Received error from socket', error);
        if (error) {
            toast.error(error);
        }
    };

    const autoSelectRoomListener = (e: Event) => {
        const roomID = (e as CustomEvent)?.detail;
        if (roomID) {
            setRoom(roomID);
        }
    };

    const themeEventListener = (_e: Event) => {
        const theme = client.settings.getTheme();
        setTheme(theme);
    };

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
            if (e.type === 'leaveroom' && selectedRoom?.ID === (e as CustomEvent).detail.ID) {
                setRoom('home');
            } else if (!selectedRoom) { setRoom('home'); }
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
        setRooms,
        selectedRoom,
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
        if (!selectedRoom) {
            return;
        }
        const msgs = selectedRoom.messages ?? [];
        setNotifications(client.getNotifications());
        setMessages([...msgs]);
    }, [client, selectedRoom]);

    useEffect(() => {
        if (!selectedRoom) return;

        setMessages([...selectedRoom.messages ?? []]);

        const eventListener = () => {
            setUpdateMsgs(updateMsgs + 1);
        };

        const notificationsEventListener: EventListener = (event) => {
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
        selectedRoom,
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
        <ClientContext.Provider
            value={{
                client,
                currentRoom: selectedRoom,
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
        </ClientContext.Provider>
    );
}

export function useClientContext() {
    const context = useContext(ClientContext);
    if (!context) {
        throw new Error('useClientContext must be used within a ClientContextProvider');
    }
    return context;
}
