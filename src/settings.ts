import localForage from "localforage";
import { Room } from "./client/room";

export class Settings {
  rooms: string[] = [];
  highlightWords: Map<string, string[]> = new Map(); // roomid -> highlightWords
  defaultRooms = ["lobby", "help", "overused"];
  private timeout: any;

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
    const settings:any = await localForage.getItem("settings");
    console.log("loadSettings", settings);
    if (settings) {
      this.highlightWords = settings.highlightWords;
      this.rooms = settings.rooms;
    }
  }
}
