import { Message } from "./message";
import { Room } from "./room";

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
      console.log("this.rooms", this.rooms);
    };
  }

  async parse_message(message: string) {
    // console.log(message);
    if (message.startsWith("|challstr|")) {
      const splitted_challstr = message.split("|");
      splitted_challstr.shift();
      splitted_challstr.shift();
      this.challstr = splitted_challstr.join("|");
    }
    if (/\n/g.test(message)) {
      console.log("message is multiline");
      console.log(message);
      const splitted_message = message.split("\n");
      const roomID = splitted_message[0];
      const [_, cmd, ...args] = splitted_message[1].split("|");
      if (splitted_message.length === 2) {
        /*
          Messages that are two lines:
            - any message linked to a room
        */
        console.log("room_id", roomID);
        console.log("cmd", cmd);
        console.log("args", args);
        switch (cmd) {
          case "c:":
            // th
            this.events.dispatchEvent(
              new CustomEvent("chat", { detail: { room_id: roomID, args } }),
            );
            const room = this.rooms.find((room) => room.ID === roomID);
            if(!room){
              console.log("room not found (" + roomID + ")");
              return;
            }
            room?.add_message(
              new Message({ roomID, type: "chat", content: args[3] }),
            );
            console.log("room", room);
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
            let type = '', didType = false, title = '', didTitle = false, id = '', didID = false, room = null;
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
              if (!didTitle && splitted_message[i].startsWith("|title|")) {
                title = splitted_message[i].slice(7);
                didTitle = true;
                continue;
              }
              if(!didID && splitted_message[i].startsWith('|:|')){
                id = splitted_message[i].slice(3);
                didID = true;
                room = new Room({ID: id, title, type: (type as "chat" | "battle")})
                this.rooms.push(room)
                continue;
              }
            }
        }
      }
    } else {
      const splitted_message = message.split("|");
    }
  }

  roomExists(room_id: string) {
    return this.rooms.some((room) => room.ID === room_id);
  }

  async login({ username, password }: { username: string; password: string }) {
    while (!this.challstr) {
      console.log("waiting for challstr");
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

    console.log("response_json", response_json);
    this.socket.send(`|/trn ${username},0,${response_json.assertion}`);
    this.socket.send(`|/join botdevelopment`);
  }
}
