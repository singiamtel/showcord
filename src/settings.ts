import { Room } from "./client/room";

export class Settings {
  rooms: { ID: string; lastReadTime: Date }[] = [];
  highlightWords: { [key: string]: RegExp[] } = Object.create(null); // roomid -> highlightWords
  defaultRooms = [];
  // defaultRooms = ["lobby", "help", "overused"];
  private timeout: any;
  status = ""; // if status is set, it will be restored on login
  notes: Map<string, string> = new Map(); // user -> note

  constructor() {
    // this.loadSettings();

    const settingsRaw = localStorage.getItem("settings");
    if (!settingsRaw) {
      return;
    }
    const settings = JSON.parse(settingsRaw);
    console.log("loadSettings", settings);
    if (settings) {
      for (const [key, value] of Object.entries(settings.highlightWords) as [key:string, value: string[]][]){
        this.highlightWords[key] = value.map((w: string) => new RegExp(w));
      }
      this.highlightWords = {};
      console.log("AWD SAVED ROOMS", settings.rooms);
      this.rooms = settings.rooms;
    }
    console.log("AWD loadSettings rooms", this.rooms);
    console.log("AWD constructor finished");
    // Notification.requestPermission((result) => {
    //   console.log(result);
    // });
  }

  changeRooms(rooms: Map<string, Room>) {
    this.rooms = Array.from(rooms).filter((e) => e[1].type === "chat").map((
      r,
    ) => ({ ID: r[1].ID, lastReadTime: r[1].lastReadTime }));
    if (this.rooms.length !== 0) {
      this.saveSettings();
    }
  }

  getSavedRooms() {
    const settingsRaw = localStorage.getItem("settings");
    if (!settingsRaw) {
      return [];
      }
    const settings = JSON.parse(settingsRaw);
    return settings.rooms as {
      ID: string;
      lastReadTime: Date;
    }[];
  }

  saveSettings() {
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
      settings.highlightWords[key] = value.map((w) => w.toString());
    }
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(async () => {
      console.log("saveSettings", settings);
      localStorage.setItem("settings", JSON.stringify(settings));
    }, 1500);
  }

  async addHighlightWord(roomid: string, word: string) {
    if (this.highlightWords[roomid] === undefined) {
      this.highlightWords[roomid] = [];
    }
    const regex = new RegExp(word, "i");
    this.highlightWords[roomid]?.push(regex);
    this.saveSettings();
  }

  async removeHighlightWord(roomid: string, word: string) {
    if (!this.highlightWords[roomid]) {
      console.warn("removeHighlightWord", "roomid not found", roomid);
      return;
    }
    const regex = new RegExp(word, "i");
    const words = this.highlightWords[roomid];
    const index = words?.findIndex((w) => w.toString() === regex.toString());
    if (index === undefined || index === -1) {
      console.warn("removeHighlightWord", "word not found", word);
    } else {
      delete words[index];
    }
  }

  highlightMsg(roomid: string, message: string) {
    // Room highlights
    this.highlightWords[roomid]?.forEach((word) => {
      if (word.test(message)) {
        console.log("word", word, "matched message", message);
        return true;
      }
    });

    // Global highlights
    this.highlightWords["global"]?.forEach((word) => {
      if (word.test(message)) {
        console.log("word", word, "matched message", message);
        return true;
      }
    });
    return false;
  }
}
