import { Client } from '@/client/client';
import { MouseEvent } from 'react';

export default function manageURL(evt:MouseEvent<HTMLAnchorElement>, client: Client) {
    // if host is current, handle redirect in client instead of opening new tab
    if (location.host === (evt.target as HTMLAnchorElement).host) {
        if (!client) {
            console.error('Client not defined on manageURL');
            return;
        }
        client.join((evt.target as HTMLAnchorElement).pathname.slice(1));
        evt.preventDefault();
        return;
    }
}
