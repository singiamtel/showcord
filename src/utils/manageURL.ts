export default function manageURL(evt: any) {
  // if host is current, handle redirect in client instead of opening new tab
  if (location.host === evt.target.host) {
    console.log("this will redirect in client");
    evt.preventDefault();
  }
}
