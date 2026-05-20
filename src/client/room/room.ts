import { toID } from '@/utils/generic';
import { rankOrder, type RankSymbol, type User } from '../user';
import { useRoomStore } from '../stores/roomStore';
import { useMessageStore } from '../stores/messageStore';

export const roomTypes = ['chat', 'battle', 'pm', 'permanent', 'html'] as const;
export type RoomType = typeof roomTypes[number];

export class Room {
    type: RoomType;
    ID: string;
    name: string;
    connected = false;
    open = false;
    users: User[] = [];
    private lastSentMessages: string[] = [];
    private readonly lastSentMessageLimit = 25;
    private prevIndex = 0;

    constructor(
        { ID, name, type, connected, open }: {
            ID: string;
            name: string;
            type: RoomType;
            connected: boolean;
            open: boolean;
        },
    ) {
        this.ID = ID;
        this.name = name;
        this.type = type;
        this.connected = connected;
        this.open = open;
    }

    historyPrev() {
        if (this.prevIndex === 0) {
            return '';
        }
        return this.lastSentMessages[--this.prevIndex];
    }

    historyNext() {
        if (this.prevIndex === this.lastSentMessages.length) {
            return '';
        }
        return this.lastSentMessages[++this.prevIndex];
    }

    select() {
        this.prevIndex = this.lastSentMessages.length;
    }

    send(message: string) {
        this.lastSentMessages.push(message);
        if (this.lastSentMessages.length > this.lastSentMessageLimit) {
            this.lastSentMessages.shift();
        }
        this.prevIndex = this.lastSentMessages.length;
    }

    removeUser(username: string) {
        this.users = this.users.filter((u) => u.name !== username);
        useRoomStore.getState().notifyUsersUpdate();
    }

    rename(name: string) {
        this.name = name;
    }

    private rankSorter = (a: User, b: User) => {
        const aSymbol = a.name.charAt(0) as RankSymbol;
        const bSymbol = b.name.charAt(0) as RankSymbol;
        if (rankOrder[aSymbol] !== rankOrder[bSymbol]) {
            const result = rankOrder[bSymbol] - rankOrder[aSymbol];
            if (!isNaN(result)) {
                return result;
            }
        }
        return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
    };

    addUser(user: User) {
        this.addUsers([user]);
    }

    addUsers(users: User[]) {
        this.users = this.users.concat(users).filter((user, index, self) =>
            self.findIndex((u) => u.ID === user.ID) === index).sort(this.rankSorter);
        useRoomStore.getState().notifyUsersUpdate();
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
        user.ID = toID(name);
        user.status = status;
        this.users.sort(this.rankSorter);
        useRoomStore.getState().notifyUsersUpdate();
    }

    clearNotifications() {
        useMessageStore.getState().selectRoom(this.ID);
    }
}
