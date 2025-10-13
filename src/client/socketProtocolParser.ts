import { Protocol } from '@pkmn/protocol';
import { toID } from '../utils/generic';
import newMessage from './message';
import { Room } from './room/room';
import { User } from './user';
import { BattleRoom } from './room/battleRoom';
import { useClientStore } from './clientStore';
import { assert } from '@/lib/utils';
import type { Settings } from './settings';
import { parseCMessage, parseCMessageContent, addMessageToRoom, highlightMsg } from './messageHandling';
import { addRoom, __createPM } from './roomManagement';
import type { QueryHandlers } from './queryHandlers';
import formatParser, { type Formats } from './formatParser';

export interface ProtocolParserCallbacks {
    getRoom: (roomID: string) => Room | undefined;
    getRooms: () => Map<Room['ID'], Room>;
    getSelectedRoom: () => string;
    removeRoom: (roomID: string) => void;
    setUsername: (username: string) => void;
    forceHighlightMsg: (roomid: string, message: any) => boolean;
    dispatchEvent: (event: Event) => void;
}

export class SocketProtocolParser {
    private formats: Formats | undefined;

    constructor(
        private settings: Settings,
        private callbacks: ProtocolParserCallbacks,
        private queryHandlers: QueryHandlers
    ) {}

    parseSocketChunk(chunk: string) {
        const split = chunk.split('\n');
        const roomID = split[0].startsWith('>') ? split[0].slice(1) : 'lobby';
        for (const [idx, line] of split.entries()) {
            if (line === '') continue;
            if (idx === 0 && line.startsWith('>')) {
                continue;
            }
            const { args, kwArgs } = Protocol.parseBattleLine(line);
            const room = this.callbacks.getRoom(roomID);
            if (room instanceof BattleRoom) {
                room.feedBattle(line);
            }

            const success = this.parseSocketLine(args, kwArgs, roomID);
            if (!success) {
                console.error('Failed to parse', line);
                console.error(chunk);
            }
        }
    }

    private requiresRoom(cmd: string, roomID: string) {
        const room = this.callbacks.getRoom(roomID);
        if (!room) {
            console.error(`requiresRoom: room is undefined for cmd ${cmd}`);
            return false;
        }
        return room;
    }

