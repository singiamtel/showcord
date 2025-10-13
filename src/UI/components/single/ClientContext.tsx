import { client, useRoomStore, useMessageStore, useAppStore } from '../../../client/client';
import { Room } from '../../../client/room/room';
import { loadCustomColors } from '../../../utils/namecolour';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { ClientContext } from './ClientContext.types';

export default function ClientContextProvider(props: Readonly<React.PropsWithChildren>) {
    const [previousRooms, setPreviousRooms] = useState<string[]>(['home']);
    const roomsMap = useRoomStore((state) => state.rooms);
    const currentRoom = useRoomStore((state) => state.currentRoom);
    const setCurrentRoom = useRoomStore((state) => state.setCurrentRoom);
    const messagesMap = useMessageStore((state) => state.messages);

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
        let previousError: string | undefined = undefined;
        const unsubscribe = useAppStore.subscribe((state) => {
            const error = state.error;
            if (error && error !== previousError) {
                console.warn('Received error from socket', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: error,
                });
                previousError = error;
            }
        });

        return unsubscribe;
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
        <ClientContext
            value={ProviderValue}
        >
            {props.children}
        </ClientContext>
    );
}

