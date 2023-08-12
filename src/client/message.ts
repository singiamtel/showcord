export class Message{
  content: string;
  type: 'chat' | 'raw';
  roomID?: string;
  ID?: string;
  constructor({ content, type, ID, roomID }: {content: string, type: 'chat' | 'raw', roomID?: string, ID?: string}){
    this.content = content;
    this.type = type;
    this.roomID = roomID;
    this.ID = ID
  }
}
