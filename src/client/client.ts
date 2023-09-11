import { Settings } from "@/settings";
import { toID } from "@/utils/generic";
import { Message } from "./message";
import { Room } from "./room";
import { User } from "./user";
import localforage from "localforage";
import { Notification } from "./notifications";

export class Client {
  socket: WebSocket | undefined;
  server_url: string = "wss://sim3.psim.us/showdown/websocket/";
  loginserver_url: string = "https://play.pokemonshowdown.com/api/";
  challstr: string = "";
  rooms: Map<string, Room> = new Map();
  users: User[] = [];
  events: EventTarget = new EventTarget();
  username: string = "";
  loggedIn: boolean = false;
  settings: Settings = new Settings();
  onOpen: (() => void)[] = []; // Append stuff here to run when the socket opens
  private joinAfterLogin: string[] = [];
  private cleanUsername: string = "";
  private selectedRoom: string = "";
  private userListener: ((json: any) => any) | undefined; // Returns the JSON

  constructor() {
    this.socket = new WebSocket(this.server_url);
    this.__setupSocketListeners();
  }

  async send(message: string, room: string | false) {
    if (!this.socket) {
      throw new Error(
        `Sending message before socket initialization ${room} ${message}`,
      );
    }
    if (!room) {
      message = `|${message}`;
    } else {
      const roomObj = this.room(room);
      if (roomObj) {
        if (roomObj.type === "pm") {
          message = `|/pm ${roomObj.name}, ${message}`;
        } else {
          message = `${roomObj.ID}|${message}`;
        }
      }
    }

    console.log(`>>${message}`);
    this.socket.send(`${message}`);
  }

  room(room_id: string) {
    // rooms is a map
    return this.rooms.get(room_id);
  }

  // Used to remove highlights and mentions
  selectRoom(roomid: string) {
    this.selectedRoom = roomid;
    this.room(roomid)?.select();
    console.log("select room", this.rooms);
    this.settings.changeRooms(this.rooms);
  }

  leaveRoom(room_id: string) {
    if (!this.socket) {
      throw new Error("Leaving room before socket initialization " + room_id);
    }
    this.socket.send(`|/leave ${room_id}`);
  }

  async getUser(user: string, callback: (json: any) => void) {
    if (!this.socket) {
      throw new Error("Getting user before socket initialization " + user);
    }
    this.socket.send(`|/cmd userdetails ${user}`);
    this.userListener = callback;
  }

  async join(rooms: string | string[]) {
    if (!this.socket) {
      throw new Error("Joining room(s) before socket initialization " + rooms);
    }
    if (typeof rooms === "string") {
      this.socket.send(`|/join ${rooms}`);
    } else {
      for (let room of rooms) {
        this.socket.send(`|/join ${room}`);
      }
    }
  }

  async autojoin(rooms: string[], useDefaultRooms = false) {
    if (!this.socket) {
      throw new Error("Auto-joining rooms before socket initialization ");
    }
    if (useDefaultRooms && (!rooms || rooms.length === 0)) {
      for (let room of this.settings.defaultRooms) {
        this.socket.send(`|/join ${room}`);
      }
      return;
    }

    if (!rooms) return;
    this.socket.send(`|/autojoin ${rooms.join(",")}`);
  }

  private highlightMsg(roomid: string, message: string) {
    if (
      this.cleanUsername && (message.includes(this.cleanUsername) ||
        message.includes(toID(this.username)))
    ) {
      return true;
    }
    if (
      this.settings.highlightMsg(roomid, message)
    ) {
      return true;
    }
    return false;
  }

  getNotifications(): Notification[] {
    return Array.from(this.rooms).map(([_, room]) => ({
      room: room.ID,
      mentions: room.mentions,
      unread: room.unread,
    }));
  }

  // --- Login ---

