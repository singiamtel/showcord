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
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export default function ClientContextProvider(props: Readonly<React.PropsWithChildren>) {
    const [previousRooms, setPreviousRooms] = useState<string[]>(['home']);
    const { rooms: roomsMap, currentRoom, setCurrentRoom, messages: messagesMap } = useClientStore((state) => ({
        rooms: state.rooms,
        currentRoom: state.currentRoom,
        setCurrentRoom: state.setCurrentRoom,
        messages: state.messages,
    }));

    const rooms = Array.from(roomsMap.values()).filter((r) => r.open);
    const messages = currentRoom ? messagesMap[currentRoom.ID] || [] : [];

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
    }, [setCurrentRoom, rooms, previousRooms, currentRoom]);

    useEffect(() => {
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

        client.events.addEventListener('error', globalErrorListener);

        return () => {
            client.events.removeEventListener('error', globalErrorListener);
        };
    }, []);

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
        setRoom,
        messages,
        rooms,
    }), [setRoom, messages, rooms]);

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
