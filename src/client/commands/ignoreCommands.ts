import { toID } from '@/utils/generic';
import newMessage, { type Message } from '../message';
import type { Settings } from '../settings';

export interface IgnoreCommandCallbacks {
    getSelectedRoom: () => string;
    addMessageToRoom: (roomID: string, message: Message) => void;
}

function log(room: string, content: string, callbacks: IgnoreCommandCallbacks): void {
    callbacks.addMessageToRoom(
        room,
        newMessage({ user: '', name: '', type: 'log', content }),
    );
}

export function parseIgnoreCommand(
    message: string,
    settings: Settings,
    callbacks: IgnoreCommandCallbacks
): boolean {
    if (!message.startsWith('/')) {
        return false;
    }
    const splitted_message = message.split(' ');
    const cmd = splitted_message[0].slice(1);
    const target = splitted_message.slice(1).join(' ').trim();
    const room = callbacks.getSelectedRoom();

    switch (cmd) {
    case 'ignore': {
        if (!target) {
            log(room, 'Usage: /ignore [user]', callbacks);
            return true;
        }
        const userid = toID(target);
        if (userid === settings.userID) {
            log(room, 'You are not able to ignore yourself.', callbacks);
            return true;
        }
        if (!settings.addIgnored(userid)) {
            log(room, `User '${target}' is already on your ignore list. (Moderator messages will not be ignored.)`, callbacks);
        } else {
            log(room, `User '${target}' ignored. (Moderator messages will not be ignored.)`, callbacks);
        }
        return true;
    }
    case 'unignore': {
        if (!target) {
            log(room, 'Usage: /unignore [user]', callbacks);
            return true;
        }
        const userid = toID(target);
        if (!settings.removeIgnored(userid)) {
            log(room, `User '${target}' isn't on your ignore list.`, callbacks);
        } else {
            log(room, `User '${target}' no longer ignored.`, callbacks);
        }
        return true;
    }
    case 'ignorelist': {
        const list = settings.getIgnoreList();
        log(
            room,
            list.length ? `You are currently ignoring: ${list.join(', ')}` : 'You are not ignoring anyone.',
            callbacks,
        );
        return true;
    }
    case 'clearignore': {
        if (target !== 'confirm') {
            log(room, 'Are you sure you want to clear your ignore list? Use \'/clearignore confirm\' to confirm.', callbacks);
            return true;
        }
        if (!settings.getIgnoreList().length) {
            log(room, 'You have no ignored users.', callbacks);
            return true;
        }
        settings.clearIgnored();
        log(room, 'Your ignore list was cleared.', callbacks);
        return true;
    }
    default:
        return false;
    }
}
