import { createContext } from 'react';
import type { Client } from '@/client/client';
import type { Message } from '@/client/message';
import type { Room } from '@/client/room/room';

export interface ClientContextType {
    client: Client;
    rooms: Room[];
    setRoom:(room: string | 1 | -1 | Room) => void;
    messages: Message[];
}

export const ClientContext = createContext<ClientContextType | undefined>(undefined);
