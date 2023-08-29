export default function manageURL(evt: any) {
  // if host is current, handle redirect in client instead of opening new tab
  console.log("event", evt);
  if (location.host === evt.view.location.host) {
    console.log("this will redirect in client");
    evt.preventDefault();
  }
}
