import { Message } from "./message";
import { User } from "./user";

export class Room {
  ID: string;
  name: string;
  type: "chat" | "battle";
  messages: Message[] = [];
  users: User[] = [];
  unread = 0;
  lastReadTime : Date = new Date();
  mentions = 0;
  private messageLimit = 600;

  constructor(
    { ID, name, type }: { ID: string; name: string; type: "chat" | "battle"} 
  ) {
    this.ID = ID;
    this.name = name;
    this.type = type;
  }

  addMessage(message: Message, selected: boolean) {
    if (this.messages.length > this.messageLimit){
      this.messages.shift();
    }
    if(selected){
      this.lastReadTime = new Date();
    }
    if(message.timestamp && message.timestamp > this.lastReadTime){
      this.unread++;
      if(message.hld){
        this.mentions++;
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

  private rankOrder: any = {
    '&': 9,
    '#': 8,
    '\u00a7': 7,
    '@': 6,
    '%': 5,
    '*': 4,
    '+': 3,
    '^': 2,
    ' ': 1,
    '‽': 0,
  }

  private rankSorter = (a:User, b:User) => {
    // the symbols should go first, then the spaces, then the interrobangs
    const aSymbol = a.name.charAt(0)
    const bSymbol = b.name.charAt(0)
    if (this.rankOrder[aSymbol] !== this.rankOrder[bSymbol]) {
      return this.rankOrder[bSymbol] - this.rankOrder[aSymbol]
    }
    return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
  }

  addUsers(users: User[]) {
    this.users = this.users.concat(users).sort(this.rankSorter)
  }

  select() {
    this.lastReadTime = new Date();
    this.mentions = 0;
    this.unread = 0;
  }
}
