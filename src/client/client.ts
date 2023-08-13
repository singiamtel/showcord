import { Message } from "./message";
import { Room } from "./room";
import { User } from "./user";

export class Client {
  // socket
  socket: WebSocket;
  server_url: string = "wss://sim3.psim.us/showdown/websocket";
  loginserver_url: string = "https://play.pokemonshowdown.com/api/";
  challstr: string = "";
  rooms: Room[] = [];
  events: EventTarget = new EventTarget();

  constructor() {
    this.socket = new WebSocket(this.server_url);
    this.socket.onopen = function () {
    };
    this.socket.onmessage = (event) => {
      this.parse_message(event.data);
    };
  }

  async parse_message(message: string) {
    if (message.startsWith("|challstr|")) {
      const splitted_challstr = message.split("|");
      splitted_challstr.shift();
      splitted_challstr.shift();
      this.challstr = splitted_challstr.join("|");
    }
    if (/\n/g.test(message)) {
      const splitted_message = message.split("\n");
      const roomID = splitted_message[0];
      const [_, cmd, ...args] = splitted_message[1].split("|");
      if (splitted_message.length === 2) {
        /*
          Messages that are two lines:
            - any message linked to a room
        */
        switch (cmd) {
          case "c:":
            // th
            const room = this.room(roomID);
            if(!room){
              console.log("room not found (" + roomID + ")");
              return;
            }
            this.addMessage(roomID,
              new Message({ ID: roomID, type: "chat", content: args[2], user: args[1] })
            );
        }
      } else {
        /*
          Messages that can be more than two lines:
            - init room
            - chat message
            - update user
        */
        switch (cmd) {
          case "init":
            let type = '', didType = false, name = '', didName = false, id = '', didID = false, room = null;
            let users : User[] = [];
            for (let i = 2; i < splitted_message.length; i++) { // start at 2 because first line is room id and second line is cmd
              if (splitted_message[i] === "") continue;
              if (!didType && splitted_message[i].startsWith("|init|")) {
                type = splitted_message[i].split("|")[2];
                if(type !== "chat" && type !== "battle") {
                  console.log("room type not supported (" + type + "), room id: " + roomID);
                }
                didType = true;
                continue;
              }
              if (!didName && splitted_message[i].startsWith("|title|")) {
                name = splitted_message[i].slice(7);
                didName = true;
                continue;
              }
              if (splitted_message[i].startsWith("|users|")) {
                const parsedUsers = splitted_message[i].split("|")[2].split(",");
                users = parsedUsers.map((tmpuser) => {
                  const [user, status] = tmpuser.slice(1).split("@");
                  return new User({ name: tmpuser.slice(0,1) + user, status })
                })
                users.shift();
                continue;
              }
              if(!didID && splitted_message[i].startsWith('|:|')){
                id = splitted_message[i].slice(3);
                didID = true;
                room = new Room({ID: roomID, name: name, type: (type as "chat" | "battle")})
                this.addRoom(room)
                this.addUsers(roomID, users)
                continue;
              }
              if(splitted_message[i].startsWith('|c:|')){
                const [_, _2, msgID, user, message] = splitted_message[i].split("|")
                this.addMessage(roomID, new Message({user, type: "chat", content: message, ID: msgID}))
              }
              else{
                console.log("unknown init message: " + splitted_message[i]);
              }
            }
        }
      }
    } else {
      const splitted_message = message.split("|");
    }
  }

  room(room_id: string) {
    return this.rooms.find((room) => room.ID === room_id);
  }


  addRoom(room: Room) {
    this.rooms.push(room);
    const eventio = new CustomEvent("room", { detail: room })
    this.events.dispatchEvent(eventio);
  }

  addMessage(room_id: string, message: Message) {
    const room = this.room(room_id);
    if (room){
      room.addMessage(message);
      this.events.dispatchEvent(new CustomEvent("message", { detail: message }));
      return
    }
    console.log("room (" + room_id + ") does not exist");
  }

  addUsers(room_id: string, users: User[]) {
    const room = this.room(room_id);
    if (room) {
      room.addUsers(users);
      this.events.dispatchEvent(new CustomEvent("users", { detail: users }));
      return
    }
    console.log("room (" + room_id + ") does not exist");
  }


  async login({ username, password }: { username: string; password: string }) {
    while (!this.challstr) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    const response = await fetch(
      `${this.loginserver_url}login?name=${username}&pass=${password}&challstr=${this.challstr}&sid=1`,
      {
        method: "POST",
      },
    );
    const response_test = await response.text();
    const response_json = JSON.parse(response_test.slice(1));

    this.socket.send(`|/trn ${username},0,${response_json.assertion}`);
    this.socket.send(`|/join botdevelopment`);
    this.socket.send(`|/join techcode`);
  }
}
