import { Settings } from './settings';
import { toID } from '../utils/generic';
import newMessage, { Message } from './message';
import { Room } from './room/room';
import { User } from './user';
import { notificationsEngine, RoomNotification as RoomNotifications } from './notifications';
import { Protocol } from '@pkmn/protocol';
import { assert, assertNever } from '@/lib/utils';
import { BattleRoom } from './room/battleRoom';
import formatParser, { Formats } from './formatParser';

import { create } from 'zustand';

type ClientConstructor = {
    server_url?: string;
    loginserver_url?: string;
    autoLogin?: boolean;
};

interface UseClientStoreType {
    rooms: Map<Room['ID'], Room>;
    currentRoom: Room | undefined;
    setCurrentRoom: (roomID: Room) => void;
    // messages: Message[]; // only messages from the current room
    messages: Record<Room['ID'], Message[]>; // messages from all rooms
    newMessage: (room: Room, message: Message) => void;
    updateMessages: (room: Room) => void;
    notifications: Record<Room['ID'], RoomNotifications>;
    clearNotifications: (roomID: Room['ID']) => void;
    addUnread: (room: Room) => void;
    addMention: (room: Room) => void;
    avatar: string;
    theme: 'light' | 'dark';
    user: string | undefined
}

export const useClientStore = create<UseClientStoreType>((set) => ({
    rooms: new Map(),
    currentRoom: undefined,
    setCurrentRoom: (room: Room) => {
        set(() => ({
            currentRoom: room,
        }));
    },
    messages: {},
    newMessage: (room: Room, message: Message) => {
        set((state) => {
            if (room !== state.currentRoom) {
                state.addUnread(room);
            }

            if (!state.messages[room.ID]) {
                return {
                    messages: { ...state.messages, [room.ID]: [message] },
                };
            }
            return {
                messages: { ...state.messages, [room.ID]: [...state.messages[room.ID], message] },
            };
        });
    },
    updateMessages: (room: Room) => {
        // copy all messages from changed room
        set((state) => ({
            messages: { ...state.messages, [room.ID]: [...room.messages] },
        }));
    },
    notifications: {},
    addUnread: (room: Room) => {
        set((state) => {
            if (!state.notifications[room.ID]) {
                return {
                    notifications: { ...state.notifications, [room.ID]: { unread: 1, mentions: 0 } },
                };
            }
            return {
                notifications: { ...state.notifications, [room.ID]: { unread: state.notifications[room.ID].unread + 1, mentions: state.notifications[room.ID].mentions } },
            };
        });
    },
    addMention: (room: Room) => {
        set((state) => {
            if (!state.notifications[room.ID]) {
                return {
                    notifications: { ...state.notifications, [room.ID]: { unread: 0, mentions: 1 } },
                };
            }
            return {
                notifications: { ...state.notifications, [room.ID]: { unread: state.notifications[room.ID].unread, mentions: state.notifications[room.ID].mentions + 1 } },
            };
        });
    },
    clearNotifications: (roomID: string) => {
        if (!roomID) return;
        set((state) => {
            if (!state.notifications[roomID]) {
                return {
                    notifications: { ...state.notifications, [roomID]: { unread: 0, mentions: 0 } },
                };
            }
            return {
                notifications: { ...state.notifications, [roomID]: { unread: 0, mentions: 0 } },
            };
        });
    },

    avatar: 'lucas',
    theme: localStorage.getItem('theme') as 'light' | 'dark' ?? 'dark',
    user: undefined,

}));


export class Client {
    readonly settings: Settings = new Settings();
    static readonly permanentRooms = [{
        ID: 'home',
        name: 'Home',
        defaultOpen: true,
    }, {
        ID: 'settings',
        name: 'Settings',
        defaultOpen: false,
    }] as const; // Client-side only rooms, joined automatically
    private socket: WebSocket | undefined;

    private rooms: Map<string, Room> = new Map();
    events: EventTarget = new EventTarget();
    private loggedIn: boolean = false;
    private shouldAutoLogin: boolean = true;
    private onOpen: (() => void)[] = []; // Append callbacks here to run when the socket opens

    get username() {
        return this.settings.username;
    }

    private joinAfterLogin: string[] = [];
    private challstr: string = '';
    private client_id = import.meta.env.VITE_OAUTH_CLIENTID;
    // private selectedRoom: string = ''; // Used for notifications
    private __selectedRoom = '';
    get selectedRoom() {
        return this.__selectedRoom;
    }
    // Callbacks given to query commands, it's called after the server responds back with the info
    private userListener: ((json: any) => any) | undefined;
    private roomListener: ((json: any) => any) | undefined;
    private roomsJSON: any = undefined; // Server response to /cmd rooms
    private news: any = undefined; // Cached news
    private lastQueriedUser: { user: string; json: any } | undefined; // Cached user query
    private formats: Formats | undefined;

