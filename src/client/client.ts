import { Settings } from '../settings';
import { cleanRegex, toID } from '../utils/generic';
import { Message } from './message';
import { Room, RoomType, roomTypes } from './room';
import { User } from './user';
import { clientNotification, RoomNotification } from './notifications';

export class Client {
    private readonly server_url: string =
        'wss://sim3.psim.us/showdown/websocket/';
    private readonly loginserver_url: string =
        'https://play.pokemonshowdown.com/api/';
    private readonly newsURL = 'https://pokemonshowdown.com/news.json';

    settings: Settings = new Settings();
    private socket: WebSocket | undefined;

    rooms: Map<string, Room> = new Map();
    events: EventTarget = new EventTarget();
    private username: string = '';
    private loggedIn: boolean = false;
    private onOpen: (() => void)[] = []; // Append callbacks here to run when the socket opens

    private joinAfterLogin: string[] = [];
    private challstr: string = '';
    private client_id = import.meta.env.VITE_OAUTH_CLIENTID;
    private cleanUsername: string = ''; // For highlighting
    private selectedRoom: string = ''; // Used for notifications
    // Callbacks given to query commands, it's called after the server responds back with the info
    private userListener: ((json: any) => any) | undefined;
    private roomListener: ((json: any) => any) | undefined;
    private permanentRooms = [{
        ID: 'home',
        name: 'Home',
    }]; // Client-side only rooms, joined automatically
    private roomsJSON: any = undefined; // Server response to /cmd rooms
    private news: any = undefined; // Cached news

    constructor() {
        this.__createPermanentRooms();
        this.socket = new WebSocket(this.server_url);
        this.__setupSocketListeners();
    }

