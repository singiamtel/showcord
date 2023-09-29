import { client } from '../app/PS_context';
import { MouseEvent } from 'react';

export default function manageURL(evt:MouseEvent<HTMLAnchorElement>) {
    // if host is current, handle redirect in client instead of opening new tab
    if (location.host === (evt.target as HTMLAnchorElement).host) {
        console.log('this will redirect in client');
        if (!client) {
            console.error('Client not defined on manageURL');
            return;
        }
        client.join((evt.target as HTMLAnchorElement).pathname.slice(1));
        evt.preventDefault();
        return;
    }
    // console.log("this will open in new tab");
    // window.open((evt.target as HTMLAnchorElement).href, "_blank");
}
