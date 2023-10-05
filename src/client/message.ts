type MessageTypes =
  | 'chat'
  | 'raw'
  | 'log'
  | 'simple'
  | 'error'
  | 'roleplay'
  | 'uhtmlchange';
export class Message {
    content: string;
    type: MessageTypes;
    user?: string;
    timestamp?: Date;
    hld?: boolean;
    name?: string; // only defined for uhtml messages
    constructor(
        { content, type, user, timestamp, hld = false, name }: {
            content: string;
            type: MessageTypes;
            user?: string;
            timestamp?: string;
            hld?: boolean;
            name?: string;
        },
    ) {
        this.content = content;
        if (type === 'uhtmlchange') {
            throw new Error('Received invalid message type uhtmlchange');
        }
        this.type = type;
        this.user = user;
        // this.timestamp = timestamp ? new Date(timestamp) : undefined;
        if (timestamp) this.timestamp = new Date(Number(timestamp) * 1000);
        this.hld = hld;
        this.name = name;
    }
}
