export class Message {
  content: string;
  type: "chat" | "raw" | "log";
  user?: string;
  timestamp?: Date;
  hld?: boolean;
  constructor(
    { content, type, user, timestamp, hld = false }: {
      content: string;
      type: "chat" | "raw" | "log"
      user?: string;
      timestamp?: string;
      hld?: boolean 
    },
  ) {
    this.content = content;
    this.type = type;
    this.user = user;
    // this.timestamp = timestamp ? new Date(timestamp) : undefined;
    if(timestamp) this.timestamp = new Date(Number(timestamp) * 1000);
    this.hld = hld;
  }
}
