export const HHMMSS = (date: Date) => {
  return date.toLocaleTimeString("en-US", { hour12: false });
};

export const HHMM = (date: Date) => {
  return HHMMSS(date).slice(0, 5); // lol
}