  async login() {
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
    while (!this.challstr) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    // Oauth login method
    const url =
      `https://play.pokemonshowdown.com/api/oauth/authorize?redirect_uri=${location.origin}&client_id=${process.env.NEXT_PUBLIC_OAUTH_ID}&challenge=${this.challstr}`;
    const nWindow = (window as any).n = open(
      url,
      undefined,
      "popup=1,width=700,height=700",
    );
    const checkIfUpdated = async () => {
      try {
        if (nWindow?.location.host === location.host) {
          const url = new URL(nWindow.location.href);
          const assertion = url.searchParams.get("assertion");
          if (assertion) {
            this.send_assertion(assertion);
          }
          const token = url.searchParams.get("token");
          if (token) {
            await localforage.setItem(
              "ps-token",
              url.searchParams.get("token"),
            );
          }
          nWindow.close();
        } else {
          setTimeout(checkIfUpdated, 500);
        }
      } catch (e) {
        // DomException means that the window wasn't redirected yet
        // so we just wait a bit more
        if (e instanceof DOMException) {
          setTimeout(checkIfUpdated, 500);
          return;
        }
        throw e;
      }
    };
    setTimeout(checkIfUpdated, 1000);
  }

  private async tryLogin() {
    while (!this.challstr) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    const urlParams = new URLSearchParams(window.location.search);
    let assertion = urlParams.get("assertion");
    if (assertion && assertion !== "undefined") {
      await this.send_assertion(assertion);
      const token = urlParams.get("token");
      if (token) {
        await localforage.setItem("ps-token", token);
      }
      return;
    } else if (
      (assertion = await this.assertionFromToken(this.challstr) || null)
    ) {
      await this.send_assertion(assertion);
      return;
    } else {
      const token = await localforage.getItem("ps-token");
      if (token && token !== "undefined") {
        if (!await this.refreshToken()) {
          console.error("Couldn't refresh token");
          return;
        }
        const assertion = await this.assertionFromToken(this.challstr);
        if (assertion) {
          await this.send_assertion(assertion);
        }
      }
    }
  }

  private async send_assertion(assertion: string) {
    const username = assertion.split(",")[1];
    this.send(`/trn ${username},0,${assertion}`, false);
  }

  private async parseLoginserverResponse(
    response: Response,
  ): Promise<string | false> {
    // Loginserver responses are just weird
    const response_test = await response.text();
    if (response_test[0] === ";") {
      console.error("AssertionError: Received ; from loginserver");
      return false;
    }
    try {
      const response_json = JSON.parse(response_test.slice(1));
      if (response_json.success === false) {
        console.error(`Couldn't login`, response_json);
        return false;
      } else if (response_json.success) {
        return response_json.success;
      }
    } catch (e) {
    }
    return response_test;
  }

  private async assertionFromToken(challstr: string): Promise<string | false> {
    const token = await localforage.getItem("ps-token");
    if (!token || token === "undefined") {
      console.log("no token");
      return false;
    }
    const response = await fetch(
      `${this.loginserver_url}oauth/api/getassertion?challenge=${challstr}&token=${token}&client_id=${process.env.NEXT_PUBLIC_OAUTH_ID}`,
    );
    return await this.parseLoginserverResponse(response);
  }

