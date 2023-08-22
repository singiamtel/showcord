import localForage from "localforage";
import { Room } from "./client/room";

export class Settings {
  rooms: string[] = [];
  highlightWords: Map<string, RegExp[]> = new Map(); // roomid -> highlightWords
  defaultRooms = ["lobby", "help", "overused"];
  URL = location.origin;
  private timeout: any;
  status = ""; // if status is set, it will be restored on login
  notes: Map<string, string> = new Map(); // user -> note

  constructor() {
    this.loadSettings();
  }

  changeRooms(rooms: Room[]) {
    this.rooms = rooms.map((r) => r.ID);
    this.saveSettings();
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
    }, 1000);
  }

  async loadSettings() {
    const settings: any = await localForage.getItem("settings");
    console.log("loadSettings", settings);
    if (settings) {
      this.highlightWords = settings.highlightWords;
      this.rooms = settings.rooms;
    }
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
