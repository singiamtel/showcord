import { Message } from './message';
import { User } from './user';

export const roomTypes = ['chat', 'battle', 'pm', 'permanent'] as const;
export type RoomType = typeof roomTypes[number];

export const rankOrder = {
    '&': 9,
    '#': 8,
    '\u00a7': 7,
    '@': 6,
    '%': 5,
    '*': 4,
    '+': 3,
    '^': 2,
    ' ': 1,
    '‽': 0,
} as const;

export class Room {
    type: RoomType;
    ID: string;
    name: string;
    lastReadTime: Date = new Date();
    lastReadTimeMargin = 1000; // 1 second
    unread = 0;
    mentions = 0;

    messages: Message[] = [];
    users: User[] = [];
    private readonly messageLimit = 600;
    private icon?: JSX.Element;
    private lastSentMessages: string[] = [];
    constructor(
        { ID, name, type }: {
            ID: string;
            name: string;
            type: RoomType;
        },
    ) {
        this.ID = ID;
        this.name = name;
        this.type = type;
    }

    select() {
        this.lastReadTime = new Date();
        this.mentions = 0;
        this.unread = 0;
    }

    send(message: string) {
        if (this.lastSentMessages.length > 25) {
            this.lastSentMessages.shift();
        }
        this.lastSentMessages.push(message);
    }

    getLastSentMessage(age: number) {
        return this.lastSentMessages[this.lastSentMessages.length - age];
    }

    addMessage(
        message: Message,
        { selected, selfSent }: { selected: boolean; selfSent: boolean },
    ): boolean {
        let shouldNotify = false;
        if (this.messages.length > this.messageLimit) {
            this.messages.shift();
        }
        if (selected) {
            const date = new Date();
            this.lastReadTime = date;
        }
        if (
            ['chat', 'pm'].includes(message.type) && !selfSent && !selected &&
      message.timestamp &&
      message.timestamp >
        new Date(this.lastReadTime.getTime() - this.lastReadTimeMargin)
        ) {
            this.unread++;
            if (message.hld || this.type === 'pm') {
                this.mentions++;
                if (!selected || !document.hasFocus()) {
                    shouldNotify = true;
                    // message.hld = false;
                    // new Notification(`Private message from ${message.user}`, {
                    //     body: message.content,
                    //     icon: '/static/favicon.png',
                    // });
                }
            }
        }
        this.messages.push(message);
        return shouldNotify;
    }

    removeUser(username: string) {
        this.users = this.users.filter((u) => u.name !== username);
    }

    addUHTML(
        message: Message,
        { selected, selfSent }: { selected: boolean; selfSent: boolean },
    ) {
        const previousMessage = this.messages.find((m) => m.name === message.name);
        if (previousMessage) {
            this.messages.splice(this.messages.indexOf(previousMessage), 1);
        }
        this.addMessage(message, { selected, selfSent });
    }

    changeUHTML(
        message: Message,
    ) {
        if (!message.name) {
            console.error(
                `changeUHTML(): Received unnamed UHTML for room ${this.name}`,
            );
            return false;
        }
        const prevMsg = this.messages.find((m) => m.name === message.name);
        if (!prevMsg) {
            console.error(
                `changeUHTML(): Tried to change non-existent uhtml message named ${message.name} for room ${this.name}`,
            );
            return false;
        }
        prevMsg.content = message.content;
        return true;
    }

    private rankSorter = (a: User, b: User) => {
    // the symbols should go first, then the spaces, then the interrobangs
        const aSymbol = a.name.charAt(0) as keyof typeof rankOrder;
        const bSymbol = b.name.charAt(0) as keyof typeof rankOrder;
        if (rankOrder[aSymbol] !== rankOrder[bSymbol]) {
            return rankOrder[bSymbol] - rankOrder[aSymbol];
        }
        return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
    };

    addUser(user: User) {
        this.addUsers([user]);
    }

    addUsers(users: User[]) {
        this.users = this.users.concat(users).filter((user, index, self) =>
            self.findIndex((u) => u.ID === user.ID) === index).sort(this.rankSorter);
    }

    updateUsername(newName: string, userID: string) {
        const user = this.users.find((u) => u.ID === userID);
        if (!user) {
            console.error(
                `updateUsername(): Tried to update username for non-existent user ${userID} in room ${this.name}`,
            );
            return;
        }
        const [name, status] = newName.split('@');
        user.name = name;
        user.status = status;
        this.users = this.users.sort(this.rankSorter);
    }

    runHighlight(callback: (roomID: string, content: string) => boolean): void {
        for (const message of this.messages) {
            if (message.type === 'chat') {
                if (callback(this.ID, message.content)) {
                    message.hld = true;
                }
            }
        }
    }
}