    formatName(formatID: string) {
        // search all categories and return the name of the format
        const allFormats = this.formats?.categories.flatMap((c) => c.formats);
        const format = allFormats?.find((f) => f.ID === formatID);
        return format;
    }

    constructor(options?: ClientConstructor) {
        // if running test suite, don't do anything
        if (import.meta.env.VITEST) {
            console.debug('Running tests, skipping client initialization');
            return;
        }
        try {
            if (options?.autoLogin) this.shouldAutoLogin = options.autoLogin;
            this.__createPermanentRooms();
            this.socket = new WebSocket(this.settings.serverURL);
            this.__setupSocketListeners();
            this.selectRoom('home');
            window.addEventListener('focus', this.notificationsListener.bind(this));
        } catch (error) {
            if (error instanceof DOMException) {
                console.warn('DOMException: ', error);
                this.settings.serverURL = Settings.defaultServerURL;
                this.settings.loginServerURL = Settings.defaultLoginServerURL;
                window.location.reload();
            }
            console.error(error);
        }
    }

    notificationsListener(e: FocusEvent) {
        useClientStore.getState().clearNotifications(this.selectedRoom);
    }


    async send(message: string, room: string | false) {
        if (room) {
            this.room(room)?.send(message);
        }
        this.__send(message, room, false);
    }

    private async __send(ogMessage: string, room: string | false, raw = true) {
        if (!this.socket) {
            throw new Error(
                `Sending message before socket initialization ${room} ${ogMessage}`,
            );
        }
        let message = ogMessage;
        if (!room) {
            message = `|${message}`;
        } else {
            const roomObj = this.room(room);
            if (roomObj) {
                if (roomObj.type === 'pm') {
                    message = `|/pm ${roomObj.name}, ${message}`;
                } else {
                    message = `${roomObj.ID}|${message}`;
                }
            } else {
                console.warn('Sending message to non-existent room', room);
            }
        }

        console.debug('[socket-input]\n', message);
        try {
            if (this.__parseSendMsg(ogMessage, raw)) return; // Already handled client-side
            this.socket.send(`${message}`);
        } catch (e) {
            if (e instanceof DOMException) {
                this.onOpen.push(() => this.socket!.send(`${message}`));
                return;
            }
            throw e;
        }
    }

    room(roomID: string) {
        return this.rooms.get(roomID);
    }

    setTheme(theme: 'light' | 'dark') {
        this.settings.theme = theme;
        useClientStore.setState({ theme });
    }


    /** Returns an array of all rooms
    */
    getRooms() {
        const tmp = [...this.rooms.values()].filter((r) => r.open);
        return tmp;
    }

    createPM(user: string) {
        this.__createPM(user);
        this.selectRoom('pm-' + toID(user));
    }

    private __createPM(user: string) {
        const roomID = `pm-${toID(user)}`;
        const room = this.room(roomID);
        if (room) {
            return;
        }
        const newRoom = new Room({
            ID: roomID,
            name: user,
            type: 'pm',
            connected: false,
            open: true,
        });
        this._addRoom(newRoom);
    }

    selectRoom(roomid: string) {
        this.__selectedRoom = roomid;
        this.room(roomid)?.select();
        // this.settings.changeRooms(this.rooms);
        useClientStore.setState({ currentRoom: this.room(roomid) });
        useClientStore.getState().clearNotifications(roomid);
    }

    async queryUser(user: string, callback: (json: any) => void) {
        if (!this.socket) {
            throw new Error('Getting user before socket initialization ' + user);
        }
        if (this.lastQueriedUser && this.lastQueriedUser.user === user) {
            // Refresh anyways but give the cached json first
            callback(this.lastQueriedUser.json);
            this.__send(`/cmd userdetails ${user}`, false);
            this.userListener = callback;
        }
        this.__send(`/cmd userdetails ${user}`, false);
        this.userListener = callback;
    }

    private async queryUserInternal(user: string) {
        this.queryUser(user, (_json) => {
            // This is risky as we could be logged in but not get a queryResponse for some reason
            useClientStore.setState({ user: this.settings.username, avatar: this.settings.avatar });
        });
    }

    async queryRooms(callback: (json: any) => void) {
        if (!this.socket) {
            throw new Error('Getting /cmd rooms before socket initialization');
        }
        if (this.roomsJSON) {
            callback(this.roomsJSON);
            return;
        }
        this.__send(`/cmd rooms`, false);
        this.roomListener = callback;
    }

    async queryNews(callback: (json: any) => void) {
        if (this.news) {
            return callback(this.news);
        }
        fetch(Settings.defaultNewsURL).then((res) => res.json()).then((json) => {
            this.news = json;
            callback(json);
        });
    }

    async join(room: string) {
        if (!room) {
            console.trace('Trying to join empty string room');
        }
        if (!this.socket) {
            throw new Error('Joining room(s) before socket initialization ' + room);
        }
        this.__send(`/join ${room}`, false);
    }

