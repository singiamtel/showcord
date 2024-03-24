import { Settings } from './settings';
import { toID } from '../utils/generic';
import newMessage, { Message } from './message';
import { Room } from './room/room';
import { User } from './user';
import { clientNotification, RoomNotification } from './notifications';
import { Protocol } from '@pkmn/protocol';
import { assertNever, assert } from '@/lib/utils';
import { BattleRoom } from './room/battleRoom';

type ClientConstructor = {
    server_url?: string;
    loginserver_url?: string;
    autoLogin?: boolean;
};

export class Client {
    private readonly newsURL = 'https://pokemonshowdown.com/news.json';

    settings: Settings = new Settings();
    private socket: WebSocket | undefined;

    private rooms: Map<string, Room> = new Map();
    events: EventTarget = new EventTarget();
    private autoSelectRoom: string = '';
    private loggedIn: boolean = false;
    private shouldAutoLogin: boolean = true;
    private onOpen: (() => void)[] = []; // Append callbacks here to run when the socket opens

    get username() {
        return this.settings.username;
    }

    private joinAfterLogin: string[] = [];
    challstr: string = '';
    private client_id = import.meta.env.VITE_OAUTH_CLIENTID;
    private selectedRoom: string = ''; // Used for notifications
    // Callbacks given to query commands, it's called after the server responds back with the info
    private userListener: ((json: any) => any) | undefined;
    private roomListener: ((json: any) => any) | undefined;
    permanentRooms = [{
        ID: 'home',
        name: 'Home',
        defaultOpen: true,
    }, {
        ID: 'settings',
        name: 'Settings',
        defaultOpen: false,
    }] as const; // Client-side only rooms, joined automatically
    private roomsJSON: any = undefined; // Server response to /cmd rooms
    private news: any = undefined; // Cached news
    private lastQueriedUser: { user: string; json: any } | undefined; // Cached user query

    constructor(options?: ClientConstructor) {
        // if running test suite, don't do anything
        if (import.meta.env.VITEST) {
            return;
        }
        try {
            if (options?.autoLogin) this.shouldAutoLogin = options.autoLogin;
            this.__createPermanentRooms();
            this.socket = new WebSocket(this.settings.getServerURL());
            this.__setupSocketListeners();
        } catch (e) {
            if (e instanceof DOMException) {
                console.warn('DOMException: ', e);
                this.settings.setServerURLs(this.settings.defaultServerURL, this.settings.defaultLoginServerURL);
                window.location.reload();
            }
            console.error(e);
        }
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
        this.settings.setTheme(theme);
        this.events.dispatchEvent(new CustomEvent('theme', { detail: theme }));
    }


    /** Returns an array of all rooms
    */
    getRooms() {
        const tmp = [...this.rooms.values()].filter((r) => r.open);
        return tmp;
    }

