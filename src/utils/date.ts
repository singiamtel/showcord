export const HHMMSS = (date: Date) => date.toLocaleTimeString('en-US', { hour12: false });

export const HHMM = (date: Date) =>
    HHMMSS(date).slice(0, 5); // lol

