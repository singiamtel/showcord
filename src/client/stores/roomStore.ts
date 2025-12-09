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
    updateRoom: (roomID: Room['ID'], updates: Partial<Room>) => void;
    setCurrentRoom: (room: Room) => void;
    selectRoom: (roomID: string, room: Room | undefined) => void;
    setBattleRequest: (roomID: string, request: any) => void;
    notifyUsersUpdate: () => void;
}

export type RoomStore = RoomStoreState & RoomStoreActions;

export const useRoomStore = create<RoomStore>()((set) => ({
    rooms: new Map(),
    selectedRoomID: 'home',
    currentRoom: undefined,
    battleRequest: undefined,
    usersUpdateCounter: 0,

    setRooms: (rooms: Map<Room['ID'], Room>) => {
        set({ rooms: new Map(rooms) });
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

    updateRoom: (roomID: Room['ID'], updates: Partial<Room>) => {
        set((state) => {
            const room = state.rooms.get(roomID);
            if (!room) {
                console.warn(`updateRoom: room ${roomID} not found`);
                return state;
            }

            const hasChanges = Object.entries(updates).some(
                ([key, value]) => room[key as keyof typeof updates] !== value
            );
            if (!hasChanges) return state;

            Object.assign(room, updates);
            return { rooms: new Map(state.rooms).set(roomID, room) };
        });
    },

    setCurrentRoom: (room: Room) => {
        set({ currentRoom: room, selectedRoomID: room.ID });
    },

    selectRoom: (roomID: string, room: Room | undefined) => {
        set({ currentRoom: room, selectedRoomID: roomID });
    },

    setBattleRequest: (roomID: string, request: any) => {
        set({ battleRequest: { roomID, request } });
    },

    notifyUsersUpdate: () => {
        set((state) => ({
            usersUpdateCounter: state.usersUpdateCounter + 1,
        }));
    },
}));
