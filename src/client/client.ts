import { Settings } from './settings';
import { type Message } from './message';
import { type RoomNotification as RoomNotifications } from './notifications';
import { AuthenticationManager, type AuthenticationCallbacks } from './authentication';
import { useClientStore } from './clientStore';
import { highlightMsg, addMessageToRoom as addMsgToRoom } from './messageHandling';
import {
    openRoom as openRoomInternal,
    removeRoom as removeRoomInternal,
    closeRoom as closeRoomInternal,
    createPM as createPMInternal,
    selectRoom as selectRoomInternal,
    getRoomsArray,
    createPermanentRooms,
    getNotifications as getNotificationsInternal,
    clearNotifications as clearNotificationsInternal,
} from './roomManagement';
import { QueryHandlers } from './queryHandlers';
import { SocketProtocolParser } from './socketProtocolParser';
import { parseHighlightCommand } from './commands/highlightCommands';

type ClientConstructor = {
    server_url?: string;
    loginserver_url?: string;
    autoLogin?: boolean;
    skipVitestCheck?: boolean;
};

export { useClientStore };

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
    }] as const;
    private socket: WebSocket | undefined;

    events: EventTarget = new EventTarget();
    private onOpen: (() => void)[] = [];
    private authManager: AuthenticationManager;
    private pendingRoomJoins: string[] = [];
    private queryHandlers: QueryHandlers;
    private protocolParser: SocketProtocolParser;

    get username() {
        return this.settings.username;
    }

    get isLoggedIn() {
        return this.authManager.isLoggedIn;
    }

    get rooms() {
        return useClientStore.getState().rooms;
    }

    get selectedRoom() {
        return useClientStore.getState().selectedRoomID;
    }

    formatName(formatID: string) {
        const allFormats = this.protocolParser.getFormats()?.categories.flatMap((c) => c.formats);
        const format = allFormats?.find((f) => f.ID === formatID);
        return format;
    }

    constructor(options?: ClientConstructor) {
        if (import.meta.env.VITEST && !options?.skipVitestCheck) {
            console.debug('Running tests, skipping client initialization');
            this.authManager = new AuthenticationManager(this.settings, {
                sendMessage: () => {},
                setUsername: () => {},
            });
            this.queryHandlers = new QueryHandlers(this.settings, {
                send: () => {},
            });
            this.protocolParser = new SocketProtocolParser(
                this.settings,
                {
                    getRoom: this.room.bind(this),
                    getRooms: () => this.rooms,
                    getSelectedRoom: () => this.selectedRoom,
                    removeRoom: this._removeRoom.bind(this),
                    setUsername: this.setUsername.bind(this),
                    forceHighlightMsg: this.forceHighlightMsg.bind(this),
                    dispatchEvent: (event: Event) => this.events.dispatchEvent(event),
                },
                this.queryHandlers
            );
            return;
        }

        const authCallbacks: AuthenticationCallbacks = {
            sendMessage: (message: string) => this.__send(message, false),
            setUsername: (username: string) => this.setUsername(username),
            onLoginSuccess: () => {
                if (this.pendingRoomJoins.length > 0) {
                    this.autojoin(this.pendingRoomJoins);
                    this.pendingRoomJoins = [];
                }
                const savedRooms = this.settings.rooms;
                this.autojoin(savedRooms.filter((e) => e.open).map((e) => e.ID), true);
            },
            onLoginFailure: (error: string) => {
                console.error('Login failed:', error);
            },
        };
        this.authManager = new AuthenticationManager(this.settings, authCallbacks);

        this.queryHandlers = new QueryHandlers(this.settings, {
            send: (message: string, room: string | false) => this.__send(message, room),
        });

        this.protocolParser = new SocketProtocolParser(
            this.settings,
            {
                getRoom: this.room.bind(this),
                getRooms: () => this.rooms,
                getSelectedRoom: () => this.selectedRoom,
                removeRoom: this._removeRoom.bind(this),
                setUsername: this.setUsername.bind(this),
                forceHighlightMsg: this.forceHighlightMsg.bind(this),
                dispatchEvent: (event: Event) => this.events.dispatchEvent(event),
            },
            this.queryHandlers
        );

        try {
            if (options?.autoLogin !== undefined) {
                this.authManager.setShouldAutoLogin(options.autoLogin);
            }
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

    notificationsListener(_e: FocusEvent) {
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
            if (this.__parseSendMsg(ogMessage, raw)) return;
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

    setTheme(theme: 'light' | 'dark' | 'system') {
        this.settings.theme = theme;
        useClientStore.setState({ theme });
    }

    getRooms() {
        return getRoomsArray(() => this.rooms);
    }

    createPM(user: string) {
        createPMInternal(user, {
            getRoom: this.room.bind(this),
            getRooms: () => this.rooms,
            getSelectedRoom: () => this.selectedRoom,
        });
    }

    selectRoom(roomid: string) {
        selectRoomInternal(roomid, this.room.bind(this));
    }

    async queryUser(user: string, callback: (json: any) => void) {
        if (!this.socket) {
            throw new Error('Getting user before socket initialization ' + user);
        }
        this.queryHandlers.queryUser(user, callback);
    }

    async queryRooms(callback: (json: any) => void) {
        if (!this.socket) {
            throw new Error('Getting /cmd rooms before socket initialization');
        }
        this.queryHandlers.queryRooms(callback);
    }

    async queryNews(callback: (json: any) => void) {
        this.queryHandlers.queryNews(callback);
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
            const error = `Trying to leave non-existent room ${roomID}`;
            useClientStore.getState().setError(error);
            this.events.dispatchEvent(
                new CustomEvent('error', {
                    detail: error,
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
        closeRoomInternal(
            roomID,
            () => this.rooms,
            this.room.bind(this),
            this.selectedRoom
        );
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

    private forceHighlightMsg(roomid: string, message: Message) {
        return highlightMsg(roomid, message, this.settings, true);
    }

    getNotifications(): Map<string, RoomNotifications> {
        return getNotificationsInternal(() => this.rooms);
    }

    clearNotifications(roomID: string) {
        clearNotificationsInternal(roomID, this.room.bind(this));
    }

    openSettings() {
        this._openRoom('settings');
        this.selectRoom('settings');
    }

    logout() {
        this.authManager.logout();
    }

    async login() {
        await this.authManager.login();
    }


    private _openRoom(roomID: string) {
        openRoomInternal(
            roomID,
            () => this.rooms,
            this.room.bind(this),
            this.settings
        );
    }

    private _removeRoom(roomID: string) {
        removeRoomInternal(
            roomID,
            this.selectedRoom,
            this.room.bind(this),
            this.settings
        );
    }

    private setUsername(username: string) {
        this.settings.username = username;
        this.rooms.forEach(async (room) => {
            room.runHighlight(this.forceHighlightMsg.bind(this));
        });
    }

    private __setupSocketListeners() {
        if (!this.socket) {
            throw new Error('__setupSocketListeners: Socket not initialized');
        }
        this.socket.onopen = () => {
            for (const cb of this.onOpen) {
                cb();
            }
            this.authManager.tryLogin();
        };

        this.socket.onmessage = (event) => {
            console.debug('[socket-output]\n' + event.data);
            this.protocolParser.parseSocketChunk(event.data);
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
        createPermanentRooms(Client.permanentRooms);
    }

    private __parseSendMsg(
        message: string,
        _raw: boolean,
    ): boolean {
        const handled = parseHighlightCommand(
            message,
            this.settings,
            {
                getSelectedRoom: () => this.selectedRoom,
                addMessageToRoom: (roomID: string, msg: Message) => {
                    highlightMsg(roomID, msg, this.settings);
                    const room = this.room(roomID);
                    addMsgToRoom(
                        roomID,
                        msg,
                        room,
                        this.selectedRoom,
                        this.settings.username
                    );
                },
            }
        );
        return handled;
    }
}


export const client = new Client();
window.client = client;