    leaveRoom(roomID: string) {
        if (!this.socket) {
            throw new Error('Leaving room before socket initialization ' + roomID);
        }
        const room = this.room(roomID);
        if (!room) {
            console.warn('Trying to leave non-existent room', roomID);
            this.events.dispatchEvent(
                new CustomEvent('error', {
                    detail: `Trying to leave non-existent room ${roomID}`,
                }),
            );
            return;
        }
        if (room.connected) {
            this.__send(`/leave ${roomID}`, false);
        } else if (Client.permanentRooms.map((e) => e.ID).includes(roomID as any)) {
            this._closeRoom(roomID);
        } else { this._removeRoom(roomID); }
    }

    _closeRoom(roomID: string) {
        const room = this.room(roomID);
        if (!room) {
            console.warn('Trying to close non-existent room', roomID);
            return;
        }
        room.open = false;
        useClientStore.setState({ rooms: new Map(this.rooms) });
        if (roomID === this.selectedRoom) {
            this.selectRoom('home');
        }
    }

    async autojoin(rooms: string[], useDefaultRooms = false) {
        if (!this.socket) {
            throw new Error('Auto-joining rooms before socket initialization ');
        }
        const filteredRooms = rooms.filter((room) =>
            !Client.permanentRooms.map((e) => e.ID).includes(
                room as typeof Client.permanentRooms[number]['ID'],
            ) && !room.startsWith('pm-'));
        if (useDefaultRooms && (!filteredRooms || filteredRooms.length === 0)) {
            for (const room of Settings.defaultRooms) {
                this.__send(`/join ${room}`, false);
            }
            return;
        }
        if (!filteredRooms.length) return;
        this.__send(
            `/autojoin ${filteredRooms.join(',')}`,
            false,
        );
    }

    private highlightMsg(roomid: string, message: Message, force = false) {
        if (message.hld !== null && !force) return message.hld;
        if (toID(message.user) === (this.settings.username)) {
            message.hld = false;
            return false;
        }
        const highlight = this.settings.highlightMsg(roomid, message.content);
        message.hld = highlight;
        return highlight;
    }

    private shouldNotify(room: Room, message: Message) {
        if (this.selectedRoom == room.ID && document.hasFocus()) return false;
        if (room.checkMessageStaleness(message)) return false;
        if (message.hld || (room.type === 'pm' && toID(message.user) !== toID(this.settings.username))) return true;
        return false;
    }

    private forceHighlightMsg(roomid: string, message: Message) {
        return this.highlightMsg(roomid, message, true);
    }

    getNotifications(): Map<string, RoomNotifications> {
        return new Map(
            [...this.rooms].map(([roomID, room]) => [roomID, { unread: room.unread, mentions: room.mentions }]),
        );
    }

    clearNotifications(roomID: string) {
        const room = this.room(roomID);
        if (room) {
            room.clearNotifications();
            useClientStore.getState().clearNotifications(roomID);
        }
    }

    openSettings() {
        this._openRoom('settings');
        this.selectRoom('settings');
    }


    // --- Login ---

    logout() {
        this.settings.logout();
    }

