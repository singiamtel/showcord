export class Message{
  content: string;
  type: 'chat' | 'raw';
  user?: string;
  ID?: string;
  constructor({ content, type, ID, user }: {content: string, type: 'chat' | 'raw', user?: string, ID?: string}){
    this.content = content;
    this.type = type;
    this.user = user;
    this.ID = ID
  }
}
