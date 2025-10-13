import { type Client, client, useClientStore } from '../../../client/client';
import type { Message } from '../../../client/message';
import { Room } from '../../../client/room/room';
import { loadCustomColors } from '../../../utils/namecolour';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from '@/components/ui/use-toast';

interface ClientContextType {
    client: Client;
    rooms: Room[];
    setRoom:(room: string | 1 | -1 | Room) => void;
    messages: Message[];
    setRooms: (rooms: Room[]) => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export default function ClientContextProvider(props: Readonly<React.PropsWithChildren>) {
    const [rooms, setRooms] = useState<Room[]>(client.getRooms());
    const [update, setUpdate] = useState<number>(0); // Used to force update on rooms change
    const [previousRooms, setPreviousRooms] = useState<string[]>(['home']);
    const [messages, setMessages] = useState<Message[]>([]);
    const [updateMsgs, setUpdateMsgs] = useState<number>(0); // Used to force update on rooms change
    const { currentRoom, setCurrentRoom } = useClientStore((state) => ({ currentRoom: state.currentRoom, setCurrentRoom: state.setCurrentRoom }));

    /* --- Room handling --- */

    const setRoom = useCallback((newRoom: string | 1 | -1 | Room) => {
        if (newRoom instanceof Room) {
            setCurrentRoom(newRoom);
            return;
        }
        if (typeof newRoom === 'number') {
            if (rooms) {
                if (!currentRoom) return;
                const index = rooms.indexOf(currentRoom);
                const newIndex = index + newRoom;
                if (newIndex >= rooms.length) {
                    setCurrentRoom(rooms[0]);
                } else if (newIndex < 0) {
                    setCurrentRoom(rooms[rooms.length - 1]);
                } else {
                    setCurrentRoom(rooms[newIndex]);
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
            setCurrentRoom(roomObj);
            client.selectRoom(newRoom);
        } else {
            console.warn('Trying to set room that does not exist (' + newRoom + ')');
        }
    }, [client, rooms, previousRooms]);

    const globalErrorListener = (e: Event) => {
        const error = (e as CustomEvent).detail;
        console.warn('Received error from socket', error);
        if (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error,
            });
        }
    };

    const autoSelectRoomListener = (e: Event) => {
        const roomID = (e as CustomEvent)?.detail;
        if (roomID) {
            setRoom(roomID);
        }
    };

    useEffect(() => {
        const changeRoomsEventListener = (e: Event) => {
            const newRooms = client.getRooms() as ReadonlyArray<Room>;
            // Keep the same order we had before
            const newRoomsOrdered = newRooms.toSorted((a, b) => {
                const indexA = rooms.findIndex((e) => e.ID === a.ID);
                const indexB = rooms.findIndex((e) => e.ID === b.ID);
                if (indexA === -1 || indexB === -1) {
                    return 0;
                }
                return indexA - indexB;
            });
            setRooms(newRoomsOrdered);
            if ((e.type === 'leaveroom' && currentRoom?.ID === (e as CustomEvent).detail.ID) || !currentRoom) {
                setRoom('home');
            }
        };


        client.events.addEventListener('room', changeRoomsEventListener);
        client.events.addEventListener('selectroom', autoSelectRoomListener);
        client.events.addEventListener('leaveroom', changeRoomsEventListener);
        client.events.addEventListener('error', globalErrorListener);

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
        setRoom,
        update,
        setUpdate,
    ]);

    /* --- End room handling --- */

    /* --- Message handling --- */
    const handleMsgEvent = useCallback(async (setMessages: any) => {
        if (!currentRoom) {
            return;
        }
        const msgs = currentRoom.messages ?? [];
        setMessages([...msgs]);
    }, [client]);

    useEffect(() => {
        if (!currentRoom) return;

        const refreshMessages = () => {
            const newMsgs = currentRoom.messages ?? [];
            setMessages([...newMsgs]);
        };

        refreshMessages();

        const eventListener = () => {
            setUpdateMsgs(prev => prev + 1);
        };

        client.events.addEventListener('message', eventListener);

        return () => {
            client.events.removeEventListener('message', eventListener);
        };
    }, [
        client,
        currentRoom,
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
        };
        init();
    }, []);

    /* --- End user handling --- */

    const ProviderValue = useMemo(() => ({
        client,
        currentRoom,
        setRoom,
        messages,
        rooms,
        setRooms,
    }), [messages, rooms, setRooms]);

    return (
        <ClientContext.Provider
            value={ProviderValue}
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

useClientContext.displayName = 'useClientContext';
