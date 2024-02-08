import { toID } from './generic';

export function stringsToRegex(strings: string[]) {
    // regex should test true even if the message has spaces between the letters
    return new RegExp(strings.map((s) => toID(s)).join('|'), 'i');
}

export function highlightMsg(highlight: RegExp, message: string) : boolean {
    const cleanMessage = message.replace(/[^a-z0-9]/gi, '');
    const hl = highlight.test(cleanMessage);
    if (hl) {
        console.log('highlighted', message, highlight);
    }
    return hl;
}
