import { Settings } from "@/settings";
import { toID } from "@/utils/generic";
import { Message } from "./message";
import { Room } from "./room";
import { User } from "./user";
import localforage from "localforage";

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
  private cleanUsername: string = "";
  loggedIn: boolean = false;
  settings: Settings = new Settings();
  onOpen: (() => void)[] = [];
  private selectedRoom: string = "";

  constructor() {
    this.socket = new WebSocket(this.server_url);
    this.__setupSocketListeners();
  }

  // Order of login methods:
  // 1. Assertion in URL (from oauth login)
  // - This happens right after oauth login
  // - We also need to store the token in localforage
  //
  // 2. Assertion from token
  // - This happens when we have a token stored in localforage
  // - We try to get an assertion from the token, and send it to the server
  // - If it fails we drop the token and go to #3
  //
  // 3. Normal login
  // Redirect to oauth login page

  private __setupSocketListeners() {
    this.socket.onopen = () => {
      console.log("socket connected");
      for (let cb of this.onOpen) {
        cb();
      }
      this.tryLogin();
    };
    this.socket.onmessage = (event) => {
      console.log("msg:", event.data);
      this.parseSocketMsg(event.data);
    };
    this.socket.onerror = (event) => {
      console.error(event);
    };
    this.socket.onclose = (_) => {
      this.__setupSocketListeners();
      this.events.dispatchEvent(new CustomEvent("disconnect"));
    };
  }

  private async parseSocketMsg(message: string) {
    if (message.startsWith("|challstr|")) {
      const splitted_challstr = message.split("|");
      splitted_challstr.shift();
      splitted_challstr.shift();
      this.challstr = splitted_challstr.join("|");
      return;
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
    console.log("cmd:", cmd, "args:", args);
    i++;
    let type = "",
      didType = false,
      name = "",
      didName = false,
      timestamp: string | undefined = "",
      didTimestamp = false,
      room = null;
    switch (cmd) {
      case "c":
      case "c:":
        // th
        room = this.room(roomID);
        if (!room) {
          console.warn("room not found (" + roomID + ")");
          return;
        }
        const chatMessage = this.parseCMessage(splitted_message[isGlobalOrLobby ? 0 : 1])
        this.addMessage(roomID, chatMessage);
        break;
      case "J": {
        console.log("user joined room", roomID, args);
        let room = this.room(roomID);
        if (!room) {
          console.error(
            "Received |J| from untracked room",
            roomID,
          );
          return;
        }
        room.addUser(new User({ name: args[0] }));
        break;
      }
      case "L": {
        console.log("user left room", roomID, args);
        let room = this.room(roomID);
        if (!room) {
          console.error(
            "Received |L| from untracked room",
            roomID,
          );
          return;
        }
        room.removeUser(args[0]);
      }
      case "N": {
      }
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
            const parsedMessage = this.parseCMessage(splitted_message[i]);
            this.addMessage(roomID, parsedMessage);
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
        if (!args[0].trim().toLowerCase().startsWith("guest")) {
          this.join(this.joinAfterLogin);
          console.log("logged in as " + args[0]);
          this.loggedIn = true;
          this.setUsername(args[0]);
        }
        break;
      case "deinit":
        // leave room
        this._removeRoom(roomID);
        break;
      default:
        console.log("unknown cmd: " + cmd);
    }
  }

  private parseCMessage(message: string): Message {
    const splitted_message = message.split("|");
    let content
    let type: "raw" | "chat" | "log" = "chat";
    let [_, _2, msgTime, user, ...tmpcontent] : (string | undefined)[] = splitted_message
    content = tmpcontent.join("|");
    if (content.startsWith("/raw")) {
      type = "raw";
      content = content.slice(4);
    } 
    else if(splitted_message[3]?.startsWith("/log")){
      type = "log";
      content = splitted_message[3].slice(4);
      // msgTime = undefined;
      msgTime = Math.floor(Date.now() / 1000).toString();
    }
    if(content.startsWith("/log")){
      type = "log";
      content = content.slice(4);
    }
    return new Message({
      timestamp: msgTime,
      user,
      type,
      content: content,
    });
  }

  room(room_id: string) {
    return this.rooms.find((room) => room.ID === room_id);
  }

  leaveRoom(room_id: string) {
    this.socket.send(`|/leave ${room_id}`);
  }

  private _addRoom(room: Room) {
    this.rooms.push(room);
    const eventio = new CustomEvent("room", { detail: room });
    this.events.dispatchEvent(eventio);
    this.settings.changeRooms(this.rooms);
  }

  private _removeRoom(room_id: string) {
    this.rooms = this.rooms.filter((room) => room.ID !== room_id);
    const eventio = new CustomEvent("leaveroom", { detail: room_id });
    this.events.dispatchEvent(eventio);
    this.settings.changeRooms(this.rooms);
  }

  private addMessage(room_id: string, message: Message) {
    const room = this.room(room_id);
    if (this.highlightMsg(room_id, message.content)) {
      message.hld = true;
    }
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

  private async tryLogin() {
    console.log("trying to login");
    while (!this.challstr) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    const urlParams = new URLSearchParams(window.location.search);
    let assertion = urlParams.get("assertion");
    if (assertion && assertion !== "undefined") {
      console.log("logging in with assertion", assertion);
      await this.send_assertion(assertion);
      const token = urlParams.get("token");
      if (token) {
        await localforage.setItem("ps-token", token);
      }
      return;
    } else if ((assertion = await this.assertionFromToken(this.challstr))) {
      console.log("logging in with token+assertion", assertion);
      await this.send_assertion(assertion);
      return;
    }
  }

  private async send_assertion(assertion: string) {
    //
    console.log("sending assertion", assertion);
    const username = assertion.split(",")[1];
    console.log("trn", username, assertion);
    this.socket.send(`|/trn ${username},0,${assertion}`);
  }

  private async assertionFromToken(challstr: string): Promise<string | null> {
    const token = await localforage.getItem("ps-token");
    if (!token || token === "undefined") {
      console.log("no token");
      return null;
    }
    try {
      const response = await fetch(
        `${this.loginserver_url}oauth/api/getassertion?challenge=${challstr}&token=${token}&client_id=${process.env.NEXT_PUBLIC_OAUTH_ID}`
      );
      const response_test = await response.text();
      console.log("response_test", response_test)
      if(response_test[0] === ';'){
        console.error("Received ; from loginserver")
        return null
      }
      try{
        const response_json = JSON.parse(response_test.slice(1));
        if (response_json.success === false) {
          console.error(`Couldn't login with token ${token}`, response_json)
          return null;
        }
      }
      catch(e){
      }
      return response_test
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async login() {
    while (!this.challstr) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    console.log("using oauth redirect");
    // Oauth login method
    const url =
      `https://play.pokemonshowdown.com/api/oauth/authorize?redirect_uri=${location.origin}&client_id=${process.env.NEXT_PUBLIC_OAUTH_ID}&challenge=${this.challstr}`;
    console.log("url", url);
    const nWindow = (window as any).n = open(url, undefined, "popup=1,width=700,height=700");
    const checkIfUpdated = async () => {
      try{
      if (nWindow?.location.host === location.host){
        const url = new URL(nWindow.location.href);
        console.log('URL', url);
        const assertion = url.searchParams.get("assertion");
        if (assertion) {
          this.send_assertion(assertion);
        }
        const token = url.searchParams.get("token");
        if (token) {
          await localforage.setItem("ps-token", url.searchParams.get("token"));
        }
        nWindow.close();
          console.log('got token', token);
      } else {
        setTimeout(checkIfUpdated, 500);
      }
      }
      catch(e){
        // DomException means that the window wasn't redirected yet
        // so we just wait a bit more
        if(e instanceof DOMException){
          setTimeout(checkIfUpdated, 500);
          return;
        }
        throw e;
      }
    };
    setTimeout(checkIfUpdated, 1000);
  }

  async join(rooms: string | string[], useDefaultRooms = false) {
    console.log("joining rooms...", rooms);
    if (useDefaultRooms && (!rooms || rooms.length === 0)) {
      for (let room of this.settings.defaultRooms) {
        this.socket.send(`|/join ${room}`);
      }
      return;
    }

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

  highlightMsg(roomid: string, message: string) {
    if (
      this.cleanUsername && (message.includes(this.cleanUsername) ||
        message.includes(toID(this.username)))
    ) {
      console.log('trueee')
      return true;
    }
    if (
      this.settings.highlightMsg(roomid, message)
    ) {
      console.log("highlighted message", message);
      return true;
    }
    return false;
  }

  private setUsername(username: string) {
    // gotta re-run highlightMsg on all messages
    this.username = username;
    this.cleanUsername = username.replace(/[\u{0080}-\u{FFFF}]/gu,"").trim();
    this.rooms.forEach(async (room) => {
      room.messages.forEach((msg) => {
        console.log('trying to hl', msg)
        if (this.highlightMsg(room.ID, msg.content)) {
          msg.hld = true;
        } else {
          msg.hld = false;
        }
      });
    });
    this.events.dispatchEvent(
      new CustomEvent("login", { detail: this.username }),
    );
  }

  selectRoom(roomid: string) {
    this.selectedRoom = roomid;
    this.room(roomid)?.select();
  }
}
