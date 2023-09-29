export class Message {
    content: string;
    type: 'chat' | 'raw' | 'log' | 'simple' | 'error';
    user?: string;
    timestamp?: Date;
    hld?: boolean;
    name?: string; // only defined for uhtml messages
    constructor(
        { content, type, user, timestamp, hld = false, name }: {
            content: string;
            type: 'chat' | 'raw' | 'log' | 'simple' | 'error';
            user?: string;
            timestamp?: string;
            hld?: boolean
            name?: string
        },
    ) {
        this.content = content;
        this.type = type;
        this.user = user;
        // this.timestamp = timestamp ? new Date(timestamp) : undefined;
        if (timestamp) this.timestamp = new Date(Number(timestamp) * 1000);
        this.hld = hld;
        this.name = name;
    }
}