  // TODO: Actually use this
  private async refreshToken() {
    const token = await localforage.getItem("ps-token");
    if (!token || token === "undefined") {
      console.log("no token");
      return false;
    }
    try {
      const response = await fetch(
        `${this.loginserver_url}oauth/api/refreshtoken?token=${token}&client_id=${process.env.NEXT_PUBLIC_OAUTH_ID}`,
      );
      const result = await this.parseLoginserverResponse(response);
      console.log("refreshed token", result);
      if (result) await localforage.setItem("ps-token", result);
      return result;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  // --- Room management ---
  private _addRoom(room: Room) {
    this.rooms.set(room.ID, room);
    const eventio = new CustomEvent("room", { detail: room });
    this.events.dispatchEvent(eventio);
    this.settings.changeRooms(this.rooms);
  }

  private _removeRoom(room_id: string) {
    this.rooms.delete(room_id);
    const eventio = new CustomEvent("leaveroom", { detail: room_id });
    this.events.dispatchEvent(eventio);
    this.settings.changeRooms(this.rooms);
  }

  private addMessageToRoom(room_id: string, message: Message, retry = true) {
    const room = this.room(room_id);
    if (
      toID(message.user) !== toID(this.username) &&
      this.highlightMsg(room_id, message.content)
    ) {
      message.hld = true;
    }
    if (room) {
      room.addMessage(message, {
        selected: this.selectedRoom === room_id,
        selfSent: toID(this.username) === toID(message.user),
      });
      this.events.dispatchEvent(
        new CustomEvent("message", { detail: message }),
      );
      return;
    } else if (retry) {
      setTimeout(() => this.addMessageToRoom(room_id, message, false), 1000);
    }
    console.warn(
      "addMessageToRoom: room (" + room_id + ") is unknown. Message:",
      message,
    );
  }

  private addUsers(room_id: string, users: User[]) {
    const room = this.room(room_id);
    if (room) {
      room.addUsers(users);
      this.events.dispatchEvent(new CustomEvent("users", { detail: users }));
      return;
    }
    console.warn("addUsers: room (" + room_id + ") is unknown. Users:", users);
  }

  private removeUser(room_id: string, user: string) {
    const room = this.room(room_id);
    if (room) {
      room.removeUser(user);
      this.events.dispatchEvent(new CustomEvent("users", { detail: user }));
      return;
    }
    console.warn("removeUsers: room (" + room_id + ") is unknown");
  }

  private setUsername(username: string) {
    // gotta re-run highlightMsg on all messages
    this.username = username;
    this.cleanUsername = username.replace(/[\u{0080}-\u{FFFF}]/gu, "").trim();
    this.rooms.forEach(async (room) => {
      room.messages.forEach((msg) => {
        msg.hld = this.highlightMsg(room.ID, msg.content);
      });
    });
    this.events.dispatchEvent(
      new CustomEvent("login", { detail: this.username }),
    );
  }

  // --- Commands parser ---
  // Hopefully this code will become cleaner with time (lol)
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
    // console.log("cmd:", cmd, "args:", args);
    i++;
    let type = "",
      name = "",
      didName = false,
      timestamp: string | undefined = "",
      didTimestamp = false,
      room = null;
    switch (cmd) {
      case "c":
      case "c:": {
        room = this.room(roomID);
        if (!room) {
          console.warn("room not found (" + roomID + ")");
          return;
        }
        for (
          let j = isGlobalOrLobby ? 0 : 1;
          j < splitted_message.length;
          j++
        ) {
          const chatMessage = this.parseCMessage(
            splitted_message[j],
            cmd === "c:",
          );
          this.addMessageToRoom(roomID, chatMessage);
        }
        break;
      }
      case "pm":
        {
          const sender = toID(args[0]);
          const receiver = toID(args[1]);
          if(sender === toID(this.username)) {
            // sent message
            roomID = toID(receiver);
          } else {
            // received message
            roomID = toID(sender);
          }
          const content = args.slice(2).join("|");
          const room = this.room(roomID);
          if (!room) {
            this._addRoom(
              new Room({
                ID: roomID,
                name: sender === toID(this.username) ? args[1] : args[0],
                type: "pm",
              }),
            );
          }
          this.addMessageToRoom(
            roomID,
            new Message({
              timestamp: Math.floor(Date.now() / 1000).toString(),
              user: args[0],
              type: "chat",
              content,
            }),
          );
        }
        break;
      case "J": {
        let room = this.room(roomID);
        if (!room) {
          console.error(
            "Received |J| from untracked room",
            roomID,
          );
          return;
        }
        this.addUsers(roomID, [new User({ name: args[0] })]);
        break;
      }
      case "L": {
        let room = this.room(roomID);
        if (!room) {
          console.error(
            "Received |L| from untracked room",
            roomID,
          );
          return;
        }
        this.removeUser(roomID, args[0]);
        break;
      }
      case "N": {
        break;
      }
      case "queryresponse": {
        if (args[0] === "userdetails") {
          try {
            const tmpjson = JSON.parse(args.slice(1).join("|"));
            if (this.userListener) {
              this.userListener(tmpjson);
              this.userListener = undefined;
            } else {
              console.warn(
                "received userdetails but nobody asked for it",
                args,
              );
            }
          } catch (e) {
            console.error("Error parsing userdetails", args);
          }
        } else {
          console.warn("Unknown queryresponse", args);
        }
        break;
      }
      // << |queryresponse|userdetails|{"id":"zestar75","userid":"zestar75","name":"zestar75","avatar":266,"group":" ","autoconfirmed":true,"rooms":{"@techcode":{},"@scholastic":{},"sports":{},"@twilightzone":{"isPrivate":true}},"friended":true}
      case "init":
        let users: User[] = [];
        type = args[0];
        for (; i < splitted_message.length; i++) { // start at 2 because first line is room id and second line is cmd
          if (splitted_message[i] === "") continue;
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
          if (
            splitted_message[i].startsWith("|c:|") ||
            splitted_message[i].startsWith("|c|")
          ) {
            const parsedMessage = this.parseCMessage(
              splitted_message[i],
              splitted_message[i].startsWith("|c:|"),
            );
            this.addMessageToRoom(roomID, parsedMessage);
          } else if (splitted_message[i].startsWith("|raw|")) {
            const [_, _2, ...data] = splitted_message[i].split("|");
            this.addMessageToRoom(
              roomID,
              new Message({
                timestamp,
                user: "",
                type: "raw",
                content: data.join("|"),
              }),
            );
          } else if (splitted_message[i].startsWith("|html|")) {
            const [_, _2, ...data] = splitted_message[i].split("|");
            this.addMessageToRoom(
              roomID,
              new Message({
                timestamp,
                user: "",
                type: "raw",
                content: data.join("|"),
              }),
            );
          } else if (splitted_message[i].startsWith("|uhtml|")) {
            const [_, _2, name, ...data] = splitted_message[i].split("|");
            // TODO: Use the name
            this.addMessageToRoom(
              roomID,
              new Message({
                timestamp,
                name,
                user: "",
                type: "raw",
                content: data.join("|"),
              }),
            );
          } else if (splitted_message[i].startsWith("|uhtmlchange|")) {
            const room = this.room(roomID);
            if (!room) {
              console.error(
                "Received |uhtmlchange| from untracked room",
                roomID,
              );
              break;
            }
            room.changeUHTML(args[0], args.slice(1).join("|"));
            this.events.dispatchEvent(
              new CustomEvent("message", { detail: message }),
            );
          } else {
            console.warn("unknown init message: " + splitted_message[i]);
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
          this.autojoin(this.joinAfterLogin);
          console.log("Logged in as " + args[0]);
          this.loggedIn = true;
          this.setUsername(args[0]);
        }
        break;
      case "deinit":
        // leave room
        this._removeRoom(roomID);
        break;
      case "uhtml":
        // console.log("uhtml", args);
        const uhtml = args.slice(1).join("|");
        this.addMessageToRoom(
          roomID,
          new Message({
            timestamp,
            name: args[0],
            user: "",
            type: "raw",
            content: uhtml,
          }),
        );
        break;
      case "uhtmlchange":
        {
          const room = this.room(roomID);
          if (!room) {
            console.error(
              "Received |uhtmlchange| from untracked room",
              roomID,
            );
            break;
          }
          room.changeUHTML(args[0], args.slice(1).join("|"));
          this.events.dispatchEvent(
            new CustomEvent("message", { detail: message }),
          );
        }
        break;
      default:
        console.warn("Unknown cmd: " + cmd);
    }
  }

  private parseCMessage(message: string, hasTimestamp: boolean): Message {
    const splitted_message = message.split("|");
    let content;
    let type: "raw" | "chat" | "log" = "chat";
    let _, _2, msgTime, user, tmpcontent: (string | undefined)[];
    if (hasTimestamp) {
      [_, _2, msgTime, user, ...tmpcontent] = splitted_message;
    } else {
      [_, _2, user, ...tmpcontent] = splitted_message;
      msgTime = Math.floor(Date.now() / 1000).toString();
    }
    content = tmpcontent.join("|");
    if (content.startsWith("/raw")) {
      type = "raw";
      content = content.slice(4);
    } else if (content.startsWith("/uhtml")) {
      let [name, ...html] = content.split(",");
      // TODO: Use the name and parse uhtmlchange
      type = "raw";
      content = html.join(",");
    } else if (content.startsWith("/log")) {
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

  private __setupSocketListeners() {
    if (!this.socket) {
      throw new Error("__setupSocketListeners: Socket not initialized");
    }
    this.socket.onopen = () => {
      for (let cb of this.onOpen) {
        cb();
      }
      this.tryLogin();
    };
    this.socket.onmessage = (event) => {
      console.log("<<", event.data);
      this.parseSocketMsg(event.data);
    };
    this.socket.onerror = (event) => {
      console.error(event);
    };
    this.socket.onclose = (_) => {
      this.events.dispatchEvent(new CustomEvent("disconnect"));
    };
  }
}