    parseSocketLine(
        args: Protocol.ArgType | Protocol.BattleArgType,
        _kwArgs: Protocol.BattleArgsKWArgType | Record<string, never>,
        roomID: string
    ): boolean {
        switch (args[0]) {
        case 'challstr': {
            const challstr = args.slice(1).join('|');
            useClientStore.getState().setChallstr(challstr);
            return true;
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
            addRoom(newRoom, this.settings, { getRoom: this.callbacks.getRoom });
            break;
        }
        case 'title': {
            const name = args[1];
            const room = this.requiresRoom('title', roomID);
            if (!room) return false;
            room.rename(name);
            const rooms = this.callbacks.getRooms();
            rooms.set(roomID, room);
            useClientStore.getState().setRooms(rooms);
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
            const chatMessage = parseCMessage(messageContent, username, undefined, room);
            if (!chatMessage) {
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
            const chatMessage = parseCMessage(messageContent, username, timestamp, room);
            if (!chatMessage) {
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
                    inferredRoomid = `pm-${receiver}`;
                } else {
                    inferredRoomid = `pm-${sender}`;
                }
                const { content, type } = parseCMessageContent(
                    args.slice(3).join('|'),
                );
                __createPM(
                    sender === toID(this.settings.username) ? args[2] : args[1],
                    this.callbacks.getRoom
                );

                if (type === 'challenge') {
                    if (!content.trim()) {
                        const room = this.requiresRoom('pm', inferredRoomid);
                        if (!room) return false;
                        room.endChallenge();
                        useClientStore.getState().updateMessages(room);
                    } else {
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

                    const hadListener = this.queryHandlers.hasUserListener();
                    this.queryHandlers.handleUserDetailsResponse(tmpjson);
                    if (!hadListener && this.settings.username) {
                        console.warn(
                            'received queryresponse|userdetails but nobody asked for it',
                            args,
                        );
                    }
                } catch (_e) {
                    console.error('Error parsing userdetails', args);
                }
                break;
            case 'rooms':
                try {
                    const tmpjson = JSON.parse(args[2]);
                    this.queryHandlers.handleRoomsResponse(tmpjson);
                } catch (e) {
                    console.error('Error parsing roomsdetails', args, e);
                }
                break;
            case 'roomlist':
            case 'laddertop':
            case 'roominfo':
            case 'savereplay':
            case 'debug':
                break;
            default:
                queryType satisfies never;
                console.error('Unknown queryresponse', args);
                break;
            }
            break;
        }
        case 'noinit': {
            const reason = args[1];
            switch (reason) {
            case 'namerequired':
                break;
            case 'nonexistent':
            case 'joinfailed':
            {
                const error = args[2];
                useClientStore.getState().setError(error);
                this.callbacks.removeRoom(roomID);
                break;
            }
            case 'rename':
                console.warn('Currently unhandled noinit', args);
                break;
            default:
                reason satisfies never;
                console.error('Bug in pkmn/protocol, noinit', args);
            }
            break;
        }
        case 'updateuser':
            {
                const username = args[1];
                const named = args[2];
                const avatar = args[3];
                this.callbacks.setUsername(username);
                if (!username.trim().toLowerCase().startsWith('guest')) {
                    assert(named === '1', 'Couldn\'t guard against guest');
                    this.settings.updateUser(username, avatar);
                    this.queryHandlers.queryUserInternal(username);
                }
            }
            break;
        case 'deinit':
            this.callbacks.removeRoom(roomID);
            break;
        case 'pagehtml': {
            const content = args[1];
            const room = this.callbacks.getRoom(roomID);
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
                    selected: this.callbacks.getSelectedRoom() === roomID,
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
                        selected: this.callbacks.getSelectedRoom() === room.ID,
                        selfSent: false,
                    },
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
                        selected: this.callbacks.getSelectedRoom() === room.ID,
                        selfSent: false,
                    },
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
            this.formats = formatParser(formats);
        }
            break;
        case 'customgroups':
        case 'notify':
        case 'popup':
        case 'nametaken':
        case 'updatesearch':
            console.error('Currently unhandled cmd', args);
            break;
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
            this.callbacks.dispatchEvent(
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
        case 'tournament':
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
        case '-swapsideconditions':
        case '-swapboost':
        case '-invertboost':
        case '-clearboost':
        case '-clearallboost':
        case '-clearpositiveboost':
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
            console.error('Bug in pkmn/protocol, unknown cmd', args[0], args);
            args[0] satisfies never;
            return false;
        }
        }
        return true;
    }

    private addMessageToRoom(roomID: string, message: any) {
        highlightMsg(roomID, message, this.settings);
        const room = this.callbacks.getRoom(roomID);
        addMessageToRoom(
            roomID,
            message,
            room,
            this.callbacks.getSelectedRoom(),
            this.settings.username
        );
    }

    private addUsers(roomID: string, users: User[]) {
        const room = this.callbacks.getRoom(roomID);
        if (room) {
            room.addUsers(users);
            return;
        }
        console.warn('addUsers: room (' + roomID + ') is unknown. Users:', users);
    }

    private removeUser(roomID: string, user: string) {
        const room = this.callbacks.getRoom(roomID);
        if (room) {
            room.removeUser(user);
            return;
        }
        console.warn('removeUsers: room (' + roomID + ') is unknown');
    }

    private updateUsername(roomID: string, newName: string, userID: string) {
        const room = this.callbacks.getRoom(roomID);
        if (room) {
            room.updateUsername(newName, userID);
            return;
        }
        console.warn('updateUsername: room (' + roomID + ') is unknown');
    }

    getFormats(): Formats | undefined {
        return this.formats;
    }
}
