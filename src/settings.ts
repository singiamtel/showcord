import localForage from "localforage";
import { Room } from "./client/room";

export class Settings {
  rooms: { ID: string; lastReadTime: Date }[] = [];
  highlightWords: Map<string, RegExp[]> = new Map(); // roomid -> highlightWords
  defaultRooms = [];
  // defaultRooms = ["lobby", "help", "overused"];
  URL = location.origin;
  private timeout: any;
  status = ""; // if status is set, it will be restored on login
  notes: Map<string, string> = new Map(); // user -> note

  constructor() {
    this.loadSettings();
  }

  changeRooms(rooms: Map<string, Room>) {
    this.rooms = Array.from(rooms).filter((e) => e[1].type === "chat").map((
      r,
    ) => ({ ID: r[1].ID, lastReadTime: r[1].lastReadTime }));
    if (this.rooms.length !== 0) {
      this.saveSettings();
    }
  }

  async getSavedRooms() {
    return (await localForage.getItem("settings") as any)?.rooms as {
      ID: string;
      lastReadTime: Date;
    }[];
  }

  async saveSettings() {
    const settings = {
      highlightWords: this.highlightWords,
      rooms: this.rooms,
    };
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(async () => {
      console.log("saveSettings", settings);
      await localForage.setItem("settings", settings);
    }, 2500);
  }

  async loadSettings() {
    const settings: any = await localForage.getItem("settings");
    console.log("loadSettings", settings);
    if (settings) {
      this.highlightWords = settings.highlightWords;
      this.rooms = settings.rooms;
    }
    console.log("loadSettings", this.rooms);
  }

  async addHighlightWord(roomid: string, word: string) {
    if (!this.highlightWords.has(roomid)) {
      this.highlightWords.set(roomid, []);
    }
    const regex = new RegExp(word, "i");
    this.highlightWords.get(roomid)?.push(regex);
    await this.saveSettings();
  }

  async removeHighlightWord(roomid: string, word: string) {
    if (!this.highlightWords.has(roomid)) {
      console.warn("removeHighlightWord", "roomid not found", roomid);
      return;
    }
    const regex = new RegExp(word, "i");
    const words = this.highlightWords.get(roomid);
    const index = words?.findIndex((w) => w.toString() === regex.toString());
    if (index === undefined || index === -1) {
      console.warn("removeHighlightWord", "word not found", word);
    } else {
      this.highlightWords.get(roomid)?.splice(index, 1);
    }
  }

  highlightMsg(roomid: string, message: string) {
    // Room highlights
    this.highlightWords.get(roomid)?.forEach((word) => {
      if (word.test(message)) {
        console.log("word", word, "matched message", message);
        return true;
      }
    });

    // Global highlights
    this.highlightWords.get("global")?.forEach((word) => {
      if (word.test(message)) {
        console.log("word", word, "matched message", message);
        return true;
      }
    });
    return false;
  }
}
