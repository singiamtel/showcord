import { toID } from '@/utils/generic';
import { highlightMsg, stringsToRegex } from '../utils/highlightMsg';
import { Room } from './room/room';

export interface UserDefinedSettings {
    highlightWords: { [key: string]: string[] };
    // compact = IRC style
    chatStyle: 'compact' | 'normal'; // TODO: implement normal style
    avatar: string;
    serverURL: string;
    loginserverURL: string;
    highlightOnSelf: boolean;
}

export type SerializedRoom = {
    ID: string;
    lastReadTime: Date;
    open: boolean;
};

export type SavedSettings = {
    version: number;
    rooms: SerializedRoom[];
    username: string;
    userDefinedSettings: UserDefinedSettings;
}

export class Settings {
    static readonly defaultRooms = [];
    static readonly defaultServerURL = 'wss://sim3.psim.us:443/showdown/websocket';
    static readonly defaultLoginServerURL = 'https://play.pokemonshowdown.com/api/';
    static readonly defaultNewsURL = 'https://pokemonshowdown.com/news.json';

    readonly version = 2; // used to invalidate settings when the format changes
    rooms: SerializedRoom[] = [];
    /** Only serializable data should be here, as it saves directly to localStorage */
    private userDefinedSettings: UserDefinedSettings = {
        highlightWords: {},
        chatStyle: 'normal',
        avatar: '',
        serverURL: Settings.defaultServerURL,
        loginserverURL: Settings.defaultLoginServerURL,
        highlightOnSelf: true,
    };

    private compileHighlightWords: { [key: string]: RegExp | null } = {};
    private name = '';
    private notes: Map<string, string> = new Map();

    get username(): string { return this.name; }

    set username(username: string) {
        this.name = username;
    }

    get avatar() { return this.userDefinedSettings.avatar; }

    set avatar(avatar: string) {
        this.userDefinedSettings.avatar = avatar;
        this.saveSettings();
    }

    get userID() { return toID(this.name); }

    private __theme: 'light' | 'dark' | 'system' = 'system';
    get theme() { return this.__theme; }
    set theme(theme: 'light' | 'dark' | 'system') {
        this.__theme = theme;
        localStorage.setItem('theme', theme);
    }

    private __status = '';
    get status() { return this.__status; }
    set status(status: string) { this.__status = status; }

    get serverURL() {
        return this.userDefinedSettings.serverURL || Settings.defaultServerURL;
    }

    set serverURL(serverURL: string) {
        this.userDefinedSettings.serverURL = serverURL;
        this.saveSettings();
    }

    get loginServerURL() {
        return this.userDefinedSettings.loginserverURL || Settings.defaultLoginServerURL;
    }

    set loginServerURL(loginServerURL: string) {
        this.userDefinedSettings.loginserverURL = loginServerURL;
        this.saveSettings();
    }

    getHighlightWords(roomid: string) {
        return this.userDefinedSettings.highlightWords[roomid] ?? [];
    }

    getHighlightWordsMap() {
        return this.userDefinedSettings.highlightWords;
    }

    setHighlightWords(roomid: string, words: string[]) {
        this.userDefinedSettings.highlightWords[roomid] = [...new Set(words)];

        const strings = this.userDefinedSettings.highlightWords[roomid] ?? [];
        if (this.username && this.userDefinedSettings.highlightOnSelf) {
            strings.push(this.username);
        }
        this.compileHighlightWords[roomid] = stringsToRegex(strings);
        this.saveSettings();
    }

    getHighlightOnSelf() {
        return this.userDefinedSettings.highlightOnSelf;
    }

    setHighlightOnSelf(highlightOnSelf: boolean) {
        this.userDefinedSettings.highlightOnSelf = highlightOnSelf;
        this.saveSettings();
    }

