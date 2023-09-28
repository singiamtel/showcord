import { Message } from "./message";
import { User } from "./user";

export const roomTypes = ["chat", "battle", "pm", "permanent"] as const;
export type RoomType = typeof roomTypes[number];

export class Room {
  ID: string;
  name: string;
  type: RoomType;
  messages: Message[] = [];
  users: User[] = [];
  unread = 0;
  lastReadTime: Date = new Date();
  mentions = 0;
  private messageLimit = 600;
  icon?: JSX.Element;

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

  addMessage(
    message: Message,
    { selected, selfSent }: { selected: boolean; selfSent: boolean },
  ) {
    if (this.messages.length > this.messageLimit) {
      this.messages.shift();
    }
    if (selected) {
      const date = new Date();
      date.setSeconds(date.getSeconds() + 1); // Some margin of error
      this.lastReadTime = date;
    }
    if (
      message.type === "chat" && !selfSent && message.timestamp &&
      message.timestamp > this.lastReadTime
    ) {
      this.unread++;
      if (message.hld) {
        this.mentions++;
        if (!selected || !document.hasFocus()) {
          // message.hld = false;
          new Notification(`Private message from ${message.user}`, {
            body: message.content,
            icon: "/static/favicon.png",
          });
        }
      }
    }
    this.messages.push(message);
  }

  addUser(user: User) {
    this.addUsers([user]);
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
      console.log("Removing previous UHTML message with name ", message.name);
      this.messages.splice(this.messages.indexOf(previousMessage), 1);
    }
    console.log("Adding new UHTML message with name ", message.name);
    this.addMessage(message, { selected, selfSent });
  }

  changeUHTML(HTMLname: string, html: string) {
    const message = this.messages.find((m) => m.name === HTMLname);
    if (!message) {
      console.error(
        `changeUHTML(): Tried to change non-existent uhtml message named ${HTMLname} for room ${this.name}`,
      );
      return;
    }
    message.content = html;
  }

  private rankOrder: any = {
    "&": 9,
    "#": 8,
    "\u00a7": 7,
    "@": 6,
    "%": 5,
    "*": 4,
    "+": 3,
    "^": 2,
    " ": 1,
    "‽": 0,
  };

  private rankSorter = (a: User, b: User) => {
    // the symbols should go first, then the spaces, then the interrobangs
    const aSymbol = a.name.charAt(0);
    const bSymbol = b.name.charAt(0);
    if (this.rankOrder[aSymbol] !== this.rankOrder[bSymbol]) {
      return this.rankOrder[bSymbol] - this.rankOrder[aSymbol];
    }
    return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
  };

  addUsers(users: User[]) {
    this.users = this.users.concat(users).sort(this.rankSorter);
  }

  updateUsername(newName: string, userID: string) {
    const user = this.users.find((u) => u.ID === userID);
    if (!user) {
      console.error(
        `updateUsername(): Tried to update username for non-existent user ${userID} in room ${this.name}`,
      );
      return;
    }
    const [name, status] = newName.split("@");
    user.name = name;
    user.status = status;
    this.users = this.users.sort(this.rankSorter);
  }

  select() {
    this.lastReadTime = new Date();
    this.mentions = 0;
    this.unread = 0;
  }
}
