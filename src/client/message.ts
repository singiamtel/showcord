export class Message {
  content: string;
  type: "chat" | "raw";
  user?: string;
  timestamp: Date;
  constructor(
    { content, type, user, timestamp }: {
      content: string;
      type: "chat" | "raw";
      user?: string;
      timestamp: string;
    },
  ) {
    this.content = content;
    this.type = type;
    this.user = user;
    // this.timestamp = timestamp ? new Date(timestamp) : undefined;
    console.log('converted timestamp: ' + timestamp)
    this.timestamp = new Date(Number(timestamp) * 1000);
  }
}