    async send(ogMessage: string, room: string | false) {
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
            }
        }

        console.log(`>>${message}`);
        try {
            if (this.__parseSendMsg(ogMessage, room)) return; // Already handled client-side
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
    // rooms is a map
        return this.rooms.get(roomID);
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
        this.send(`/cmd userdetails ${user}`, false);
        this.userListener = callback;
    }

    async queryRooms(callback: (json: any) => void) {
        if (!this.socket) {
            throw new Error('Getting /cmd rooms before socket initialization');
        }
        if (this.roomsJSON) {
            callback(this.roomsJSON);
            return;
        }
        this.send(`/cmd rooms`, false);
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

    async join(rooms: string | string[]) {
        if (!rooms) {
            console.trace('Trying to join empty string room');
        }
        if (!this.socket) {
            throw new Error('Joining room(s) before socket initialization ' + rooms);
        }
        if (typeof rooms === 'string') {
            this.send(`/join ${rooms}`, false);
        } else {
            for (const room of rooms) {
                this.send(`/join ${room}`, false);
            }
        }
    }

    private leaveRoom(roomID: string) {
        if (!this.socket) {
            throw new Error('Leaving room before socket initialization ' + roomID);
        }
        this.send(`/leave ${roomID}`, false);
    }

    async autojoin(rooms: string[], useDefaultRooms = false) {
        if (!this.socket) {
            throw new Error('Auto-joining rooms before socket initialization ');
        }
        const filteredRooms = rooms.filter((e) =>
            !this.permanentRooms.map((e) => e.ID).includes(e));
        if (useDefaultRooms && (!filteredRooms || filteredRooms.length === 0)) {
            for (const room of this.settings.defaultRooms) {
                this.send(`/join ${room}`, false);
            }
            return;
        }
        if (!filteredRooms.length) return;
        this.send(
            `/autojoin ${filteredRooms.join(',')}`,
            false,
        );
    }

    private highlightMsg(roomid: string, message: string) {
        if (
            this.cleanUsername &&
      (message.includes(this.cleanUsername) ||
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

    getNotifications(): RoomNotification[] {
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
        this.send(`/trn ${username},0,${assertion}`, false);
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
            `${this.loginserver_url}oauth/api/getassertion?challenge=${challstr}&token=${token}&client_id=${this.client_id}`,
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
                `${this.loginserver_url}oauth/api/refreshtoken?token=${token}&client_id=${this.client_id}`,
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
        const eventio = new CustomEvent('room', { detail: room });
        this.events.dispatchEvent(eventio);
        this.settings.changeRooms(this.rooms);
    }

    private _removeRoom(roomID: string) {
        this.rooms.delete(roomID);
        const eventio = new CustomEvent('leaveroom', { detail: roomID });
        this.events.dispatchEvent(eventio);
        this.settings.changeRooms(this.rooms);
    }

    private addMessageToRoom(
        roomID: string,
        message: Message,
        retry = true,
    ) {
        const room = this.room(roomID);
        if (
            toID(message.user) !== toID(this.username) &&
      this.highlightMsg(roomID, message.content)
        ) {
            message.hld = true;
            this.events.dispatchEvent(
                new CustomEvent('message', { detail: message }),
            );
        }
        if (room) {
            const settings = {
                selected: this.selectedRoom === roomID,
                selfSent: toID(this.username) === toID(message.user),
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
            console.log('addMessageToRoom', roomID, message);
            if (shouldNotify) {
                console.log('sendNotification for', roomID, message);
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
        console.warn('updateUserName: room (' + roomID + ') is unknown');
    }

    private setUsername(username: string) {
    // gotta re-run highlightMsg on all messages
        this.username = username;
        this.cleanUsername = username.replace(/[\u{0080}-\u{FFFF}]/gu, '').trim();
        this.rooms.forEach(async (room) => {
            room.runHighlight(this.highlightMsg.bind(this));
        });
        this.events.dispatchEvent(
            new CustomEvent('login', { detail: this.username }),
        );
    }

    // --- Commands parser ---
    // Hopefully this code will become cleaner with time (lol)
    private async parseSocketMsg(message: string) {
        if (message.startsWith('|challstr|')) {
            const splitted_challstr = message.split('|');
            splitted_challstr.shift();
            splitted_challstr.shift();
            this.challstr = splitted_challstr.join('|');
            return;
        }
        let i = 0;
        const splitted_message = message.split('\n');
        const isGlobalOrLobby = splitted_message[0][0] !== '>';
        let roomID: string;
        if (isGlobalOrLobby) {
            roomID = 'lobby';
        } else {
            i++;
            roomID = splitted_message[0].slice(1);
        }
        if (splitted_message[i].startsWith('|init|')) {
            let name = '';
            let users: User[] = [];
            const type = splitted_message[i].split('|')[2];
            i++;
            for (; i < splitted_message.length; i++) { // start at 2 because first line is room id and second line is cmd
                if (splitted_message[i] === '') continue;
                if (splitted_message[i].startsWith('|title|')) {
                    name = splitted_message[i].slice(7);
                    continue;
                }
                if (splitted_message[i].startsWith('|users|')) {
                    const parsedUsers = splitted_message[i].split('|')[2].split(
                        ',',
                    );
                    users = parsedUsers.map((tmpuser) => {
                        const [user, status] = tmpuser.slice(1).split('@');
                        const name = tmpuser.slice(0, 1) + user;
                        return new User({ name, ID: toID(name), status });
                    });
                    users.shift();
                    continue;
                }
                if (splitted_message[i].startsWith('|:|')) {
                    if (!roomTypes.includes(type as RoomType)) {
                        console.error('Unknown room type', type);
                    }
                    const room = new Room({
                        ID: roomID,
                        name: name,
                        type: type as RoomType,
                    });
                    this._addRoom(room);
                    this.addUsers(roomID, users);
                    continue;
                }
                this.parseSingleLiner(splitted_message[i], roomID);
            }
        }

        for (; i < splitted_message.length; i++) {
            this.parseSingleLiner(splitted_message[i], roomID);
        }
    }

    private parseSingleLiner(
        message: string,
        roomID: string,
    ): void {
        if (!message.startsWith('|')) {
            const chatMessage = new Message({
                timestamp: Math.floor(Date.now() / 1000).toString(),
                type: 'simple',
                content: message,
            });
            return this.addMessageToRoom(roomID, chatMessage);
        }

        const [_, cmd, ...args] = message.split('|');
        switch (cmd) {
            case 'c':
            case 'c:': {
                const room = this.room(roomID);
                if (!room) {
                    console.warn(
                        'Trying to add message to non-existent room (' + roomID + ')',
                        message,
                    );
                    return;
                }

                const chatMessage = this.parseCMessage(message, cmd === 'c:', roomID);
                if (!chatMessage) {
                    this.events.dispatchEvent(
                        new CustomEvent('message', { detail: message }),
                    );
                    return;
                }
                this.addMessageToRoom(roomID, chatMessage);
                break;
            }
            case 'pm':
                {
                    const sender = toID(args[0]);
                    const receiver = toID(args[1]);
                    if (sender === toID(this.username)) {
                        // sent message
                        roomID = `pm-${receiver}`;
                    } else {
                        // received message
                        roomID = `pm-${sender}`;
                    }
                    const { content, type } = this.parseCMessageContent(
                        args.slice(2).join('|'),
                    );
                    const room = this.room(roomID);
                    if (!room) {
                        this._addRoom(
                            new Room({
                                ID: roomID,
                                name: sender === toID(this.username) ? args[1] : args[0],
                                type: 'pm',
                            }),
                        );
                    }
                    this.addMessageToRoom(
                        roomID,
                        new Message({
                            user: args[0],
                            content,
                            timestamp: Math.floor(Date.now() / 1000).toString(),
                            type,
                        }),
                    );
                }
                break;
            case 'J': {
                const room = this.room(roomID);
                if (!room) {
                    console.error(
                        'Received |J| from untracked room',
                        roomID,
                    );
                    return;
                }
                this.addUsers(roomID, [new User({ name: args[0], ID: toID(args[0]) })]);
                break;
            }
            case 'L': {
                const room = this.room(roomID);
                if (!room) {
                    console.error(
                        'Received |L| from untracked room',
                        roomID,
                    );
                    return;
                }
                this.removeUser(roomID, args[0]);
                break;
            }
            case 'N': {
                this.updateUsername(roomID, args[0], args[1]);
                break;
            }
            case 'queryresponse': {
                if (args[0] === 'userdetails') {
                    try {
                        const tmpjson = JSON.parse(args.slice(1).join('|'));
                        if (this.userListener) {
                            this.userListener(tmpjson);
                            this.userListener = undefined;
                        } else {
                            console.warn(
                                'received queryresponse|userdetails but nobody asked for it',
                                args,
                            );
                        }
                    } catch (e) {
                        console.error('Error parsing userdetails', args);
                    }
                } else if (args[0] === 'rooms') {
                    try {
                        const tmpjson = JSON.parse(args.slice(1).join('|'));
                        this.roomsJSON = tmpjson;
                        if (this.roomListener) {
                            this.roomListener(tmpjson);
                            this.roomListener = undefined;
                        }
                    } catch (e) {
                        console.error('Error parsing roomsdetails', args);
                    }
                } else {
                    console.error('Unknown queryresponse', args);
                }
                break;
            }
            case 'noinit':
                if (args[0] === 'namerequired') {
                    this.joinAfterLogin.push(roomID);
                } else if (args[0] === 'nonexistent') {
                    this.events.dispatchEvent(
                        new CustomEvent('error', { detail: args[1] }),
                    );
                }
                break;
            case 'updateuser':
                if (!args[0].trim().toLowerCase().startsWith('guest')) {
                    this.autojoin(this.joinAfterLogin);
                    this.loggedIn = true;
                    this.setUsername(args[0]);
                }
                break;
            case 'deinit':
                this._removeRoom(roomID);
                break;
            case 'uhtml':
                {
                    const uhtml = args.slice(1).join('|');
                    const name = args[0];
                    const room = this.room(roomID);
                    if (!room) {
                        console.error('Received |uhtml| from untracked room', roomID);
                        return;
                    }
                    room.addUHTML(
                        new Message({
                            name,
                            user: '',
                            type: 'raw',
                            content: uhtml,
                        }),
                        {
                            selected: this.selectedRoom === roomID,
                            selfSent: false,
                        },
                    );
                }
                break;
            case 'uhtmlchange':
                {
                    const room = this.room(roomID);
                    if (!room) {
                        console.error(
                            'Received |uhtmlchange| from untracked room',
                            roomID,
                        );
                        break;
                    }
                    room.changeUHTML(
                        new Message({
                            name: args[0],
                            user: '',
                            type: 'raw',
                            content: args.slice(1).join('|'),
                        }),
                    );

                    this.events.dispatchEvent(
                        new CustomEvent('message', { detail: message }),
                    );
                }
                break;
            case 'raw': {
                this.addMessageToRoom(
                    roomID,
                    new Message({
                        user: '',
                        type: 'raw',
                        content: args.join('|'),
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
                        new Message({
                            user: '',
                            type: 'error',
                            content: args.join('|'),
                        }),
                    );
                }
                break;
            default:
                console.error('Unknown cmd: ' + cmd);
        }
    }

    private parseCMessage(
        message: string,
        hasTimestamp: boolean,
        room: string,
    ): Message | undefined {
        const splitted_message = message.slice(1).split('|');
        let _, msgTime, user, tmpcontent: (string | undefined)[];
        if (hasTimestamp) {
            [_, msgTime, user, ...tmpcontent] = splitted_message;
        } else {
            [_, user, ...tmpcontent] = splitted_message;
            msgTime = Math.floor(Date.now() / 1000).toString();
        }
        const { content, type, UHTMLName } = this.parseCMessageContent(
            tmpcontent.join('|'),
        );
        if (type === 'uhtmlchange') {
            const roomObj = this.room(room);
            if (!roomObj) {
                console.error(
                    'Received |uhtmlchange| from untracked room',
                    room,
                );
                return;
            }
            roomObj.changeUHTML(
                new Message({
                    name: UHTMLName,
                    user: '',
                    type: 'raw',
                    content,
                }),
            );

            return;
        }

        return new Message({
            timestamp: msgTime,
            user,
            name: UHTMLName,
            type,
            content: content,
        });
    }

    private parseCMessageContent(
        content: string,
    ): {
            type: Message['type'] | 'uhtmlchange';
            content: string;
            UHTMLName?: string;
        } {
        let type: Message['type'] | 'uhtmlchange' = 'chat';
        let UHTMLName = undefined;
        if (content.startsWith('/raw')) {
            type = 'raw';
            content = content.slice(4);
        } else if (content.startsWith('/uhtmlchange')) {
            const [name, ...html] = content.split(',');
            UHTMLName = name.split(' ')[1];
            type = 'uhtmlchange';
            content = html.join(',');
        } else if (content.startsWith('/uhtml')) {
            const [name, ...html] = content.split(',');
            UHTMLName = name.split(' ')[1];
            type = 'raw';
            content = html.join(',');
        } else if (content.startsWith('/error')) {
            type = 'error';
            content = content.slice(6);
        } else if (content.startsWith('/log')) {
            type = 'log';
            content = content.slice(4);
        } else if (content.startsWith('/me')) {
            type = 'roleplay';
            content = content.slice(3);
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
            this.tryLogin();
        };
        this.socket.onmessage = (event) => {
            console.log('<<', event.data);
            this.parseSocketMsg(event.data);
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
            this._addRoom(
                new Room({
                    ID: room.ID,
                    name: room.name,
                    type: 'permanent',
                }),
            );
        });
    }

    private __parseSendMsg(message: string, room: string | false): boolean {
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
                            new Message({
                                user: '',
                                name: '',
                                type: 'log',
                                content: `Added "${args.join(' ')}" to highlight list`,
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
                            new Message({
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
                            const words = this.settings.highlightWords[
                                subcmd === 'list' ? 'global' : this.selectedRoom
                            ]?.map((e) => cleanRegex(e));

                            this.addMessageToRoom(
                                this.selectedRoom,
                                new Message({
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
                                new Message({
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
            default:
                return false;
        // /highlight add [word 1], [word 2], [...] - Add the provided list of words to your highlight list.
        // /highlight roomadd [word 1], [word 2], [...] - Add the provided list of words to the highlight list of whichever room you used the command in.
        // /highlight list - List all words that currently highlight you.
        // /highlight roomlist - List all words that currently highlight you in whichever room you used the command in.
        // /highlight delete [word 1], [word 2], [...] - Delete the provided list of words from your entire highlight list.
        // /highlight roomdelete [word 1], [word 2], [...] - Delete the provided list of words from the highlight list of whichever room you used the command in.
        // /highlight clear - Clear your global highlight list.
        // /highlight roomclear - Clear the highlight list of whichever room you used the command in.
        // /highlight clearall - Clear your entire highlight list (all rooms and globally).
        // Don't send to server
        }
    }
}
