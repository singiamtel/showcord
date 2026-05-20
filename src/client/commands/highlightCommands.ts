import newMessage, { type Message } from '../message';
import type { Settings } from '../settings';

export interface HighlightCommandCallbacks {
    getSelectedRoom: () => string;
    addMessageToRoom: (roomID: string, message: Message) => void;
}

const HELP_TEXT = [
    'Usage: /hl <subcommand> [args]',
    '',
    'Subcommands:',
    '  add <word...>      Add global highlight word(s) (regex supported)',
    '  roomadd <word...>  Add highlight word(s) for current room only',
    '  delete <word...>   Remove global highlight word(s)',
    '  roomdelete <word...>  Remove room highlight word(s)',
    '  list               List global highlight words',
    '  roomlist           List room highlight words',
    '  clear              Clear all global highlight words',
    '  roomclear          Clear room highlight words',
    '  help               Show this help message',
    '',
    'Aliases: /highlight can be shortened to /hl',
].join('\n');

function sendHelp(room: string, callbacks: HighlightCommandCallbacks): void {
    callbacks.addMessageToRoom(
        room,
        newMessage({ user: '', name: '', type: 'log', content: HELP_TEXT }),
    );
}

export function parseHighlightCommand(
    message: string,
    settings: Settings,
    callbacks: HighlightCommandCallbacks
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

        if (subcmd === undefined || subcmd === 'help') {
            sendHelp(callbacks.getSelectedRoom(), callbacks);
            return true;
        }

        switch (subcmd) {
        case 'add':
        case 'roomadd': {
            if (!args.length) {
                sendHelp(callbacks.getSelectedRoom(), callbacks);
                return true;
            }
            for (const word of args) {
                settings.addHighlightWord(
                    subcmd === 'add' ? 'global' : callbacks.getSelectedRoom(),
                    word,
                );
            }
            callbacks.addMessageToRoom(
                callbacks.getSelectedRoom(),
                newMessage({
                    user: '',
                    name: '',
                    type: 'log',
                    content: `Added "${args.join(' ')}" to ${subcmd === 'add' ? 'global' : 'room'} highlight list`,
                }),
            );
            return true;
        }
        case 'delete':
        case 'roomdelete': {
            if (!args.length) {
                sendHelp(callbacks.getSelectedRoom(), callbacks);
                return true;
            }
            for (const word of args) {
                settings.removeHighlightWord(
                    subcmd === 'delete' ? 'global' : callbacks.getSelectedRoom(),
                    word,
                );
            }
            callbacks.addMessageToRoom(
                callbacks.getSelectedRoom(),
                newMessage({
                    user: '',
                    name: '',
                    type: 'log',
                    content: `Deleted "${args.join(' ')}" from highlight list`,
                }),
            );
            return true;
        }
        case 'list':
        case 'roomlist': {
            const words = settings.getHighlightWords(subcmd === 'list' ? 'global' : callbacks.getSelectedRoom());
            callbacks.addMessageToRoom(
                callbacks.getSelectedRoom(),
                newMessage({
                    user: '',
                    name: '',
                    type: 'log',
                    content: words && words.length ?
                        `Current highlight list: ${words.join(', ')}` :
                        'Your highlight list is empty',
                }),
            );
            return true;
        }
        case 'clear':
        case 'roomclear': {
            settings.clearHighlightWords(
                subcmd === 'clear' ? 'global' : callbacks.getSelectedRoom(),
            );
            callbacks.addMessageToRoom(
                callbacks.getSelectedRoom(),
                newMessage({
                    user: '',
                    name: '',
                    type: 'log',
                    content: 'Cleared highlight list',
                }),
            );
            return true;
        }
        default:
            callbacks.addMessageToRoom(
                callbacks.getSelectedRoom(),
                newMessage({
                    user: '',
                    name: '',
                    type: 'log',
                    content: `Unknown subcommand "${subcmd}". Type /hl help for available commands.`,
                }),
            );
            return true;
        }
    }
    case 'j':
    case 'join':
        return false;
    default:
        return false;
    }
}
