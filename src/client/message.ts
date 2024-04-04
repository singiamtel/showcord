import { Optional } from '../utils/generic';

export type MessageType =
  | 'chat'
  | 'rawHTML'
  | 'boxedHTML'
  | 'log'
  | 'announce'
  | 'simple'
  | 'error'
  | 'roleplay'
  | 'uhtmlchange'
  | 'challenge';

export type Message = {
    content: string;
    type: MessageType;
    user?: string;
    timestamp?: Date;
    /** true if message is highlighted, false if not, null if not parsed yet */
    hld: boolean | null
    name?: string; // only defined for uhtml messages
};

export default function ({
    content,
    type,
    user,
    timestamp,
    hld,
    name,
}: Omit<Optional<Message, 'hld'>, 'timestamp'> & {
    timestamp?: string;
}): Message {
    if (type === 'uhtmlchange') {
        throw new Error('Received invalid message type uhtmlchange');
    }
    return {
        content,
        type,
        user,
        timestamp: timestamp ? new Date(Number(timestamp) * 1000) : undefined,
        hld: hld ?? null,
        name,
    };
}
