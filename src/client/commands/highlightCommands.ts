import newMessage from '../message';
import type { Settings } from '../settings';

export interface HighlightCommandCallbacks {
    getSelectedRoom: () => string;
    addMessageToRoom: (roomID: string, message: any) => void;
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
        switch (subcmd) {
        case 'add':
        case 'roomadd':
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
        case 'delete':
        case 'roomdelete':
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
        case 'list':
        case 'roomlist':
            {
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
            }
            return true;
        case 'clear':
        case 'roomclear':
            settings.clearHighlightWords(
                subcmd === 'clear' ? 'global' : callbacks.getSelectedRoom(),
            );
            callbacks.addMessageToRoom(
                callbacks.getSelectedRoom(),
                newMessage({
                    user: '',
                    name: '',
                    type: 'log',
                    content: `Cleared highlight list`,
                }),
            );
            return true;

        default:
            console.warn('Unknown subcommand for /highlight: ', subcmd);
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
