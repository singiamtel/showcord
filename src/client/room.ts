import { Message } from "./message";

export class Room {
  ID: string;
  name: string;
  type: "chat" | "battle";
  messages: Message[] = [];
  constructor(
    { ID, name, type }: { ID: string; name: string; type: "chat" | "battle" },
  ) {
    this.ID = ID;
    this.name = name;
    this.type = type;
  }
  add_message(message: Message) {
    if (this.messages.length > 100) {
      this.messages.shift();
    }
    this.messages.push(message);
  }
}
