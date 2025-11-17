import { create } from 'zustand';
import type { Message } from '../message';
import type { Room } from '../room/room';

interface MessageStoreState {
    messages: Record<Room['ID'], Message[]>;
}

interface MessageStoreActions {
    newMessage: (roomID: string, message: Message) => void;
    updateMessages: (roomID: string, messages: Message[]) => void;
}

export type MessageStore = MessageStoreState & MessageStoreActions;

export const useMessageStore = create<MessageStore>()((set) => ({
    messages: {},

    newMessage: (roomID: string, message: Message) => {
        set((state) => {
            const existingMessages = state.messages[roomID] || [];
            return {
                messages: {
                    ...state.messages,
                    [roomID]: [...existingMessages, message],
                },
            };
        });
    },

    updateMessages: (roomID: string, messages: Message[]) => {
        set((state) => ({ messages: { ...state.messages, [roomID]: messages } }));
    },
}));
