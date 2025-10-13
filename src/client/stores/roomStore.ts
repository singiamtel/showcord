import { create } from 'zustand';
import { Room } from '../room/room';

interface RoomStoreState {
    rooms: Map<Room['ID'], Room>;
    selectedRoomID: string;
    currentRoom: Room | undefined;
    battleRequest: { roomID: string; request: any } | undefined;
    usersUpdateCounter: number;
}

interface RoomStoreActions {
    setRooms: (rooms: Map<Room['ID'], Room>) => void;
    addRoom: (room: Room) => void;
    removeRoom: (roomID: Room['ID']) => void;
    setCurrentRoom: (room: Room) => void;
    selectRoom: (roomID: string, room: Room | undefined) => void;
    setBattleRequest: (roomID: string, request: any) => void;
    notifyUsersUpdate: () => void;
}

export type RoomStore = RoomStoreState & RoomStoreActions;

export const useRoomStore = create<RoomStore>((set) => ({
    rooms: new Map(),
    selectedRoomID: 'home',
    currentRoom: undefined,
    battleRequest: undefined,
    usersUpdateCounter: 0,

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

    setBattleRequest: (roomID: string, request: any) => {
        set(() => ({
            battleRequest: { roomID, request },
        }));
    },

    notifyUsersUpdate: () => {
        set((state) => ({
            usersUpdateCounter: state.usersUpdateCounter + 1,
        }));
    },
}));
