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
    readonly defaultRooms = []; // ["lobby", "help", "overused"];
    readonly defaultServerURL = 'wss://sim3.psim.us:443/showdown/websocket';
    readonly defaultLoginServerURL = 'https://play.pokemonshowdown.com/api/';
    readonly version = 2; // used to invalidate settings when the format changes
    private rooms: SerializedRoom[] = [];
    /** Only serializable data should be here */

    theme: 'dark' | 'light' = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    private userDefinedSettings: UserDefinedSettings = {
        highlightWords: {},
        chatStyle: 'normal',
        avatar: '',
        serverURL: this.defaultServerURL,
        loginserverURL: this.defaultLoginServerURL,
        highlightOnSelf: true,
    };
    private compileHighlightWords: { [key: string]: RegExp | null } = {};
    private name = '';
    private status = ''; // if status is set, it will be restored on login
    private notes: Map<string, string> = new Map();

    get username(): string {
        return this.name;
    }

    updateUser(username: string, avatar: string) {
        this.name = username;
        this.userDefinedSettings.avatar = avatar;
        this.saveSettings();
    }

    get avatar() {
        return this.userDefinedSettings.avatar;
    }

    set avatar(avatar: string) {
        this.userDefinedSettings.avatar = avatar;
        this.saveSettings();
    }

    set username(username: string) {
        this.name = username;
        this.saveSettings();
    }

    get userID() {
        return toID(this.name);
    }

    constructor() {
        if (typeof window === 'undefined') {
            return;
        }
        const theme = localStorage.getItem('theme');
        if (theme) {
            console.assert(theme === 'dark' || theme === 'light', 'Invalid theme', theme);
            this.theme = theme as 'dark' | 'light';
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
            settings.rooms.forEach((r) => {
                this.rooms.push(r);
            });
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
            this.rooms.push(room);
        }
    }

    getAvatar() {
        return this.userDefinedSettings.avatar;
    }

    getStatus() {
        return this.status;
    }

    setStatus(status: string) {
        this.status = status;
    }

    getTheme() {
        return this.theme;
    }

    setTheme(theme: 'light' | 'dark') {
        this.theme = theme;
        this.saveSettings();
    }

    getServerURL() {
        return this.userDefinedSettings.serverURL || this.defaultServerURL;
    }
    getLoginServerURL() {
        return this.userDefinedSettings.loginserverURL || this.defaultLoginServerURL;
    }
    setServerURLs(serverURL: string, loginserverURL: string) {
        this.userDefinedSettings.serverURL = serverURL;
        this.userDefinedSettings.loginserverURL = loginserverURL;
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
        }[] ?? [];
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
        // this.userDefinedSettings.highlightWords[roomid]?.push(word);
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
