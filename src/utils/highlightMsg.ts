import { toID } from './generic';

export function stringsToRegex(strings: string[]): RegExp | null {
    // regex should test true even if the message has spaces between the letters
    if (strings.length === 0) return null;
    return new RegExp(strings.map((s) => toID(s)).join('|'), 'i');
}

export function highlightMsg(highlight: RegExp | null, message: string) : boolean {
    if (!highlight) return false;
    const cleanMessage = message.replace(/[^a-z0-9]/gi, '');
    const hl = highlight.test(cleanMessage);
    return hl;
}