    createPM(user: string) {
        this.__createPM(user);
        this.autoSelectRoom = '';
        this.events.dispatchEvent(
            new CustomEvent('selectroom', { detail: 'pm-' + toID(user) }),
        );
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

    // Used to remove highlights and mentions
    selectRoom(roomid: string) {
        this.selectedRoom = roomid;
        this.room(roomid)?.select();
        this.settings.changeRooms(this.rooms);
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
            this.events.dispatchEvent(
                new CustomEvent('login', { detail: this.settings.username }),
            );
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
        fetch(this.newsURL).then((res) => res.json()).then((json) => {
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
        this.autoSelectRoom = room;
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
        } else {
            if (this.permanentRooms.map((e) => e.ID).includes(roomID as any)) {
                this._closeRoom(roomID);
            } else { this._removeRoom(roomID); }
        }
    }

    _closeRoom(roomID: string) {
        const room = this.room(roomID);
        if (!room) {
            console.warn('Trying to close non-existent room', roomID);
            return;
        }
        room.open = false;
        this.events.dispatchEvent(new CustomEvent('leaveroom', { detail: roomID }));
    }

    async autojoin(rooms: string[], useDefaultRooms = false) {
        if (!this.socket) {
            throw new Error('Auto-joining rooms before socket initialization ');
        }
        const filteredRooms = rooms.filter((room) =>
            !this.permanentRooms.map((e) => e.ID).includes(
                room as typeof this.permanentRooms[number]['ID'],
            ) && !room.startsWith('pm-'));
        if (useDefaultRooms && (!filteredRooms || filteredRooms.length === 0)) {
            for (const room of this.settings.defaultRooms) {
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
        const highlight = this.settings.highlightMsg(roomid, message.content);
        message.hld = highlight;
        return highlight;
    }

    private forceHighlightMsg(roomid: string, message: Message) {
        return this.highlightMsg(roomid, message, true);
    }

    getNotifications(): RoomNotification[] {
        return Array.from(this.rooms).map(([_, room]) => ({
            room: room.ID,
            mentions: room.mentions,
            unread: room.unread,
        }));
    }

    openSettings() {
        this._openRoom('settings');
        this.events.dispatchEvent(
            new CustomEvent('selectroom', { detail: 'settings' }),
        );
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
                            url.searchParams.get('token') || 'notoken',
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
            return;
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
        if (response_test[0] === ';') {
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
            `${this.settings.getLoginServerURL()}oauth/api/getassertion?challenge=${challstr}&token=${token}&client_id=${this.client_id}`,
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
                `${this.settings.getLoginServerURL()}oauth/api/refreshtoken?token=${token}&client_id=${this.client_id}`,
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
        this.events.dispatchEvent(new CustomEvent('room', { detail: room.ID }));
        this.events.dispatchEvent(new CustomEvent('message', { detail: room.ID })); // Just in case. Fixes pagehtml
        this.settings.addRoom(room);
    }

    private _openRoom(roomID: string) {
        const room = this.room(roomID);
        if (room) {
            room.open = true;
            // move room to bottom
            this.rooms.delete(roomID);
            this.rooms.set(roomID, room);
            this.events.dispatchEvent(new CustomEvent('room', { detail: room }));
            this.settings.changeRooms(this.rooms);
            return;
        }
        console.warn('openRoom: room (' + roomID + ') is unknown');
    }


    private _removeRoom(roomID: string) {
        this.rooms.delete(roomID);
        const eventio = new CustomEvent('leaveroom', { detail: roomID });
        this.events.dispatchEvent(eventio);
        this.settings.removeRoom(roomID);
    }

    private addMessageToRoom(
        roomID: string,
        message: Message,
        retry = true,
    ) {
        const room = this.room(roomID);
        if (
            toID(message.user) !== toID(this.settings.username) &&
            this.highlightMsg(roomID, message)
        ) {
            this.events.dispatchEvent(
                new CustomEvent('message', { detail: message }),
            );
        }
        if (room) {
            const settings = {
                selected: this.selectedRoom === roomID,
                selfSent: toID(this.settings.username) === toID(message.user),
            };
            let shouldNotify = false;
            if (message.name) {
                room.addUHTML(message, settings);
            } else {
                shouldNotify = room.addMessage(message, settings);
            }
            this.events.dispatchEvent(
                new CustomEvent('message', { detail: message }),
            );
            if (shouldNotify) {
                this.events.dispatchEvent(
                    new CustomEvent('notification', {
                        detail: {
                            user: message.user,
                            message: message.content,
                            room: roomID,
                            roomType: room.type,
                        } as clientNotification,
                    }),
                );
            }

            return;
        } else if (retry) {
            setTimeout(() => this.addMessageToRoom(roomID, message, false), 1000);
        }
        console.warn(
            'addMessageToRoom: room (' + roomID + ') is unknown. Message:',
            message,
        );
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
        const roomID = split[0][0] === '>' ? split[0].slice(1) : 'lobby';
        for (const [idx, line] of split.entries()) {
            if (line === '') continue;
            if (idx === 0 && line[0] === '>') {
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
                this.events.dispatchEvent(new CustomEvent('room', { detail: room }));
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
                            this.events.dispatchEvent(
                                new CustomEvent('message', { detail: { room: inferredRoomid, end: true } }),
                            );
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
                                    this.settings.setStatus(tmpjson.status);
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
                        this.events.dispatchEvent(
                            new CustomEvent('error', { detail: args[2] }),
                        );
                        break;
                    case 'joinfailed':

                        this.events.dispatchEvent(
                            new CustomEvent('error', { detail: args[2] }),
                        );
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
                {
                    // this.events.dispatchEvent(
                    //     new CustomEvent('error', { detail: args.join('|') }),
                    // );
                    this.addMessageToRoom(
                        roomID,
                        newMessage({
                            user: '',
                            type: 'error',
                            content: args[1],
                        }),
                    );
                }
                break;
            case 'customgroups':
            case 'formats':
            case 'tournament':
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
                break;
            default:
            {
                // assertNever(args[0]);
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
        };
        this.socket.onmessage = (event) => {
            console.debug('[socket-output]\n' + event.data);
            this.parseSocketChunk(event.data);
        };
        this.socket.onerror = (event) => {
            console.error(event);
        };
        this.socket.onclose = (_) => {
            console.error('Socket closed');
            this.events.dispatchEvent(new CustomEvent('disconnect'));
        };
    }

    private __createPermanentRooms() {
        this.permanentRooms.forEach((room) => {
            // if (!room.defaultOpen) return;
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
                        {
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
                        }
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
                    this.autoSelectRoom = toID(args.join(''));
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
