export class User {
  name: string;
  status?: string;
  gauth?: string;
  constructor({ name, status }: { name: string; status: string }) {
    this.name = name;
    this.status = status
  }
}