    async login() {
        // Order of login methods:
        // 1. Assertion in URL (from oauth login)
        // - This happens right after oauth login
        // - We also need to store the token in localstorage
        //
        // 2. Assertion from token
        // - This happens when we have a token stored in localstorage
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
            `https://play.pokemonshowdown.com/api/oauth/authorize?redirect_uri=${location.origin}&client_id=${this.client_id}&challenge=${this.challstr}`;
        const nWindow = (window as any).n = open(
            url,
            undefined,
            'popup=1,width=700,height=700',
        );
        const checkIfUpdated = async () => {
            try {
                if (nWindow?.location.host === location.host) {
                    const url = new URL(nWindow.location.href);
                    const assertion = url.searchParams.get('assertion');
                    if (assertion) {
                        this.send_assertion(assertion);
                    }
                    const token = url.searchParams.get('token');
                    if (token) {
                        localStorage.setItem(
                            'ps-token',
                            url.searchParams.get('token') ?? 'notoken',
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
        let assertion = urlParams.get('assertion');
        if (assertion && assertion !== 'undefined') {
            await this.send_assertion(assertion);
            const token = urlParams.get('token');
            if (token) {
                localStorage.setItem('ps-token', token);
            }
        } else if (
            (assertion = await this.assertionFromToken(this.challstr) || null)
        ) {
            await this.send_assertion(assertion);
            return;
        } else {
            const token = localStorage.getItem('ps-token');
            if (token && token !== 'undefined') {
                if (!await this.refreshToken()) {
                    console.error('Couldn\'t refresh token');
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
        const username = assertion.split(',')[1];

        const storedName = this.settings.username;
        this.__send(
            `/trn ${toID(storedName) === toID(username) ? storedName : username
            },0,${assertion}`,
            false,
        );
    }

    private async parseLoginserverResponse(
        response: Response,
    ): Promise<string | false> {
        // Loginserver responses are just weird
        const response_test = await response.text();
        if (response_test.startsWith(';')) {
            console.error('AssertionError: Received ; from loginserver');
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
            // pass
        }
        return response_test;
    }

    private async assertionFromToken(challstr: string): Promise<string | false> {
        const token = localStorage.getItem('ps-token');
        if (!token || token === 'undefined') {
            return false;
        }
        const response = await fetch(
            `${this.settings.loginServerURL}oauth/api/getassertion?challenge=${challstr}&token=${token}&client_id=${this.client_id}`,
        );
        return await this.parseLoginserverResponse(response);
    }

    private async refreshToken() {
        const token = localStorage.getItem('ps-token');
        if (!token || token === 'undefined') {
            return false;
        }
        try {
            const response = await fetch(
                `${this.settings.loginServerURL}oauth/api/refreshtoken?token=${token}&client_id=${this.client_id}`,
            );
            const result = await this.parseLoginserverResponse(response);
            if (result) localStorage.setItem('ps-token', result);
            return result;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    // --- Room management ---
    private _addRoom(room: Room) {
        this.rooms.set(room.ID, room);
        useClientStore.setState({ rooms: new Map(this.rooms) });
        if (!this.settings.rooms.find((r) => r.ID === room.ID)?.open) {
            this.selectRoom(room.ID);
        }
        if (room.type !== 'permanent' && !this.settings.rooms.find((r) => r.ID === room.ID)) {
            this.settings.addRoom(room);
        }
    }

    private _openRoom(roomID: string) {
        const room = this.room(roomID);
        if (room) {
            room.open = true;
            // move room to bottom
            this.rooms.delete(roomID);
            this.rooms.set(roomID, room);
            this.settings.changeRooms(this.rooms);
            useClientStore.setState({ rooms: new Map(this.rooms) });
            return;
        }
        console.warn('openRoom: room (' + roomID + ') is unknown');
    }


    private _removeRoom(roomID: string) {
        this.rooms.delete(roomID);
        if (roomID === this.selectedRoom) {
            this.selectRoom('home');
        }
        useClientStore.setState({ rooms: new Map(this.rooms) });
        this.settings.removeRoom(roomID);
    }

    private addMessageToRoom(
        roomID: string,
        message: Message,
    ) {
        const room = this.room(roomID);
        this.highlightMsg(roomID, message);
        if (!room) {
            console.warn('addMessageToRoom: room (' + roomID + ') is unknown. Message:', message);
            return;
        }
        const settings = {
            selected: this.selectedRoom === roomID,
            selfSent: toID(this.settings.username) === toID(message.user),
        };
        if (message.name) {
            room.addUHTML(message, settings);
        } else {
            room.addMessage(message, settings);
        }
        useClientStore.getState().newMessage(room, message);
        console.debug('message', message);

        if (this.shouldNotify(room, message)) {
            notificationsEngine.sendNotification({
                user: message.user ?? '',
                message: message.content,
                room: roomID,
                roomType: room.type,
            });
            useClientStore.getState().addMention(room);
        }
    }

    private addUsers(roomID: string, users: User[] /*  */) {
        const room = this.room(roomID);
        if (room) {
            room.addUsers(users);
            this.events.dispatchEvent(new CustomEvent('users', { detail: users }));
            return;
        }
        console.warn('addUsers: room (' + roomID + ') is unknown. Users:', users);
    }

    private removeUser(roomID: string, user: string) {
        const room = this.room(roomID);
        if (room) {
            room.removeUser(user);
            this.events.dispatchEvent(new CustomEvent('users', { detail: user }));
            return;
        }
        console.warn('removeUsers: room (' + roomID + ') is unknown');
    }

    private updateUsername(roomID: string, newName: string, userID: string) {
        const room = this.room(roomID);
        if (room) {
            room.updateUsername(newName, userID);
            this.events.dispatchEvent(new CustomEvent('users', { detail: newName }));
            return;
        }
        console.warn('updateUsername: room (' + roomID + ') is unknown');
    }

    private setUsername(username: string) {
        // gotta re-run highlightMsg on all messages
        this.settings.username = username;
        this.rooms.forEach(async (room) => {
            room.runHighlight(this.forceHighlightMsg.bind(this));
        });
    }

    private parseSocketChunk(chunk: string) {
        const split = chunk.split('\n');
        const roomID = split[0].startsWith('>') ? split[0].slice(1) : 'lobby';
        for (const [idx, line] of split.entries()) {
            if (line === '') continue;
            if (idx === 0 && line.startsWith('>')) {
                continue;
            }
            const { args, kwArgs } = Protocol.parseBattleLine(line);
            const room = this.room(roomID);
            if (room instanceof BattleRoom) {
                room.feedBattle(line) && this.events.dispatchEvent(new CustomEvent('message', { detail: line }));
            }

            const success = this.parseSocketLine(args, kwArgs, roomID);
            if (!success) {
                console.error('Failed to parse', line);
                console.error(chunk);
            }
        }
    }

    private requiresRoom(cmd: string, roomID: string) {
        const room = this.room(roomID);
        if (!room) {
            console.error(`requiresRoom: room is undefined for cmd ${cmd}`);
            return false;
        }
        return room;
    }

    private parseSocketLine(
        args: Protocol.ArgType | Protocol.BattleArgType,
        _kwArgs: Protocol.BattleArgsKWArgType | Record<string, never>,
        roomID: string
    ): boolean {
        switch (args[0]) {
        case 'challstr': {
            this.challstr = args[1];
            break;
        }
        case 'init': {
            const type = args[1];
            const shouldConnect = type === 'chat' || type === 'battle';
            const isBattle = type === 'battle';
            const newRoom = isBattle ? new BattleRoom(
                {
                    ID: roomID,
                    name: roomID,
                    type: type,
                    connected: true,
                    open: true,
                }
            ) : new Room({
                ID: roomID,
                name: roomID,
                type: type,
                connected: shouldConnect,
                open: true,
            });
            this._addRoom(newRoom);
            break;
        }
        case 'title': {
            const name = args[1];
            const room = this.requiresRoom('title', roomID);
            if (!room) return false;
            room.rename(name);
            useClientStore.setState({ rooms: new Map(this.rooms) });
            break;
        }
        case 'users': {
            const room = this.requiresRoom('userlist', roomID);
            if (!room) return false;
            const parsedUsers = args[1].split(',');
            const users = parsedUsers.map((tmpuser) => {
                const [user, status] = tmpuser.slice(1).split('@');
                const name = tmpuser.slice(0, 1) + user;
                return new User({ name, ID: toID(name), status });
            });
            users.shift();
            room.addUsers(users);
            break;
        }
        case '': {
            const messageContent = args[1];
            const room = this.requiresRoom('chat', roomID);
            if (!room) return false;
            const chatMessage = newMessage({
                user: '',
                content: messageContent,
                type: 'log',
            });
            if (!chatMessage) {
                this.events.dispatchEvent(
                    new CustomEvent('message', { detail: chatMessage }),
                );
                return false;
            }
            this.addMessageToRoom(room.ID, chatMessage);
            break;
        }
        case 'chat': {
            const username = args[1];
            const messageContent = args[2];
            const room = this.requiresRoom('chat', roomID);
            if (!room) return false;
            const chatMessage = this.parseCMessage(messageContent, username, undefined, room);
            if (!chatMessage) {
                this.events.dispatchEvent(
                    new CustomEvent('message', { detail: chatMessage }),
                );
                return false;
            }
            this.addMessageToRoom(room.ID, chatMessage);
            break;
        }
        case 'c:': {
            const timestamp = args[1];
            const username = args[2];
            const messageContent = args[3];
            const room = this.requiresRoom('c:', roomID);
            if (!room) return false;
            const chatMessage = this.parseCMessage(messageContent, username, timestamp, room);
            if (!chatMessage) {
                this.events.dispatchEvent(
                    new CustomEvent('message', { detail: chatMessage }),
                );
                break;
            }
            this.addMessageToRoom(room.ID, chatMessage);
            break;
        }
        case 'pm':
            {
                const sender = toID(args[1]);
                const receiver = toID(args[2]);
                let inferredRoomid = '';
                if (sender === toID(this.settings.username)) {
                    // sent message
                    inferredRoomid = `pm-${receiver}`;
                } else {
                    // received message
                    inferredRoomid = `pm-${sender}`;
                }
                const { content, type } = this.parseCMessageContent(
                    args.slice(3).join('|'),
                );
                this.__createPM(
                    sender === toID(this.settings.username) ? args[2] : args[1],
                );

                if (type === 'challenge') {
                    if (!content.trim()) {
                        // end challenge
                        const room = this.requiresRoom('pm', inferredRoomid);
                        if (!room) return false;
                        room.endChallenge();
                        useClientStore.getState().updateMessages(room);
                    } else {
                        // start challenge
                        this.addMessageToRoom(
                            inferredRoomid,
                            newMessage({
                                user: args[1],
                                content,
                                timestamp: Math.floor(Date.now() / 1000).toString(),
                                type,
                            }),
                        );
                    }
                    break;
                }
                this.addMessageToRoom(
                    inferredRoomid,
                    newMessage({
                        user: args[1],
                        content,
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        type,
                    }),
                );
            }
            break;
        case 'join': {
            const room = this.requiresRoom('join', roomID);
            if (!room) return false;
            const username = args[1];
            this.addUsers(room.ID, [new User({ name: username, ID: toID(username) })]);
            break;
        }
        case 'leave': {
            const room = this.requiresRoom('leave', roomID);
            if (!room) return false;
            this.removeUser(room.ID, args[1]);
            break;
        }
        case 'name': {
            const args1 = args[1];
            const args2 = args[2];
            this.updateUsername(roomID, args1, args2);
            break;
        }
        case 'queryresponse': {
            // 'userdetails' | 'roomlist' | 'rooms' | 'laddertop' | 'roominfo' | 'savereplay' | 'debug'
            const queryType = args[1];
            switch (queryType) {
            case 'userdetails':
                try {
                    const tmpjson = JSON.parse(args[2]);
                    if (tmpjson.userid === toID(this.settings.username)) {
                        if (tmpjson.status) {
                            this.settings.status = tmpjson.status;
                        }
                    }

                    if (this.userListener) {
                        this.userListener(tmpjson);
                        this.userListener = undefined;
                    } else if (this.loggedIn) {
                        console.warn(
                            'received queryresponse|userdetails but nobody asked for it',
                            args,
                        );
                    }
                } catch (e) {
                    console.error('Error parsing userdetails', args);
                }
                break;
            case 'rooms':
                try {
                    const tmpjson = JSON.parse(args[2]);
                    this.roomsJSON = tmpjson;
                    if (this.roomListener) {
                        this.roomListener(tmpjson);
                        this.roomListener = undefined;
                    }
                } catch (e) {
                    console.error('Error parsing roomsdetails', args);
                }
                break;
            default:
                // assertNever(queryType);
                console.error('Unknown queryresponse', args);
                break;
            }
            break;
        }
        case 'noinit': {
            const reason = args[1];
            switch (reason) {
            case 'namerequired':
                this.joinAfterLogin.push(roomID);
                break;
            case 'nonexistent':
            case 'joinfailed':
                this.events.dispatchEvent(
                    new CustomEvent('error', { detail: args[2] }),
                );
                this._removeRoom(roomID);
                break;
            default:
                // assertNever(reason);
                console.error('Unknown noinit', args);
            }
            break;
        }
        case 'updateuser':
            {
                const username = args[1];
                const named = args[2];
                const avatar = args[3];
                if (!username.trim().toLowerCase().startsWith('guest')) {
                    this.autojoin(this.joinAfterLogin);
                    this.loggedIn = true;
                    assert(named === '1', 'Couldn\'t guard against guest');
                    this.settings.updateUser(username, avatar);
                    this.setUsername(username);
                    this.queryUserInternal(username);
                }
            }
            break;
        case 'deinit':
            this._removeRoom(roomID);
            break;
        case 'pagehtml': {
            const content = args[1];
            const room = this.room(roomID);
            if (!room) {
                console.error('Received |pagehtml| from untracked room', roomID);
                return false;
            }
            room.addUHTML(
                newMessage({
                    name: 'pagehtml',
                    user: '',
                    type: 'rawHTML',
                    content,
                }),
                {
                    selected: this.selectedRoom === roomID,
                    selfSent: false,
                },
            );
            this.events.dispatchEvent(
                new CustomEvent('message', { detail: 'pagehtml' }),
            );
            break;
        }
        case 'uhtmlchange':{
            const name = args[1];
            const uhtml = args[2];
            const room = this.requiresRoom('uhtmlchange', roomID);
            if (!room) return false;
            room.changeUHTML(
                newMessage({
                    name,
                    user: '',
                    type: 'boxedHTML',
                    content: uhtml,
                }),
            );
            this.events.dispatchEvent(
                new CustomEvent('message', { detail: name }),
            );
            break;
        }
        case 'uhtml':
            {
                const name = args[1];
                const uhtml = args[2];
                const room = this.requiresRoom('uhtml', roomID);
                if (!room) return false;
                room.addUHTML(
                    newMessage({
                        name,
                        user: '',
                        type: 'boxedHTML',
                        content: uhtml,
                    }),
                    {
                        selected: this.selectedRoom === room.ID,
                        selfSent: false,
                    },
                );
                this.events.dispatchEvent(
                    new CustomEvent('message', { detail: name }),
                );
            }
            break;
        case 'html':
            {
                const uhtml = args[1];
                const room = this.requiresRoom('html', roomID);
                if (!room) return false;
                room.addUHTML(
                    newMessage({
                        name: '',
                        user: '',
                        type: 'boxedHTML',
                        content: uhtml,
                    }),
                    {
                        selected: this.selectedRoom === room.ID,
                        selfSent: false,
                    },
                );
                this.events.dispatchEvent(
                    new CustomEvent('message', { detail: 'html' }),
                );
            }
            break;
        case 'raw': {
            this.addMessageToRoom(
                roomID,
                newMessage({
                    user: '',
                    type: 'rawHTML',
                    content: args[1],
                }),
            );
            break;
        }
        case 'error':
            this.addMessageToRoom(
                roomID,
                newMessage({
                    user: '',
                    type: 'error',
                    content: args[1],
                }),
            );
            break;
        case 'formats': {
            const formats = args.slice(1);
            // formats
            this.formats = formatParser(formats);
        }
            break;
        case 'customgroups':
        case 'tournament':
        case 'notify':
        case 'popup':
        case 'nametaken':
        case 'updatesearch':
            break;
            // battles
        case 'player':
            {
                const room = this.requiresRoom('player', roomID);
                if (!(room instanceof BattleRoom)) {
                    console.error('Received |player| from non-battle room', roomID);
                    return false;
                }
                const perspective = args[1];
                const playerName = args[2];
                if (toID(playerName) === this.settings.userID) {
                    room.setFormatter(perspective);
                }
            }
            break;
        case 'request':{
            const room = this.requiresRoom('request', roomID);
            if (!room) return false;
            if (!(room instanceof BattleRoom)) {
                console.error('Received |request| from non-battle room', roomID);
                return false;
            }
            this.events.dispatchEvent(
                new CustomEvent('request', { detail: room.battle.request }),
            );
            break;
        }
        case 'move':
        case '-fail':
        case '-status':
        case 'cant':
        case '-item':
        case '-enditem':
        case '-unboost':
        case '-formechange':
        case '-clearnegativeboost':
        case '-supereffective':
        case '-end':
        case '-singleturn':
        case '-miss':
        case '-crit':
        case '-immune':
        case '-sidestart':
        case '-sideend':
        case '-start':
        case '-resisted':
        case '-damage':
        case 'done':
        case 'faint':
        case '-heal':
        case '-ability':
        case '-message':
        case 'win':
        case '-boost':
        case 'upkeep':
        case 'expire':
        case 'turn':
        case ':':
        case 't:':
        case 'teamsize':
        case 'rule':
        case 'start':
        case 'switch':
        case 'battle':
        case 'gametype':
        case 'gen':
        case 'tier':
        case 'sentchoice':
        case 'rated':
        case 'seed':
        case 'clearpoke':
        case 'poke':
        case 'usercount':
        case 'message' :
        case 'replace' :
        case 'teampreview' :
        case 'updatepoke' :
        case 'inactive' :
        case 'inactiveoff' :
        case 'tie' :
        case 'drag' :
        case 'detailschange' :
        case 'swap' :
        case '-block' :
        case '-notarget' :
        case '-sethp' :
        case '-curestatus':
        case '-cureteam':
        case '-setboost':
        case '-swapboost':
        case '-invertboost':
        case '-clearboost':
        case '-clearallboost':
        case '-clearpositiveboost':
        case '-swapsideconditions':
        case '-endability':
        case '-transform':
        case '-mega':
        case '-primal':
        case '-burst':
        case '-zpower':
        case '-zbroken':
        case '-activate':
        case '-fieldactivate':
        case '-hint':
        case '-center':
        case '-combine':
        case '-copyboost':
        case '-weather':
        case '-fieldstart':
        case '-fieldend':
        case 'askreg':
        case '-waiting':
        case '-prepare':
        case '-mustrecharge':
        case '-hitcount':
        case '-singlemove':
        case '-anim':
        case '-ohko':
        case '-candynamax':
        case '-terastallize':
        case 'updatechallenges':
        case 'debug':
        case 'unlink':
        case 'warning':
        case 'bigerror':
        case 'chatmsg':
        case 'chatmsg-raw':
        case 'controlshtml':
        case 'fieldhtml':
        case 'selectorhtml':
        case 'refresh':
        case 'tempnotify':
        case 'tempnotifyoff':
        case 'hidelines' :
        case 'custom' :
            break;
        default:
        {
            assertNever(args[0]);
            console.error('Unknown cmd', args[0], args);
            return false;
        }
        }
        return true;
    }

    private parseCMessage(
        message: string,
        user: string,
        timestamp: string | undefined,
        room: Room
    ): Message | undefined {
        const { content, type, UHTMLName } = this.parseCMessageContent(
            message
        );

        if (type === 'uhtmlchange') {
            if (!room) {
                console.error(
                    'Received |uhtmlchange| from untracked room',
                    room,
                );
                return;
            }
            room.changeUHTML(
                newMessage({
                    name: UHTMLName,
                    user: '',
                    type: 'boxedHTML',
                    content,
                }),
            );
            this.events.dispatchEvent(
                new CustomEvent('message', { detail: message }),
            );

            return;
        }

        return newMessage({
            timestamp,
            user,
            name: UHTMLName,
            type,
            content: content,
        });
    }

    private parseCMessageContent(
        content: string,
    ): {
            type: Message['type'];
            content: string;
            UHTMLName?: string;
        } {
        let type: Message['type'] = 'chat';
        let UHTMLName = undefined;
        const cmd = content.split(' ')[0];
        switch (cmd) {
        case '/raw':
            type = 'rawHTML';
            content = content.slice(5);
            break;
        case '/uhtmlchange': {
            const [name, ...html] = content.split(',');
            UHTMLName = name.split(' ')[1];
            type = 'uhtmlchange';
            content = html.join(',');
            break;
        }
        case '/uhtml': {
            const [name, ...html] = content.split(',');
            UHTMLName = name.split(' ')[1];
            type = 'boxedHTML';
            content = html.join(',');
            break;
        }
        case '/error':
            type = 'error';
            content = content.slice(6);
            break;
        case '/text':
            type = 'log';
            content = content.slice(5);
            break;
        case '/announce':
            type = 'announce';
            content = content.slice(9);
            break;
        case '/log':
            type = 'log';
            content = content.slice(4);
            break;
        case '/me':
            type = 'roleplay';
            content = content.slice(3);
            break;
        case '/challenge':
            type = 'challenge';
            content = content.slice(11);
            break;
        case '/nonotify':
            type = 'log';
            content = content.slice(9);
            break;
        default:
            break;
        }
        if (UHTMLName) {
            return { type, content, UHTMLName };
        }
        return { type, content };
    }

    private __setupSocketListeners() {
        if (!this.socket) {
            throw new Error('__setupSocketListeners: Socket not initialized');
        }
        this.socket.onopen = () => {
            for (const cb of this.onOpen) {
                cb();
            }
            if (this.shouldAutoLogin) {
                this.tryLogin();
            }
            const savedRooms = client.settings.rooms;
            this.autojoin(savedRooms.filter((e) => e.open).map((e) => e.ID), true);
        };

        this.socket.onmessage = (event) => {
            console.debug('[socket-output]\n' + event.data);
            this.parseSocketChunk(event.data);
        };
        this.socket.onerror = (event) => {
            console.error(event);
        };
        this.socket.onclose = (_) => {
            console.error('Socket closed, dispatching disconnect');
            this.events.dispatchEvent(new CustomEvent('disconnect'));
        };
    }

    private __createPermanentRooms() {
        Client.permanentRooms.forEach((room) => {
            this._addRoom(
                new Room({
                    ID: room.ID,
                    name: room.name,
                    type: 'permanent',
                    connected: false,
                    open: room.defaultOpen,
                }),
            );
        });
        useClientStore.setState({ rooms: new Map(this.rooms) });
    }

    /**
     * Handles every user-sent message.
     *
     * Some messages are not actually sent to the server but hijacked and handled by the client instead
     *
     * Returns true if the message has been handled, false otherwise
     */
    private __parseSendMsg(
        message: string,
        raw: boolean,
    ): boolean {
        if (!message.startsWith('/')) {
            return false;
        }
        const splitted_message = message.split(' ');
        const cmd = splitted_message[0].slice(1);
        switch (cmd) {
        case 'highlight':
        case 'hl': {
            const [subcmd, ...args] = splitted_message.slice(1);
            switch (subcmd) {
            case 'add':
            case 'roomadd':
                for (const word of args) {
                    this.settings.addHighlightWord(
                        subcmd === 'add' ? 'global' : this.selectedRoom,
                        word,
                    );
                }
                this.addMessageToRoom(
                    this.selectedRoom,
                    newMessage({
                        user: '',
                        name: '',
                        type: 'log',
                        content: `Added "${args.join(' ')}" to ${subcmd === 'add' ? 'global' : 'room'} highlight list`,
                    }),
                );
                // TODO: display help
                return true;
            case 'delete':
            case 'roomdelete':
                for (const word of args) {
                    this.settings.removeHighlightWord(
                        subcmd === 'delete' ? 'global' : this.selectedRoom,
                        word,
                    );
                }
                this.addMessageToRoom(
                    this.selectedRoom,
                    newMessage({
                        user: '',
                        name: '',
                        type: 'log',
                        content: `Deleted "${args.join(' ')}" from highlight list`,
                    }),
                );
                return true;
            case 'list':
            case 'roomlist':
                {
                    const words = this.settings.getHighlightWords(subcmd === 'list' ? 'global' : this.selectedRoom);

                    this.addMessageToRoom(
                        this.selectedRoom,
                        newMessage({
                            user: '',
                            name: '',
                            type: 'log',
                            content: words && words.length ?
                                `Current highlight list: ${words.join(', ')}` :
                                'Your highlight list is empty',
                        }),
                    );
                }
                return true;
            case 'clear':
            case 'roomclear':
                this.settings.clearHighlightWords(
                    subcmd === 'clear' ? 'global' : this.selectedRoom,
                );
                this.addMessageToRoom(
                    this.selectedRoom,
                    newMessage({
                        user: '',
                        name: '',
                        type: 'log',
                        content: `Cleared highlight list`,
                    }),
                );
                return true;

            default:
                // Display help
                console.warn('Unknown subcommand for /highlight: ', subcmd);
                return true; // Don't send to server
            }
        }
        case 'j':
        case 'join':
            if (!raw) {
                // Set as autoselect room
                const args = splitted_message.slice(1);
                if (args.length === 0) {
                    return false;
                }
            }
            return false;
            // case 'status':
            // this.settings.setStatus(splitted_message.slice(1).join(' '));
            // return false;
        default:
            return false;
        }
    }
}


export const client = new Client();
window.client = client; // Only for debugging
