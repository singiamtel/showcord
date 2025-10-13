import { create } from 'zustand';
import { Room } from '../room/room';

interface RoomStoreState {
    rooms: Map<Room['ID'], Room>;
    selectedRoomID: string;
    currentRoom: Room | undefined;
}

interface RoomStoreActions {
    setRooms: (rooms: Map<Room['ID'], Room>) => void;
    addRoom: (room: Room) => void;
    removeRoom: (roomID: Room['ID']) => void;
    setCurrentRoom: (room: Room) => void;
    selectRoom: (roomID: string, room: Room | undefined) => void;
}

export type RoomStore = RoomStoreState & RoomStoreActions;

export const useRoomStore = create<RoomStore>((set) => ({
    rooms: new Map(),
    selectedRoomID: 'home',
    currentRoom: undefined,

    setRooms: (rooms: Map<Room['ID'], Room>) => {
        set(() => ({
            rooms: new Map(rooms),
        }));
    },

    addRoom: (room: Room) => {
        set((state) => {
            const newRooms = new Map(state.rooms);
            newRooms.set(room.ID, room);
            return { rooms: newRooms };
        });
    },

    removeRoom: (roomID: Room['ID']) => {
        set((state) => {
            const newRooms = new Map(state.rooms);
            newRooms.delete(roomID);
            return { rooms: newRooms };
        });
    },

    setCurrentRoom: (room: Room) => {
        set(() => ({
            currentRoom: room,
            selectedRoomID: room.ID,
        }));
    },

    selectRoom: (roomID: string, room: Room | undefined) => {
        set(() => ({
            currentRoom: room,
            selectedRoomID: roomID,
        }));
    },
}));
