import { Message } from "./message";
import { User } from "./user";

export class Room {
  ID: string;
  name: string;
  type: "chat" | "battle";
  messages: Message[] = [];
  users: User[] = [];
  constructor(
    { ID, name, type }: { ID: string; name: string; type: "chat" | "battle" },
  ) {
    this.ID = ID;
    this.name = name;
    this.type = type;
  }
  addMessage(message: Message) {
    if (this.messages.length > 100) {
      this.messages.shift();
    }
    this.messages.push(message);
  }
  addUser(user: User) {
    this.addUsers([user]);
  }

  private rankOrder: any = {
    '&': 8,
    '#': 7,
    '\u00a7': 6,
    '@': 5,
    '%': 4,
    '*': 3,
    '+': 2,
    '^': 1,
  }

  private rankSorter = (a:User, b:User) => {
    const parsedA = this.rankOrder[a.name.slice(0,1)] || a.name[0]
    const parsedB = this.rankOrder[b.name.slice(0,1)] || b.name[0]
    return parsedB - parsedA ? parsedB - parsedA : a.name.localeCompare(b.name)
  }

  addUsers(users: User[]) {
    this.users = this.users.concat(users).sort(this.rankSorter)
  }
}
