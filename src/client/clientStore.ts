import { create } from 'zustand';
import { Room } from './room/room';
import type { Message } from './message';
import type { RoomNotification as RoomNotifications } from './notifications';

interface UseClientStoreType {
    rooms: Map<Room['ID'], Room>;
    currentRoom: Room | undefined;
    selectedRoomID: string;
    setCurrentRoom: (roomID: Room) => void;
    setRooms: (rooms: Map<Room['ID'], Room>) => void;
    addRoom: (room: Room) => void;
    removeRoom: (roomID: Room['ID']) => void;
    messages: Record<Room['ID'], Message[]>;
    newMessage: (room: Room, message: Message) => void;
    updateMessages: (room: Room) => void;
    notifications: Record<Room['ID'], RoomNotifications>;
    clearNotifications: (roomID: Room['ID']) => void;
    addUnread: (room: Room) => void;
    addMention: (room: Room) => void;
    avatar: string;
    theme: 'light' | 'dark' | 'system';
    user: string | undefined;
    error: string | undefined;
    setError: (error: string | undefined) => void;
    challstr: string;
    setChallstr: (challstr: string) => void;
}

export const useClientStore = create<UseClientStoreType>((set) => ({
    rooms: new Map(),
    currentRoom: undefined,
    selectedRoomID: 'home',
    setCurrentRoom: (room: Room) => {
        set(() => ({
            currentRoom: room,
            selectedRoomID: room.ID,
        }));
    },
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
    messages: {},
    newMessage: (room: Room, message: Message) => {
        set((state) => {
            if (room.ID !== state.selectedRoomID) {
                state.addUnread(room);
            }

            if (!state.messages[room.ID]) {
                return {
                    messages: { ...state.messages, [room.ID]: [message] },
                };
            }
            return {
                messages: { ...state.messages, [room.ID]: [...state.messages[room.ID], message] },
            };
        });
    },
    updateMessages: (room: Room) => {
        set((state) => ({
            messages: { ...state.messages, [room.ID]: [...room.messages] },
        }));
    },
    notifications: {},
    addUnread: (room: Room) => {
        set((state) => {
            if (!state.notifications[room.ID]) {
                return {
                    notifications: { ...state.notifications, [room.ID]: { unread: 1, mentions: 0 } },
                };
            }
            return {
                notifications: { ...state.notifications, [room.ID]: { unread: state.notifications[room.ID].unread + 1, mentions: state.notifications[room.ID].mentions } },
            };
        });
    },
    addMention: (room: Room) => {
        set((state) => {
            if (!state.notifications[room.ID]) {
                return {
                    notifications: { ...state.notifications, [room.ID]: { unread: 0, mentions: 1 } },
                };
            }
            return {
                notifications: { ...state.notifications, [room.ID]: { unread: state.notifications[room.ID].unread, mentions: state.notifications[room.ID].mentions + 1 } },
            };
        });
    },
    clearNotifications: (roomID: string) => {
        if (!roomID) return;
        set((state) => {
            if (!state.notifications[roomID]) {
                return {
                    notifications: { ...state.notifications, [roomID]: { unread: 0, mentions: 0 } },
                };
            }
            return {
                notifications: { ...state.notifications, [roomID]: { unread: 0, mentions: 0 } },
            };
        });
    },

    avatar: 'lucas',
    theme: localStorage.getItem('theme') as 'light' | 'dark' | 'system' ?? 'system',
    user: undefined,
    error: undefined,
    setError: (error: string | undefined) => {
        set(() => ({ error }));
    },
    challstr: '',
    setChallstr: (challstr: string) => {
        set(() => ({ challstr }));
    },

}));
