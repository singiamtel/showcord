export function toID(s: unknown) {
    if (typeof s === 'string') {
        return s.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    return '';
}

export function clamp(n: number, min: number, max: number) {
    return Math.min(Math.max(n, min), max);
}

export function cleanRegex(regex: RegExp) { // Convert regex to string
    return regex.toString().slice(1, -2);
}

export function removeFirstCharacterIfNotLetter(str: string) {
    if (str.length > 0 && !str.charAt(0).match(/[a-zA-Z]/)) {
        return str.slice(1);
    }
    return str;
}

export const omit = <T extends object, K extends keyof T>(
    obj: T,
    ...keys: K[]
): Omit<T, K> => {
    keys.forEach((key) => delete obj[key]);
    return obj;
};
