import { Room } from './client/room';
import { cleanRegex } from './utils/generic';

export class Settings {
    readonly defaultRooms = [];
    private rooms: { ID: string; lastReadTime: Date }[] = [];
    highlightWords: { [key: string]: RegExp[] } = Object.create(null); // roomid -> highlightWords
    // defaultRooms = ["lobby", "help", "overused"];
    private timeout: any;
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
        console.log('loaded settings', settings);
        if (settings) {
            for (
                const [key, value] of Object.entries(settings.highlightWords) as [
          key: string,
          value: string[],
                ][]
            ) {
                this.highlightWords[key] = value.map((w: string) => new RegExp(w, 'i'));
            }
            // this.highlightWords = {};
            this.rooms = settings.rooms;
        }
    // Notification.requestPermission((result) => {
    //   console.log(result);
    // });
    }

    changeRooms(rooms: Map<string, Room>) {
        this.rooms = Array.from(rooms).filter((e) => e[1].type === 'chat').map((
            r,
        ) => ({ ID: r[1].ID, lastReadTime: r[1].lastReadTime }));
        if (this.rooms.length !== 0) {
            this.saveSettings();
        }
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
        const settings: {
            highlightWords: any;
            rooms: {
                ID: string;
                lastReadTime: Date;
            }[];
        } = {
            highlightWords: {},
            rooms: this.rooms,
        };
        for (const [key, value] of Object.entries(this.highlightWords)) {
            settings.highlightWords[key] = value.map((w) => cleanRegex(w));
        }
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.timeout = setTimeout(async () => {
            console.log('saveSettings', settings);
            localStorage.setItem('settings', JSON.stringify(settings));
        }, 3000);
    }

    async addHighlightWord(roomid: string, word: string) {
        if (this.highlightWords[roomid] === undefined) {
            this.highlightWords[roomid] = [];
        }
        const regex = new RegExp(word, 'i');
        this.highlightWords[roomid]?.push(regex);
        this.saveSettings();
    }

    removeHighlightWord(roomid: string, word: string) {
        if (!this.highlightWords[roomid]) {
            console.warn('removeHighlightWord', 'roomid not found', roomid);
            return;
        }
        const regex = new RegExp(word, 'i');
        const words = this.highlightWords[roomid];
        const index = words?.findIndex((w) => w.toString() === regex.toString());
        if (index === undefined || index === -1) {
            console.warn('removeHighlightWord', 'word not found', word);
        } else {
            delete words[index];
        }
    }

    clearHighlightWords(roomid: string) {
        if (!this.highlightWords[roomid]) {
            console.warn('clearHighlightWords', 'roomid not found', roomid);
            return;
        }
        this.highlightWords[roomid] = [];
    }

    highlightMsg(roomid: string, message: string) {
        // Room highlights
        for (const word of this.highlightWords[roomid] ?? []) {
            if (word.test(message)) {
                return true;
            }
        }

        // Global highlights
        for (const word of this.highlightWords['global'] ?? []) {
            if (word.test(message)) {
                return true;
            }
        }
        return false;
    }
}
