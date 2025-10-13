import { toID } from '../utils/generic';
import newMessage, { type Message } from './message';
import { type Room } from './room/room';
import { notificationsEngine } from './notifications';
import { useClientStore } from './clientStore';
import type { Settings } from './settings';

export interface MessageHandlerCallbacks {
    highlightMsg: (roomid: string, message: Message) => boolean;
    getUsername: () => string | undefined;
    getSelectedRoom: () => string;
}

export function highlightMsg(
    roomid: string,
    message: Message,
    settings: Settings,
    force = false
): boolean {
    if (message.hld !== null && !force) return message.hld;
    if (toID(message.user) === (settings.username)) {
        message.hld = false;
        return false;
    }
    const highlight = settings.highlightMsg(roomid, message.content);
    message.hld = highlight;
    return highlight;
}

export function shouldNotify(
    room: Room,
    message: Message,
    selectedRoom: string,
    username: string | undefined
): boolean {
    if (selectedRoom == room.ID && document.hasFocus()) return false;
    if (room.checkMessageStaleness(message)) return false;
    if (message.hld || (room.type === 'pm' && toID(message.user) !== toID(username))) return true;
    return false;
}

export function addMessageToRoom(
    roomID: string,
    message: Message,
    room: Room | undefined,
    selectedRoom: string,
    username: string | undefined
) {
    if (!room) {
        console.warn('addMessageToRoom: room (' + roomID + ') is unknown. Message:', message);
        return;
    }
    const settings = {
        selected: selectedRoom === roomID,
        selfSent: toID(username) === toID(message.user),
    };
    if (message.name) {
        room.addUHTML(message, settings);
    } else {
        room.addMessage(message, settings);
    }
    useClientStore.getState().newMessage(room, message);
    console.debug('message', message);

    if (shouldNotify(room, message, selectedRoom, username)) {
        notificationsEngine.sendNotification({
            user: message.user ?? '',
            message: message.content,
            room: roomID,
            roomType: room.type,
        });
        useClientStore.getState().addMention(room);
    }
}

export function parseCMessage(
    message: string,
    user: string,
    timestamp: string | undefined,
    room: Room
): Message | undefined {
    const { content, type, UHTMLName } = parseCMessageContent(message);

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

export function parseCMessageContent(
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
        content = content.slice(7);
        break;
    case '/text':
        type = 'log';
        content = content.slice(6);
        break;
    case '/announce':
        type = 'announce';
        content = content.slice(10);
        break;
    case '/log':
        type = 'log';
        content = content.slice(5);
        break;
    case '/me':
        type = 'roleplay';
        content = content.slice(4);
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
