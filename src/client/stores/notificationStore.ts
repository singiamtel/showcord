import { create } from 'zustand';
import type { Room } from '../room/room';

export type RoomNotification = {
    mentions: number;
    unread: number;
};

interface NotificationStoreState {
    notifications: Record<Room['ID'], RoomNotification>;
}

interface NotificationStoreActions {
    addUnread: (roomID: string) => void;
    addMention: (roomID: string) => void;
    clearNotifications: (roomID: string) => void;
}

export type NotificationStore = NotificationStoreState & NotificationStoreActions;

export const useNotificationStore = create<NotificationStore>((set) => ({
    notifications: {},

    addUnread: (roomID: string) => {
        set((state) => {
            if (!state.notifications[roomID]) {
                return {
                    notifications: { ...state.notifications, [roomID]: { unread: 1, mentions: 0 } },
                };
            }
            return {
                notifications: {
                    ...state.notifications,
                    [roomID]: {
                        unread: state.notifications[roomID].unread + 1,
                        mentions: state.notifications[roomID].mentions,
                    },
                },
            };
        });
    },

    addMention: (roomID: string) => {
        set((state) => {
            if (!state.notifications[roomID]) {
                return {
                    notifications: { ...state.notifications, [roomID]: { unread: 0, mentions: 1 } },
                };
            }
            return {
                notifications: {
                    ...state.notifications,
                    [roomID]: {
                        unread: state.notifications[roomID].unread,
                        mentions: state.notifications[roomID].mentions + 1,
                    },
                },
            };
        });
    },

    clearNotifications: (roomID: string) => {
        if (!roomID) return;
        set((state) => ({
            notifications: { ...state.notifications, [roomID]: { unread: 0, mentions: 0 } },
        }));
    },
}));
