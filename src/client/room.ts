import { Message } from "./message";

export class Room {
  ID: string;
  title: string;
  type: "chat" | "battle";
  messages: Message[] = [];
  constructor(
    { ID, title, type }: { ID: string; title: string; type: "chat" | "battle" },
  ) {
    this.ID = ID;
    this.title = title;
    this.type = type;
  }
  add_message(message: Message) {
    if (this.messages.length > 100) {
      this.messages.shift();
    }
    this.messages.push(message);
  }
}
