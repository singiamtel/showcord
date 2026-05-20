import { createContext, use } from 'react';

const RoomContext = createContext<string | null>(null);

export function useRoomID(): string {
    const roomID = use(RoomContext);
    if (roomID === null) {
        throw new Error('useRoomID must be used within a RoomContext.Provider');
    }
    return roomID;
}

export { RoomContext };
