export const HHMMSS = (date: Date) => {
  return date.toLocaleTimeString("en-US", { hour12: false });
};
