export function toID(s: unknown) {
    if (typeof s === 'string') {
        return s.replace(/[^a-z0-9]/g, '').toLowerCase();
    }
    return '';
}
