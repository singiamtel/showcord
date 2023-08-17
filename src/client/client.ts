import { Message } from "./message";
import { Room } from "./room";
import { User } from "./user";

export class Client {
  // socket
  socket: WebSocket;
  server_url: string = "wss://sim3.psim.us/showdown/websocket/";
  loginserver_url: string = "https://play.pokemonshowdown.com/api/";
  challstr: string = "";
  rooms: Room[] = [];
  events: EventTarget = new EventTarget();
  private joinAfterLogin: string[] = [];
  username: string = "";
  loggedIn: boolean = false;

  constructor() {
    this.socket = new WebSocket(this.server_url);
    this.__setupSocketListeners();
    this.send_login();
  }

  private __setupSocketListeners() {
    this.socket.onopen = function () {
    };
    this.socket.onmessage = (event) => {
      console.log(event.data);
      this.parse_message(event.data);
    };
    this.socket.onerror = (event) => {
      console.error(event);
    };
    this.socket.onclose = (_) => {
      this.__setupSocketListeners();
      this.events.dispatchEvent(new CustomEvent("disconnect"));
    }
  }

  private async parse_message(message: string) {
    if (message.startsWith("|challstr|")) {
      const splitted_challstr = message.split("|");
      splitted_challstr.shift();
      splitted_challstr.shift();
      this.challstr = splitted_challstr.join("|");
      return
    }
    let i = 0;
    const splitted_message = message.split("\n");
    const isGlobalOrLobby = splitted_message[0][0] !== ">";
    let roomID: string;
    if (isGlobalOrLobby) {
      roomID = "lobby";
    } else {
      i++;
      roomID = splitted_message[0].slice(1);
    }
    const [_, cmd, ...args] = splitted_message[i].split("|");
    i++;
    // console.log("cmd", cmd);
    // console.log("args", args);
    // console.log("roomID", roomID);
    /*
          Messages that are two lines:
            - any message linked to a room
        */

    let type = "",
      didType = false,
      name = "",
      didName = false,
      timestamp = "",
      didTimestamp = false,
      room = null;
    switch (cmd) {
      case "c":
      case "c:":
        // th
        room = this.room(roomID);
        if (!room) {
          console.log("room not found (" + roomID + ")");
          return;
        }
        let user, content, msgType : "raw" | "chat";
        if (args[1]?.startsWith("/raw")) {
          msgType = "raw";
          content = args[1].slice(4);
        }
        else {
          msgType = "chat";
          timestamp = args[0];
          user = args[1];
          content = args[2];
        }

        this.addMessage(
          roomID,
          new Message({
            timestamp,
            type: msgType,
            content,
            user,
          }),
        );
        break;
      /*
          Messages that can be more than two lines:
            - init room
            - noinit room
            - chat message
            - update user
        */
      case "init":
        let users: User[] = [];
        for (; i < splitted_message.length; i++) { // start at 2 because first line is room id and second line is cmd
          if (splitted_message[i] === "") continue;
          if (!didType && splitted_message[i].startsWith("|init|")) {
            type = splitted_message[i].split("|")[2];
            if (type !== "chat" && type !== "battle") {
              console.log(
                "room type not supported (" + type + "), room id: " +
                  roomID,
              );
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
            const parsedUsers = splitted_message[i].split("|")[2].split(
              ",",
            );
            users = parsedUsers.map((tmpuser) => {
              const [user, status] = tmpuser.slice(1).split("@");
              return new User({ name: tmpuser.slice(0, 1) + user, status });
            });
            users.shift();
            continue;
          }
          if (!didTimestamp && splitted_message[i].startsWith("|:|")) {
            timestamp = splitted_message[i].slice(3);
            didTimestamp = true;
            room = new Room({
              ID: roomID,
              name: name,
              type: (type as "chat" | "battle"),
            });
            this._addRoom(room);
            this.addUsers(roomID, users);
            continue;
          }
          if (splitted_message[i].startsWith("|c:|")) {
            let [_, _2, msgTime, user, message] = splitted_message[i].split(
              "|",
            );
            let type: "raw" | "chat" = "chat";
            if (message.startsWith("/raw")) {
              type = "raw";
              message = message.slice(4);
            }
            this.addMessage(
              roomID,
              new Message({
                timestamp: msgTime,
                user,
                type,
                content: message,
              }),
            );
          } else if (splitted_message[i].startsWith("|raw|")) {
            const [_, _2, ...data] = splitted_message[i].split("|");
            this.addMessage(
              roomID,
              new Message({
                timestamp,
                user: "",
                type: "raw",
                content: data.join("|"),
              }),
            );
          } else {
            console.log("unknown init message: " + splitted_message[i]);
          }
        }
        break;
      case "noinit":
        // store room and try again after login
        // >botdevelopment
        // |noinit|namerequired|The room 'botdevelopment' does not exist or requires a login to join
        if (args[0] === "namerequired") {
          this.joinAfterLogin.push(roomID);
        }
        break;
      case "updateuser":
        console.log("joined rooms after login", args);
        if (!args[0].trim().toLowerCase().startsWith("guest")) {
          this.join(this.joinAfterLogin);
          console.log("logged in as " + args[0]);
          this.loggedIn = true;
          this.events.dispatchEvent(new CustomEvent("login", { detail: this.username}))
        }
        break;
      case "deinit":
        // leave room
        this.rooms = this.rooms.filter((room) => room.ID !== roomID);
        this.events.dispatchEvent(new CustomEvent("leaveroom", { detail: roomID }));
        break
      default:
        console.log("unknown cmd: " + cmd);
    }
  }

  room(room_id: string) {
    return this.rooms.find((room) => room.ID === room_id);
  }

  leaveRoom(room_id: string){
    this.socket.send(`|/leave ${room_id}`);
  }

  private _addRoom(room: Room) {
    this.rooms.push(room);
    const eventio = new CustomEvent("room", { detail: room });
    this.events.dispatchEvent(eventio);
  }

  private addMessage(room_id: string, message: Message) {
    const room = this.room(room_id);
    if (room) {
      room.addMessage(message);
      this.events.dispatchEvent(
        new CustomEvent("message", { detail: message }),
      );
      return;
    }
    console.log("room (" + room_id + ") does not exist");
  }

  private addUsers(room_id: string, users: User[]) {
    const room = this.room(room_id);
    if (room) {
      room.addUsers(users);
      this.events.dispatchEvent(new CustomEvent("users", { detail: users }));
      return;
    }
    console.log("room (" + room_id + ") does not exist");
  }

  private async send_login() {
    while (!this.challstr) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    // if there's an assertion in the URL, log in using that
    const URLParams = new URLSearchParams(window.location.search);
    const assertion = URLParams.get("assertion");
    if (assertion) {
      console.log("logging in with assertion");
      console.log("assertion", assertion);
      this.socket.send(`|/trn itszxc,0,${assertion}`);
    }
  }

  // async login() {
  async login({ username, password }: { username: string; password: string }) {
    this.username = username;
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
    // Oauth login method
    // console.log("process.env", process.env);
    // console.log("process.env.NEXT_PUBLIC_OAUTH_ID", process.env.NEXT_PUBLIC_OAUTH_ID);
    // location.push(`https://play.pokemonshowdown.com/api/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_OAUTH_ID}&redirect_uri=${location.origin}`);
    // const res = await fetch(`${this.loginserver_url}oauth/api/authorize?client_id=${process.env.NEXT_PUBLIC_OAUTH_ID}`)
  }

  async join(rooms: string | string[]) {
    console.log("joining rooms...", rooms);
    if (typeof rooms === "string") {
      this.socket.send(`|/join ${rooms}`);
    } else {
      for (let room of rooms) {
        this.socket.send(`|/join ${room}`);
      }
    }
  }

  async send(room: string, message: string) {
    console.log(`${room}|${message}`);
    this.socket.send(`${room}|${message}`);
  }
}
