export class Message {
  content: string;
  type: "chat" | "raw";
  user?: string;
  ID?: string;
  timestamp: Date;
  constructor(
    { content, type, ID, user, timestamp }: {
      content: string;
      type: "chat" | "raw";
      user?: string;
      ID?: string;
      timestamp: string;
    },
  ) {
    this.content = content;
    this.type = type;
    this.user = user;
    this.ID = ID;
    // this.timestamp = timestamp ? new Date(timestamp) : undefined;
    console.log('converted timestamp: ' + timestamp)
    this.timestamp = new Date(Number(timestamp) * 1000);
  }
}
