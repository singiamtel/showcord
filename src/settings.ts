import { Room } from './client/room';
import { cleanRegex, omit } from './utils/generic';

export interface UserDefinedSettings {
    highlightWords: { [key: string]: RegExp[] };
    theme: 'light' | 'dark';
    chatStyle: 'compact' | 'normal'; // compact = IRC style
    avatar: string;
}

export class Settings {
    readonly defaultRooms = [];
    private rooms: Room[] = [];
    userDefinedSettings: UserDefinedSettings = {
    // Only serializable data should be here
        highlightWords: {},
        theme: 'dark',
        chatStyle: 'normal',
        avatar: '',
    };
    // highlightWords: { [key: string]: RegExp[] } = Object.create(null); // roomid -> highlightWords
    // defaultRooms = ["lobby", "help", "overused"];
    private timeout: any;
    private username = '';
    private status = ''; // if status is set, it will be restored on login
    private notes: Map<string, string> = new Map(); // user -> note

    constructor() {
        if (typeof window === 'undefined') {
            return;
        }
        const settingsRaw = localStorage.getItem('settings');
        if (!settingsRaw) {
            return;
        }
        const settings = JSON.parse(settingsRaw);
        if (settings && settings.userDefinedSettings) {
            this.rooms = settings.rooms;
            this.username = settings.username;
            // User defined settings
            this.userDefinedSettings.avatar = settings.userDefinedSettings.avatar;
            if (settings.userDefinedSettings.highlightWords) {
                for (
                    const [key, value] of Object.entries(
                        settings.userDefinedSettings.highlightWords,
                    ) as [
            key: string,
            value: string[],
                    ][]
                ) {
                    this.userDefinedSettings.highlightWords[key] = value.map((
                        w: string,
                    ) => new RegExp(w, 'i'));
                }
            }
        }
    }

    addRoom(room: Room) {
        if (!this.rooms.find((r) => r.ID === room.ID)) {
            this.rooms.push(room);
        }
    }

    updateUsername(username: string, avatar: string) {
        this.username = username;
        this.userDefinedSettings.avatar = avatar;
        this.saveSettings();
    }

    getUserName() {
        return this.username;
    }

    getAvatar() {
        return this.userDefinedSettings.avatar;
    }

    getStatus() {
        return this.status;
    }

    removeRoom(roomid: string) {
        const index = this.rooms.findIndex((r) => r.ID === roomid);
        if (index !== -1) {
            // this.rooms.splice(index, 1);
            this.rooms[index].open = false;
        }
    }

    changeRooms(rooms: Map<string, Room>) {
    // Used to remember which rooms were open when the user logs out
        this.rooms = Array.from(rooms).map((e) => e[1]).filter((e) =>
            e.type === 'chat');
        this.saveSettings();
    }

    getSavedRooms() {
        const settingsRaw = localStorage.getItem('settings');
        if (!settingsRaw) {
            return [];
        }
        const settings = JSON.parse(settingsRaw);
        return settings.rooms as {
            ID: string;
            lastReadTime: Date;
        }[];
    }

    private saveSettings() {
        const nonSerializable = ['highlightWords'] as const;
        const userDefinedSettingsCopy = omit(
            { ...this.userDefinedSettings },
            ...nonSerializable,
        );
        const settings: {
            userDefinedSettings: typeof userDefinedSettingsCopy & {
                highlightWords: { [key: string]: string[] };
            };
            rooms: {
                ID: string;
                lastReadTime: Date;
            }[];
            username: string;
        } = {
            userDefinedSettings: {
                highlightWords: {},
                ...userDefinedSettingsCopy,
            },
            rooms: this.rooms,
            username: this.username,
        };
        for (
            const [key, value] of Object.entries(
                this.userDefinedSettings.highlightWords,
            )
        ) {
            settings.userDefinedSettings.highlightWords[key] = value.map((w) =>
                cleanRegex(w));
        }
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.timeout = setTimeout(async () => {
            console.log('saveSettings', settings);
            localStorage.setItem('settings', JSON.stringify(settings));
        }, 300);
    }

    async addHighlightWord(roomid: string, word: string) {
        if (this.userDefinedSettings.highlightWords[roomid] === undefined) {
            this.userDefinedSettings.highlightWords[roomid] = [];
        }
        const regex = new RegExp(word, 'i');
        this.userDefinedSettings.highlightWords[roomid]?.push(regex);
        this.saveSettings();
    }

    removeHighlightWord(roomid: string, word: string) {
        if (!this.userDefinedSettings.highlightWords[roomid]) {
            console.warn('removeHighlightWord', 'roomid not found', roomid);
            return;
        }
        const regex = new RegExp(word, 'i');
        const words = this.userDefinedSettings.highlightWords[roomid];
        const index = words?.findIndex((w) => w.toString() === regex.toString());
        if (index === undefined || index === -1) {
            console.warn('removeHighlightWord', 'word not found', word);
        } else {
            delete words[index];
        }
    }

    clearHighlightWords(roomid: string) {
        if (!this.userDefinedSettings.highlightWords[roomid]) {
            console.warn('clearHighlightWords', 'roomid not found', roomid);
            return;
        }
        this.userDefinedSettings.highlightWords[roomid] = [];
    }

    highlightMsg(roomid: string, message: string) {
    // Room highlights
        for (const word of this.userDefinedSettings.highlightWords[roomid] ?? []) {
            if (word.test(message)) {
                return true;
            }
        }

        // Global highlights
        for (
            const word of this.userDefinedSettings.highlightWords['global'] ?? []
        ) {
            if (word.test(message)) {
                return true;
            }
        }
        return false;
    }
}