    constructor() {
        if (typeof window === 'undefined') {
            return;
        }
        const theme = localStorage.getItem('theme');
        if (theme) {
            console.assert(theme === 'dark' || theme === 'light' || theme === 'system', 'Invalid theme', theme);
            this.theme = theme as 'light' | 'dark' | 'system';
        }
        const settingsRaw = localStorage.getItem('settings');
        if (!settingsRaw) {
            return;
        }
        try {
            const settings = JSON.parse(settingsRaw) as SavedSettings;
            if (settings.version !== this.version) {
                throw new Error('Settings version mismatch');
            }
            this.rooms = settings.rooms;
            this.name = settings.username;
            const userDefinedSettings = settings.userDefinedSettings;
            if (userDefinedSettings) {
                this.userDefinedSettings = userDefinedSettings;
            }
            if (this.userDefinedSettings.highlightWords) {
                for (const roomid in this.userDefinedSettings.highlightWords) {
                    const strings = this.userDefinedSettings.highlightWords[roomid] ?? [];
                    if (this.username && this.userDefinedSettings.highlightOnSelf) {
                        strings.push(this.username);
                    }
                    this.compileHighlightWords[roomid] = stringsToRegex(strings);
                }
            }
        } catch (e) {
            console.error('Corrupted settings, removing...', e, settingsRaw);
            localStorage.removeItem('settings');
        }
    }

    updateUser(username: string, avatar: string) {
        this.name = username;
        this.userDefinedSettings.avatar = avatar;
        this.saveSettings();
    }

    private saveSettings() {
        const savedSettings : SavedSettings = {
            version: this.version,
            rooms: this.rooms,
            username: this.username,
            userDefinedSettings: this.userDefinedSettings,
        };
        try {
            localStorage.setItem('settings', JSON.stringify(savedSettings));
        } catch (e) {
            console.error('Error saving settings', e, savedSettings);
        }
        localStorage.setItem('theme', this.theme);
    }


    addRoom(room: Room) {
        if (!this.rooms.find((r) => r.ID === room.ID)) {
            this.rooms = [...this.rooms, { ID: room.ID, lastReadTime: new Date(), open: true }];
        }
        this.saveSettings();
    }


    removeRoom(roomid: string) {
        const index = this.rooms.findIndex((r) => r.ID === roomid);
        if (index !== -1) {
            this.rooms[index].open = false;
        }
        this.saveSettings();
    }

    changeRooms(rooms: Map<string, Room>) {
    // Used to remember which rooms were open when the user logs out
        this.rooms = Array.from(rooms).filter((e) => e[1].type === 'chat').map((e) => ({
            ID: e[1].ID,
            lastReadTime: e[1].lastReadTime,
            open: e[1].open,
        }));
        this.saveSettings();
    }

    logout() {
        localStorage.removeItem('ps-token');
        this.username = '';
        this.saveSettings();
    }

    addHighlightWord(roomid: string, word: string) {
        if (this.userDefinedSettings.highlightWords[roomid] === undefined) {
            this.userDefinedSettings.highlightWords[roomid] = [];
        }
        this.setHighlightWords(roomid, [...this.userDefinedSettings.highlightWords[roomid], word]);
        this.saveSettings();
    }

    removeHighlightWord(roomid: string, word: string) {
        if (!this.userDefinedSettings.highlightWords[roomid]) {
            console.warn('removeHighlightWord', 'roomid not found', roomid);
            return;
        }
        const words = this.userDefinedSettings.highlightWords[roomid];
        const index = words?.findIndex((w) => w === word);
        if (index === undefined || index === -1) {
            console.warn('removeHighlightWord', 'word not found', word);
        } else {
            // delete words[index];
            this.setHighlightWords(roomid, words.filter((w) => w !== word));
            if (this.userDefinedSettings.highlightWords[roomid].length === 0) {
                delete this.userDefinedSettings.highlightWords[roomid];
            }
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
        if (!this.compileHighlightWords[roomid]) {
            const strings = this.userDefinedSettings.highlightWords[roomid] ?? [];
            if (this.username && this.userDefinedSettings.highlightOnSelf) {
                strings.push(this.username);
            }
            this.compileHighlightWords[roomid] = stringsToRegex(strings);
        }
        if (highlightMsg(this.compileHighlightWords[roomid], message)) {
            return true;
        }
        if (this.compileHighlightWords['global']) {
            return highlightMsg(this.compileHighlightWords['global'], message);
        }
        return false;
    }
}
