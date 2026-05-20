import { create } from 'zustand';
import type { Message } from '../message';
import type { RoomType } from '../room/room';

const MESSAGE_LIMIT = 200;

interface MessageEntry {
    messages: Message[];
    lastReadTime: number;
    unread: number;
    mentions: number;
}

interface MessageStoreState {
    rooms: Record<string, MessageEntry>;
}

interface MessageStoreActions {
    addMessage: (
        roomID: string,
        message: Message,
        opts: { selected: boolean; selfSent: boolean; roomType: RoomType },
    ) => void;
    addUHTML: (
        roomID: string,
        message: Message,
        opts: { selected: boolean; selfSent: boolean },
    ) => void;
    changeUHTML: (roomID: string, message: Message) => boolean;
    endChallenge: (roomID: string) => void;
    selectRoom: (roomID: string) => void;
    clearMessages: (roomID: string) => void;
}

export type MessageStore = MessageStoreState & MessageStoreActions;

export const useMessageStore = create<MessageStore>()((set) => ({
    rooms: {},

    addMessage: (roomID, message, opts) => {
        set((state) => {
            const entry = state.rooms[roomID] ?? {
                messages: [],
                lastReadTime: Date.now(),
                unread: 0,
                mentions: 0,
            };

            const messages = [...entry.messages];
            if (messages.length >= MESSAGE_LIMIT) {
                messages.shift();
            }

            let { lastReadTime, unread } = entry;
            if (opts.selected) {
                lastReadTime = Date.now();
            }

            const margin = 1000;
            if (
                ['chat', 'pm'].includes(message.type) &&
                !opts.selfSent &&
                !opts.selected &&
                message.timestamp &&
                message.timestamp.getTime() > lastReadTime - margin
            ) {
                unread++;
            }

            messages.push(message);

            return {
                rooms: {
                    ...state.rooms,
                    [roomID]: { ...entry, messages, lastReadTime, unread },
                },
            };
        });
    },

    addUHTML: (roomID, message, opts) => {
        set((state) => {
            const entry = state.rooms[roomID] ?? {
                messages: [],
                lastReadTime: Date.now(),
                unread: 0,
                mentions: 0,
            };

            const messages = [...entry.messages];
            if (message.name) {
                const idx = messages.findIndex((m) => m.name === message.name);
                if (idx !== -1) {
                    messages.splice(idx, 1);
                }
            }

            let { lastReadTime } = entry;
            if (opts.selected) {
                lastReadTime = Date.now();
            }

            messages.push(message);

            return {
                rooms: {
                    ...state.rooms,
                    [roomID]: { ...entry, messages, lastReadTime },
                },
            };
        });
    },

    changeUHTML: (roomID, message) => {
        let changed = false;
        set((state) => {
            const entry = state.rooms[roomID];
            if (!entry || !message.name) return state;

            const idx = entry.messages.findIndex((m) => m.name === message.name);
            if (idx === -1) return state;

            changed = true;
            const messages = [...entry.messages];
            messages[idx] = { ...messages[idx], content: message.content };

            return {
                rooms: {
                    ...state.rooms,
                    [roomID]: { ...entry, messages },
                },
            };
        });
        return changed;
    },

    endChallenge: (roomID) => {
        set((state) => {
            const entry = state.rooms[roomID];
            if (!entry) return state;

            const challengeIdx = entry.messages.findIndex(
                (m) => m.type === 'challenge' && !m.cancelled,
            );
            if (challengeIdx === -1) return state;

            const messages = [...entry.messages];
            messages[challengeIdx] = { ...messages[challengeIdx], cancelled: true };

            return {
                rooms: {
                    ...state.rooms,
                    [roomID]: { ...entry, messages },
                },
            };
        });
    },

    selectRoom: (roomID) => {
        set((state) => {
            const entry = state.rooms[roomID];
            if (!entry) return state;

            return {
                rooms: {
                    ...state.rooms,
                    [roomID]: {
                        ...entry,
                        lastReadTime: Date.now(),
                        unread: 0,
                        mentions: 0,
                    },
                },
            };
        });
    },

    clearMessages: (roomID) => {
        set((state) => {
            const { [roomID]: _, ...rest } = state.rooms;
            return { rooms: rest };
        });
    },
}));
