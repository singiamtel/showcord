export class User {
  name: string;
  ID: string;
  status?: string;
  gauth?: string;
  constructor({ name, ID, status }: { name: string, ID: string, status?: string }) {
    this.name = name;
    this.ID = ID;
    this.status = status
  }
}
