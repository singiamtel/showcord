import { useRoomStore, useMessageStore, useAppStore } from '../../../client/client';
import { client } from '../../../client/singleton';
import { Room } from '../../../client/room/room';
import { logger } from '../../../utils/logger';
import { loadCustomColors } from '../../../utils/namecolour';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { ClientContext, type ClientContextType } from './ClientContext.types';

let didInitColors = false;
const EMPTY_MESSAGES: ClientContextType['messages'] = [];

export default function ClientContextProvider(props: Readonly<React.PropsWithChildren>) {
    const [previousRooms, setPreviousRooms] = useState<string[]>(['home']);
    const roomsMap = useRoomStore((state) => state.rooms);
    const currentRoom = useRoomStore((state) => state.currentRoom);
    const setCurrentRoom = useRoomStore((state) => state.setCurrentRoom);
    // Selecting only the active room's entry (instead of the whole messages map) means
    // this provider - and everything consuming useClientContext() - only re-renders when
    // the currently open room's messages change, not on every socket message app-wide.
    const currentRoomMessages = useMessageStore(
        (state) => currentRoom ? state.rooms[currentRoom.ID]?.messages : undefined,
    );

    const rooms = useMemo(
        () => Array.from(roomsMap.values()).filter((r) => r.open),
        [roomsMap],
    );
    const messages = currentRoomMessages ?? EMPTY_MESSAGES;

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
            logger.warn('Trying to set room that does not exist (' + newRoom + ')');
        }
    }, [setCurrentRoom, rooms, previousRooms, currentRoom]);

    useEffect(() => {
        let previousError: string | undefined = undefined;
        const unsubscribe = useAppStore.subscribe((state) => {
            const error = state.error;
            if (error && error !== previousError) {
                logger.warn('Received error from socket', error);
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
        if (!didInitColors) {
            didInitColors = true;
            loadCustomColors();
        }
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
